/**
 * Token Encryption Utility
 *
 * Encrypts/decrypts OAuth tokens before storing in the database.
 * Uses AES-256-GCM for authenticated encryption.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key from environment variable
 * @returns {Buffer} 32-byte encryption key
 */
function getEncryptionKey() {
  const key = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('CALENDAR_TOKEN_ENCRYPTION_KEY environment variable is not set');
  }
  // Accept hex-encoded 32-byte key (64 hex chars) or raw 32-char string
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, 'hex');
  }
  if (key.length === 32) {
    return Buffer.from(key, 'utf8');
  }
  throw new Error('CALENDAR_TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex chars or 32 character string)');
}

/**
 * Encrypt a plaintext string
 * @param {string} plaintext - The string to encrypt
 * @returns {string} Encrypted string in format "iv:authTag:ciphertext" (base64 encoded parts)
 */
export function encrypt(plaintext) {
  if (!plaintext) return plaintext;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string
 * @param {string} encryptedText - Encrypted string in format "iv:authTag:ciphertext"
 * @returns {string} Decrypted plaintext
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;

  const key = getEncryptionKey();
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const ciphertext = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
