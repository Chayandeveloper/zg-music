import React from 'react';
import { LucideIcon, TrendingUp } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accentColor?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  accentColor = 'var(--primary)',
}) => {
  return (
    <div className="glass-panel" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', letterSpacing: '-0.5px' }}>
            {value}
          </div>
        </div>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: `rgba(234, 179, 8, 0.1)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          border: '1px solid rgba(234, 179, 8, 0.2)',
        }}>
          <Icon size={22} />
        </div>
      </div>

      {trend && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '14px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--success)',
        }}>
          <TrendingUp size={14} />
          <span>{trend}</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs previous week</span>
        </div>
      )}
    </div>
  );
};
