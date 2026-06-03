import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Header } from "@/components/Header"
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} bg-background`}>
      <body className="min-h-screen font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  )
}
