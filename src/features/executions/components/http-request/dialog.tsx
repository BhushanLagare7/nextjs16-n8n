"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

/**
 * Zod validation schema for the HTTP request settings form.
 *
 * Fields:
 * - `variableName`: Identifier used to reference this node's response in
 *   downstream nodes. Must be a valid JS identifier.
 * - `endpoint`: Target URL for the HTTP request.
 * - `method`: HTTP verb to use.
 * - `body`: Optional request body (only meaningful for POST/PUT/PATCH).
 */
const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message:
        "Variable name must start with a letter or underscore and container only letters, numbers, and underscores",
    }),
  endpoint: z.url({ message: "Please enter a valid URL" }),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  body: z.string().optional(),
  // .refine() TODO JSON5 — validate body as JSON5 once supported
})

/** Inferred form value type used by consumers of this dialog. */
export type HttpRequestFormValues = z.infer<typeof formSchema>

/**
 * Props for {@link HttpRequestDialog}.
 *
 * @property open           Controls dialog visibility.
 * @property onOpenChange   Callback invoked when open state changes.
 * @property onSubmit       Called with validated form values on save.
 * @property defaultValues  Initial values to pre-fill the form.
 */
interface HttpRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: z.infer<typeof formSchema>) => void
  defaultValues?: Partial<HttpRequestFormValues>
}

/**
 * Settings dialog for the HTTP Request node.
 *
 * Exposes method, endpoint URL, variable name, and (for write methods)
 * a request body. Validates input via Zod and calls `onSubmit` with the
 * parsed values on save.
 */
export function HttpRequestDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: HttpRequestDialogProps) {
  // Initialize the form with Zod validation and default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName ?? "",
      endpoint: defaultValues.endpoint ?? "",
      method: defaultValues.method ?? "GET",
      body: defaultValues.body ?? "",
    },
  })

  // Reset form values when dialog reopens so stale edits don't persist
  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName ?? "",
        endpoint: defaultValues.endpoint ?? "",
        method: defaultValues.method ?? "GET",
        body: defaultValues.body ?? "",
      })
    }
  }, [open, defaultValues, form])

  // Live-watched values drive dynamic UI (preview text + conditional field)
  const watchVariableName = form.watch("variableName") ?? "myApiCall"
  const watchMethod = form.watch("method")

  // Only show the body field for methods that typically carry a payload
  const showBodyField = ["POST", "PUT", "PATCH"].includes(watchMethod)

  /** Forward validated values to the parent and close the dialog. */
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>HTTP Request</DialogTitle>
          <DialogDescription>
            Configure settings for the HTTP Request node.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="mt-4 space-y-8"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            {/* Variable name — how other nodes reference this response */}
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="myApiCall" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use this name to reference the result in other nodes:{" "}
                    {`{{${watchVariableName}.httpResponse.data}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* HTTP method selector */}
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The HTTP method to use for this request
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Endpoint URL — supports {{template}} substitutions */}
            <FormField
              control={form.control}
              name="endpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://api.example.com/users/{{httpResponse.data.id}}"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Static URL or use {"{{variables}}"} for simple values or{" "}
                    {"{{json variable}}"} to stringify objects
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Conditional body field — only for POST/PUT/PATCH */}
            {showBodyField && (
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Body</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[120px] font-mono text-sm"
                        placeholder={
                          '{\n  "userId": "{{httpResponse.data.id}}",\n  "name": "{{httpResponse.data.name}}",\n  "items": "{{httpResponse.data.items}}"\n}'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      JSON with template variables. Use {"{{variables}}"} for
                      simple values or {"{{json variable}}"} to stringify
                      objects
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter className="mt-4">
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
