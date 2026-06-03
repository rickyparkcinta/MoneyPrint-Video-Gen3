import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoneyPrint Video Gen",
  description: "Paid AI short-video generation built around MoneyPrinterTurbo."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link className="brand" href="/">
              <span className="brand-mark">M</span>
              <span>MoneyPrint</span>
            </Link>
            <nav className="nav" aria-label="Main navigation">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/create">Create</Link>
              <Link href="/videos">Videos</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/billing">Billing</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </header>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
