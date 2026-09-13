import React, { useEffect, useState } from 'react';
import { ApiClient } from '../services/api';
import { AuditLog } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await ApiClient.getAuditLogs();
        setLogs(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Administrative Audit Trail</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Immutable historical log of all editorial actions, approval status modifications, and takedowns.
        </p>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Administrator</th>
              <th>Entity</th>
              <th>Details</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading audit trail...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No logged administrative events recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.user?.name || 'System Admin'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {log.auditable_type ? log.auditable_type.split('\\').pop() : 'Global'} #{log.auditable_id}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {log.new_values ? JSON.stringify(log.new_values) : '-'}
                  </td>
                  <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.ip_address || '127.0.0.1'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
