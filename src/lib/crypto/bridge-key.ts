import crypto from 'crypto';

/**
 * Generates a cryptographically secure bridge key.
 * Format: brk_<32_random_alphanumeric_characters>
 */
export function generateBridgeKey(): string {
  // Generate 24 random bytes (yields 32 base64 characters)
  const randomBytes = crypto.randomBytes(24);
  
  // Convert to base64, then make it URL-safe alphanumeric
  const randomString = randomBytes
    .toString('base64')
    .replace(/\+/g, 'A')
    .replace(/\//g, 'B')
    .replace(/=/g, '')
    .substring(0, 32);

  return `brk_${randomString}`;
}
