import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Header, type HeaderViewer } from "@/components/Header"
import { I18nProvider } from "@/components/I18nProvider"
import { getI18n } from "@/lib/i18n-server"
import { htmlLang } from "@/lib/i18n"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "MoneyPrint Video Gen",
    template: "%s | MoneyPrint"
  },
  description: "AI-powered short-form video generation for YouTube Shorts, TikTok, and Instagram Reels. Create professional faceless videos in minutes.",
  keywords: ["AI video", "video generation", "YouTube Shorts", "TikTok", "Instagram Reels", "faceless videos", "content creation"],
  authors: [{ name: "MoneyPrint" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MoneyPrint Video Gen",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0d14",
  width: "device-width",
  initialScale: 1,
}

async function getHeaderViewer(): Promise<HeaderViewer | null> {
  try {
    const { user } = await getAuthenticatedUser()
    if (!user) {
      return null
    }

    const admin = getSupabaseAdmin()
    const [{ data: profile }, { data: balance }] = await Promise.all([
      admin.from("profiles").select("full_name,email").eq("id", user.id).single(),
      admin.from("credit_balances").select("balance").eq("user_id", user.id).single(),
    ])

    const email = user.email || profile?.email || ""
    const name = profile?.full_name || user.user_metadata?.full_name || email.split("@")[0] || "Creator"

    return {
      name,
      email,
      initials: initialsForName(name || email),
      credits: balance?.balance ?? 0,
    }
  } catch {
    return null
  }
}

function initialsForName(value: string): string {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  return initials || "MP"
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getI18n()
  const viewer = await getHeaderViewer()

  return (
    <html lang={htmlLang(locale)} className={`${inter.variable} bg-background`}>
      <body className="min-h-screen font-sans antialiased">
        <I18nProvider locale={locale} dict={dict}>
          <div className="relative flex min-h-screen flex-col">
            <Header viewer={viewer} />
            <main className="flex-1">{children}</main>
          </div>
        </I18nProvider>
      </body>
    </html>
  )
}
