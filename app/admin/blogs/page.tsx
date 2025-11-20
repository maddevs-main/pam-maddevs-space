// Migrated legacy Blogs management UI (client)
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';

type Blog = {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  date: string;
  content: string;
  imageUrl: string;
  detailImageUrl2: string;
  isPinned: boolean;
  tags: string[];
};

type FormBlog = Omit<Blog, 'id' | 'tags'> & { tags: string; slug: string };

const emptyBlog: FormBlog = {
  title: '',
  excerpt: '',
  author: '',
  date: '',
  content: '',
  imageUrl: '',
  detailImageUrl2: '',
  isPinned: false,
  tags: '',
  slug: '',
};

export default function AdminBlogsPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [form, setForm] = useState<FormBlog>(emptyBlog);
  const [editId, setEditId] = useState<number | null>(null);
  const [viewBlog, setViewBlog] = useState<Blog | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.replace('/auth/login');
          return;
        }
        setIsAuthenticated(true);
      } catch (e) {
        console.error('auth check failed', e);
        router.replace('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };
    validateToken();
  }, [router]);

  const getAuthHeaders = () => ({ 'Content-Type': 'application/json' });

  // Admin-only fetch helper (no public fallback)
  const adminFetch = async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(path, { ...opts, credentials: 'same-origin' });
    return res;
  };

  // Resolve API path at runtime. If NEXT_PUBLIC_API_BASE_URL points to a different
  // origin (e.g. production), use relative `/api` paths in the browser so cookies
  // are sent by the same-origin fetch. This prevents cross-origin calls that
  // omit the HttpOnly `pam_token` cookie and lead to empty admin lists.
  const resolveApiPath = (relativePath: string) => {
    if (typeof window === 'undefined') return (apiBase ? `${apiBase}${relativePath}` : relativePath);
    if (!apiBase) return relativePath;
    try {
      const baseUrl = new URL(apiBase, window.location.origin);
      if (baseUrl.origin !== window.location.origin) {
        return relativePath;
      }
      return `${apiBase.replace(/\/$/, '')}${relativePath}`;
    } catch (e) {
      return relativePath;
    }
  };

  const fetchBlogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const adminUrl = resolveApiPath('/api/admin/blogs');
      const res = await adminFetch(adminUrl, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch blogs');
      setBlogs(data.blogs || []);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    if (isAuthenticated) fetchBlogs();
  }, [isAuthenticated, fetchBlogs]);

  if (isLoading || !isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#222222',
          color: 'white',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        {isLoading ? 'Loading...' : 'Redirecting to login...'}
      </div>
    );
  }

  const openAdd = () => {
    setForm(emptyBlog);
    setEditMode(false);
    setShowDialog(true);
    setEditId(null);
  };
  const openEdit = (blog: Blog) => {
    setForm({ ...blog, tags: (blog.tags ?? []).join(', '), slug: blog.slug ?? '' });
    setEditMode(true);
    setShowDialog(true);
    setEditId(blog.id ?? null);
  };
  const closeDialog = () => {
    setShowDialog(false);
    setForm(emptyBlog);
    setEditId(null);
  };
  const slugify = (str: string) =>
    str
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm(f => {
        if (name === 'title') {
          return {
            ...f,
            title: value,
            slug: f.slug && f.slug !== slugify(f.title) ? f.slug : slugify(value),
          };
        }
        return { ...f, [name]: value };
      });
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.slug) {
      setError('Slug is required');
      return;
    }
    const payload: Blog = {
      ...form,
      tags: form.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
    } as Blog;
    try {
      if (editMode && editId !== null) {
        const adminUrl = resolveApiPath(`/api/admin/blogs/${editId}`);
        await adminFetch(adminUrl, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) });
      } else {
        const adminUrl = resolveApiPath('/api/admin/blogs');
        await adminFetch(adminUrl, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
      }
      await fetchBlogs();
      closeDialog();
    } catch {
      setError('Failed to save blog');
    }
  };
  const handleDelete = async () => {
    if (editId === null) return;
    try {
      const adminUrl = resolveApiPath(`/api/admin/blogs/${editId}`);
      await adminFetch(adminUrl, { method: 'DELETE', headers: getAuthHeaders() });
      await fetchBlogs();
      closeDialog();
    } catch {
      setError('Failed to delete blog');
    }
  };

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: 132,
          fontFamily: 'Inter, Arial, sans-serif',
          background: 'transparent',
          color: '#F1F1F1',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <a
            href="/admin"
            style={{
              fontSize: 25,
              color: '#B4B4B2',
              textDecoration: 'none',
              padding: '12px 20px',
              border: '1px solid rgb(0, 0, 0)',
              borderRadius: 0,
              backgroundColor: '#000000',
              transition: 'all 0.2s ease'
            }}
          >
            DASH/
          </a>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24, letterSpacing: 1 }}>
          Blog Dashboard
        </h1>
        <button
          onClick={openAdd}
          style={{
            marginBottom: 16,
            padding: '10px 20px',
            fontWeight: 600,
            borderRadius: 6,
            background: '#111',
            color: '#F1F1F1',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Add Blog
        </button>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'rgba(18,18,20,0.7)',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              color: '#F1F1F1',
            }}
          >
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Title</th>
                <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Author</th>
                <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Date</th>
                <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog: Blog) => (
                <tr key={blog.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>{blog.title}</td>
                  <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>{blog.author}</td>
                  <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>{blog.date}</td>
                  <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>
                    <button
                      onClick={() => setViewBlog(blog)}
                      style={{
                        marginRight: 8,
                        padding: '6px 14px',
                        borderRadius: 4,
                        background: 'transparent',
                        color: '#F1F1F1',
                        border: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEdit(blog)}
                      style={{
                        marginRight: 8,
                        padding: '6px 14px',
                        borderRadius: 4,
                        background: 'transparent',
                        color: '#F1F1F1',
                        border: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {viewBlog && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
            }}
          >
            <div
              style={{
                background: 'rgba(18,18,20,0.9)',
                padding: 32,
                borderRadius: 10,
                minWidth: 350,
                maxWidth: 500,
                boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
                position: 'relative',
                color: '#F1F1F1'
              }}
            >
              <button
                onClick={() => setViewBlog(null)}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  color: '#888',
                }}
              >
                &times;
              </button>
              <h2 style={{ marginBottom: 18, fontWeight: 600 }}>Blog Details</h2>
              <div style={{ fontSize: 15, lineHeight: 1.7, color: '#D9D9D9' }}>
                <div>
                  <b>Title:</b> {viewBlog.title}
                </div>
                <div>
                  <b>Excerpt:</b> {viewBlog.excerpt}
                </div>
                <div>
                  <b>Author:</b> {viewBlog.author}
                </div>
                <div>
                  <b>Date:</b> {viewBlog.date}
                </div>
                <div>
                  <b>Content:</b>{' '}
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        background: 'rgba(255,255,255,0.03)',
                        padding: 8,
                        borderRadius: 4,
                        color: '#F1F1F1'
                      }}
                    >
                    {viewBlog.content}
                  </pre>
                </div>
                <div>
                  <b>Image URL:</b>{' '}
                  <a href={viewBlog.imageUrl} target="_blank" rel="noopener noreferrer">
                    {viewBlog.imageUrl}
                  </a>
                </div>
                <div>
                  <b>Detail Image URL:</b>{' '}
                  <a href={viewBlog.detailImageUrl2} target="_blank" rel="noopener noreferrer">
                    {viewBlog.detailImageUrl2}
                  </a>
                </div>
                <div>
                  <b>Is Pinned:</b> {viewBlog.isPinned ? 'Yes' : 'No'}
                </div>
                <div>
                  <b>Tags:</b>{' '}
                  {viewBlog.tags && viewBlog.tags.length > 0 ? viewBlog.tags.join(', ') : 'None'}
                </div>
              </div>
            </div>
          </div>
        )}
        {showDialog && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
              }}
            >
              <form
                onSubmit={handleSubmit}
                style={{
                  background: 'rgba(18,18,20,0.95)',
                  padding: 24,
                  borderRadius: 8,
                  minWidth: 350,
                  maxWidth: 400,
                  color: '#F1F1F1'
                }}
              >
              <h2 style={{ marginBottom: 16 }}>{editMode ? 'Edit Blog' : 'Add Blog'}</h2>

              <label>
                Title
                  <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    marginBottom: 8,
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 4,
                      background: 'transparent',
                      padding: 8,
                      color: '#F1F1F1'
                  }}
                />
              </label>
              <label>
                Slug
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    background: '#fafbfc',
                    padding: 8,
                  }}
                />
              </label>
              <label>
                Excerpt
                <input
                  name="excerpt"
                  value={form.excerpt}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    background: '#fafbfc',
                    padding: 8,
                  }}
                />
              </label>
              <label>
                Author
                <input
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    background: '#fafbfc',
                    padding: 8,
                  }}
                />
              </label>
              <label>
                Date
                <input
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    background: '#fafbfc',
                    padding: 8,
                  }}
                />
              </label>
              <label>
                Content
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    background: '#fafbfc',
                    padding: 8,
                  }}
                />
              </label>
              <label>
                Image URL
                <input
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    background: '#fafbfc',
                    padding: 8,
                  }}
                />
              </label>
              <label>
                Detail Image URL
                <input
                  name="detailImageUrl2"
                  value={form.detailImageUrl2}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    background: '#fafbfc',
                    padding: 8,
                  }}
                />
              </label>
              <label>
                Is Pinned
                <input
                  name="isPinned"
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={handleChange}
                  style={{ marginLeft: 8 }}
                />
              </label>
              <label>
                Tags (comma separated)
                <input
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    background: '#fafbfc',
                    padding: 8,
                  }}
                />
              </label>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                <button type="submit" style={{ padding: '8px 16px', background: '#111', color: '#F1F1F1', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {editMode ? 'Update' : 'Add'}
                </button>
                <button type="button" onClick={closeDialog} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.04)', color: '#F1F1F1' }}>
                  Cancel
                </button>
                {editMode && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    style={{ padding: '8px 16px', color: '#ff6b6b', background: 'transparent', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
