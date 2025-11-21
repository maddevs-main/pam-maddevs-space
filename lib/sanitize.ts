import { ObjectId } from 'mongodb';

function isObjectId(v: any) {
  return v && (v instanceof ObjectId || v?._bsontype === 'ObjectID');
}

export function sanitize(value: any): any {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(sanitize);

  if (isObjectId(value)) return value.toString();
  if (value instanceof Date) return value.toISOString();

  if (typeof value === 'object') {
    const out: any = {};
    for (const key of Object.keys(value)) {
      if (key === 'passwordHash') continue;
      const v = (value as any)[key];
      if (key === '_id') {
        out.id = isObjectId(v) ? v.toString() : sanitize(v);
        continue;
      }
      out[key] = sanitize(v);
    }
    return out;
  }

  return value;
}

export function sanitizeDoc(doc: any) {
  return sanitize(doc);
}

export function sanitizeList(list: any[]) {
  return (list || []).map(sanitize);
}
