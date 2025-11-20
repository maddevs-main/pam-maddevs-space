// Migrated legacy News management UI (client)
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';

type News = {
  id?: number;
  title: string;
  slug: string;
  subtitle: string;
  imageUrl: string;
  content: string;
  layout: string;
  tags: string[];
};

type FormNews = Omit<News, 'id' | 'tags'> & { tags: string; slug: string };

const emptyNews: FormNews = {
  title: '',
  subtitle: '',
  imageUrl: '',
  content: '',
  layout: '',
  tags: '',
  slug: '',
};

export default function AdminNewsPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [form, setForm] = useState<FormNews>(emptyNews);
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.replace('/auth/login');
          return;
        }
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (e) {
        router.replace('/auth/login');
      }
    };
    validateToken();
  }, [router]);

  const getAuthHeaders = () => ({ 'Content-Type': 'application/json' });

  const adminFetch = async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(path, opts);
    return res;
  };

  const fetchNews = React.useCallback(async () => {
    setLoading(true);
    try {
      const adminUrl = apiBase ? `${apiBase}/admin/news` : '/api/admin/news';
      const res = await adminFetch(adminUrl, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch news');
      setNews(data.news || []);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNews();
    }
  }, [isAuthenticated, fetchNews]);

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
    setForm(emptyNews);
    setEditMode(false);
    setShowDialog(true);
    setEditId(null);
  };
  const openEdit = (item: News) => {
    setForm({ ...item, tags: (item.tags ?? []).join(', '), slug: item.slug ?? '' });
    setEditMode(true);
    setShowDialog(true);
    setEditId(item.id ?? null);
  };
  const closeDialog = () => {
    setShowDialog(false);
    setForm(emptyNews);
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
    const { name, value } = e.target;
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
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.slug) {
      setError('Slug is required');
      return;
    }
    const payload: News = {
      ...form,
      tags: form.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
    } as News;
    try {
      if (editMode && editId !== null) {
        const adminUrl = apiBase ? `${apiBase}/admin/news/${editId}` : `/api/admin/news/${editId}`;
        await adminFetch(adminUrl, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) });
      } else {
        const adminUrl = apiBase ? `${apiBase}/admin/news` : '/api/admin/news';
        await adminFetch(adminUrl, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
      }
      await fetchNews();
      closeDialog();
    } catch (e) {
      console.error(e);
      setError('Failed to save news');
    }
  };
  const handleDelete = async () => {
    if (editId === null) return;
    try {
      const adminUrl = apiBase ? `${apiBase}/admin/news/${editId}` : `/api/admin/news/${editId}`;
      await adminFetch(adminUrl, { method: 'DELETE', headers: getAuthHeaders() });
      await fetchNews();
      closeDialog();
    } catch {
      setError('Failed to delete news');
    }
  };

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: 124,
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
          News Dashboard
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
            border: '1px solid rgba(255,255,255,0.04)',
            cursor: 'pointer',
          }}
        >
          Add News
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
                <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Subtitle</th>
                <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Layout</th>
                <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {news.map((item: News) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>{item.title}</td>
                  <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>{item.subtitle}</td>
                  <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>{item.layout}</td>
                  <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>
                    <button
                      onClick={() => openEdit(item)}
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
        {showDialog && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.35)',
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
                padding: 28,
                borderRadius: 10,
                minWidth: 350,
                maxWidth: 420,
                boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
                color: '#F1F1F1'
              }}
            >
              <h2 style={{ marginBottom: 18, fontWeight: 600 }}>
                {editMode ? 'Edit News' : 'Add News'}
              </h2>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Title
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    padding: 6,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'transparent',
                    color: '#F1F1F1'
                  }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Slug
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    padding: 6,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'transparent',
                    color: '#F1F1F1'
                  }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Subtitle
                <input
                  name="subtitle"
                  value={form.subtitle}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    padding: 6,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'transparent',
                    color: '#F1F1F1'
                  }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Image URL
                <input
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    padding: 6,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'transparent',
                    color: '#F1F1F1'
                  }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Content
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    padding: 6,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'transparent',
                    color: '#F1F1F1'
                  }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Layout - &apos;image-top, image-left, image-right&apos;
                <input
                  name="layout"
                  value={form.layout}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    padding: 6,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'transparent',
                    color: '#F1F1F1'
                  }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Tags (comma separated)
                <input
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    padding: 6,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'transparent',
                    color: '#F1F1F1'
                  }}
                />
              </label>
                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: 4,
                    background: '#111',
                    color: '#F1F1F1',
                    border: '1px solid rgba(255,255,255,0.04)',
                    fontWeight: 600,
                  }}
                >
                  {editMode ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={closeDialog}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 4,
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#F1F1F1'
                  }}
                >
                  Cancel
                </button>
                {editMode && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 4,
                      background: 'transparent',
                      color: '#ff6b6b',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
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
