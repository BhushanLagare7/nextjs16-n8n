"use client"

import { useForm } from "react-hook-form"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
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
import { CredentialType } from "@/config/constants"
import { useUpgradeModal } from "@/hooks/use-upgrade-modal"

import {
  useCreateCredential,
  useSuspenseCredential,
  useUpdateCredential,
} from "../hooks/use-credentials"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum([
    CredentialType.OPENAI,
    CredentialType.ANTHROPIC,
    CredentialType.GEMINI,
  ]),
  value: z.string().min(1, "API key is required"),
})

type FormValues = z.infer<typeof formSchema>

const credentialTypeOptions = [
  {
    value: CredentialType.OPENAI,
    label: "OpenAI",
    logo: "/logos/openai.svg",
  },
  {
    value: CredentialType.ANTHROPIC,
    label: "Anthropic",
    logo: "/logos/anthropic.svg",
  },
  {
    value: CredentialType.GEMINI,
    label: "Gemini",
    logo: "/logos/gemini.svg",
  },
]

interface CredentialFormProps {
  initialData?: {
    id?: string
    name: string
    type: CredentialType
  }
}

/**
 * Form for creating or editing a credential.
 *
 * @param initialData - Existing credential data; presence of `id` enables edit mode
 */
export function CredentialForm({ initialData }: CredentialFormProps) {
  const router = useRouter()
  const createCredential = useCreateCredential()
  const updateCredential = useUpdateCredential()
  const { handleError, modal } = useUpgradeModal()

  const isEdit = !!initialData?.id

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      type: initialData?.type ?? CredentialType.OPENAI,
      value: "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    if (isEdit && initialData?.id) {
      await updateCredential.mutateAsync({
        id: initialData.id,
        ...values,
      })
    } else {
      await createCredential.mutateAsync(values, {
        onSuccess: (data) => {
          router.push(`/credentials/${data.id}`)
        },
        onError: (error) => {
          handleError(error)
        },
      })
    }
  }

  return (
    <>
      {modal}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>
            {isEdit ? "Edit Credential" : "Create Credential"}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? "Update your API key or credential details"
              : "Add a new API key or credential to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My API key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {credentialTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Image
                                alt={option.label}
                                height={16}
                                src={option.logo}
                                width={16}
                              />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input placeholder="sk-..." type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  disabled={
                    createCredential.isPending || updateCredential.isPending
                  }
                  type="submit"
                >
                  {isEdit ? "Update" : "Create"}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href="/credentials" prefetch>
                    Cancel
                  </Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  )
}

/**
 * Suspense-backed view that loads a credential by ID and renders
 * the edit form once data is available.
 *
 * @param credentialId - ID of the credential to load
 */
export function CredentialView({ credentialId }: { credentialId: string }) {
  const { data: credential } = useSuspenseCredential(credentialId)

  return <CredentialForm initialData={credential} />
}
