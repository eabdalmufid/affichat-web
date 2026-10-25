import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Phone,
} from 'lucide-react';
import type { Chat, Message } from '../types';
import { formatPhoneDisplay } from '../utils/phone';

interface ChatAreaProps {
  chat: Chat;
  messages: Message[];
  onSendMessage: (text: string) => Promise<{ success: boolean; error?: string }>;
  onBackMobile: () => void;
  isSending: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages,
  onSendMessage,
  onBackMobile,
  isSending,
}) => {
  const [inputText, setInputText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
    setSendError(null);
  }, [chat.id]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setSendError(null);
    setInputText('');

    const res = await onSendMessage(text);
    if (!res.success) {
      setSendError(res.error || 'Pesan belum terkirim. Pastikan API Key di Pengaturan sudah terisi dan WhatsApp Anda terhubung.');
      setInputText(text); // restore failed text
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={12} color="var(--text-muted)" />;
      case 'sent':
        return <Check size={14} color="var(--text-secondary)" />;
      case 'delivered':
        return <CheckCheck size={14} color="var(--text-secondary)" />;
      case 'read':
        return <CheckCheck size={14} color="var(--blue-tick)" />;
      case 'failed':
        return <AlertCircle size={13} color="var(--danger)" />;
      default:
        return null;
    }
  };

  const initials = (chat.name || chat.phone).slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Top Chat Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          backgroundColor: 'var(--bg-header)',
          borderBottom: '1px solid var(--border)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Back button for mobile */}
          <button
            onClick={onBackMobile}
            aria-label="Kembali ke daftar chat"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} />
          </button>

          {/* Avatar */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: chat.avatarColor || '#00A884',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <div>
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: '1.2',
              }}
            >
              {chat.name || formatPhoneDisplay(chat.phone)}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {formatPhoneDisplay(chat.phone)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
          <button
            title="Panggil WhatsApp"
            aria-label="Buka nomor di WhatsApp"
            onClick={() => window.open(`https://wa.me/${chat.phone}`, '_blank')}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Phone size={18} />
          </button>
        </div>
      </div>

      {/* Message Feed Area */}
      <div
        className="wa-chat-bg"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              margin: 'auto',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(32, 44, 51, 0.85)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              textAlign: 'center',
              maxWidth: '360px',
              border: '1px solid var(--border)',
            }}
          >
            Pesan ke nomor ini akan dikirim melalui WhatsApp Gateway Anda.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.fromMe;

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  marginBottom: '2px',
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    backgroundColor: isMe ? 'var(--bg-bubble-out)' : 'var(--bg-bubble-in)',
                    color: 'var(--text-primary)',
                    borderRadius: isMe ? '8px 8px 0px 8px' : '8px 8px 8px 0px',
                    padding: '8px 12px 6px 12px',
                    boxShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
                    wordBreak: 'break-word',
                    position: 'relative',
                  }}
                >
                  {/* Media attachment if any */}
                  {msg.media?.image && (
                    <div style={{ marginBottom: '6px', borderRadius: '6px', overflow: 'hidden' }}>
                      <img
                        src={msg.media.image}
                        alt="Media attachment"
                        style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', objectFit: 'contain' }}
                      />
                    </div>
                  )}

                  {/* Message Text */}
                  <div
                    style={{
                      fontSize: '14px',
                      lineHeight: '1.45',
                      whiteSpace: 'pre-wrap',
                      marginBottom: '2px',
                    }}
                  >
                    {msg.text}
                  </div>

                  {/* Timestamp & Status Icon */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '4px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '2px',
                    }}
                  >
                    <span>{formatMessageTime(msg.timestamp)}</span>
                    {isMe && renderStatusIcon(msg.status)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error alert if send failed */}
      {sendError && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(241, 92, 109, 0.15)',
            borderTop: '1px solid rgba(241, 92, 109, 0.3)',
            color: 'var(--danger)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{sendError}</span>
          <button
            onClick={() => setSendError(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 600 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Bottom Message Input Bar */}
      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px calc(10px + env(safe-area-inset-bottom, 0px)) 16px',
          backgroundColor: 'var(--bg-header)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ketik pesan..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            style={{
              width: '100%',
              padding: '11px 16px',
              backgroundColor: 'var(--bg-input)',
              border: 'none',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '15px',
              outline: 'none',
            }}
          />
        </div>

        <button
          type="submit"
          aria-label="Kirim Pesan"
          disabled={!inputText.trim() || isSending}
          style={{
            minWidth: '44px',
            minHeight: '44px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: inputText.trim() && !isSending ? 'var(--accent)' : 'transparent',
            border: 'none',
            color: inputText.trim() && !isSending ? '#fff' : 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() && !isSending ? 'pointer' : 'default',
            transition: 'background-color 0.2s ease, opacity 0.1s ease',
            flexShrink: 0,
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
