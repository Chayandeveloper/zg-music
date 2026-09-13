import React, { useState } from 'react';
import { AuthProvider, useAdminAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { DashboardPage } from './pages/DashboardPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ReleasesPage } from './pages/ReleasesPage';
import { SongsPage } from './pages/SongsPage';
import { AlbumsPage } from './pages/AlbumsPage';
import { CopyrightPage } from './pages/CopyrightPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { UsersPage } from './pages/UsersPage';
import { LoginPage } from './pages/LoginPage';

const AdminLayout: React.FC = () => {
  const { user, loading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)',
        color: 'var(--primary)',
        fontWeight: 700
      }}>
        Initializing Zubeefy Admin Console...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} />;
      case 'applications':
        return <ApplicationsPage />;
      case 'releases':
        return <ReleasesPage />;
      case 'songs':
        return <SongsPage />;
      case 'albums':
        return <AlbumsPage />;
      case 'copyright':
        return <CopyrightPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'users':
        return <UsersPage />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Platform Performance & Metrics', subtitle: 'Real-time overview of listeners, streams, and releases' },
    applications: { title: 'Artist Applications Review', subtitle: 'Verify identities, credentials, and legal rights attestations' },
    releases: { title: 'Releases & Audio Moderation', subtitle: 'Audition incoming releases, check HLS variants, approve tracks' },
    songs: { title: 'Songs Catalog Management', subtitle: 'Published catalog management, track info, and instant takedown actions' },
    albums: { title: 'Albums & Soundtracks', subtitle: 'Album releases, track counts, and discography' },
    copyright: { title: 'Copyright & DMCA Notices', subtitle: 'Review user and label copyright strikes and takedowns' },
    audit: { title: 'Audit Trail', subtitle: 'Chronological activity history of administrative changes' },
    users: { title: 'User Directory', subtitle: 'Manage listeners, artists, and staff roles' },
  };

  const currentInfo = titles[activeTab] || { title: 'Admin Console', subtitle: '' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopNav title={currentInfo.title} subtitle={currentInfo.subtitle} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AdminLayout />
    </AuthProvider>
  );
};

export default App;
