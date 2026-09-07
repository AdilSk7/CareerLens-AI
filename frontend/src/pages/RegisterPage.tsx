import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Briefcase, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAuth } from "../contexts/AuthContext"

export function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Name validation: 2-50 chars, letters and spaces only
    const nameRegex = /^[a-zA-Z\s]{2,50}$/
    if (!nameRegex.test(name.trim())) {
      return setError("Name must be 2-50 characters long and contain only letters and spaces.")
    }

    // Email validation: strictly enforce @gmail.com domain
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i
    if (!emailRegex.test(email.trim())) {
      return setError("Please enter a valid @gmail.com email address.")
    }
    
    // Password validation: min 8 chars, uppercase, lowercase, number, special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
    if (!passwordRegex.test(password)) {
      return setError("Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.")
    }

    try {
      setError("")
      setLoading(true)
      await register(name, email, password)
      navigate("/dashboard")
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered.")
      } else {
        setError("Failed to create an account. Please try again.")
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
              &ldquo;With CareerLens AI, I stopped guessing what recruiters wanted and started speaking their language. It's an indispensable tool for anyone serious about their career.&rdquo;
            </p>
            <footer className="text-sm font-medium">Alex Chen</footer>
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
              <CardTitle className="text-2xl">Create an account</CardTitle>
              <CardDescription>
                Enter your details below to create your account
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
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
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
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button disabled={loading} type="submit" className="w-full">
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center">
              <p className="mt-2 text-sm text-center text-muted-foreground">
                Already have an account?{" "}
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
