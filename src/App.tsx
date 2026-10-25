import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AppSettings, Chat, Message } from './types';
import {
  loadSettings,
  saveSettings,
  loadChats,
  saveChats,
  loadMessages,
  saveMessages,
  checkIsAppLocked,
  touchLastActive,
  clearLastActive,
} from './utils/storage';
import { playNotificationSound } from './utils/sound';
import { toJid, getAvatarColor, formatPhoneDisplay } from './utils/phone';
import { WebhookReceiver, type WebhookStatus, type ParsedWebhookMessage } from './services/webhookReceiver';
import { GatewayApiClient } from './services/gatewayApi';

import { SidebarHeader } from './components/SidebarHeader';
import { ChatList } from './components/ChatList';
import { ChatArea } from './components/ChatArea';
import { EmptyChat } from './components/EmptyChat';
import { SettingsModal } from './components/SettingsModal';
import { NewChatModal } from './components/NewChatModal';
import { LockScreen } from './components/LockScreen';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [isLocked, setIsLocked] = useState<boolean>(() => checkIsAppLocked(loadSettings()));
  const [chats, setChats] = useState<Chat[]>(loadChats);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(loadMessages);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>('disconnected');
  const [isSending, setIsSending] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const receiverRef = useRef<WebhookReceiver | null>(null);
  const activeChatIdRef = useRef<string | null>(activeChatId);
  const settingsRef = useRef<AppSettings>(settings);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!settings.pinHash) {
      setIsLocked(false);
      return;
    }

    const minutes = settings.autoLockMinutes ?? 5;
    if (minutes === 0) return;

    let timer: any = null;

    const checkAndSchedule = () => {
      if (timer) clearTimeout(timer);

      const raw = localStorage.getItem('affichat_last_active_at');
      const lastActive = raw ? parseInt(raw, 10) : Date.now();
      const elapsedMs = Date.now() - (isNaN(lastActive) ? Date.now() : lastActive);
      const remainingMs = minutes * 60 * 1000 - elapsedMs;

      if (remainingMs <= 0) {
        setIsLocked(true);
      } else {
        timer = setTimeout(() => {
          if (settingsRef.current.pinHash) {
            setIsLocked(true);
          }
        }, remainingMs);
      }
    };

    let lastRecordTime = 0;
    const recordActivity = () => {
      const now = Date.now();
      if (now - lastRecordTime > 2000) {
        lastRecordTime = now;
        touchLastActive();
      }
      checkAndSchedule();
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, recordActivity, { passive: true }));
    checkAndSchedule();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, recordActivity));
    };
  }, [settings.pinHash, settings.autoLockMinutes]);

  // Handle incoming realtime message from Webhook SSE
  const handleIncomingMessage = useCallback((incoming: ParsedWebhookMessage) => {
    const { chatId, senderPhone, senderName, message, sessionId: incomingSession } = incoming;

    // Auto-discover and adapt active WhatsApp session ID from incoming webhook
    if (incomingSession && incomingSession !== settingsRef.current.sessionId) {
      setSettings((prev) => {
        const updated = { ...prev, sessionId: incomingSession };
        saveSettings(updated);
        return updated;
      });
    }

    setChats((prevChats) => {
      const existingIndex = prevChats.findIndex((c) => c.id === chatId);
      const isCurrentActive = activeChatIdRef.current === chatId;

      let updatedChats = [...prevChats];

      if (existingIndex >= 0) {
        const existing = updatedChats[existingIndex]!;
        const newUnread = isCurrentActive ? 0 : existing.unreadCount + 1;
        const updatedChat: Chat = {
          ...existing,
          name: senderName || existing.name,
          lastMessage: message.text,
          lastTimestamp: message.timestamp,
          unreadCount: newUnread,
        };
        // Move to top of chat list
        updatedChats.splice(existingIndex, 1);
        updatedChats.unshift(updatedChat);
      } else {
        const newChat: Chat = {
          id: chatId,
          phone: senderPhone,
          name: senderName || formatPhoneDisplay(senderPhone),
          avatarColor: getAvatarColor(senderPhone),
          unreadCount: isCurrentActive ? 0 : 1,
          lastMessage: message.text,
          lastTimestamp: message.timestamp,
        };
        updatedChats.unshift(newChat);
      }

      saveChats(updatedChats);
      return updatedChats;
    });

    setMessagesMap((prevMap) => {
      const chatMessages = prevMap[chatId] || [];
      // Prevent duplicate messages
      if (chatMessages.some((m) => m.id === message.id)) {
        return prevMap;
      }
      const updatedMessages = [...chatMessages, message];
      const newMap = { ...prevMap, [chatId]: updatedMessages };
      saveMessages(newMap);
      return newMap;
    });

    if (settingsRef.current.enableSound) {
      playNotificationSound();
    }
  }, []);

  // Initialize and update WebhookReceiver
  useEffect(() => {
    if (receiverRef.current) {
      receiverRef.current.disconnect();
    }

    receiverRef.current = new WebhookReceiver(
      settings.smeeChannel,
      handleIncomingMessage,
      (status) => setWebhookStatus(status)
    );

    return () => {
      receiverRef.current?.disconnect();
    };
  }, [settings.smeeChannel, handleIncomingMessage]);

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setMobileView('chat');

    setChats((prevChats) => {
      const updated = prevChats.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c));
      saveChats(updated);
      return updated;
    });
  };

  const handleStartNewChat = (phone: string, name?: string) => {
    const chatId = toJid(phone);
    const existing = chats.find((c) => c.id === chatId);

    if (existing) {
      handleSelectChat(chatId);
      return;
    }

    const newChat: Chat = {
      id: chatId,
      phone,
      name: name || formatPhoneDisplay(phone),
      avatarColor: getAvatarColor(phone),
      unreadCount: 0,
      lastMessage: '',
      lastTimestamp: Date.now(),
    };

    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    saveChats(updatedChats);
    handleSelectChat(chatId);
  };

  const handleSendMessage = async (text: string): Promise<{ success: boolean; error?: string }> => {
    if (!activeChatId) return { success: false, error: 'Tidak ada percakapan aktif' };

    const currentChat = chats.find((c) => c.id === activeChatId);
    if (!currentChat) return { success: false, error: 'Kontak tidak ditemukan' };

    const tempId = `outgoing_${Date.now()}`;
    const outgoingMsg: Message = {
      id: tempId,
      chatId: activeChatId,
      fromMe: true,
      text,
      timestamp: Date.now(),
      status: 'pending',
    };

    // Optimistically add message
    setMessagesMap((prev) => {
      const list = prev[activeChatId] || [];
      const updated = { ...prev, [activeChatId]: [...list, outgoingMsg] };
      saveMessages(updated);
      return updated;
    });

    // Update last message in chat list
    setChats((prev) => {
      const updated = prev.map((c) =>
        c.id === activeChatId ? { ...c, lastMessage: text, lastTimestamp: Date.now() } : c
      );
      saveChats(updated);
      return updated;
    });

    setIsSending(true);

    const res = await GatewayApiClient.sendTextMessage(settings, {
      to: currentChat.phone,
      text,
    });

    setIsSending(false);

    if (res.success) {
      setMessagesMap((prev) => {
        const list = prev[activeChatId] || [];
        const updatedList = list.map((m) =>
          m.id === tempId ? { ...m, id: res.messageId || tempId, status: 'sent' as const } : m
        );
        const updated = { ...prev, [activeChatId]: updatedList };
        saveMessages(updated);
        return updated;
      });
      return { success: true };
    } else {
      setMessagesMap((prev) => {
        const list = prev[activeChatId] || [];
        const updatedList = list.map((m) =>
          m.id === tempId ? { ...m, status: 'failed' as const } : m
        );
        const updated = { ...prev, [activeChatId]: updatedList };
        saveMessages(updated);
        return updated;
      });
      return { success: false, error: res.error };
    }
  };

  const handleSendImage = async (
    dataUrl: string,
    caption?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!activeChatId) return { success: false, error: 'Tidak ada percakapan aktif' };

    const currentChat = chats.find((c) => c.id === activeChatId);
    if (!currentChat) return { success: false, error: 'Kontak tidak ditemukan' };

    const tempId = `outgoing_img_${Date.now()}`;
    const outgoingMsg: Message = {
      id: tempId,
      chatId: activeChatId,
      fromMe: true,
      text: caption || '[Foto]',
      timestamp: Date.now(),
      status: 'pending',
      media: {
        image: dataUrl,
      },
    };

    setMessagesMap((prev) => {
      const list = prev[activeChatId] || [];
      const updated = { ...prev, [activeChatId]: [...list, outgoingMsg] };
      saveMessages(updated);
      return updated;
    });

    setChats((prev) => {
      const updated = prev.map((c) =>
        c.id === activeChatId ? { ...c, lastMessage: caption || '[Foto]', lastTimestamp: Date.now() } : c
      );
      saveChats(updated);
      return updated;
    });

    setIsSending(true);

    const res = await GatewayApiClient.sendImageMessage(settings, {
      to: currentChat.phone,
      image: dataUrl,
      caption: caption || '',
    });

    setIsSending(false);

    if (res.success) {
      setMessagesMap((prev) => {
        const list = prev[activeChatId] || [];
        const updatedList = list.map((m) =>
          m.id === tempId ? { ...m, id: res.messageId || tempId, status: 'sent' as const } : m
        );
        const updated = { ...prev, [activeChatId]: updatedList };
        saveMessages(updated);
        return updated;
      });
      return { success: true };
    } else {
      setMessagesMap((prev) => {
        const list = prev[activeChatId] || [];
        const updatedList = list.map((m) =>
          m.id === tempId ? { ...m, status: 'failed' as const } : m
        );
        const updated = { ...prev, [activeChatId]: updatedList };
        saveMessages(updated);
        return updated;
      });
      return { success: false, error: res.error };
    }
  };

  const handleSendDocument = async (
    dataUrl: string,
    filename: string,
    caption?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!activeChatId) return { success: false, error: 'Tidak ada percakapan aktif' };

    const currentChat = chats.find((c) => c.id === activeChatId);
    if (!currentChat) return { success: false, error: 'Kontak tidak ditemukan' };

    const tempId = `outgoing_doc_${Date.now()}`;
    const outgoingMsg: Message = {
      id: tempId,
      chatId: activeChatId,
      fromMe: true,
      text: caption || `[Dokumen: ${filename}]`,
      timestamp: Date.now(),
      status: 'pending',
      media: {
        document: dataUrl,
      },
    };

    setMessagesMap((prev) => {
      const list = prev[activeChatId] || [];
      const updated = { ...prev, [activeChatId]: [...list, outgoingMsg] };
      saveMessages(updated);
      return updated;
    });

    setChats((prev) => {
      const updated = prev.map((c) =>
        c.id === activeChatId ? { ...c, lastMessage: caption || `[Dokumen: ${filename}]`, lastTimestamp: Date.now() } : c
      );
      saveChats(updated);
      return updated;
    });

    setIsSending(true);

    const res = await GatewayApiClient.sendDocumentMessage(settings, {
      to: currentChat.phone,
      document: dataUrl,
      filename,
      caption: caption || '',
    });

    setIsSending(false);

    if (res.success) {
      setMessagesMap((prev) => {
        const list = prev[activeChatId] || [];
        const updatedList = list.map((m) =>
          m.id === tempId ? { ...m, id: res.messageId || tempId, status: 'sent' as const } : m
        );
        const updated = { ...prev, [activeChatId]: updatedList };
        saveMessages(updated);
        return updated;
      });
      return { success: true };
    } else {
      setMessagesMap((prev) => {
        const list = prev[activeChatId] || [];
        const updatedList = list.map((m) =>
          m.id === tempId ? { ...m, status: 'failed' as const } : m
        );
        const updated = { ...prev, [activeChatId]: updatedList };
        saveMessages(updated);
        return updated;
      });
      return { success: false, error: res.error };
    }
  };

  const handleDeleteMessage = async (
    messageId: string,
    mode: 'forEveryone' | 'forMe'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!activeChatId) return { success: false, error: 'Tidak ada percakapan aktif' };

    const currentChat = chats.find((c) => c.id === activeChatId);
    if (!currentChat) return { success: false, error: 'Kontak tidak ditemukan' };

    if (mode === 'forEveryone') {
      setIsSending(true);
      const res = await GatewayApiClient.deleteMessage(settings, {
        to: currentChat.phone,
        messageId,
      });
      setIsSending(false);

      if (!res.success) {
        return { success: false, error: res.error || 'Gagal menarik pesan dari server' };
      }

      // Mark message as revoked in local store
      setMessagesMap((prev) => {
        const list = prev[activeChatId] || [];
        const updatedList = list.map((m) =>
          m.id === messageId
            ? {
                ...m,
                text: '🚫 Pesan ini telah ditarik / dihapus',
                media: undefined,
              }
            : m
        );
        const updated = { ...prev, [activeChatId]: updatedList };
        saveMessages(updated);
        return updated;
      });
      return { success: true };
    } else {
      // mode === 'forMe': remove locally from this chat
      setMessagesMap((prev) => {
        const list = prev[activeChatId] || [];
        const updatedList = list.filter((m) => m.id !== messageId);
        const updated = { ...prev, [activeChatId]: updatedList };
        saveMessages(updated);
        return updated;
      });
      return { success: true };
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    touchLastActive();
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleUnlock = () => {
    touchLastActive();
    setIsLocked(false);
  };

  const handleLockNow = () => {
    clearLastActive();
    setIsLocked(true);
  };

  const handleClearChats = () => {
    setChats([]);
    setMessagesMap({});
    setActiveChatId(null);
  };

  const handleFullResetApp = () => {
    localStorage.clear();
    setSettings(loadSettings());
    setChats([]);
    setMessagesMap({});
    setActiveChatId(null);
    setIsLocked(false);
  };

  const activeChat = chats.find((c) => c.id === activeChatId);
  const activeMessages = activeChatId ? messagesMap[activeChatId] || [] : [];

  return (
    <div className="app-container">
      {isLocked && settings.pinHash && (
        <LockScreen
          pinHash={settings.pinHash}
          onUnlock={handleUnlock}
          onResetApp={handleFullResetApp}
        />
      )}

      <div className={`sidebar-pane ${mobileView === 'chat' ? 'hidden-mobile' : ''}`}>
        <SidebarHeader
          sessionId={settings.sessionId}
          webhookStatus={webhookStatus}
          onOpenNewChat={() => setIsNewChatOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          hasPin={Boolean(settings.pinHash)}
          onLockNow={handleLockNow}
        />
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onOpenNewChat={() => setIsNewChatOpen(true)}
        />
      </div>

      <div className={`chat-pane ${mobileView === 'list' ? 'hidden-mobile' : ''}`}>
        {activeChat ? (
          <ChatArea
            chat={activeChat}
            messages={activeMessages}
            onSendMessage={handleSendMessage}
            onSendImage={handleSendImage}
            onSendDocument={handleSendDocument}
            onDeleteMessage={handleDeleteMessage}
            onBackMobile={() => setMobileView('list')}
            isSending={isSending}
            gatewayUrl={settings.gatewayUrl}
            apiKey={settings.apiKey}
          />
        ) : (
          <EmptyChat
            onOpenSettings={() => setIsSettingsOpen(true)}
            isConfigured={Boolean(settings.apiKey.trim())}
          />
        )}
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        webhookStatus={webhookStatus}
        onClearChats={handleClearChats}
      />

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onStartChat={handleStartNewChat}
      />
    </div>
  );
};

export default App;
