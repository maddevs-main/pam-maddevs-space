// Migrated legacy Onboard management UI (client)
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import tryFetch from '../../../lib/clientFetch';

// Simple loading spinner
const LoadingSpinner = ({ size = 16, color = "#fff" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" style={{ display: "inline-block" }}>
    <circle cx="25" cy="25" r="20" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round">
      <animate attributeName="stroke-dashoffset" values="0;502" dur="1.5s" repeatCount="indefinite" />
    </circle>
  </svg>
);

type Onboard = {
  _id: string;
  name: string;
  email: string;
  organisation: string;
  title: string;
  message: string;
  date: string;
  time: string;
  meetingId: string;
  meeting_link?: string;
  approved?: boolean | null;
  done?: boolean | null;
};

export default function AdminOnboardPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.replace('/auth/login');
          return;
        }
        setIsAuthenticated(true);
      } catch (e) {
        console.error("auth check failed", e);
        router.replace('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [router]);

  const getAuthHeaders = () => ({ 'Content-Type': 'application/json' });
  const [onboards, setOnboards] = useState<Onboard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [updating, setUpdating] = useState<string>('');
  const [viewOnboard, setViewOnboard] = useState<Onboard | null>(null);
  const [view, setView] = useState<'default' | 'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('default');

  const [approvalDialog, setApprovalDialog] = useState<{ show: boolean; onboardId: string | null; meetingLink: string }>({ show: false, onboardId: null, meetingLink: '' });

  const adminFetch = async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(path, opts);
    return res;
  };

  const fetchOnboards = React.useCallback(async () => {
    setLoading(true);
    try {
      const adminUrl = apiBase ? `${apiBase}/admin/onboard/all` : '/api/admin/onboard/all';
      const res = await adminFetch(adminUrl, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch onboard entries');
      setOnboards(data.meetings || []);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch onboard entries');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    if (isAuthenticated) fetchOnboards();
  }, [isAuthenticated, fetchOnboards]);

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

  const handleApproveClick = (id: string) => {
    setApprovalDialog({ show: true, onboardId: id, meetingLink: '' });
  };

  const handleApproveConfirm = async (approved: boolean) => {
    if (!approvalDialog.onboardId) return;

    setUpdating(approvalDialog.onboardId + approved);
    try {
      const adminUrl = apiBase ? `${apiBase}/admin/onboard/${approvalDialog.onboardId}/approve` : `/api/admin/onboard/${approvalDialog.onboardId}/approve`;
      const legacyUrl = apiBase ? `${apiBase}/onboard/${approvalDialog.onboardId}/approve` : `/api/onboard/${approvalDialog.onboardId}/approve`;
      const res = await tryFetch(adminUrl, legacyUrl, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ approved, meeting_link: approved ? approvalDialog.meetingLink : undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update approval');
      await fetchOnboards();
      setApprovalDialog({ show: false, onboardId: null, meetingLink: '' });
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to update approval');
    } finally {
      setUpdating('');
    }
  };

  const handleMeetingLinkChange = (value: string) => {
    setApprovalDialog(prev => ({ ...prev, meetingLink: value }));
  };

  const all = onboards;
  const approved = onboards.filter(o => o.approved === true && o.done !== true);
  const rejected = onboards.filter(o => o.approved === false);
  const pending = onboards.filter(o => o.approved === null || typeof o.approved === 'undefined');
  const completed = onboards.filter(o => o.done === true);

  const handleDone = async (id: string) => {
    setUpdating(id + 'done');
    try {
      const adminUrl = apiBase ? `${apiBase}/admin/onboard/${id}/done` : `/api/admin/onboard/${id}/done`;
      const legacyUrl = apiBase ? `${apiBase}/onboard/${id}/done` : `/api/onboard/${id}/done`;
      const res = await tryFetch(adminUrl, legacyUrl, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ done: true }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update done status');
      await fetchOnboards();
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to update done status');
    } finally {
      setUpdating('');
    }
  };

  const Table = ({ title, data, showDone, showApprove }: { title: string; data: Onboard[]; showDone?: boolean; showApprove?: boolean }) => (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12, color: '#F1F1F1' }}>{title}</h2>

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
            <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Name</th>
            <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Email</th>
            <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Organisation</th>
            <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Title</th>
            <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Date</th>
            <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Time</th>
            <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Approved</th>
            {showDone && <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Done</th>}
            <th style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(o => (
              <tr key={o._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }} onClick={() => setViewOnboard(o)}>
              <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>{o.name}</td>
              <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>{o.email}</td>
              <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>{o.organisation}</td>
              <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>{o.title}</td>
              <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>{o.date}</td>
              <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>{o.time}</td>
              <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>{o.approved === true ? 'Yes' : o.approved === false ? 'No' : 'None'}</td>
              {showDone && <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }}>{o.done === true ? 'Yes' : 'No'}</td>}
              <td style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, color: '#F1F1F1' }} onClick={e => e.stopPropagation()}>
                {showApprove && (
                  <button
                    onClick={() => handleApproveClick(o._id)}
                    disabled={updating === o._id + 'true' || updating === o._id + 'false'}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 4,
                      background: '#2ecc40',
                      color: '#fff',
                      border: 'none',
                      cursor: updating === o._id + 'true' || updating === o._id + 'false' ? 'not-allowed' : 'pointer',
                      opacity: updating === o._id + 'true' || updating === o._id + 'false' ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      minWidth: '80px',
                      justifyContent: 'center'
                    }}
                  >
                    {(updating === o._id + 'true' || updating === o._id + 'false') ? (
                      <LoadingSpinner size={14} color="#fff" />
                    ) : null}
                    Approve
                  </button>
                )}
                {showDone && o.done !== true && (
                  <button
                    onClick={() => handleDone(o._id)}
                    disabled={updating === o._id + 'done'}
                    style={{
                      marginLeft: 8,
                      padding: '6px 14px',
                      borderRadius: 4,
                      background: '#0074d9',
                      color: '#fff',
                      border: 'none',
                      cursor: updating === o._id + 'done' ? 'not-allowed' : 'pointer',
                      opacity: updating === o._id + 'done' ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      minWidth: '60px',
                      justifyContent: 'center'
                    }}
                  >
                    {updating === o._id + 'done' ? (
                      <LoadingSpinner size={14} color="#fff" />
                    ) : null}
                    Done
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div
        style={{
          maxWidth: 1100,
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
          Onboard Management
        </h1>
        <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setView('default')}
              style={{
                padding: '8px 18px',
                borderRadius: 4,
                background: view === 'default' ? '#111' : 'transparent',
                color: view === 'default' ? '#F1F1F1' : '#D9D9D9',
                border: view === 'default' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.02)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
          >
            Default
          </button>
          <button
            onClick={() => setView('all')}
            style={{
              padding: '8px 18px',
              borderRadius: 4,
              background: view === 'all' ? '#111' : 'transparent',
              color: view === 'all' ? '#F1F1F1' : '#D9D9D9',
              border: view === 'all' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.02)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All
          </button>
          <button
            onClick={() => setView('pending')}
            style={{
              padding: '8px 18px',
              borderRadius: 4,
              background: view === 'pending' ? '#111' : 'transparent',
              color: view === 'pending' ? '#F1F1F1' : '#D9D9D9',
              border: view === 'pending' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.02)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Pending
          </button>
          <button
            onClick={() => setView('approved')}
            style={{
              padding: '8px 18px',
              borderRadius: 4,
              background: view === 'approved' ? '#111' : 'transparent',
              color: view === 'approved' ? '#F1F1F1' : '#D9D9D9',
              border: view === 'approved' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.02)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Approved
          </button>
          <button
            onClick={() => setView('rejected')}
            style={{
              padding: '8px 18px',
              borderRadius: 4,
              background: view === 'rejected' ? '#111' : 'transparent',
              color: view === 'rejected' ? '#F1F1F1' : '#D9D9D9',
              border: view === 'rejected' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.02)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Rejected
          </button>
          <button
            onClick={() => setView('completed')}
            style={{
              padding: '8px 18px',
              borderRadius: 4,
              background: view === 'completed' ? '#111' : 'transparent',
              color: view === 'completed' ? '#F1F1F1' : '#D9D9D9',
              border: view === 'completed' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.02)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Completed
          </button>
        </div>
        <div><p className='text-sm font-mono' style={{ color: '#ff8b8b' }}>A mail will be sent to the client and you notifying each change.</p></div>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : (
          <>
            {view === 'default' && (
              <>
                <Table title="Pending Onboards" data={pending} showApprove />
                <Table title="Approved Onboards" data={approved} showDone />
              </>
            )}
            {view === 'all' && <Table title="All Onboards" data={all} />}
            {view === 'pending' && <Table title="Pending Onboards" data={pending} showApprove />}
            {view === 'approved' && <Table title="Approved Onboards" data={approved} showDone />}
            {view === 'rejected' && <Table title="Rejected Onboards" data={rejected} />}
            {view === 'completed' && <Table title="Meeting Complete" data={completed} showDone />}
          </>
        )}

        {approvalDialog.show && (
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
              zIndex: 300,
            }}
          >
            <div
              style={{
                background: 'rgba(18,18,20,0.95)',
                padding: 32,
                borderRadius: 10,
                minWidth: 400,
                maxWidth: 500,
                boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
                position: 'relative',
                color: '#F1F1F1'
              }}
            >
              <button
                onClick={() => setApprovalDialog({ show: false, onboardId: null, meetingLink: '' })}
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
              <h2 style={{ marginBottom: 18, fontWeight: 600 }}>Approve Meeting</h2>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Meeting Link (Optional):
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={approvalDialog.meetingLink}
                  onChange={e => handleMeetingLinkChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 4,
                    fontSize: 14,
                    boxSizing: 'border-box',
                    background: 'transparent',
                    color: '#F1F1F1'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setApprovalDialog({ show: false, onboardId: null, meetingLink: '' })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 4,
                    background: 'transparent',
                    color: '#F1F1F1',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApproveConfirm(false)}
                  disabled={updating === approvalDialog.onboardId + 'false'}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 4,
                    background: '#ff4136',
                    color: '#fff',
                    border: 'none',
                    cursor: updating === approvalDialog.onboardId + 'false' ? 'not-allowed' : 'pointer',
                    opacity: updating === approvalDialog.onboardId + 'false' ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: '80px',
                    justifyContent: 'center'
                  }}
                >
                  {updating === approvalDialog.onboardId + 'false' ? (
                    <LoadingSpinner size={14} color="#fff" />
                  ) : null}
                  Reject
                </button>
                <button
                  onClick={() => handleApproveConfirm(true)}
                  disabled={updating === approvalDialog.onboardId + 'true'}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 4,
                    background: '#2ecc40',
                    color: '#fff',
                    border: 'none',
                    cursor: updating === approvalDialog.onboardId + 'true' ? 'not-allowed' : 'pointer',
                    opacity: updating === approvalDialog.onboardId + 'true' ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: '80px',
                    justifyContent: 'center'
                  }}
                >
                  {updating === approvalDialog.onboardId + 'true' ? (
                    <LoadingSpinner size={14} color="#fff" />
                  ) : null}
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {viewOnboard && (
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
                background: 'rgba(18,18,20,0.95)',
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
                onClick={() => setViewOnboard(null)}
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
              <h2 style={{ marginBottom: 18, fontWeight: 600 }}>Onboard Details</h2>
              <div style={{ fontSize: 15, lineHeight: 1.7, color: '#D9D9D9' }}>
                <div>
                  <b>Name:</b> {viewOnboard.name}
                </div>
                <div>
                  <b>Email:</b> {viewOnboard.email}
                </div>
                <div>
                  <b>Organisation:</b> {viewOnboard.organisation}
                </div>
                <div>
                  <b>Title:</b> {viewOnboard.title}
                </div>
                <div>
                  <b>Message:</b>{' '}
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      background: 'rgba(255,255,255,0.03)',
                      padding: 8,
                      borderRadius: 4,
                      color: '#F1F1F1'
                    }}
                  >
                    {viewOnboard.message}
                  </pre>
                </div>
                <div>
                  <b>Date:</b> {viewOnboard.date}
                </div>
                <div>
                  <b>Time:</b> {viewOnboard.time}
                </div>
                <div>
                  <b>Meeting ID:</b> {viewOnboard.meetingId}
                </div>
                <div>
                  <b>Meeting Link:</b>{' '}
                  {viewOnboard.meeting_link ? (
                    <a href={viewOnboard.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#0074d9' }}>
                      {viewOnboard.meeting_link}
                    </a>
                  ) : (
                    'Not set'
                  )}
                </div>
                <div>
                  <b>Approved:</b>{' '}
                  {viewOnboard.approved === true
                    ? 'Yes'
                    : viewOnboard.approved === false
                      ? 'No'
                      : 'None'}
                </div>
                <div>
                  <b>Done:</b>{' '}
                  {viewOnboard.done === true ? 'Yes' : viewOnboard.done === false ? 'No' : 'None'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
