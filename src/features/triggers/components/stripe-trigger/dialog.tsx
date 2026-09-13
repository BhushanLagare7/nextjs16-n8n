"use client"

import { useParams } from "next/navigation"

import { CopyIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface StripeTriggerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Returns true when the URL is publicly reachable — i.e. not a localhost/
 * private-loop address and not the empty fallback default.
 */
function isPublicUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname
    return (
      host !== "localhost" &&
      host !== "127.0.0.1" &&
      host !== "0.0.0.0" &&
      !host.startsWith("[::") &&
      host !== ""
    )
  } catch {
    return false
  }
}

/**
 * Configuration dialog for the Stripe trigger node.
 * Displays the workflow's webhook URL and setup instructions for configuring
 * the endpoint in the Stripe Dashboard.
 */
export function StripeTriggerDialog({
  open,
  onOpenChange,
}: StripeTriggerDialogProps) {
  const params = useParams()
  const workflowId = params?.workflowId as string

  // Construct the webhook URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const isBaseUrlPublic = isPublicUrl(baseUrl)
  const webhookUrl = `${baseUrl}/api/webhooks/stripe?workflowId=${workflowId}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      toast.success("Webhook URL copied to clipboard")
    } catch {
      toast.error("Failed to copy URL")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Stripe Trigger Configuration</DialogTitle>
          <DialogDescription>
            Configure this webhook URL in your Stripe Dashboard to trigger this
            workflow on payment events.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!isBaseUrlPublic && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
              <p className="font-medium">Localhost URL detected</p>
              <p className="mt-1 text-xs">
                The current app URL ({baseUrl}) is not publicly reachable.
                Stripe cannot deliver webhooks directly to localhost. Set{" "}
                <code className="rounded bg-background px-1 py-0.5">
                  NEXT_PUBLIC_APP_URL
                </code>{" "}
                to a public URL (e.g. your ngrok URL) or use the Stripe CLI to
                forward events.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                className="font-mono text-sm"
                id="webhook-url"
                readOnly
                value={webhookUrl}
              />
              <Button
                aria-label="Copy webhook URL"
                size="icon"
                type="button"
                variant="outline"
                onClick={copyToClipboard}
              >
                <CopyIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-lg bg-muted p-4">
            <h4 className="text-sm font-medium">Setup instructions:</h4>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Open your Stripe Dashboard</li>
              <li>Go to Developers → Webhooks</li>
              <li>Click &quot;Add endpoint&quot;</li>
              <li>Paste the webhook URL above</li>
              <li>
                Select events to listen for (e.g., payment_intent.succeeded)
              </li>
              <li>Save and copy the signing secret</li>
            </ol>
          </div>

          <div className="space-y-2 rounded-lg bg-muted p-4">
            <h4 className="text-sm font-medium">Available Variables</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <code className="rounded bg-background px-1 py-0.5">
                  {"{{stripe.amount}}"}
                </code>{" "}
                - Payment amount
              </li>
              <li>
                <code className="rounded bg-background px-1 py-0.5">
                  {"{{stripe.currency}}"}
                </code>{" "}
                - Currency code
              </li>
              <li>
                <code className="rounded bg-background px-1 py-0.5">
                  {"{{stripe.customerId}}"}
                </code>{" "}
                - Customer ID
              </li>
              <li>
                <code className="rounded bg-background px-1 py-0.5">
                  {"{{json stripe}}"}
                </code>{" "}
                - Full event data as JSON
              </li>
              <li>
                <code className="rounded bg-background px-1 py-0.5">
                  {"{{stripe.eventType}}"}
                </code>{" "}
                - Event type (e.g., payment_intent.succeeded)
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
