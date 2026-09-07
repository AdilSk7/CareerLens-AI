import { useState } from "react"
import { Link } from "react-router-dom"
import { Briefcase, AlertCircle, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAuth } from "../contexts/AuthContext"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  
  const { resetPassword } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      setMessage("")
      setError("")
      setLoading(true)
      await resetPassword(email)
      setMessage("Check your inbox for further instructions.")
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email.")
      } else {
        setError("Failed to reset password.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container relative flex h-screen w-full flex-col items-center justify-center lg:px-0 bg-muted/40">
      
      <div className="lg:p-8 w-full flex justify-center p-4">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <Link to="/" className="flex items-center justify-center gap-2 mb-2 text-primary">
            <Briefcase className="h-6 w-6" />
            <span className="font-bold text-xl">CareerLens AI</span>
          </Link>
          <Card className="border-none shadow-sm md:border-solid">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Reset password</CardTitle>
              <CardDescription>
                Enter your email address and we will send you a password reset link
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              {message && (
                <div className="p-3 rounded-md bg-primary/15 text-primary text-sm flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{message}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button disabled={loading} type="submit" className="w-full">
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center">
              <p className="mt-2 text-sm text-center text-muted-foreground">
                Remembered your password?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
