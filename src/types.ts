export interface MessageMedia {
  image?: string | null;
  video?: string | null;
  document?: string | null;
  audio?: string | null;
}

export interface Message {
  id: string;
  chatId: string;
  fromMe: boolean;
  senderName?: string;
  text: string;
  timestamp: number;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  media?: MessageMedia;
}

export interface Chat {
  id: string; // e.g. 6281234567890@s.whatsapp.net
  phone: string; // e.g. 6281234567890
  name: string;
  avatarColor: string;
  unreadCount: number;
  lastMessage?: string;
  lastTimestamp?: number;
}

export interface AppSettings {
  gatewayUrl: string;
  apiKey: string;
  sessionId: string;
  smeeChannel: string;
  enableSound: boolean;
  pinHash?: string | null;
  autoLockMinutes?: number;
}

