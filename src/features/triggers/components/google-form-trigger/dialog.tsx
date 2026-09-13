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

import { generateGoogleFormScript } from "./utils"

interface GoogleFormTriggerDialogProps {
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
 * Configuration dialog for the Google Form trigger node.
 * Displays the workflow's webhook URL and a copyable Apps Script snippet
 * for wiring up "On form submit" notifications.
 */
export function GoogleFormTriggerDialog({
  open,
  onOpenChange,
}: GoogleFormTriggerDialogProps) {
  const params = useParams()
  const workflowId = params?.workflowId as string

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const isBaseUrlPublic = isPublicUrl(baseUrl)
  const webhookUrl = `${baseUrl}/api/webhooks/google-form?workflowId=${workflowId}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      toast.success("Webhook URL copied to clipboard")
    } catch {
      toast.error("Failed to copy URL")
    }
  }

  const copyScriptToClipboard = async () => {
    const script = generateGoogleFormScript(webhookUrl)
    try {
      await navigator.clipboard.writeText(script)
      toast.success("Script copied to clipboard")
    } catch {
      toast.error("Failed to copy Script to clipboard")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Google Form Trigger Configuration</DialogTitle>
          <DialogDescription>
            Use this webhook URL in your Google Form&apos;s Apps Script to
            trigger this workflow when a form is submitted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!isBaseUrlPublic && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
              <p className="font-medium">Localhost URL detected</p>
              <p className="mt-1 text-xs">
                The current app URL ({baseUrl}) is not publicly reachable.
                Google Forms cannot deliver submissions to localhost. Set{" "}
                <code className="rounded bg-background px-1 py-0.5">
                  NEXT_PUBLIC_APP_URL
                </code>{" "}
                to a public URL (e.g. your ngrok URL) before testing end-to-end.
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
              <li>Open your Google Form</li>
              <li>Click the three dots menu → Script editor</li>
              <li>Copy and paste the script below</li>
              <li>Replace WEBHOOK_URL with your webhook URL above</li>
              <li>Save and click &quot;Triggers&quot; → Add Trigger</li>
              <li>Choose: From form → On form submit → Save</li>
            </ol>
          </div>

          <div className="space-y-3 rounded-lg bg-muted p-4">
            <h4 className="text-sm font-medium">Google Apps Script:</h4>
            <Button
              type="button"
              variant="outline"
              onClick={copyScriptToClipboard}
            >
              <CopyIcon className="mr-2 size-4" />
              Copy Google Apps Script
            </Button>
            <p className="text-xs text-muted-foreground">
              This script includes your webhook URL and handles form submissions
            </p>
          </div>

          <div className="space-y-2 rounded-lg bg-muted p-4">
            <h4 className="text-sm font-medium">Available Variables</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <code className="rounded bg-background px-1 py-0.5">
                  {"{{googleForm.respondentEmail}}"}
                </code>{" "}
                - Respondent&apos;s email
              </li>
              <li>
                <code className="rounded bg-background px-1 py-0.5">
                  {"{{googleForm.responses['Question Name']}}"}
                </code>{" "}
                - Specific answer
              </li>
              <li>
                <code className="rounded bg-background px-1 py-0.5">
                  {"{{json googleForm.responses}}"}
                </code>{" "}
                - All responses as JSON
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
