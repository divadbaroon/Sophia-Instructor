"use client"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { createClient } from "@/utils/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, ArrowLeft } from "lucide-react"

export default function SignupClient({ initialMessage }: { initialMessage?: string }) {
  const [message, setMessage] = useState(initialMessage || "")
  const [isLoading, setIsLoading] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const router = useRouter()

  async function handleSignup(formData: FormData) {
    setIsLoading(true)
    setMessage("")

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // Client-side validation
    if (password !== confirmPassword) {
      setMessage("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm`
        }
      })

      if (error) {
        setMessage(error.message)
      } else if (data.user && !data.user.email_confirmed_at) {
        // User created but needs email verification
        setUserEmail(email)
        setShowVerificationModal(true)
      } else if (data.user && data.user.email_confirmed_at) {
        // User is already verified (shouldn't happen on signup, but just in case)
        router.push("/")
      }
    } catch (error: any) {
      setMessage(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogin(formData: FormData) {
    setIsLoading(true)
    setMessage("")

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      } else {
        router.push("/")
      }
    } catch (error: any) {
      setMessage(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  async function resendVerificationEmail() {
    if (!userEmail) return

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm`
        }
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage("Verification email sent!")
      }
    } catch (error: any) {
      setMessage(error.message || "Failed to resend email")
    }
  }

  if (showVerificationModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
        {/* geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl"></div>
        </div>

        {/* Verification Modal */}
        <section className="min-h-screen flex justify-center items-center px-6 relative">
          <div className="w-full max-w-md">
            <Card className="border border-white/20 shadow-2xl bg-white/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Check Your Email</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 text-center">
                <div className="space-y-3">
                  <p className="text-gray-600">
                    We&apos;ve sent a verification link to:
                  </p>
                  <p className="font-semibold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                    {userEmail}
                  </p>
                  <p className="text-sm text-gray-500">
                    Click the link in the email to verify your account and complete your registration.
                  </p>
                </div>

                {message && (
                  <div className="text-sm font-medium text-green-600 bg-green-50/80 p-3 rounded-lg border border-green-200 backdrop-blur-sm">
                    {message}
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={resendVerificationEmail}
                    variant="outline"
                    className="w-full h-12 border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    Resend Verification Email
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setShowVerificationModal(false)
                      setMessage("")
                    }}
                    variant="ghost"
                    className="w-full h-12 text-gray-600 hover:text-gray-800"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign Up
                  </Button>
                </div>

                <div className="text-xs text-gray-500">
                  <p>Didn&apos;t receive the email? Check your spam folder or try resending.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      {/* geometric shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Sign Up Section */}
      <section className="min-h-screen flex justify-center items-center px-6 relative">
        <div className="w-full max-w-md mt-12">
          <Card className="border border-white/20 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <form 
                id="signup-form" 
                className="grid gap-6"
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  handleSignup(formData)
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white/80 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 font-medium">
                      Password
                    </Label>
                    <span className="text-xs text-gray-500 bg-gray-50/80 px-2 py-1 rounded backdrop-blur-sm">Min. 6 characters</span>
                  </div>
                  <Input
                    minLength={6}
                    name="password"
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white/80 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    minLength={6}
                    name="confirmPassword"
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white/80 backdrop-blur-sm"
                    required
                  />
                </div>
                {message && (
                  <div className="text-sm font-medium text-red-600 bg-red-50/80 p-3 rounded-lg border border-red-200 backdrop-blur-sm">
                    {message}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/95 px-2 text-gray-500">Or</span>
                </div>
              </div>

              <div className="text-center">
                <span className="text-gray-600">Already have an account? </span>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    const form = document.getElementById("signup-form") as HTMLFormElement
                    const formData = new FormData(form)
                    handleLogin(formData)
                  }}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline disabled:opacity-50"
                >
                  Sign in
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Footer text */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}