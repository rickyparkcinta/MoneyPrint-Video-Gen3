import Link from "next/link"
import type { Metadata } from "next"
import { AuthForm } from "@/components/AuthForm"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { getI18n } from "@/lib/i18n-server"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your MoneyPrint account and start generating videos",
}

export default async function SignupPage() {
  const { dict } = await getI18n()

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Benefits */}
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          {dict.auth.benefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="size-4 text-primary" />
              {benefit}
            </div>
          ))}
        </div>

        <AuthForm mode="signup" />
        
        <div className="text-center text-sm text-muted-foreground">
          {dict.auth.haveAccount}{" "}
          <Button variant="link" asChild className="h-auto p-0 font-semibold">
            <Link href="/login">{dict.common.login}</Link>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {dict.auth.termsNote}{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            {dict.auth.terms}
          </Link>{" "}
          {dict.auth.and}{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            {dict.auth.privacy}
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
