/**
 * Options for validating an external webhook URL.
 */
export interface ValidateWebhookUrlOptions {
  /** Whitelisted hostnames (case-insensitive, e.g. ["discord.com", "discordapp.com"]). */
  allowedHosts: string[]
  /** Required path prefix (e.g. "/api/webhooks/"). */
  allowedPathPrefix?: string
}

/**
 * Checks whether a given hostname targets a private, loopback, link-local,
 * or local network destination.
 */
export function isPrivateOrLocalHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().trim()

  // Strip brackets from IPv6 hostnames, e.g. [::1] -> ::1
  const cleanHost =
    normalized.startsWith("[") && normalized.endsWith("]")
      ? normalized.slice(1, -1)
      : normalized

  if (
    cleanHost === "localhost" ||
    cleanHost.endsWith(".localhost") ||
    cleanHost.endsWith(".local") ||
    cleanHost.endsWith(".internal")
  ) {
    return true
  }

  // Check IPv4 addresses
  const ipv4Match = cleanHost.match(
    /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  )
  if (ipv4Match) {
    const octets = [
      Number(ipv4Match[1]),
      Number(ipv4Match[2]),
      Number(ipv4Match[3]),
      Number(ipv4Match[4]),
    ]

    // Invalid IPv4 octet
    if (octets.some((oct) => oct < 0 || oct > 255)) {
      return true
    }

    // 0.0.0.0/8 (Current network)
    if (octets[0] === 0) return true
    // 10.0.0.0/8 (Private)
    if (octets[0] === 10) return true
    // 127.0.0.0/8 (Loopback)
    if (octets[0] === 127) return true
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127) return true
    // 169.254.0.0/16 (Link-local / cloud metadata)
    if (octets[0] === 169 && octets[1] === 254) return true
    // 172.16.0.0/12 (Private)
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true
    // 192.168.0.0/16 (Private)
    if (octets[0] === 192 && octets[1] === 168) return true
    // 255.255.255.255 (Broadcast)
    if (
      octets[0] === 255 &&
      octets[1] === 255 &&
      octets[2] === 255 &&
      octets[3] === 255
    )
      return true
  }

  // Check IPv6 loopback and private/link-local addresses
  if (
    cleanHost === "::1" ||
    cleanHost === "::" ||
    cleanHost.startsWith("fe80:") ||
    cleanHost.startsWith("fc00:") ||
    cleanHost.startsWith("fd") ||
    cleanHost.startsWith("::ffff:127.") ||
    cleanHost.startsWith("::ffff:10.") ||
    cleanHost.startsWith("::ffff:192.168.")
  ) {
    return true
  }

  return false
}

/**
 * Validates that a webhook URL is HTTPS, targets an approved host and path,
 * does not contain credentials or unexpected ports, and does not target
 * a private/local network.
 *
 * @throws {Error} If the URL fails any validation requirement.
 */
export function validateWebhookUrl(
  urlStr: string,
  options: ValidateWebhookUrlOptions
): URL {
  let parsed: URL
  try {
    parsed = new URL(urlStr)
  } catch {
    throw new Error("Invalid URL format")
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Webhook URL must use HTTPS protocol")
  }

  if (parsed.username || parsed.password) {
    throw new Error("Webhook URL must not contain embedded credentials")
  }

  if (parsed.port && parsed.port !== "443") {
    throw new Error(`Webhook URL must not use custom port: ${parsed.port}`)
  }

  const hostname = parsed.hostname.toLowerCase()
  if (isPrivateOrLocalHost(hostname)) {
    throw new Error("Webhook URL must not target private or local networks")
  }

  const allowedHosts = options.allowedHosts.map((h) => h.toLowerCase())
  if (!allowedHosts.includes(hostname)) {
    throw new Error(
      `Webhook URL host "${hostname}" is not allowed. Approved hosts: ${options.allowedHosts.join(", ")}`
    )
  }

  if (
    options.allowedPathPrefix &&
    !parsed.pathname.startsWith(options.allowedPathPrefix)
  ) {
    throw new Error(
      `Webhook URL path must start with "${options.allowedPathPrefix}"`
    )
  }

  return parsed
}

/**
 * Approved Discord webhook hosts and path prefix.
 */
export const DISCORD_APPROVED_HOSTS = ["discord.com", "discordapp.com"]
export const DISCORD_APPROVED_PATH_PREFIX = "/api/webhooks/"

/**
 * Validates a Discord webhook URL.
 */
export function validateDiscordWebhookUrl(urlStr: string): URL {
  return validateWebhookUrl(urlStr, {
    allowedHosts: DISCORD_APPROVED_HOSTS,
    allowedPathPrefix: DISCORD_APPROVED_PATH_PREFIX,
  })
}

/**
 * Approved Slack webhook hosts and path prefix.
 */
export const SLACK_APPROVED_HOSTS = ["hooks.slack.com"]
export const SLACK_APPROVED_PATH_PREFIX = "/services/"

/**
 * Validates a Slack webhook URL.
 */
export function validateSlackWebhookUrl(urlStr: string): URL {
  return validateWebhookUrl(urlStr, {
    allowedHosts: SLACK_APPROVED_HOSTS,
    allowedPathPrefix: SLACK_APPROVED_PATH_PREFIX,
  })
}
