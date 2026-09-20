"use client"

import { useForm } from "react-hook-form"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"

import { GithubLogo, GoogleLogo } from "@/components/logos"
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
import { authClient } from "@/lib/auth-client"

import { OAuthErrorAlert } from "./oauth-error-alert"

const registerSchema = z
  .object({
    email: z.email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

/**
 * Registration form.
 * Creates an account via email/password or social provider, redirecting
 * to home on success.
 */
export function RegisterForm() {
  const router = useRouter()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const signInGithub = async () => {
    await authClient.signIn.social(
      {
        provider: "github",
        callbackURL: "/",
        errorCallbackURL: "/signup",
      },
      {
        onSuccess: () => {
          router.push("/")
        },
        onError: () => {
          toast.error("Something went wrong")
        },
      }
    )
  }

  const signInGoogle = async () => {
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: "/",
        errorCallbackURL: "/signup",
      },
      {
        onSuccess: () => {
          router.push("/")
        },
        onError: () => {
          toast.error("Something went wrong")
        },
      }
    )
  }

  const onSubmit = async (values: RegisterFormValues) => {
    await authClient.signUp.email(
      {
        name: values.email,
        email: values.email,
        password: values.password,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          router.push("/")
        },
        onError: (ctx) => {
          toast.error(ctx.error.message)
        },
      }
    )
  }

  const isPending = form.formState.isSubmitting

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Get Started</CardTitle>
          <CardDescription>Create your account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <OAuthErrorAlert />
                <div className="flex flex-col gap-4">
                  <Button
                    className="w-full"
                    disabled={isPending}
                    type="button"
                    variant="outline"
                    onClick={signInGithub}
                  >
                    <GithubLogo aria-hidden="true" size={20} />
                    Continue with GitHub
                  </Button>
                  <Button
                    className="w-full"
                    disabled={isPending}
                    type="button"
                    variant="outline"
                    onClick={signInGoogle}
                  >
                    <GoogleLogo aria-hidden="true" size={20} />
                    Continue with Google
                  </Button>
                </div>
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="m@example.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="*********"
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="*********"
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button className="w-full" disabled={isPending} type="submit">
                    Sign up
                  </Button>
                </div>
                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link className="underline underline-offset-4" href="/login">
                    Login
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
