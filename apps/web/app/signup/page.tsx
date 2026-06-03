import Link from "next/link"
import type { Metadata } from "next"
import { AuthForm } from "@/components/AuthForm"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your MoneyPrint account and start generating videos",
}

const benefits = [
  "5 launch credits to start",
  "No credit card required",
  "Cancel anytime",
]

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Benefits */}
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="size-4 text-primary" />
              {benefit}
            </div>
          ))}
        </div>

        <AuthForm mode="signup" />
        
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Button variant="link" asChild className="h-auto p-0 font-semibold">
            <Link href="/login">Log in</Link>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
