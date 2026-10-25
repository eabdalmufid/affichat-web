/**
 * Formats raw input into clean Indonesian/international standard WhatsApp number.
 * e.g. "0812-3456-7890" -> "6281234567890"
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Returns full JID format: e.g. "6281234567890@s.whatsapp.net"
 */
export function toJid(phoneOrJid: string): string {
  if (!phoneOrJid) return '';
  if (phoneOrJid.endsWith('@s.whatsapp.net') || phoneOrJid.endsWith('@g.us')) {
    return phoneOrJid;
  }
  const cleanPhone = normalizePhoneNumber(phoneOrJid);
  return `${cleanPhone}@s.whatsapp.net`;
}

/**
 * Extracts digits from a JID.
 */
export function extractPhoneFromJid(jid: string): string {
  if (!jid) return '';
  return jid.split('@')[0] || '';
}

/**
 * Formats a phone number nicely for display (e.g. "+62 812-3456-7890")
 */
export function formatPhoneDisplay(phone: string): string {
  const clean = normalizePhoneNumber(phone);
  if (clean.startsWith('62') && clean.length >= 10) {
    const prefix = '+62';
    const part1 = clean.slice(2, 5);
    const part2 = clean.slice(5, 9);
    const part3 = clean.slice(9);
    return `${prefix} ${part1}-${part2}${part3 ? '-' + part3 : ''}`;
  }
  return phone;
}

/**
 * Generates consistent avatar color for a given string (phone/name)
 */
const AVATAR_COLORS = [
  '#00A884', '#007ACC', '#9C27B0', '#E91E63',
  '#FF9800', '#4CAF50', '#00BCD4', '#3F51B5'
];

export function getAvatarColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index] || '#00A884';
}
