import Link from "next/link"
import type { Metadata } from "next"
import { AuthForm } from "@/components/AuthForm"
import { Button } from "@/components/ui/button"
import { getI18n } from "@/lib/i18n-server"

export const metadata: Metadata = {
  title: "Log In",
  description: "Sign in to your MoneyPrint account",
}

export default async function LoginPage() {
  const { dict } = await getI18n()

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <AuthForm mode="login" />
        
        <div className="text-center text-sm text-muted-foreground">
          {dict.auth.noAccount}{" "}
          <Button variant="link" asChild className="h-auto p-0 font-semibold">
            <Link href="/signup">{dict.common.signup}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
