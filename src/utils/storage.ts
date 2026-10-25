import type { AppSettings, Chat, Message } from '../types';

const SETTINGS_KEY = 'affichat_settings';
const CHATS_KEY = 'affichat_chats';
const MESSAGES_KEY = 'affichat_messages';

export const AFFICHAT_GATEWAY_URL = 'https://chat.affidev.com';

export const DEFAULT_SETTINGS: AppSettings = {
  gatewayUrl: AFFICHAT_GATEWAY_URL,
  apiKey: '',
  sessionId: 'default',
  smeeChannel: '',
  enableSound: true,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw), gatewayUrl: AFFICHAT_GATEWAY_URL };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChats(chats: Chat[]): void {
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  } catch (e) {
    console.error('Failed to save chats:', e);
  }
}

export function loadMessages(): Record<string, Message[]> {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveMessages(messages: Record<string, Message[]>): void {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error('Failed to save messages:', e);
  }
}

export function clearAllData(): void {
  localStorage.removeItem(CHATS_KEY);
  localStorage.removeItem(MESSAGES_KEY);
}

export function exportBackup(): string {
  const data = {
    settings: loadSettings(),
    chats: loadChats(),
    messages: loadMessages(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}
