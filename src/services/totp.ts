/**
 * AEGIS GRID — Two-Step Verification (TOTP RFC 6238) Engine
 * Implemented using browser-native Web Crypto API.
 * Provides authentic TOTP code generation, verification, and backup recovery codes.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Generate a random Base32 secret string (16 characters)
export function generateBase32Secret(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % 32];
  }
  return secret;
}

// Decode Base32 to byte array
function base32ToBytes(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}

// Compute HMAC-SHA1 for counter
async function computeHmacSha1(keyBytes: Uint8Array, counter: number): Promise<Uint8Array> {
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  // Big-endian 64-bit integer
  counterView.setUint32(4, counter, false);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
  return new Uint8Array(signature);
}

// Generate 6-digit TOTP code for a given timestamp
export async function generateTotpCode(secret: string, timestampMs = Date.now()): Promise<string> {
  const keyBytes = base32ToBytes(secret);
  const counter = Math.floor(timestampMs / 1000 / 30);
  const hmac = await computeHmacSha1(keyBytes, counter);

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binaryCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const token = binaryCode % 1000000;
  return token.toString().padStart(6, '0');
}

// Verify a user-provided 6-digit code against secret with drift tolerance (+/- 1 time step)
export async function verifyTotpCode(secret: string, userCode: string, timestampMs = Date.now()): Promise<boolean> {
  const cleanCode = userCode.trim().replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleanCode)) return false;

  const currentCounter = Math.floor(timestampMs / 1000 / 30);
  const keyBytes = base32ToBytes(secret);

  for (let step = -1; step <= 1; step++) {
    const hmac = await computeHmacSha1(keyBytes, currentCounter + step);
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    const candidate = (binary % 1000000).toString().padStart(6, '0');
    if (candidate === cleanCode) {
      return true;
    }
  }

  return false;
}

// Generate 8 one-time backup recovery codes
export async function generateBackupCodes(): Promise<{ plain: string; hash: string }[]> {
  const codes: { plain: string; hash: string }[] = [];
  for (let i = 0; i < 8; i++) {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    const plain = `${part1}-${part2}`;

    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    codes.push({ plain, hash });
  }
  return codes;
}

// Generate OTPAuth URI compatible with Google Authenticator / 1Password
export function getOtpAuthUri(secret: string, accountName = 'Operator Hayes', issuer = 'AEGIS GRID'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}
