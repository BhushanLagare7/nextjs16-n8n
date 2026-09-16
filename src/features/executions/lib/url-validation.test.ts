import assert from "node:assert"
import { describe, it } from "node:test"

import {
  isPrivateOrLocalHost,
  validateDiscordWebhookUrl,
  validateSlackWebhookUrl,
  validateWebhookUrl,
} from "./url-validation"

describe("url-validation", () => {
  describe("isPrivateOrLocalHost", () => {
    it("detects localhost and local domain names", () => {
      assert.strictEqual(isPrivateOrLocalHost("localhost"), true)
      assert.strictEqual(isPrivateOrLocalHost("sub.localhost"), true)
      assert.strictEqual(isPrivateOrLocalHost("myhost.local"), true)
      assert.strictEqual(isPrivateOrLocalHost("service.internal"), true)
      assert.strictEqual(isPrivateOrLocalHost("discord.com"), false)
      assert.strictEqual(isPrivateOrLocalHost("hooks.slack.com"), false)
    })

    it("detects IPv4 private and loopback addresses", () => {
      assert.strictEqual(isPrivateOrLocalHost("127.0.0.1"), true)
      assert.strictEqual(isPrivateOrLocalHost("127.1.2.3"), true)
      assert.strictEqual(isPrivateOrLocalHost("10.0.0.1"), true)
      assert.strictEqual(isPrivateOrLocalHost("10.255.255.255"), true)
      assert.strictEqual(isPrivateOrLocalHost("172.16.0.1"), true)
      assert.strictEqual(isPrivateOrLocalHost("172.31.255.255"), true)
      assert.strictEqual(isPrivateOrLocalHost("172.32.0.1"), false)
      assert.strictEqual(isPrivateOrLocalHost("192.168.1.1"), true)
      assert.strictEqual(isPrivateOrLocalHost("169.254.169.254"), true)
      assert.strictEqual(isPrivateOrLocalHost("100.64.0.1"), true)
      assert.strictEqual(isPrivateOrLocalHost("0.0.0.0"), true)
      assert.strictEqual(isPrivateOrLocalHost("8.8.8.8"), false)
    })

    it("detects IPv6 loopback and private addresses", () => {
      assert.strictEqual(isPrivateOrLocalHost("::1"), true)
      assert.strictEqual(isPrivateOrLocalHost("[::1]"), true)
      assert.strictEqual(isPrivateOrLocalHost("::"), true)
      assert.strictEqual(isPrivateOrLocalHost("fe80::1"), true)
      assert.strictEqual(isPrivateOrLocalHost("fc00::1"), true)
      assert.strictEqual(isPrivateOrLocalHost("fd12::34"), true)
      assert.strictEqual(isPrivateOrLocalHost("::ffff:127.0.0.1"), true)
    })
  })

  describe("validateWebhookUrl", () => {
    const defaultOptions = {
      allowedHosts: ["example.com"],
      allowedPathPrefix: "/webhook/",
    }

    it("accepts valid HTTPS webhook URLs", () => {
      const parsed = validateWebhookUrl(
        "https://example.com/webhook/123",
        defaultOptions
      )
      assert.strictEqual(parsed.hostname, "example.com")
      assert.strictEqual(parsed.pathname, "/webhook/123")
    })

    it("rejects non-HTTPS URLs", () => {
      assert.throws(
        () =>
          validateWebhookUrl("http://example.com/webhook/123", defaultOptions),
        /must use HTTPS protocol/
      )
    })

    it("rejects URLs with credentials", () => {
      assert.throws(
        () =>
          validateWebhookUrl(
            "https://user:pass@example.com/webhook/123",
            defaultOptions
          ),
        /must not contain embedded credentials/
      )
    })

    it("rejects URLs with custom ports", () => {
      assert.throws(
        () =>
          validateWebhookUrl(
            "https://example.com:8443/webhook/123",
            defaultOptions
          ),
        /must not use custom port/
      )
      // Standard 443 is accepted
      assert.doesNotThrow(() =>
        validateWebhookUrl(
          "https://example.com:443/webhook/123",
          defaultOptions
        )
      )
    })

    it("rejects unapproved hosts", () => {
      assert.throws(
        () =>
          validateWebhookUrl("https://evil.com/webhook/123", defaultOptions),
        /host "evil.com" is not allowed/
      )
    })

    it("rejects unapproved paths", () => {
      assert.throws(
        () =>
          validateWebhookUrl("https://example.com/other/123", defaultOptions),
        /path must start with "\/webhook\/"/
      )
    })

    it("rejects private/local network destinations", () => {
      assert.throws(
        () =>
          validateWebhookUrl("https://127.0.0.1/webhook/123", {
            allowedHosts: ["127.0.0.1"],
          }),
        /must not target private or local networks/
      )
    })
  })

  describe("validateDiscordWebhookUrl", () => {
    it("accepts valid Discord webhook URLs", () => {
      assert.doesNotThrow(() =>
        validateDiscordWebhookUrl(
          "https://discord.com/api/webhooks/12345/token-abc"
        )
      )
      assert.doesNotThrow(() =>
        validateDiscordWebhookUrl(
          "https://discordapp.com/api/webhooks/12345/token-abc"
        )
      )
    })

    it("rejects non-Discord hosts and non-webhook paths", () => {
      assert.throws(
        () =>
          validateDiscordWebhookUrl(
            "https://evil.com/api/webhooks/12345/token-abc"
          ),
        /host "evil.com" is not allowed/
      )
      assert.throws(
        () =>
          validateDiscordWebhookUrl(
            "https://discord.com/api/v10/channels/123/messages"
          ),
        /path must start with "\/api\/webhooks\/"/
      )
    })
  })

  describe("validateSlackWebhookUrl", () => {
    it("accepts valid Slack webhook URLs", () => {
      assert.doesNotThrow(() =>
        validateSlackWebhookUrl("https://hooks.slack.com/services/T00/B00/XXXX")
      )
    })

    it("rejects non-Slack hosts and non-service paths", () => {
      assert.throws(
        () => validateSlackWebhookUrl("https://slack.com/api/chat.postMessage"),
        /host "slack.com" is not allowed/
      )
      assert.throws(
        () => validateSlackWebhookUrl("https://hooks.slack.com/other/path"),
        /path must start with "\/services\/"/
      )
    })
  })
})
