import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/api';
import { CopyrightReport } from '../types';

export const CopyrightPage: React.FC = () => {
  const [reports, setReports] = useState<CopyrightReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<CopyrightReport | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'TAKEDOWN' | 'DISMISS'>('TAKEDOWN');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await ApiClient.getReports();
      setReports(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async () => {
    if (!selectedReport) return;
    setSubmitting(true);
    try {
      await ApiClient.resolveReport(selectedReport.id, {
        action: resolutionAction,
        notes: notes || 'Resolved by administrator.',
      });
      setSelectedReport(null);
      setNotes('');
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Resolution failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Copyright & Content Moderation</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Investigate claims of unauthorized uploads, impersonations, and copyright infringements with audit history.
        </p>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Song Reported</th>
              <th>Reporter</th>
              <th>Reason</th>
              <th>Description</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading copyright reports...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No open copyright notices. Clean catalog record!
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{report.song?.title || 'Unknown Track'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{report.song?.artist?.name}</div>
                  </td>
                  <td>
                    <div>{report.reporter?.name || 'Anonymous Listener'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{report.reporter?.email}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '11px', background: 'rgba(239,68,68,0.15)', color: '#F87171', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      {report.reason}
                    </span>
                  </td>
                  <td style={{ maxWidth: '300px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {report.description}
                  </td>
                  <td>
                    <span className={`badge badge-${report.status.toLowerCase()}`}>
                      {report.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {report.status === 'PENDING' ? (
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setSelectedReport(report)}
                      >
                        Resolve
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{report.admin_action}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Resolution Modal */}
      {selectedReport && (
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
          <div className="glass-panel" style={{ width: '520px', padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Resolve Moderation Report</h3>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Work:</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>{selectedReport.song?.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Claim: {selectedReport.description}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Resolution Action</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setResolutionAction('TAKEDOWN')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: resolutionAction === 'TAKEDOWN' ? '2px solid var(--danger)' : '1px solid var(--border-subtle)',
                    background: resolutionAction === 'TAKEDOWN' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.04)',
                    color: resolutionAction === 'TAKEDOWN' ? 'var(--danger)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Take Down Song
                </button>
                <button
                  type="button"
                  onClick={() => setResolutionAction('DISMISS')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: resolutionAction === 'DISMISS' ? '2px solid var(--border-accent)' : '1px solid var(--border-subtle)',
                    background: resolutionAction === 'DISMISS' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                    color: resolutionAction === 'DISMISS' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Dismiss Report
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Resolution Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Audit explanation for takedown or dismissal..."
                rows={2}
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
              <button className="btn-secondary" onClick={() => setSelectedReport(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleResolve} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Apply Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
