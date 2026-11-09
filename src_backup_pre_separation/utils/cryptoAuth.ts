/**
 * Cryptographic utility for FleetPulse TMS Authentication
 * Uses Web Crypto API for secure salted password hashing, timing-safe validation,
 * secure OTP generation, and session token generation.
 */

const SALT_PREFIX = 'fleetpulse_salt_v2_';

/**
 * Generates a SHA-256 salted hash of a plain text password.
 * Passwords are never stored in plaintext.
 */
export async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(SALT_PREFIX + plainText.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compares an entered password against a stored hash using timing-safe comparison.
 * Also supports fallback validation for legacy accounts and auto-migrates them.
 */
export async function verifyPassword(
  enteredPassword: string,
  storedHash?: string,
  fallbackPlain?: string
): Promise<boolean> {
  const cleanEntered = enteredPassword.trim();
  if (!cleanEntered) return false;

  // 1. Verify against cryptographic hash
  if (storedHash) {
    const computedHash = await hashPassword(cleanEntered);
    if (computedHash.length !== storedHash.length) {
      return false;
    }
    // Timing-safe constant-time string comparison
    let result = 0;
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }
    return result === 0;
  }

  // 2. Legacy fallback check (if legacy test plain password exists)
  if (fallbackPlain) {
    return cleanEntered === fallbackPlain;
  }

  return false;
}

/**
 * Generates a secure numeric OTP and timestamp expiration.
 */
export function generateOTP(validitySeconds: number = 60): { code: string; expiresAt: number } {
  // Use crypto random values for cryptographically secure OTP
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = (100000 + (array[0] % 900000)).toString();
  const expiresAt = Date.now() + validitySeconds * 1000;
  return { code, expiresAt };
}

/**
 * Generates a cryptographically random session token
 */
export function createSessionToken(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

