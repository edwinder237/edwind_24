/**
 * Encryption utilities for sensitive cookie data
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment
 * Falls back to derived key in development
 */
function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_SECRET || process.env.WORKOS_API_KEY;

  if (!secret) {
    throw new Error('ENCRYPTION_SECRET or WORKOS_API_KEY must be set');
  }

  // Derive a 256-bit key from the secret
  return crypto.scryptSync(secret, 'edwind-salt', 32);
}

/**
 * Encrypt data for cookie storage
 * @param {Object} data - Plain object to encrypt
 * @returns {string} Base64-encoded encrypted string
 */
export function encrypt(data) {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const plaintext = JSON.stringify(data);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    const combined = [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted
    ].join(':');

    return Buffer.from(combined).toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt cookie data
 * @param {string} encryptedData - Base64-encoded encrypted string
 * @returns {Object} Decrypted data object
 */
export function decrypt(encryptedData) {
  try {
    const key = getEncryptionKey();

    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64').toString('utf8');
    const [ivB64, authTagB64, encrypted] = combined.split(':');

    if (!ivB64 || !authTagB64 || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash data (one-way, for comparison)
 * @param {string} data - Data to hash
 * @returns {string} Hex-encoded hash
 */
export function hash(data) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Generate secure random token
 * @param {number} length - Length in bytes (default 32)
 * @returns {string} Hex-encoded random token
 */
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}
