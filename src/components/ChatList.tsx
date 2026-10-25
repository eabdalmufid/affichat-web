import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { Chat } from '../types';
import { formatPhoneDisplay } from '../utils/phone';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onOpenNewChat: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onOpenNewChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.phone.includes(searchQuery) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterUnread) {
      return matchesSearch && chat.unreadCount > 0;
    }
    return matchesSearch;
  });

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: 'numeric', month: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px' }}
          />
          <input
            type="text"
            placeholder="Cari atau mulai chat baru"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: 'var(--bg-header)',
              border: 'none',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={() => setFilterUnread(false)}
            style={{
              height: '28px',
              padding: '0 12px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: !filterUnread ? 'rgba(0, 168, 132, 0.16)' : 'var(--bg-header)',
              color: !filterUnread ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: !filterUnread ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterUnread(true)}
            style={{
              height: '28px',
              padding: '0 12px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: filterUnread ? 'rgba(0, 168, 132, 0.16)' : 'var(--bg-header)',
              color: filterUnread ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: filterUnread ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Belum Dibaca
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredChats.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              {searchQuery ? 'Tidak ada percakapan ditemukan' : 'Belum ada percakapan'}
            </p>
            {!searchQuery && (
              <button
                onClick={onOpenNewChat}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '6px 12px',
                }}
              >
                Mulai Chat Baru
              </button>
            )}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = chat.id === activeChatId;
            const initials = (chat.name || chat.phone).slice(0, 2).toUpperCase();

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  gap: '12px',
                  backgroundColor: isSelected ? 'var(--bg-selected)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
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

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: chat.unreadCount > 0 ? 600 : 500,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {chat.name || formatPhoneDisplay(chat.phone)}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: chat.unreadCount > 0 ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: chat.unreadCount > 0 ? 600 : 400,
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}
                    >
                      {formatTimestamp(chat.lastTimestamp)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        color: chat.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {chat.lastMessage || 'Kirim pesan pertama...'}
                    </span>

                    {chat.unreadCount > 0 && (
                      <span
                        style={{
                          backgroundColor: 'var(--accent)',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 700,
                          minWidth: '18px',
                          height: '18px',
                          borderRadius: '9px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 5px',
                          flexShrink: 0,
                          marginLeft: '8px',
                        }}
                      >
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
