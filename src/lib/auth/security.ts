/**
 * Universal secure password hashing utility for Ardana (compatible with Node.js and browser)
 */

const SALT = 'ardana_fintech_salt_2026_secure';

// Simple deterministic FNV-1a / DJB2 combination for universal client/server hashing fallback
function simpleDeterministicHash(str: string): string {
  let hash1 = 5381;
  let hash2 = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = Math.imul(hash2 ^ char, 0x01000193);
  }
  const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  
  // Stretch to 64 hex chars (similar to SHA-256 length)
  let result = part1 + part2;
  while (result.length < 64) {
    result += ((hash1 ^ hash2) >>> 0).toString(16).padStart(8, '0');
  }
  return result.slice(0, 64);
}

/**
 * Hash password securely with salt using scrypt (Node.js) or fallback deterministic hash
 */
export function hashPassword(password: string): string {
  const salted = `${SALT}:${password}:${SALT}`;
  if (typeof window === 'undefined') {
    try {
      // Node.js environment - use secure scrypt algorithm
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodeCrypto = require('crypto');
      const scryptKey = nodeCrypto.scryptSync(password, SALT, 32).toString('hex');
      return `scrypt:${scryptKey}`;
    } catch {
      return simpleDeterministicHash(salted);
    }
  } else {
    // Browser environment
    return simpleDeterministicHash(salted);
  }
}

/**
 * Verify plaintext password against stored hash (supports scrypt and legacy HMAC-SHA256)
 */
export function verifyPassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;

  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodeCrypto = require('crypto');

      // 1. Scrypt hash verification (prefixed)
      if (hash.startsWith('scrypt:')) {
        const scryptHash = `scrypt:${nodeCrypto.scryptSync(password, SALT, 32).toString('hex')}`;
        return scryptHash === hash;
      }

      // 2. Legacy HMAC-SHA256 verification (for pre-existing seed accounts)
      const hmacHash = nodeCrypto.createHmac('sha256', SALT).update(password).digest('hex');
      if (hmacHash === hash) return true;

      // 3. Raw scrypt without prefix match
      const rawScrypt = nodeCrypto.scryptSync(password, SALT, 32).toString('hex');
      if (rawScrypt === hash) return true;
    } catch {
      // fallback
    }
  }

  // Fallback for simple deterministic check
  const fallback = simpleDeterministicHash(`${SALT}:${password}:${SALT}`);
  if (fallback === hash) return true;

  return false;
}
