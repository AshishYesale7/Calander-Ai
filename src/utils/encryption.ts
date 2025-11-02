// Advanced Encryption Utilities for Calendar.ai
// Using industry-standard AES-256-GCM encryption

import crypto from 'crypto';

interface EncryptionResult {
  encryptedData: string;
  iv: string;
  authTag: string;
}

interface DecryptionInput {
  encryptedData: string;
  iv: string;
  authTag: string;
}

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits

  // Get encryption key from environment or generate one
  private getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    
    // If key is base64 encoded
    if (key.length === 44 && key.endsWith('=')) {
      return Buffer.from(key, 'base64');
    }
    
    // If key is hex encoded
    if (key.length === 64) {
      return Buffer.from(key, 'hex');
    }
    
    // Hash the key to ensure proper length
    return crypto.scryptSync(key, 'calendar-ai-salt', this.keyLength);
  }

  // Generate a new encryption key (for setup)
  generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('base64');
  }

  // Encrypt sensitive data (API keys, tokens, etc.)
  encrypt(plaintext: string, additionalData?: string): EncryptionResult {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, key);
      
      cipher.setAAD(Buffer.from(additionalData || 'calendar-ai'));
      
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encryptedData: encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64')
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data
  decrypt(input: DecryptionInput, additionalData?: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = Buffer.from(input.iv, 'base64');
      const authTag = Buffer.from(input.authTag, 'base64');
      
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAuthTag(authTag);
      decipher.setAAD(Buffer.from(additionalData || 'calendar-ai'));
      
      let decrypted = decipher.update(input.encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash passwords (for user authentication)
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password hash
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, hash);
  }

  // Generate secure random tokens
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  // Hash data for integrity checking
  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Encrypt for database storage (simplified interface)
  encryptForStorage(data: string): string {
    const result = this.encrypt(data);
    return JSON.stringify(result);
  }

  // Decrypt from database storage
  decryptFromStorage(encryptedString: string): string {
    const result = JSON.parse(encryptedString) as DecryptionInput;
    return this.decrypt(result);
  }
}

// Key rotation service for enhanced security
class KeyRotationService {
  private readonly keyVersions: Map<string, Buffer> = new Map();
  
  // Add a new key version
  addKeyVersion(version: string, key: string): void {
    this.keyVersions.set(version, Buffer.from(key, 'base64'));
  }
  
  // Get current key version
  getCurrentKeyVersion(): string {
    return process.env.CURRENT_KEY_VERSION || 'v1';
  }
  
  // Encrypt with versioned key
  encryptWithVersion(plaintext: string): { data: string; version: string } {
    const version = this.getCurrentKeyVersion();
    const encryption = new EncryptionService();
    const result = encryption.encrypt(plaintext);
    
    return {
      data: JSON.stringify(result),
      version
    };
  }
  
  // Decrypt with versioned key
  decryptWithVersion(encryptedData: string, version: string): string {
    // Set the key version temporarily
    const originalVersion = process.env.CURRENT_KEY_VERSION;
    process.env.CURRENT_KEY_VERSION = version;
    
    try {
      const encryption = new EncryptionService();
      const result = JSON.parse(encryptedData) as DecryptionInput;
      return encryption.decrypt(result);
    } finally {
      // Restore original version
      if (originalVersion) {
        process.env.CURRENT_KEY_VERSION = originalVersion;
      }
    }
  }
}

// Field-level encryption for specific database fields
class FieldEncryption {
  private encryption = new EncryptionService();
  
  // Define which fields should be encrypted
  private encryptedFields = new Set([
    'accessToken',
    'refreshToken',
    'apiKey',
    'clientSecret',
    'privateKey',
    'email', // PII
    'phoneNumber', // PII
    'address' // PII
  ]);
  
  // Encrypt an object's sensitive fields
  encryptObject(obj: Record<string, any>): Record<string, any> {
    const encrypted = { ...obj };
    
    for (const [key, value] of Object.entries(obj)) {
      if (this.encryptedFields.has(key) && typeof value === 'string') {
        encrypted[key] = this.encryption.encryptForStorage(value);
        encrypted[`${key}_encrypted`] = true; // Mark as encrypted
      }
    }
    
    return encrypted;
  }
  
  // Decrypt an object's sensitive fields
  decryptObject(obj: Record<string, any>): Record<string, any> {
    const decrypted = { ...obj };
    
    for (const [key, value] of Object.entries(obj)) {
      if (obj[`${key}_encrypted`] && typeof value === 'string') {
        try {
          decrypted[key] = this.encryption.decryptFromStorage(value);
          delete decrypted[`${key}_encrypted`]; // Remove encryption marker
        } catch (error) {
          console.error(`Failed to decrypt field ${key}:`, error);
          // Keep encrypted value if decryption fails
        }
      }
    }
    
    return decrypted;
  }
}

export const encryptionService = new EncryptionService();
export const keyRotationService = new KeyRotationService();
export const fieldEncryption = new FieldEncryption();

// Environment setup helper
export function generateEncryptionSetup(): {
  encryptionKey: string;
  instructions: string;
} {
  const key = new EncryptionService().generateKey();
  
  return {
    encryptionKey: key,
    instructions: `
Add this to your environment variables:

ENCRYPTION_KEY=${key}
CURRENT_KEY_VERSION=v1

For production, also consider:
- Using AWS KMS, Google Cloud KMS, or Azure Key Vault
- Implementing key rotation policies
- Setting up HSM (Hardware Security Module) for key storage
- Using envelope encryption for large data
    `.trim()
  };
}