import React from 'react';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import logoImg from '../assets/logo-nobg.png';

interface EmptyChatProps {
  onOpenSettings: () => void;
  isConfigured: boolean;
}

export const EmptyChat: React.FC<EmptyChatProps> = ({ onOpenSettings, isConfigured }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '32px 24px',
        textAlign: 'center',
        backgroundColor: 'var(--bg-chat)',
        boxSizing: 'border-box',
      }}
    >
      <img
        src={logoImg}
        alt="AffiChat"
        style={{
          width: '72px',
          height: '72px',
          objectFit: 'contain',
          marginBottom: '24px',
          opacity: 0.95,
        }}
      />

      <h1
        style={{
          fontSize: '24px',
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '-0.2px',
          marginBottom: '8px',
        }}
      >
        {isConfigured ? 'AffiChat Web' : 'Selamat Datang di AffiChat Web'}
      </h1>

      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          maxWidth: '440px',
          lineHeight: '1.6',
          marginBottom: isConfigured ? '0' : '24px',
        }}
      >
        {isConfigured
          ? 'Pilih percakapan di sebelah kiri untuk membaca pesan, atau klik ikon tambah di atas untuk memulai obrolan baru.'
          : 'Kirim dan terima pesan WhatsApp langsung dari browser tanpa perlu install aplikasi atau database tambahan.'}
      </p>

      {!isConfigured && (
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: 'var(--bg-sidebar)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '18px 20px',
            textAlign: 'left',
            marginBottom: '24px',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Cara Menghubungkan (Mudah):
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--accent)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>Masukkan <strong>API Key</strong> dari akun Anda di chat.affidev.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--accent)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>Buat dan salin <strong>Link Webhook</strong> ke menu Webhooks di dashboard</span>
            </div>
          </div>

          <button
            onClick={onOpenSettings}
            style={{
              marginTop: '16px',
              width: '100%',
              height: '40px',
              backgroundColor: 'var(--accent)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
          >
            <span>Buka Pengaturan Sekarang</span>
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginTop: 'auto',
          paddingBottom: '8px',
        }}
      >
        <Lock size={13} />
        <span>Terenkripsi secara end-to-end</span>
      </div>
    </div>
  );
};
