import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/api';
import { StatsCard } from '../components/StatsCard';
import { Users, UserCheck, Music, Disc3, Play, ArrowUpRight } from 'lucide-react';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await ApiClient.getDashboard();
        setStats(res.data?.stats);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Loading analytics & KPIs...</div>;
  }

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Action Banner for Pending Reviews */}
      {(stats?.pending_applications > 0 || stats?.pending_releases > 0 || stats?.pending_reports > 0) && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#FBBF24' }}>
              Attention Required: Editorial & Moderation Queue
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {stats?.pending_applications || 0} artist applications, {stats?.pending_releases || 0} music releases, and {stats?.pending_reports || 0} copyright notices awaiting moderation.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {stats?.pending_applications > 0 && (
              <button className="btn-primary" onClick={() => setActiveTab('applications')}>
                Review Artists
              </button>
            )}
            {stats?.pending_releases > 0 && (
              <button className="btn-secondary" onClick={() => setActiveTab('releases')}>
                Review Releases
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
      }}>
        <StatsCard
          label="Total Listeners"
          value={stats?.total_users?.toLocaleString() || '0'}
          icon={Users}
          trend="+12%"
        />
        <StatsCard
          label="Verified Artists"
          value={stats?.total_artists || '0'}
          icon={UserCheck}
          trend="+8%"
        />
        <StatsCard
          label="Catalog Songs"
          value={stats?.total_songs || '0'}
          icon={Music}
        />
        <StatsCard
          label="Published Albums"
          value={stats?.total_albums || '0'}
          icon={Disc3}
        />
        <StatsCard
          label="Total Stream Plays"
          value={stats?.total_streams?.toLocaleString() || '0'}
          icon={Play}
          trend="+24%"
        />
      </div>

      {/* Two Column Layout: Quick Actions & Editorial Policy */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Streaming Health & Ingestion</h3>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            All audio releases ingested via <strong>Zubeen Stage</strong> are verified against audio MIME integrity, normalized, transcoded via FFmpeg into multi-bitrate HLS streams (64k, 128k, 192k, 320k), and require verified rights declaration prior to publishing.
          </p>

          <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.03)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>HLS CODEC PROFILE</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>AAC-LC (VOD Segmented)</div>
              <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px' }}>4-Second Segments</div>
            </div>

            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.03)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>STREAM COUNT QUALIFICATION</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>30 Seconds Playback</div>
              <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px' }}>Deduplicated Async Queue</div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Quick Review Links</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => setActiveTab('applications')}
              className="btn-secondary"
              style={{ justifyContent: 'space-between' }}
            >
              <span>Artist Verification</span>
              <ArrowUpRight size={16} />
            </button>
            <button
              onClick={() => setActiveTab('releases')}
              className="btn-secondary"
              style={{ justifyContent: 'space-between' }}
            >
              <span>Pending Releases</span>
              <ArrowUpRight size={16} />
            </button>
            <button
              onClick={() => setActiveTab('copyright')}
              className="btn-secondary"
              style={{ justifyContent: 'space-between' }}
            >
              <span>Copyright Reports</span>
              <ArrowUpRight size={16} />
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className="btn-secondary"
              style={{ justifyContent: 'space-between' }}
            >
              <span>Security Audit Logs</span>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
