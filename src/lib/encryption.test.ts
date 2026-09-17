import assert from "node:assert"
import { describe, it } from "node:test"

import { decrypt, encrypt } from "./encryption"

describe("encryption", () => {
  it("encrypts and decrypts a plain text string", () => {
    const original = "sk-test-api-key-1234567890"
    const encrypted = encrypt(original)

    assert.notStrictEqual(encrypted, original)
    assert.ok(typeof encrypted === "string" && encrypted.length > 0)

    const decrypted = decrypt(encrypted)
    assert.strictEqual(decrypted, original)
  })

  it("handles complex strings with special characters and emojis", () => {
    const original = "special-chars!@#$%^&*()_+={}|[]\\:\";'<>?,./~`🚀🔐"
    const encrypted = encrypt(original)
    const decrypted = decrypt(encrypted)

    assert.strictEqual(decrypted, original)
  })

  it("produces unique ciphertexts for different inputs", () => {
    const cipher1 = encrypt("key-alpha")
    const cipher2 = encrypt("key-beta")

    assert.notStrictEqual(cipher1, cipher2)
  })

  it("falls back to returning input text if decryption fails", () => {
    const legacyPlaintext = "sk-unencrypted-legacy-api-key"
    const result = decrypt(legacyPlaintext)

    assert.strictEqual(result, legacyPlaintext)
  })

  it("falls back to returning invalid ciphertext untouched", () => {
    const invalidHex = "not-a-valid-cryptr-cipher-text"
    const result = decrypt(invalidHex)

    assert.strictEqual(result, invalidHex)
  })
})
