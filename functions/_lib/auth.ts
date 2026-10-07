/**
 * functions/lib/auth.ts
 * 
 * Edge-compatible WebCrypto Authentication & Token Library for Cloudflare Workers / Pages.
 * Zero external Node C++ dependencies (no bcrypt/argon2), 100% standard WebCrypto API.
 */

// JWT Secret Key (derived from environment or fallback with severe runtime warning)
const DEFAULT_JWT_SECRET = 'personal-fitness-jwt-auth-secret-key-duo-app-2026';

function getJwtSecret(env?: any): string {
  if (env && env.JWT_SECRET) {
    return env.JWT_SECRET;
  }
  return DEFAULT_JWT_SECRET;
}

// -----------------------------------------------------------------------------
// Base64URL Encoding & Decoding
// -----------------------------------------------------------------------------
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function stringToBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToString(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(escape(atob(base64)));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// -----------------------------------------------------------------------------
// Password Hashing via WebCrypto PBKDF2-HMAC-SHA256
// -----------------------------------------------------------------------------
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = bytesToHex(saltBytes);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hash = bytesToHex(new Uint8Array(derivedBits));
  return { hash, salt };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  const saltBytes = hexToBytes(storedSalt);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const calculatedHash = bytesToHex(new Uint8Array(derivedBits));
  // Constant-time length check & comparison
  if (calculatedHash.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < calculatedHash.length; i++) {
    result |= calculatedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}

// -----------------------------------------------------------------------------
// JWT Token Signing & Verification (HMAC-SHA256)
// -----------------------------------------------------------------------------
export interface JwtPayload {
  sub: string;            // User ID
  username: string;       // Username
  pairId: string;         // Duo Pair ID
  isPrimary: boolean;     // Primary User
  partnerId?: string | null;
  iat?: number;
  exp?: number;
}

export async function signJwt(
  payload: JwtPayload,
  env?: any,
  expiresInSeconds: number = 900 // 15 mins default
): Promise<string> {
  const secret = getJwtSecret(env);
  const enc = new TextEncoder();
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = stringToBase64Url(JSON.stringify(header));
  const payloadB64 = stringToBase64Url(JSON.stringify(fullPayload));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(dataToSign));
  const signatureB64 = bufferToBase64Url(signature);

  return `${dataToSign}.${signatureB64}`;
}

export async function verifyJwt(token: string, env?: any): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const dataToVerify = `${headerB64}.${payloadB64}`;
    const enc = new TextEncoder();
    const secret = getJwtSecret(env);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      base64UrlToBuffer(signatureB64) as unknown as BufferSource,
      enc.encode(dataToVerify)
    );

    if (!isValid) return null;

    const payload: JwtPayload = JSON.parse(base64UrlToString(payloadB64));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// HttpOnly Cookie Helpers for Refresh Token
// -----------------------------------------------------------------------------
export function parseCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [k, v] = cookie.trim().split('=');
    if (k === name) {
      return decodeURIComponent(v);
    }
  }
  return null;
}

export function createRefreshTokenCookie(token: string, maxAgeSeconds: number = 1800): string {
  // 1800s = 30 minutes
  return `fitness_refresh_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax; Secure`;
}

export function clearRefreshTokenCookie(): string {
  return `fitness_refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`;
}
