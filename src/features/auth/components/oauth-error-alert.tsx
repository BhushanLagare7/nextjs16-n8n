"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { OctagonXIcon } from "lucide-react"

/** Maps OAuth error codes to user-facing messages. */
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Sign in was cancelled or access was denied.",
  account_already_linked_to_different_user:
    "This account is already linked to another user.",
  email_does_not_match: "The email does not match your existing account.",
  email_not_found: "No email address was provided by your social account.",
  email_not_verified: "Your email address has not been verified.",
  invalid_code: "Invalid authorization code. Please try signing in again.",
  no_code: "Authorization was not completed. Please try again.",
  oauth_provider_not_found: "Authentication provider configuration error.",
  state_mismatch: "Sign in session expired. Please try signing in again.",
  unable_to_get_user_info:
    "Unable to retrieve account details from the provider.",
  unable_to_link_account: "Unable to link this account.",
}

/**
 * Resolves an OAuth error code to a display message.
 *
 * @param error - Error code from the OAuth callback, if any.
 * @param errorDescription - Fallback description provided by the OAuth provider.
 * @returns A user-facing message, or `null` if no error is present.
 */
function getOAuthErrorMessage(
  error: string | null,
  errorDescription: string | null
): string | null {
  if (!error) return null

  return (
    OAUTH_ERROR_MESSAGES[error] ??
    errorDescription ??
    "An error occurred during social authentication. Please try again."
  )
}

/** Reads OAuth error params from the URL and renders an alert if present. */
function OAuthErrorContent() {
  const searchParams = useSearchParams()
  const oauthError = getOAuthErrorMessage(
    searchParams.get("error"),
    searchParams.get("error_description")
  )

  if (!oauthError) return null

  return (
    <div
      aria-live="polite"
      className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
      role="alert"
    >
      <OctagonXIcon aria-hidden="true" className="size-4 shrink-0" />
      <span>{oauthError}</span>
    </div>
  )
}

/**
 * Displays OAuth errors returned as URL query parameters (e.g. `?error=access_denied`).
 * Wrapped in a `Suspense` boundary since `useSearchParams` requires one.
 */
export function OAuthErrorAlert() {
  return (
    <Suspense fallback={null}>
      <OAuthErrorContent />
    </Suspense>
  )
}
