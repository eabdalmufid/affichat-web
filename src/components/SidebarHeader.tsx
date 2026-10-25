import React from 'react';
import { MessageSquarePlus, Settings, Lock } from 'lucide-react';
import type { WebhookStatus } from '../services/webhookReceiver';
import logoImg from '../assets/logo-nobg.png';

interface SidebarHeaderProps {
  onOpenNewChat: () => void;
  onOpenSettings: () => void;
  webhookStatus: WebhookStatus;
  sessionId: string;
  hasPin?: boolean;
  onLockNow?: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  onOpenNewChat,
  onOpenSettings,
  webhookStatus,
  sessionId,
  hasPin,
  onLockNow,
}) => {
  const isOnline = webhookStatus === 'connected';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        backgroundColor: 'var(--bg-header)',
        height: '60px',
        borderBottom: '1px solid var(--border)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src={logoImg}
          alt="AffiChat"
          style={{
            width: '32px',
            height: '32px',
            objectFit: 'contain',
            flexShrink: 0,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.2px',
              }}
            >
              AffiChat
            </span>
            {!isOnline && (
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                Offline
              </span>
            )}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {sessionId || 'default'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {hasPin && (
          <button
            onClick={onLockNow}
            title="Kunci Layar Sekarang (Amankan Chat)"
            aria-label="Kunci Layar Sekarang"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#00A884';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Lock size={19} />
          </button>
        )}

        <button
          onClick={onOpenNewChat}
          title="Mulai Chat Baru"
          aria-label="Mulai Chat Baru"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <MessageSquarePlus size={20} />
        </button>

        <button
          onClick={onOpenSettings}
          title="Pengaturan"
          aria-label="Pengaturan"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
};
