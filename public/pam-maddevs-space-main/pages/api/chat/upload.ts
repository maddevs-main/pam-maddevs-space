import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import connectToDatabase from '../../../lib/mongodb';
import { Binary } from 'mongodb';

export const config = { api: { bodyParser: false } };

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // require formidable at runtime so build doesn't fail if dependency isn't installed yet
  let formidableLib: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    formidableLib = require('formidable');
  } catch (e) {
    return res.status(500).json({ error: 'missing_dependency', message: 'Please run `npm install formidable` to enable file uploads' });
  }

  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
  const form = formidableLib({ multiples: true, maxFileSize: MAX_BYTES });
  form.parse(req as any, async (err: any, fields: any, files: any) => {
    if (err) {
      console.error('upload parse error', err);
      // formidable will throw when file is too large; surface a clear 413 response
      const msg = err && (err.message || err.toString());
      if (err.code === 'ETOOBIG' || err.httpCode === 413 || (msg && msg.toLowerCase().includes('maxfilesize'))) {
        return res.status(413).json({ error: 'file_too_large', message: 'One or more files exceed the 10 MB size limit' });
      }
      return res.status(500).json({ error: 'upload_error', message: 'Failed to parse upload' });
    }

    // make uploads dir
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try { await fs.promises.mkdir(uploadDir, { recursive: true }); } catch (e) { }

    const outFiles: any[] = [];
    const fileEntries: any[] = [];

    if (files && Object.keys(files).length) {
      for (const key of Object.keys(files)) {
        const f = (files as any)[key];
        if (Array.isArray(f)) {
          fileEntries.push(...f);
        } else {
          fileEntries.push(f);
        }
      }
    }

    for (const f of fileEntries) {
      const oldPath = f.filepath || f.path || f.file;
      const originalName = f.originalFilename || f.name || f.filename || 'file';
      // defensive: reject any file that somehow bypassed formidable maxFileSize
      const size = Number(f.size || 0);
      if (size > MAX_BYTES) {
        try { await fs.promises.unlink(oldPath); } catch (e) { /* ignore */ }
        return res.status(413).json({ error: 'file_too_large', message: 'One or more files exceed the 10 MB size limit' });
      }
      const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      // If R2_BUCKET_URL is configured, attempt to upload to Cloudflare R2 (S3-compatible).
      const r2BucketUrl = process.env.R2_BUCKET_URL || process.env.NEXT_PUBLIC_R2_BUCKET_URL;
      if (r2BucketUrl) {
        try {
          const parsed = new URL(r2BucketUrl);
          // path may contain the bucket name e.g. /bucket-name
          const parts = (parsed.pathname || '/').split('/').filter(Boolean);
          const bucketFromUrl = parts[0];
          const keyPrefix = parts.slice(1).join('/');
          const key = keyPrefix ? `${keyPrefix}/${safeName}` : safeName;

          // Try to use AWS S3 SDK if available and credentials provided
          let uploaded = false;
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
            const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.R2_KEY || process.env.R2_ACCOUNT_ID;
            const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET;
            if (accessKeyId && secretAccessKey) {
              const s3 = new S3Client({
                region: 'auto',
                endpoint: parsed.origin,
                credentials: { accessKeyId, secretAccessKey },
                forcePathStyle: true,
              });
              const fileStream = fs.createReadStream(oldPath);
              const cmd = new PutObjectCommand({ Bucket: bucketFromUrl, Key: key, Body: fileStream, ContentType: f.mimetype || f.type });
              await s3.send(cmd);
              uploaded = true;
            }
          } catch (e) {
            // SDK not available or failed; we'll try direct PUT below
          }

          if (!uploaded) {
            // Fallback: direct PUT to R2 bucket URL (requires appropriate permissions on the bucket)
            const putUrl = `${r2BucketUrl.replace(/\/$/, '')}/${safeName}`;
            const stream = fs.createReadStream(oldPath);
            // use global fetch available in Next.js runtime
            const putRes = await fetch(putUrl, { method: 'PUT', headers: { 'Content-Type': f.mimetype || f.type || 'application/octet-stream' }, body: stream as unknown as BodyInit });
            if (!putRes.ok) {
              console.error('R2 upload failed', putRes.status, await putRes.text());
              return res.status(500).json({ error: 'r2_upload_failed', message: 'Failed to upload to R2' });
            }
          }

          const url = `${r2BucketUrl.replace(/\/$/, '')}/${safeName}`;
          outFiles.push({ url, name: originalName, size: f.size, type: f.mimetype || f.type || 'application/octet-stream' });
          // remove temp file
          try { await fs.promises.unlink(oldPath); } catch (e) { /* ignore */ }
          continue;
        } catch (e) {
          console.error('r2 upload error', e);
          // fall through to local storage fallback
        }
      }

      // Fallback: store locally in public/uploads
      const dest = path.join(uploadDir, safeName);
      try {
        await fs.promises.copyFile(oldPath, dest);
        const url = `/uploads/${safeName}`;
        outFiles.push({ url, name: originalName, size: f.size, type: f.mimetype || f.type || 'application/octet-stream' });
        try { await fs.promises.unlink(oldPath); } catch (e) { }
        continue;
      } catch (e) {
        console.error('move/copy failed, falling back to DB storage', e);
        // try rename as last resort
        try { await fs.promises.rename(oldPath, dest); const url = `/uploads/${safeName}`; outFiles.push({ url, name: originalName, size: f.size, type: f.mimetype || f.type || 'application/octet-stream' }); continue; } catch (e2) { console.error('rename failed', e2); }
      }

      // If filesystem fallback failed, attempt to store the file content in MongoDB (small files only)
      try {
        const buf = await fs.promises.readFile(oldPath);
        const { db } = await connectToDatabase();
        const doc = { name: originalName, type: f.mimetype || f.type || 'application/octet-stream', size: buf.length, data: new Binary(buf), createdAt: new Date() };
        const r = await db.collection('attachments').insertOne(doc as any);
        const url = `/api/chat/attachment/${r.insertedId.toString()}`;
        outFiles.push({ url, name: originalName, size: buf.length, type: f.mimetype || f.type || 'application/octet-stream', storedIn: 'mongodb' });
        try { await fs.promises.unlink(oldPath); } catch (e) { }
        continue;
      } catch (e) {
        console.error('db fallback failed', e);
        try { await fs.promises.unlink(oldPath); } catch (e) { }
        return res.status(500).json({ error: 'store_failed', message: 'Failed to store uploaded file' });
      }
    }

    return res.json({ ok: true, files: outFiles });
  });
}

export default handler;
