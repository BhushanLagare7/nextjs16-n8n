import "dotenv/config"

import Cryptr from "cryptr"

let cryptrInstance: Cryptr | null = null

/**
 * Returns the singleton Cryptr instance, creating it lazily with the configured encryption key.
 *
 * @throws {Error} If `ENCRYPTION_KEY` is not defined in production.
 */
function getCryptr(): Cryptr {
  if (!cryptrInstance) {
    const key =
      process.env.ENCRYPTION_KEY ||
      (process.env.NODE_ENV !== "production"
        ? "dev-secret-encryption-key-for-credentials"
        : undefined)

    if (!key) {
      throw new Error("ENCRYPTION_KEY environment variable is not set")
    }

    cryptrInstance = new Cryptr(key)
  }

  return cryptrInstance
}

/**
 * Encrypts a plaintext string using AES-256 via Cryptr.
 */
export const encrypt = (text: string): string => {
  return getCryptr().encrypt(text)
}

/**
 * Decrypts a ciphertext string back to plaintext.
 *
 * Falls back to returning the input string untouched if decryption fails,
 * ensuring backward compatibility with legacy unencrypted credentials and test fixtures.
 */
export const decrypt = (text: string): string => {
  try {
    return getCryptr().decrypt(text)
  } catch {
    return text
  }
}
