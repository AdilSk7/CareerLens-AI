import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Briefcase, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAuth } from "../contexts/AuthContext"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      setError("")
      setLoading(true)
      await login(email, password)
      navigate("/dashboard")
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password.")
      } else {
        setError("Failed to sign in. Please try again.")
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container relative flex h-screen w-full flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-background">
      {/* Visual side for large screens */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-primary" />
        <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
          <Briefcase className="h-6 w-6" />
          CareerLens AI
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;CareerLens AI completely transformed my job search. It helped me identify missing skills and perfectly tailor my resume for the exact roles I wanted.&rdquo;
            </p>
            <footer className="text-sm font-medium">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>

      {/* Form side */}
      <div className="lg:p-8 w-full flex justify-center p-4">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card className="border-none shadow-none md:border-solid md:shadow-sm">
            <CardHeader className="space-y-1 text-center md:text-left">
              <div className="flex md:hidden items-center justify-center gap-2 mb-4 text-primary">
                <Briefcase className="h-6 w-6" />
                <span className="font-bold">CareerLens AI</span>
              </div>
              <CardTitle className="text-2xl">Log in to your account</CardTitle>
              <CardDescription>
                Enter your email and password below to log in
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
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
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input 
                    id="password" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button disabled={loading} type="submit" className="w-full">
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center">
              <p className="mt-2 text-sm text-center text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
