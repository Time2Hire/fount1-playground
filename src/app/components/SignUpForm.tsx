"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signIn } from "next-auth/react"

type PasswordRequirement = {
  regex: RegExp
  text: string
}

const passwordRequirements: PasswordRequirement[] = [
  { regex: /.{12,}/, text: "At least 12 characters" },
  { regex: /[A-Z]/, text: "Include uppercase letters" },
  { regex: /[a-z]/, text: "Include lowercase letters" },
  { regex: /[0-9]/, text: "Include numbers" },
  { regex: /[^A-Za-z0-9]/, text: "Include symbols" },
]

export default function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter();

  const checkPasswordStrength = (password: string) => {
    return passwordRequirements.map(requirement => ({
      ...requirement,
      isMet: requirement.regex.test(password),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allRequirementsMet = checkPasswordStrength(password).every(req => req.isMet);

    if (!allRequirementsMet) {
      setError("Please meet all password requirements");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        // Automatically log in the user after successful signup
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          setError(result.error);
          setIsSubmitting(false);
        } else {
          router.push("/candidate");
        }
      } else {
        const data = await res.json();
        setError(data.error || "Signup failed");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Password Requirements</Label>
            <ul className="text-sm space-y-1">
              {checkPasswordStrength(password).map((requirement, index) => (
                <li key={index} className={`flex items-center ${requirement.isMet ? "text-green-600" : "text-red-600"}`}>
                  {requirement.isMet ? (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  {requirement.text}
                </li>
              ))}
            </ul>
          </div>
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing up..." : "Sign Up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}