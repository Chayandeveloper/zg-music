import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/api';
import { Release } from '../types';
import { Play, Pause, ShieldCheck, X } from 'lucide-react';

export const ReleasesPage: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'PUBLISH' | 'TAKEDOWN'>('APPROVE');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [playingTrackUrl, setPlayingTrackUrl] = useState<string | null>(null);

  const fetchReleases = async () => {
    try {
      const res = await ApiClient.getReleases();
      setReleases(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const handleReview = async () => {
    if (!selectedRelease) return;
    setSubmitting(true);
    try {
      await ApiClient.reviewRelease(selectedRelease.id, {
        action: reviewAction,
        notes,
      });
      setSelectedRelease(null);
      setNotes('');
      fetchReleases();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Release Moderation & Publishing</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Review artist submissions, listen to audio streams, inspect lyrics and metadata, and publish approved tracks.
        </p>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Release</th>
              <th>Artist</th>
              <th>Type</th>
              <th>Genre</th>
              <th>Rights Declaration</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading releases...
                </td>
              </tr>
            ) : releases.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No releases found in moderation queue.
                </td>
              </tr>
            ) : (
              releases.map((rel) => (
                <tr key={rel.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={rel.cover_image_path || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=100&q=80'}
                        alt={rel.title}
                        style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700 }}>{rel.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rel.language}</div>
                      </div>
                    </div>
                  </td>
                  <td>{rel.artist?.name || 'Artist'}</td>
                  <td>
                    <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      {rel.release_type}
                    </span>
                  </td>
                  <td>{rel.genre}</td>
                  <td>
                    {rel.rights_declaration ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '12px', fontWeight: 700 }}>
                        <ShieldCheck size={14} /> Confirmed
                      </span>
                    ) : (
                      <span style={{ color: 'var(--danger)', fontSize: '12px' }}>No</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${rel.status.toLowerCase()}`}>
                      {rel.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {new Date(rel.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => {
                        setSelectedRelease(rel);
                        setReviewAction('APPROVE');
                      }}
                    >
                      Moderate
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Release Inspection Modal */}
      {selectedRelease && (
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
          <div className="glass-panel" style={{ width: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Moderate Release</h3>
              <button
                onClick={() => {
                  setSelectedRelease(null);
                  setPlayingTrackUrl(null);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
              <img
                src={selectedRelease.cover_image_path || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'}
                alt={selectedRelease.title}
                style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' }}
              />
              <div>
                <h4 style={{ fontSize: '17px', fontWeight: 800 }}>{selectedRelease.title}</h4>
                <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>{selectedRelease.artist?.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {selectedRelease.release_type} • {selectedRelease.genre} • {selectedRelease.language}
                </div>
              </div>
            </div>

            {/* Audio Tracklist & Preview */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Tracks & Audio Ingestion ({selectedRelease.release_songs?.length || 0})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {selectedRelease.release_songs?.map((song, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255,255,255,0.03)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700 }}>{song.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Status: <span style={{ color: song.processing_status === 'COMPLETED' ? 'var(--success)' : 'var(--warning)' }}>{song.processing_status}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {Math.floor(song.duration_seconds / 60)}:{String(song.duration_seconds % 60).padStart(2, '0')}
                      </span>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        onClick={() => {
                          const rawUrl = song.song?.stream_url;
                          let resolvedUrl = '/storage/masters/har-har-gange-batti-gul-meter-chalu-128-kbps_xjYFsNZL.mp3';
                          if (rawUrl) {
                            resolvedUrl = rawUrl.startsWith('http') ? rawUrl : (rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl);
                          }
                          setPlayingTrackUrl(playingTrackUrl === resolvedUrl ? null : resolvedUrl);
                        }}
                      >
                        {playingTrackUrl ? <Pause size={14} /> : <Play size={14} />} Listen
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {playingTrackUrl && (
                <div style={{ marginTop: '12px', background: 'rgba(234, 179, 8, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-accent)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>Now Auditioning Track</div>
                  <audio
                    key={playingTrackUrl}
                    src={playingTrackUrl}
                    controls
                    autoPlay
                    style={{ width: '100%', height: '36px' }}
                  />
                </div>
              )}
            </div>

            {/* Lyrics Preview if available */}
            {selectedRelease.lyrics && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Lyrics Declaration
                </label>
                <div style={{
                  maxHeight: '120px',
                  overflowY: 'auto',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  lineHeight: 1.5,
                  marginTop: '6px',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedRelease.lyrics}
                </div>
              </div>
            )}

            {/* Decision Controls */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Decision</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setReviewAction('APPROVE')}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: reviewAction === 'APPROVE' ? '2px solid var(--success)' : '1px solid var(--border-subtle)',
                    background: reviewAction === 'APPROVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                    color: reviewAction === 'APPROVE' ? 'var(--success)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('PUBLISH')}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: reviewAction === 'PUBLISH' ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: reviewAction === 'PUBLISH' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.04)',
                    color: reviewAction === 'PUBLISH' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Publish Now
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('REQUEST_CHANGES')}
                  style={{
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
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Editorial Feedback
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason or editorial remarks..."
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
              <button
                className="btn-secondary"
                onClick={() => {
                  setSelectedRelease(null);
                  setPlayingTrackUrl(null);
                }}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleReview} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Apply Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
