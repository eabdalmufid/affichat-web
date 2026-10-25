import type { Message } from '../types';
import { toJid } from '../utils/phone';

export type WebhookStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ParsedWebhookMessage {
  chatId: string;
  senderPhone: string;
  senderName: string;
  message: Message;
  sessionId?: string;
}

export class WebhookReceiver {
  private eventSource: EventSource | null = null;
  private channelUrl: string = '';
  private onMessageCallback: ((msg: ParsedWebhookMessage) => void) | null = null;
  private onStatusChangeCallback: ((status: WebhookStatus) => void) | null = null;
  private reconnectTimer: any = null;

  constructor(
    channelUrl: string,
    onMessage: (msg: ParsedWebhookMessage) => void,
    onStatusChange: (status: WebhookStatus) => void
  ) {
    this.channelUrl = channelUrl.trim();
    this.onMessageCallback = onMessage;
    this.onStatusChangeCallback = onStatusChange;
    this.connect();
  }

  public updateChannel(newUrl: string): void {
    if (this.channelUrl === newUrl.trim()) return;
    this.channelUrl = newUrl.trim();
    this.disconnect();
    if (this.channelUrl) {
      this.connect();
    } else {
      this.onStatusChangeCallback?.('disconnected');
    }
  }

  public connect(): void {
    if (!this.channelUrl) {
      this.onStatusChangeCallback?.('disconnected');
      return;
    }

    this.disconnect();
    this.onStatusChangeCallback?.('connecting');

    try {
      this.eventSource = new EventSource(this.channelUrl);

      this.eventSource.onopen = () => {
        this.onStatusChangeCallback?.('connected');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.handleIncomingPayload(parsed);
        } catch (e) {
          console.warn('[WebhookReceiver] Failed to parse SSE event data:', e);
        }
      };

      this.eventSource.onerror = () => {
        this.onStatusChangeCallback?.('disconnected');
        this.reconnect();
      };
    } catch (e) {
      console.error('[WebhookReceiver] Error creating EventSource:', e);
      this.onStatusChangeCallback?.('error');
      this.reconnect();
    }
  }

  private reconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.channelUrl) {
        this.connect();
      }
    }, 4000);
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Normalizes incoming Smee event payloads into a standard ParsedWebhookMessage
   */
  private handleIncomingPayload(rawEvent: any): void {
    // Smee wraps the request in { headers: ..., body: ..., timestamp: ... }
    let payload = rawEvent.body !== undefined ? rawEvent.body : rawEvent;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {}
    }
    if (!payload || typeof payload !== 'object') return;

    // Detect AffiChat event format
    let from = '';
    let text = '';
    let pushName = '';
    let msgId = '';
    let timestamp = Date.now();
    let mediaObj = undefined;

    // Extract session from AffiChat headers or JSON payload
    const headerSession =
      rawEvent.headers?.['x-affichat-session'] ||
      rawEvent.headers?.['X-AffiChat-Session'] ||
      rawEvent.headers?.['x-session-id'] ||
      '';
    const detectedSession =
      headerSession ||
      payload.sessionId ||
      payload.session ||
      payload.data?.sessionId ||
      '';

    // 1. Format: { event: "messages.upsert", data: { from, message, pushName, ... } }
    if (payload.data && typeof payload.data === 'object') {
      const d = payload.data;
      from = d.from || d.key?.remoteJid || '';
      text = d.message || d.text || '';
      pushName = d.pushName || '';
      msgId = d.id || d.key?.id || `msg_${Date.now()}`;
      timestamp = (d.timestamp ? Number(d.timestamp) * 1000 : Date.now());
      if (d.media) mediaObj = d.media;
    }
    // 2. Format: { session, from, message, media }
    else if (payload.from) {
      from = payload.from;
      text = payload.message || payload.text || '';
      pushName = payload.pushName || payload.name || '';
      msgId = payload.id || `msg_${Date.now()}`;
      timestamp = payload.timestamp ? Number(payload.timestamp) * 1000 : Date.now();
      if (payload.media) mediaObj = payload.media;
    }
    // 3. Format: Direct Baileys/Zapo object
    else if (payload.key?.remoteJid) {
      from = payload.key.remoteJid;
      text = payload.message?.conversation || payload.message?.extendedTextMessage?.text || '';
      pushName = payload.pushName || '';
      msgId = payload.key.id || `msg_${Date.now()}`;
      timestamp = payload.messageTimestamp ? Number(payload.messageTimestamp) * 1000 : Date.now();
    }

    if (!from || (!text && !mediaObj?.image && !mediaObj?.video && !mediaObj?.document && !mediaObj?.audio)) {
      return;
    }

    // Standardize to JID
    const chatId = toJid(from);
    const phone = chatId.split('@')[0] || '';

    const newMsg: Message = {
      id: msgId,
      chatId,
      fromMe: false,
      senderName: pushName || undefined,
      text: text || (mediaObj?.image ? '[Foto]' : mediaObj?.video ? '[Video]' : mediaObj?.document ? '[Dokumen]' : mediaObj?.audio ? '[Audio]' : '[Pesan]'),
      timestamp: isNaN(timestamp) ? Date.now() : timestamp,
      status: 'read',
      media: mediaObj,
    };

    this.onMessageCallback?.({
      chatId,
      senderPhone: phone,
      senderName: pushName || phone,
      message: newMsg,
      sessionId: detectedSession || undefined,
    });
  }
}
