import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/api';

export const AlbumsPage: React.FC = () => {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await ApiClient.getAlbums();
        setAlbums(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Albums & Discography</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Published album packages, soundtracks, and compilation releases.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
      }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading albums...</div>
        ) : albums.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No albums published.</div>
        ) : (
          albums.map((album) => (
            <div key={album.id} className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px' }}>
              <img
                src={album.cover_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80'}
                alt={album.title}
                style={{ width: '84px', height: '84px', borderRadius: '8px', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800 }}>{album.title}</h4>
                  <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '2px' }}>
                    {album.artist?.name || 'Artist'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {album.release_year} • {album.genre}
                  </div>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {album.songs_count || 0} tracks
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
