import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/api';
import { Song } from '../types';

export const SongsPage: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSongs = async () => {
    try {
      const res = await ApiClient.getSongs();
      setSongs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const toggleSongStatus = async (song: Song) => {
    const nextStatus = song.status === 'PUBLISHED' ? 'TAKEN_DOWN' : 'PUBLISHED';
    const reason = prompt(`Reason for changing status to ${nextStatus}:`, 'Administrative review');
    if (reason === null) return;

    try {
      await ApiClient.updateSongStatus(song.id, nextStatus, reason);
      fetchSongs();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Master Music Catalog</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Manage streaming availability, review playback velocity, and apply immediate takedowns when necessary.
        </p>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Song</th>
              <th>Artist</th>
              <th>Genre</th>
              <th>Duration</th>
              <th>Streams</th>
              <th>Likes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading catalog songs...
                </td>
              </tr>
            ) : songs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No songs in catalog.
                </td>
              </tr>
            ) : (
              songs.map((song) => (
                <tr key={song.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={song.artwork_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=100&q=80'}
                        alt={song.title}
                        style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700 }}>{song.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{song.album?.title || 'Single'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{song.artist?.name || 'Unknown'}</td>
                  <td>{song.genre || 'Assamese'}</td>
                  <td>
                    {Math.floor(song.duration_seconds / 60)}:{String(song.duration_seconds % 60).padStart(2, '0')}
                  </td>
                  <td style={{ fontWeight: 700 }}>{song.play_count.toLocaleString()}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{song.like_count.toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${song.status === 'PUBLISHED' ? 'published' : 'takedown'}`}>
                      {song.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className={song.status === 'PUBLISHED' ? 'btn-danger' : 'btn-success'}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => toggleSongStatus(song)}
                    >
                      {song.status === 'PUBLISHED' ? 'Take Down' : 'Restore'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
