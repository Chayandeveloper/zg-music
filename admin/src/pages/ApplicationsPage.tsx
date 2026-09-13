import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/api';
import { ArtistApplication } from '../types';
import { X, ShieldCheck } from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<ArtistApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ArtistApplication | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchApps = async () => {
    try {
      const res = await ApiClient.getApplications();
      setApplications(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleReview = async () => {
    if (!selectedApp || !reviewAction) return;
    setSubmitting(true);
    try {
      await ApiClient.reviewApplication(selectedApp.id, {
        action: reviewAction,
        admin_notes: adminNotes,
      });
      setSelectedApp(null);
      setReviewAction(null);
      setAdminNotes('');
      fetchApps();
    } catch (err: any) {
      alert(err.message || 'Review failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Artist Stage Verification Applications</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Review identity, artistic biography, and rights declaration before granting Zubeen Stage publishing rights.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Artist Name</th>
              <th>Applicant</th>
              <th>Genres</th>
              <th>Rights Declaration</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading applications...
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No pending artist applications.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={app.profile_image_path || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=100&q=80'}
                        alt={app.artist_name}
                        style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                      <span style={{ fontWeight: 700 }}>{app.artist_name}</span>
                    </div>
                  </td>
                  <td>
                    <div>{app.user?.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{app.user?.email}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {app.genres?.map((g, i) => (
                        <span key={i} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {app.rights_declaration ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '12px', fontWeight: 700 }}>
                        <ShieldCheck size={14} /> Attested
                      </span>
                    ) : (
                      <span style={{ color: 'var(--danger)', fontSize: '12px' }}>Missing</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${app.status.toLowerCase()}`}>
                      {app.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => {
                        setSelectedApp(app);
                        setReviewAction('APPROVE');
                      }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Application Review Modal */}
      {selectedApp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div className="glass-panel" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Review Artist Application</h3>
              <button
                onClick={() => setSelectedApp(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
              <img
                src={selectedApp.profile_image_path || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'}
                alt={selectedApp.artist_name}
                style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }}
              />
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800 }}>{selectedApp.artist_name}</h4>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  User: {selectedApp.user?.name} ({selectedApp.user?.email})
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Biography</label>
              <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                {selectedApp.biography}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Artist Background & Rights Attestation</label>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                {selectedApp.artist_information}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Action</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setReviewAction('APPROVE')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: reviewAction === 'APPROVE' ? '2px solid var(--success)' : '1px solid var(--border-subtle)',
                    background: reviewAction === 'APPROVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                    color: reviewAction === 'APPROVE' ? 'var(--success)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Approve Artist
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('REQUEST_CHANGES')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: reviewAction === 'REQUEST_CHANGES' ? '2px solid var(--warning)' : '1px solid var(--border-subtle)',
                    background: reviewAction === 'REQUEST_CHANGES' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
                    color: reviewAction === 'REQUEST_CHANGES' ? 'var(--warning)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('REJECT')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: reviewAction === 'REJECT' ? '2px solid var(--danger)' : '1px solid var(--border-subtle)',
                    background: reviewAction === 'REJECT' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.04)',
                    color: reviewAction === 'REJECT' ? 'var(--danger)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reject
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Admin Notes / Feedback to Artist
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Reasoning or required modifications..."
                rows={3}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setSelectedApp(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleReview} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
