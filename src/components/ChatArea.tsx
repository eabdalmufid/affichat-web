import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Phone,
  Download,
  ExternalLink,
  FileText,
  Music,
  X,
  Paperclip,
  Image as ImageIcon,
  Loader2,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import type { Chat, Message } from '../types';
import { formatPhoneDisplay } from '../utils/phone';
import { resolveMediaUrl, extractFilename } from '../utils/media';
import { MediaImage } from './MediaImage';

interface ChatAreaProps {
  chat: Chat;
  messages: Message[];
  onSendMessage: (text: string) => Promise<{ success: boolean; error?: string }>;
  onSendImage: (dataUrl: string, caption?: string) => Promise<{ success: boolean; error?: string }>;
  onSendDocument: (dataUrl: string, filename: string, caption?: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteMessage?: (messageId: string, mode: 'forEveryone' | 'forMe') => Promise<{ success: boolean; error?: string }>;
  onBackMobile: () => void;
  isSending: boolean;
  gatewayUrl?: string;
  apiKey?: string;
}

interface PendingMedia {
  file: File;
  type: 'image' | 'document';
  dataUrl: string;
  filename: string;
  sizeFormatted: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages,
  onSendMessage,
  onSendImage,
  onSendDocument,
  onDeleteMessage,
  onBackMobile,
  isSending,
  gatewayUrl,
  apiKey,
}) => {
  const [inputText, setInputText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteTargetMessage, setDeleteTargetMessage] = useState<Message | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [mediaCaption, setMediaCaption] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesContentRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const userScrolledUpRef = useRef<boolean>(false);

  // Instantly pin to bottom without any visible animation
  const jumpToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Smooth scroll down (when clicking floating button or sending while near bottom)
  const smoothScrollToBottom = () => {
    userScrolledUpRef.current = false;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // When switching chats, reset scroll flag and jump to bottom instantly before paint
  useLayoutEffect(() => {
    userScrolledUpRef.current = false;
    jumpToBottom();
  }, [chat.id]);

  // Robust ResizeObserver: keeps view anchored to the bottom whenever messages mount or media loads
  useEffect(() => {
    const contentEl = messagesContentRef.current;
    if (!contentEl) return;

    jumpToBottom();

    const observer = new ResizeObserver(() => {
      if (!userScrolledUpRef.current) {
        jumpToBottom();
      }
    });

    observer.observe(contentEl);

    // Staggered layout updates for images or external fonts
    const t1 = setTimeout(jumpToBottom, 30);
    const t2 = setTimeout(jumpToBottom, 100);
    const t3 = setTimeout(jumpToBottom, 250);

    return () => {
      observer.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [chat.id, messages.length]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBottomBtn(distanceFromBottom > 200);
    // If user scrolled up by more than 120px, remember they are reading history
    if (distanceFromBottom > 120) {
      userScrolledUpRef.current = true;
    } else {
      userScrolledUpRef.current = false;
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
    setSendError(null);
    setIsAttachMenuOpen(false);
    setPendingMedia(null);
  }, [chat.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    };
    if (isAttachMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAttachMenuOpen]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processSelectedFile = (file: File, type: 'image' | 'document') => {
    if (file.size > 50 * 1024 * 1024) {
      setSendError('Ukuran berkas melebihi batas maksimal 50MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setPendingMedia({
          file,
          type,
          dataUrl,
          filename: file.name,
          sizeFormatted: formatFileSize(file.size),
        });
        setMediaCaption('');
        setIsAttachMenuOpen(false);
      }
    };
    reader.onerror = () => {
      setSendError('Gagal membaca berkas yang dipilih.');
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file, 'image');
    }
    e.target.value = '';
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file, 'document');
    }
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          processSelectedFile(file, 'image');
        }
        return;
      }
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setSendError(null);
    setInputText('');

    const res = await onSendMessage(text);
    if (!res.success) {
      setSendError(res.error || 'Pesan belum terkirim. Pastikan API Key di Pengaturan sudah terisi dan WhatsApp Anda terhubung.');
      setInputText(text);
    }
  };

  const handleSendPendingMedia = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pendingMedia || isUploadingMedia) return;

    setIsUploadingMedia(true);
    setSendError(null);

    const caption = mediaCaption.trim();
    let res: { success: boolean; error?: string };

    if (pendingMedia.type === 'image') {
      res = await onSendImage(pendingMedia.dataUrl, caption);
    } else {
      res = await onSendDocument(pendingMedia.dataUrl, pendingMedia.filename, caption);
    }

    setIsUploadingMedia(false);

    if (res.success) {
      setPendingMedia(null);
      setMediaCaption('');
    } else {
      setSendError(res.error || 'Gagal mengirim berkas media.');
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
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,application/pdf"
        style={{ display: 'none' }}
        onChange={handleDocFileChange}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          backgroundColor: 'var(--bg-header)',
          borderBottom: '1px solid var(--border)',
          height: '60px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBackMobile}
            aria-label="Kembali ke Daftar Chat"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              marginRight: '-4px',
            }}
            className="mobile-back-btn"
          >
            <ArrowLeft size={20} />
          </button>

          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: chat.avatarColor,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '15px',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {chat.name}
            </span>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {formatPhoneDisplay(chat.phone)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
          <a
            href={`tel:${chat.phone}`}
            title="Panggil Nomor"
            style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}
          >
            <Phone size={18} />
          </a>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="chat-doodle-bg"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
        }}
      >
        <div
          ref={messagesContentRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minHeight: '100%',
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

            const hasImage = Boolean(msg.media?.image);
            const hasVideo = Boolean(msg.media?.video);
            const hasAudio = Boolean(msg.media?.audio);
            const hasDocument = Boolean(msg.media?.document);
            const hasAnyMedia = hasImage || hasVideo || hasAudio || hasDocument;

            const isSyntheticPlaceholder =
              msg.text === '[Foto]' ||
              msg.text === '[Video]' ||
              msg.text === '[Audio]' ||
              msg.text === '[Dokumen]' ||
              msg.text?.startsWith('[Dokumen:') ||
              msg.text === '[Pesan]';

            const shouldShowText = msg.text && (!isSyntheticPlaceholder || !hasAnyMedia);
            const isMediaOnly = hasAnyMedia && !shouldShowText;
            const docFilename = hasDocument ? extractFilename(msg.media?.document, msg.text) : '';

            const isRevoked = Boolean(msg.text?.startsWith('🚫'));

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  alignItems: 'center',
                  marginBottom: '2px',
                  gap: '6px',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget.querySelector('.msg-delete-trigger') as HTMLElement | null;
                  if (btn) btn.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget.querySelector('.msg-delete-trigger') as HTMLElement | null;
                  if (btn) btn.style.opacity = '0';
                }}
              >
                {!isRevoked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTargetMessage(msg);
                    }}
                    className="msg-delete-trigger"
                    title={isMe ? 'Hapus / Tarik Pesan' : 'Hapus pesan untuk saya'}
                    style={{
                      opacity: 0,
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '5px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'opacity 0.15s ease, color 0.15s ease, background-color 0.15s ease',
                      order: isMe ? -1 : 1,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#F15C6D';
                      e.currentTarget.style.backgroundColor = 'rgba(241, 92, 109, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                <div
                  style={{
                    maxWidth: hasAnyMedia ? 'min(300px, 85%)' : '75%',
                    backgroundColor: isMe ? 'var(--bg-bubble-out)' : 'var(--bg-bubble-in)',
                    color: isRevoked ? 'var(--text-muted)' : 'var(--text-primary)',
                    fontStyle: isRevoked ? 'italic' : 'normal',
                    borderRadius: isMe ? '8px 8px 0px 8px' : '8px 8px 8px 0px',
                    padding: hasImage && isMediaOnly ? '3px 3px 3px 3px' : hasAnyMedia && !shouldShowText ? '6px 6px 4px 6px' : '8px 12px 6px 12px',
                    boxShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
                    wordBreak: 'break-word',
                    position: 'relative',
                  }}
                >
                  {hasImage && msg.media?.image && (
                    <div style={{ marginBottom: shouldShowText ? '6px' : '0px' }}>
                      <MediaImage
                        src={resolveMediaUrl(msg.media.image, gatewayUrl, apiKey)}
                        alt="Foto WhatsApp"
                        onPreview={setPreviewImage}
                        timestampOverlay={
                          isMediaOnly ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '11px',
                                color: 'rgba(255, 255, 255, 0.95)',
                                backgroundColor: 'rgba(11, 15, 18, 0.65)',
                                backdropFilter: 'blur(4px)',
                                borderRadius: '10px',
                                padding: '2px 6px',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                              }}
                            >
                              <span>{formatMessageTime(msg.timestamp)}</span>
                              {isMe && renderStatusIcon(msg.status)}
                            </div>
                          ) : undefined
                        }
                      />
                    </div>
                  )}

                  {hasVideo && msg.media?.video && (
                    <div
                      style={{
                        marginBottom: shouldShowText ? '6px' : '3px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: '#0B0F12',
                        width: '280px',
                        maxWidth: '100%',
                      }}
                    >
                      <video
                        src={resolveMediaUrl(msg.media.video, gatewayUrl, apiKey)}
                        controls
                        playsInline
                        preload="metadata"
                        style={{
                          width: '100%',
                          maxHeight: '220px',
                          display: 'block',
                          borderRadius: '6px',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  )}

                  {hasAudio && msg.media?.audio && (
                    <div
                      style={{
                        marginBottom: shouldShowText ? '6px' : '3px',
                        padding: '8px 10px',
                        backgroundColor: '#12181D',
                        border: '1px solid #222D35',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        width: '260px',
                        maxWidth: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#00A884' }}>
                        <Music size={15} />
                        <span style={{ fontWeight: 500 }}>Pesan Suara / Audio</span>
                      </div>
                      <audio
                        src={resolveMediaUrl(msg.media.audio, gatewayUrl, apiKey)}
                        controls
                        preload="metadata"
                        style={{ width: '100%', height: '36px' }}
                      />
                    </div>
                  )}

                  {hasDocument && msg.media?.document && (
                    <div
                      style={{
                        marginBottom: shouldShowText ? '6px' : '3px',
                        padding: '10px 12px',
                        backgroundColor: '#12181D',
                        border: '1px solid #222D35',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        width: '260px',
                        maxWidth: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(0, 168, 132, 0.15)',
                            border: '1px solid rgba(0, 168, 132, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#00A884',
                            flexShrink: 0,
                          }}
                        >
                          <FileText size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '160px',
                            }}
                            title={docFilename}
                          >
                            {docFilename}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Dokumen Berkas
                          </div>
                        </div>
                      </div>
                      <a
                        href={resolveMediaUrl(msg.media.document, gatewayUrl, apiKey)}
                        download={docFilename}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#182026',
                          border: '1px solid #222D35',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#E6ECEF',
                          textDecoration: 'none',
                          flexShrink: 0,
                        }}
                        title={`Unduh ${docFilename}`}
                      >
                        <Download size={15} />
                      </a>
                    </div>
                  )}

                  {shouldShowText && (
                    <div
                      style={{
                        fontSize: '14px',
                        lineHeight: '1.45',
                        whiteSpace: 'pre-wrap',
                        marginBottom: '2px',
                        padding: hasAnyMedia ? '4px 4px 2px 4px' : undefined,
                      }}
                    >
                      {msg.text}
                    </div>
                  )}

                  {(!isMediaOnly || !hasImage) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '4px',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginTop: '2px',
                        paddingRight: hasAnyMedia && !shouldShowText ? '4px' : undefined,
                      }}
                    >
                      <span>{formatMessageTime(msg.timestamp)}</span>
                      {isMe && renderStatusIcon(msg.status)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {showScrollBottomBtn && (
        <button
          onClick={smoothScrollToBottom}
          aria-label="Gulir ke pesan paling bawah"
          style={{
            position: 'absolute',
            bottom: '76px',
            right: '20px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#182229',
            border: '1px solid #222D35',
            color: '#00A884',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.45)',
            zIndex: 15,
            transition: 'background-color 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#202C33')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#182229')}
          title="Ke pesan paling bawah"
        >
          <ChevronDown size={20} />
        </button>
      )}

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

      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px calc(10px + env(safe-area-inset-bottom, 0px)) 16px',
          backgroundColor: 'var(--bg-header)',
          borderTop: '1px solid var(--border)',
          position: 'relative',
        }}
      >
        <div ref={attachMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
            aria-label="Lampirkan berkas"
            title="Kirim Foto atau Dokumen"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: isAttachMenuOpen ? '#222D35' : 'transparent',
              border: 'none',
              color: isAttachMenuOpen ? '#00A884' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
          >
            <Paperclip size={20} />
          </button>

          {isAttachMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '52px',
                left: 0,
                backgroundColor: '#12181D',
                border: '1px solid #222D35',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                zIndex: 100,
                minWidth: '170px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  imageInputRef.current?.click();
                  setIsAttachMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#182026')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 168, 132, 0.15)',
                    color: '#00A884',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ImageIcon size={16} />
                </div>
                <span>Foto & Gambar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  docInputRef.current?.click();
                  setIsAttachMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#182026')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={16} />
                </div>
                <span>Dokumen Berkas</span>
              </button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ketik pesan (atau paste gambar Ctrl+V)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
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

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                width: '100%',
                marginBottom: '10px',
              }}
            >
              <a
                href={previewImage}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#182026',
                  color: '#E6ECEF',
                  border: '1px solid #222D35',
                  borderRadius: '6px',
                  fontSize: '12px',
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={14} /> Buka Tab Baru
              </a>
              <a
                href={previewImage}
                download
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#00A884',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <Download size={14} /> Unduh
              </a>
              <button
                onClick={() => setPreviewImage(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#182026',
                  border: '1px solid #222D35',
                  color: '#E6ECEF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <img
              src={previewImage}
              alt="Preview Foto WhatsApp"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        </div>
      )}

      {pendingMedia && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99998,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#12181D',
              border: '1px solid #222D35',
              borderRadius: '14px',
              maxWidth: '480px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #222D35',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {pendingMedia.type === 'image' ? 'Kirim Gambar' : 'Kirim Dokumen'}
              </span>
              <button
                type="button"
                onClick={() => setPendingMedia(null)}
                disabled={isUploadingMedia}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                backgroundColor: '#0B0F12',
                maxHeight: '55vh',
                overflowY: 'auto',
              }}
            >
              {pendingMedia.type === 'image' ? (
                <div style={{ borderRadius: '8px', overflow: 'hidden', maxWidth: '100%', maxHeight: '40vh' }}>
                  <img
                    src={pendingMedia.dataUrl}
                    alt="Preview Unggahan"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '40vh',
                      objectFit: 'contain',
                      display: 'block',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px 20px',
                    backgroundColor: '#182026',
                    border: '1px solid #222D35',
                    borderRadius: '10px',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={22} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={pendingMedia.filename}
                    >
                      {pendingMedia.filename}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {pendingMedia.sizeFormatted}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendPendingMedia} style={{ padding: '14px 18px', backgroundColor: '#12181D' }}>
              <div style={{ marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="Tambah keterangan (opsional)..."
                  value={mediaCaption}
                  onChange={(e) => setMediaCaption(e.target.value)}
                  disabled={isUploadingMedia}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: '#182026',
                    border: '1px solid #222D35',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPendingMedia(null)}
                  disabled={isUploadingMedia}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid #222D35',
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
                  disabled={isUploadingMedia}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 20px',
                    backgroundColor: '#00A884',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isUploadingMedia ? 'not-allowed' : 'pointer',
                    opacity: isUploadingMedia ? 0.7 : 1,
                  }}
                >
                  {isUploadingMedia ? (
                    <>
                      <Loader2 size={15} className="spin-animate" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Kirim</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteTargetMessage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => !isDeleting && setDeleteTargetMessage(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '380px',
              backgroundColor: '#182229',
              borderRadius: '12px',
              border: '1px solid #222D35',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(241, 92, 109, 0.15)',
                  border: '1px solid rgba(241, 92, 109, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F15C6D',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#E6ECEF' }}>
                  Hapus Pesan?
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {deleteTargetMessage.fromMe
                    ? 'Anda dapat menarik pesan untuk semua orang di WhatsApp atau menghapusnya dari tampilan Anda.'
                    : 'Pesan ini akan dihapus dari riwayat tampilan chat Anda.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {deleteTargetMessage.fromMe && (
                <button
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    const res = await onDeleteMessage?.(deleteTargetMessage.id, 'forEveryone');
                    setIsDeleting(false);
                    if (res?.success) {
                      setDeleteTargetMessage(null);
                    } else if (res?.error) {
                      setSendError(res.error);
                      setDeleteTargetMessage(null);
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#F15C6D',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isDeleting ? <Loader2 size={15} className="spin-animate" /> : null}
                  <span>Hapus untuk semua orang (Tarik Pesan)</span>
                </button>
              )}

              <button
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  await onDeleteMessage?.(deleteTargetMessage.id, 'forMe');
                  setIsDeleting(false);
                  setDeleteTargetMessage(null);
                }}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#202C33',
                  color: '#E6ECEF',
                  border: '1px solid #222D35',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                Hapus untuk saya
              </button>

              <button
                disabled={isDeleting}
                onClick={() => setDeleteTargetMessage(null)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
