import React, { useState } from 'react';
import { X, Phone, User } from 'lucide-react';
import { normalizePhoneNumber, formatPhoneDisplay } from '../utils/phone';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (phone: string, name?: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onStartChat }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('Masukkan nomor WhatsApp yang valid (contoh: 08123456789)');
      return;
    }

    onStartChat(cleanPhone, name.trim() || undefined);
    setPhone('');
    setName('');
    setError('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--bg-sidebar)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            backgroundColor: 'var(--bg-header)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Mulai Chat Baru
          </h3>
          <button
            onClick={onClose}
            aria-label="Tutup"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'inline-flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '18px' }}>
          {error && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(241, 92, 109, 0.12)',
                border: '1px solid rgba(241, 92, 109, 0.25)',
                borderRadius: '6px',
                color: 'var(--danger)',
                fontSize: '12px',
                marginBottom: '14px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Nomor WhatsApp
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError('');
                }}
                autoFocus
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {phone ? (
              <span style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '4px', display: 'block' }}>
                Format WhatsApp: {formatPhoneDisplay(phone)}
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Bisa diawali 08 atau 62 (contoh: 081234567890). Otomatis disesuaikan.
              </span>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Nama Kontak (Opsional)
            </label>
            <div style={{ position: 'relative' }}>
              <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                type="text"
                placeholder="Nama kontak"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 18px',
                backgroundColor: 'var(--accent)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Mulai Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
