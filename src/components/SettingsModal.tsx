import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Smartphone,
  Radio,
  Copy,
  Check,
  Volume2,
  Trash2,
  Download,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import type { AppSettings } from '../types';
import { exportBackup, clearAllData } from '../utils/storage';
import type { WebhookStatus } from '../services/webhookReceiver';
import { GatewayApiClient } from '../services/gatewayApi';
import logoImg from '../assets/logo-nobg.png';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  webhookStatus: WebhookStatus;
  onClearChats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  webhookStatus,
  onClearChats,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [isCopied, setIsCopied] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sync state when modal opens or settings change
  useEffect(() => {
    if (isOpen) {
      setFormData({ ...settings });
      setTestResult(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  const handleGenerateSmee = () => {
    const randomId = Math.random().toString(36).substring(2, 10);
    const generatedUrl = `https://smee.io/affichat_${randomId}`;
    setFormData((prev) => ({ ...prev, smeeChannel: generatedUrl }));
  };

  const handleTestApiKey = async () => {
    if (!formData.apiKey.trim()) {
      setTestResult({ success: false, message: 'Masukkan API Key terlebih dahulu.' });
      return;
    }
    setIsTestingKey(true);
    setTestResult(null);
    const res = await GatewayApiClient.testConnection(formData.gatewayUrl, formData.apiKey);
    setIsTestingKey(false);
    setTestResult(res);
  };

  const handleCopySmee = () => {
    if (!formData.smeeChannel) return;
    navigator.clipboard.writeText(formData.smeeChannel);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExport = () => {
    const json = exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affichat_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isWebhookReady = webhookStatus === 'connected';

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
          maxWidth: '520px',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-sidebar)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            backgroundColor: 'var(--bg-header)',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={logoImg}
              alt="AffiChat"
              style={{ width: '28px', height: '28px', objectFit: 'contain' }}
            />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Pengaturan WhatsApp
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Integrasi REST API & Webhook AffiChat
              </span>
            </div>
          </div>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
            {/* Gateway Info Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-header)',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Server Gateway: <strong style={{ color: 'var(--text-primary)' }}>chat.affidev.com</strong>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>
                Terhubung Otomatis
              </span>
            </div>

            {/* 1. API Key Field */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  API Key AffiChat <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <a
                  href="https://chat.affidev.com/dashboard/apikeys"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '11px',
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <span>Buka Menu API Key</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <Key size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  placeholder="Tempel wag_live_... di sini"
                  value={formData.apiKey}
                  onChange={(e) => {
                    setFormData({ ...formData, apiKey: e.target.value });
                    setTestResult(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 105px 9px 34px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={handleTestApiKey}
                  disabled={isTestingKey}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '6px',
                    bottom: '6px',
                    padding: '0 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-header)',
                    border: '1px solid var(--border)',
                    color: 'var(--accent)',
                    cursor: isTestingKey ? 'wait' : 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isTestingKey ? 'Memeriksa...' : 'Periksa Key'}
                </button>
              </div>

              {testResult && (
                <div
                  style={{
                    marginTop: '6px',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    lineHeight: '1.4',
                    backgroundColor: testResult.success ? 'rgba(0, 168, 132, 0.12)' : 'rgba(241, 92, 109, 0.12)',
                    color: testResult.success ? 'var(--accent)' : 'var(--danger)',
                    border: `1px solid ${testResult.success ? 'rgba(0, 168, 132, 0.25)' : 'rgba(241, 92, 109, 0.25)'}`,
                  }}
                >
                  {testResult.message}
                </div>
              )}

              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Salin dari menu <strong>API Key</strong> di dashboard akun chat.affidev.com Anda.
              </span>
            </div>

            {/* 2. Session ID Field */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  ID Sesi WhatsApp (Device) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <a
                  href="https://chat.affidev.com/dashboard/sessions"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '11px',
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <span>Lihat di Menu Perangkat</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <Smartphone size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="text"
                  placeholder="Contoh: affichat_4b64bd92"
                  value={formData.sessionId}
                  onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              {formData.sessionId.trim().toLowerCase() === 'default' && (
                <div
                  style={{
                    marginTop: '6px',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    lineHeight: '1.4',
                    backgroundColor: 'rgba(245, 166, 35, 0.12)',
                    color: '#F5A623',
                    border: '1px solid rgba(245, 166, 35, 0.3)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                  }}
                >
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>
                    AffiChat menggunakan ID Sesi acak (misal: <strong>affichat_xxxx</strong>). Pastikan kolom ini diisi persis sama dengan yang ada di menu <strong>Perangkat</strong> agar pesan tidak ditolak.
                  </span>
                </div>
              )}

              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block', lineHeight: '1.4' }}>
                Wajib sama persis dengan kolom <strong>ID Sesi</strong> di menu <strong>Perangkat</strong> (dashboard chat.affidev.com).
              </span>
            </div>

            {/* 3. Webhook Receiver Guide & Field */}
            <div
              style={{
                marginBottom: '18px',
                padding: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Link Penerima Pesan (Webhook)
                </label>
                <span
                  style={{
                    fontSize: '11px',
                    color: isWebhookReady ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: isWebhookReady ? 600 : 400,
                  }}
                >
                  {isWebhookReady ? 'Siap Menerima Pesan' : 'Belum Terhubung'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Langkah mudah agar pesan masuk tampil otomatis:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  <div style={{ padding: '6px 8px', borderRadius: '6px', backgroundColor: 'var(--bg-header)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    <strong style={{ color: 'var(--accent)' }}>1.</strong> Buat Link
                  </div>
                  <div style={{ padding: '6px 8px', borderRadius: '6px', backgroundColor: 'var(--bg-header)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    <strong style={{ color: 'var(--accent)' }}>2.</strong> Salin Link
                  </div>
                  <div style={{ padding: '6px 8px', borderRadius: '6px', backgroundColor: 'var(--bg-header)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    <strong style={{ color: 'var(--accent)' }}>3.</strong> Tempel di Webhooks
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Radio size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input
                    type="url"
                    placeholder="https://smee.io/..."
                    value={formData.smeeChannel}
                    onChange={(e) => setFormData({ ...formData, smeeChannel: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateSmee}
                  style={{
                    padding: '0 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-header)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Buat Link Baru
                </button>
              </div>

              {formData.smeeChannel && (
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleCopySmee}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                    {isCopied ? 'Link berhasil disalin!' : 'Salin Link Webhook'}
                  </button>
                </div>
              )}
            </div>

            {/* 4. Sound Notification */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-header)',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Volume2 size={16} color="var(--text-secondary)" />
                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Bunyikan nada saat ada pesan masuk</span>
              </div>
              <input
                type="checkbox"
                checked={formData.enableSound}
                onChange={(e) => setFormData({ ...formData, enableSound: e.target.checked })}
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent)' }}
              />
            </div>

            {/* 5. Backup & Clear History */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleExport}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Download size={13} />
                Simpan Cadangan Chat (JSON)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Hapus seluruh riwayat chat dari browser ini?')) {
                    clearAllData();
                    onClearChats();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--danger)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Trash2 size={13} />
                Hapus Semua Riwayat
              </button>
            </div>
          </div>

          {/* Sticky Footer Actions (Always visible at bottom) */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end',
              padding: '12px 18px',
              backgroundColor: 'var(--bg-header)',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
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
                padding: '9px 20px',
                backgroundColor: 'var(--accent)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
