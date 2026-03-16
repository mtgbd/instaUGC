"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function SignUpPage() {
  const supabase = createClient()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isResendLoading, setIsResendLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null)

  const handleGoogleSignUp = async () => {
    setError(null)
    setIsGoogleLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (signUpError) {
        setError(signUpError.message)
      }
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (signUpError) {
        setError(signUpError.message)
        return
      }
      setConfirmEmail(email)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    if (!confirmEmail) return
    setError(null)
    setIsResendLoading(true)
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: confirmEmail,
      })
      if (resendError) {
        setError(resendError.message)
        return
      }
    } finally {
      setIsResendLoading(false)
    }
  }

  if (confirmEmail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Card className="w-full max-w-[400px]">
          <CardHeader className="space-y-1 text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary"
              aria-hidden
            >
              ✓
            </div>
            <CardTitle className="text-2xl font-semibold">
              Check your email
            </CardTitle>
            <CardDescription>
              We sent a confirmation link to {confirmEmail}. Click it to
              activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p
                className="text-sm font-medium text-red-600 dark:text-red-400"
                role="alert"
              >
                {error}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
              disabled={isResendLoading}
              aria-label="Resend confirmation email"
            >
              {isResendLoading ? "Sending..." : "Resend email"}
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">Sign up</CardTitle>
          <CardDescription>
            Create an account to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            aria-label="Sign up with Google"
          >
            {isGoogleLoading ? "Signing up..." : "Sign up with Google"}
          </Button>

          <div className="relative flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs font-medium text-muted-foreground">
              or
            </span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="name"
                aria-label="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                aria-label="Email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
                autoComplete="new-password"
                aria-label="Password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
                autoComplete="new-password"
                aria-label="Confirm password"
              />
            </div>
            {error && (
              <p
                className="text-sm font-medium text-red-600 dark:text-red-400"
                role="alert"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              variant="default"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
