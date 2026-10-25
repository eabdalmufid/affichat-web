import { AFFICHAT_GATEWAY_URL } from './storage';
import type { MessageMedia } from '../types';

/**
 * Resolves a media filename or relative path to a full authenticated URL on the AffiChat gateway.
 *
 * Example input: "AC80F086_foto.jpg"
 * Gateway URL: "https://chat.affidev.com"
 * Result: "https://chat.affidev.com/media/AC80F086_foto.jpg?key=API_KEY"
 */
export function resolveMediaUrl(
  mediaPath: string | null | undefined,
  gatewayUrl: string = AFFICHAT_GATEWAY_URL,
  apiKey?: string
): string {
  if (!mediaPath || typeof mediaPath !== 'string') return '';

  const trimmedPath = mediaPath.trim();
  if (!trimmedPath) return '';

  // Already a blob or data URL
  if (
    trimmedPath.startsWith('blob:') ||
    trimmedPath.startsWith('data:')
  ) {
    return trimmedPath;
  }

  const base = (gatewayUrl?.trim() || AFFICHAT_GATEWAY_URL).replace(/\/+$/, '');
  const keyParam = apiKey?.trim() ? `key=${encodeURIComponent(apiKey.trim())}` : '';

  // If already an HTTP/HTTPS absolute URL
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    if (!keyParam) return trimmedPath;
    try {
      const urlObj = new URL(trimmedPath);
      if (!urlObj.searchParams.has('key') && !urlObj.searchParams.has('x-api-key')) {
        urlObj.searchParams.set('key', apiKey!.trim());
        return urlObj.toString();
      }
    } catch {
      // ignore
    }
    return trimmedPath;
  }

  // Relative path or plain filename (e.g. "AC80F086_foto.jpg" or "/media/AC80F086_foto.jpg")
  const cleanFilename = trimmedPath.replace(/^(\.\/|\/)?(media\/)?/i, '');
  const targetUrl = `${base}/media/${cleanFilename}`;

  return keyParam ? `${targetUrl}?${keyParam}` : targetUrl;
}

/**
 * Cleanly extracts a human-readable filename from a media path or URL.
 * Also checks fallback text (e.g. "[Dokumen: Invoice.pdf]") to avoid displaying raw base64 or hash strings.
 */
export function extractFilename(
  mediaPath: string | null | undefined,
  fallbackText?: string
): string {
  // 1. Check if fallbackText has a clean format: [Dokumen: filename.ext]
  if (fallbackText && typeof fallbackText === 'string') {
    const docMatch = fallbackText.match(/^\[Dokumen:\s*([^\]]+)\]/i);
    if (docMatch && docMatch[1]?.trim()) {
      return docMatch[1].trim();
    }
  }

  if (!mediaPath || typeof mediaPath !== 'string') {
    return 'Berkas Dokumen';
  }

  // 2. If it's a data URI or blob URI, avoid dumping raw base64 characters
  if (mediaPath.startsWith('data:') || mediaPath.startsWith('blob:')) {
    if (fallbackText && !fallbackText.startsWith('[') && fallbackText.trim().length > 0) {
      return fallbackText.trim();
    }
    if (mediaPath.startsWith('data:application/pdf')) return 'Dokumen.pdf';
    if (mediaPath.startsWith('data:application/msword') || mediaPath.startsWith('data:application/vnd.openxmlformats-officedocument.wordprocessingml')) return 'Dokumen.docx';
    if (mediaPath.startsWith('data:application/vnd')) return 'Dokumen.xlsx';
    if (mediaPath.startsWith('data:text/')) return 'Dokumen.txt';
    return 'Berkas Dokumen.pdf';
  }

  const clean = mediaPath.split('?')[0]?.split('#')[0] || '';
  const lastSegment = clean.split('/').pop() || '';

  // 3. If filename is {ID}_{originalName}, e.g. AC80F086_document.pdf
  const parts = lastSegment.split('_');
  if (parts.length > 1 && parts[0].length >= 8) {
    const candidate = parts.slice(1).join('_');
    if (candidate && candidate.includes('.')) return candidate;
  }

  // 4. If lastSegment is an ultra-long base64 or hash string (>32 chars with no space)
  if (lastSegment.length > 30 && !lastSegment.includes(' ') && !lastSegment.includes('.')) {
    return 'Berkas Dokumen.pdf';
  }

  return lastSegment || 'Berkas Dokumen';
}

/**
 * Returns the active media type if present
 */
export function getMediaType(
  media?: MessageMedia | null
): 'image' | 'video' | 'audio' | 'document' | null {
  if (!media) return null;
  if (media.image) return 'image';
  if (media.video) return 'video';
  if (media.audio) return 'audio';
  if (media.document) return 'document';
  return null;
}
