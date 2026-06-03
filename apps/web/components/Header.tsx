"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  PlusCircle, 
  Video, 
  CreditCard, 
  Settings, 
  LogOut,
  Menu,
  X,
  Coins
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Create", href: "/create", icon: PlusCircle },
  { name: "Videos", href: "/videos", icon: Video },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
]

export type HeaderViewer = {
  name: string
  email: string
  initials: string
  credits: number
}

interface HeaderProps {
  viewer?: HeaderViewer | null
}

export function Header({ viewer }: HeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isLandingPage = pathname === "/"
  const isAuthPage = pathname === "/login" || pathname === "/signup"

  async function handleSignOut() {
    await createSupabaseBrowserClient().auth.signOut()
    window.location.href = "/"
  }

  if (isAuthPage) {
    return (
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary font-black text-primary-foreground">
              M
            </div>
            <span className="text-lg font-bold">MoneyPrint</span>
          </Link>
        </div>
      </header>
    )
  }

  if (isLandingPage) {
    return (
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary font-black text-primary-foreground">
              M
            </div>
            <span className="text-lg font-bold">MoneyPrint</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary font-black text-primary-foreground">
              M
            </div>
            <span className="hidden text-lg font-bold sm:inline">MoneyPrint</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-secondary text-foreground" 
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {viewer ? (
            <>
              <div className="hidden items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 sm:flex">
                <Coins className="size-4 text-primary" />
                <span className="text-sm font-semibold">{viewer.credits}</span>
                <span className="text-xs text-muted-foreground">credits</span>
              </div>

              <div className="flex items-center gap-2">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {viewer.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium lg:inline">{viewer.name}</span>
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="flex flex-col p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-secondary text-foreground" 
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                  {item.name}
                </Link>
              )
            })}
            {viewer ? (
              <>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
                  <Coins className="size-4 text-primary" />
                  <span className="text-sm font-semibold">{viewer.credits}</span>
                  <span className="text-xs text-muted-foreground">credits remaining</span>
                </div>
                <Button variant="ghost" className="mt-2 justify-start gap-3 text-muted-foreground" onClick={handleSignOut}>
                  <LogOut className="size-5" />
                  Sign out
                </Button>
              </>
            ) : (
              <div className="mt-4 grid gap-2">
                <Button variant="outline" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
