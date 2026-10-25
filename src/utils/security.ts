/**
 * Web Crypto SHA-256 helper for App Lock PIN
 */
export async function hashPin(pin: string): Promise<string> {
  const clean = pin.trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(`affichat_pin_salt_v1_${clean}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(inputPin: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return true;
  const computed = await hashPin(inputPin);
  return computed === storedHash;
}
