import type { AppSettings } from '../types';
import { normalizePhoneNumber } from '../utils/phone';

export interface SendMessageParams {
  to: string; // phone number or JID
  text: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class GatewayApiClient {
  /**
   * Cleans gateway URL removing trailing slashes
   */
  private static sanitizeUrl(url?: string): string {
    return (url || 'https://chat.affidev.com').trim().replace(/\/+$/, '');
  }

  /**
   * Test connection and validate API Key with AffiChat gateway
   * Calls GET /api/key/check as documented in AffiChat API Docs
   */
  static async testConnection(gatewayUrl: string, apiKey: string): Promise<{ success: boolean; message: string; data?: any }> {
    const baseUrl = this.sanitizeUrl(gatewayUrl);
    const cleanKey = (apiKey || '').trim();

    if (!cleanKey) {
      return { success: false, message: 'API Key belum diisi. Silakan salin dari menu API Key di chat.affidev.com' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Sesuai dokumentasi AffiChat & CORS allowed headers (Authorization, key, dan query ?key=)
      const targetUrl = `${baseUrl}/api/key/check?key=${encodeURIComponent(cleanKey)}`;
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          'key': cleanKey,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.status === true) {
        const info = data.data;
        const owner = info?.user?.name ? `${info.user.name}` : 'Aktif';
        const plan = info?.plan ? `Paket ${info.plan}` : '';
        const sisa = info?.remainingMessages !== undefined ? `${info.remainingMessages} pesan` : '';
        const details = [owner, plan, sisa ? `Sisa Kuota: ${sisa}` : ''].filter(Boolean).join(' • ');

        return {
          success: true,
          message: `API Key Terverifikasi! (${details})`,
          data: info,
        };
      } else {
        return {
          success: false,
          message: data.message || `API Key tidak valid (HTTP ${res.status})`,
        };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, message: 'Timeout: Gateway tidak merespons dalam 8 detik' };
      }
      return {
        success: false,
        message: `Gagal terhubung ke Gateway: ${err.message || 'Cek koneksi internet'}`,
      };
    }
  }

  /**
   * Send text message via AffiChat REST API
   * Sesuai dokumentasi resmi AffiChat: POST /api/send-text
   */
  static async sendTextMessage(settings: AppSettings, params: SendMessageParams): Promise<SendMessageResponse> {
    const baseUrl = this.sanitizeUrl(settings.gatewayUrl);
    const apiKey = (settings.apiKey || '').trim();
    const sessionId = (settings.sessionId || '').trim();

    if (!apiKey) {
      return { success: false, error: 'API Key belum diatur. Buka Pengaturan dan masukkan API Key akun AffiChat Anda.' };
    }

    if (!sessionId) {
      return { success: false, error: 'ID Sesi WhatsApp belum diisi. Buka Pengaturan dan isi ID Sesi dari menu Perangkat di chat.affidev.com' };
    }

    const cleanTo = normalizePhoneNumber(params.to);
    if (!cleanTo) {
      return { success: false, error: 'Nomor tujuan tidak valid' };
    }

    try {
      // Endpoint resmi: /api/send-text dengan query param ?key=
      const targetUrl = new URL(`${baseUrl}/api/send-text`);
      targetUrl.searchParams.set('key', apiKey);

      // Hanya gunakan header yang diizinkan CORS server AffiChat (Content-Type, Authorization, key)
      // DILARANG mengirim 'x-api-key' dari browser karena ditolak preflight CORS server
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'key': apiKey,
        'Accept': 'application/json',
      };

      // Payload JSON persis sesuai dokumentasi resmi AffiChat
      const payload = {
        sessionId: sessionId,
        session: sessionId, // backward-compat support
        to: cleanTo,
        text: params.text,
        is_group: cleanTo.includes('@g.us'),
      };

      const res = await fetch(targetUrl.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.status === true || data.status === 'success' || data.success === true)) {
        return {
          success: true,
          messageId: data.data?.key?.id || data.data?.id || data.id || `msg_${Date.now()}`,
        };
      } else {
        const errorMsg = data.message || data.error || `HTTP ${res.status}: ${res.statusText}`;
        // Jika sesi tidak ditemukan, berikan penjelasan yang ramah
        if (res.status === 403 || res.status === 404 || errorMsg.includes('tidak ditemukan')) {
          return {
            success: false,
            error: `${errorMsg}. Pastikan ID Sesi di menu Pengaturan sama persis dengan yang ada di menu Perangkat di dashboard chat.affidev.com.`,
          };
        }
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: `Gagal mengirim pesan: ${err.message || 'Cek koneksi internet'}`,
      };
    }
  }
}
