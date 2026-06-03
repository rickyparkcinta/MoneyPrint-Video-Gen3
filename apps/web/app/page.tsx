import Link from "next/link"
import { 
  ArrowRight, 
  Sparkles, 
  Mic, 
  Image, 
  Download, 
  Activity, 
  Layers,
  Play,
  Zap,
  Clock,
  Shield,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { mockFAQs } from "@/lib/mock-data"

const features = [
  {
    title: "AI Script Generation",
    description: "Transform your ideas into engaging scripts with our advanced AI. Just describe your topic and watch the magic happen.",
    icon: Sparkles,
  },
  {
    title: "Natural Voice Synthesis",
    description: "Choose from dozens of realistic AI voices in multiple languages and accents. Your videos sound professional, every time.",
    icon: Mic,
  },
  {
    title: "Dynamic Visuals",
    description: "Our AI generates relevant, eye-catching visuals that perfectly match your content and keep viewers engaged.",
    icon: Image,
  },
  {
    title: "One-Click Export",
    description: "Export directly to YouTube Shorts, TikTok, or Instagram Reels format. Optimized for each platform automatically.",
    icon: Download,
  },
  {
    title: "Real-Time Progress",
    description: "Track every step of your video generation with live updates. Know exactly when your content will be ready.",
    icon: Activity,
  },
  {
    title: "Batch Processing",
    description: "Queue multiple videos at once and let our system work while you focus on other things. Perfect for content calendars.",
    icon: Layers,
  },
]

const steps = [
  {
    number: "01",
    title: "Enter Your Idea",
    description: "Describe your video topic in a few words. Add optional directions for tone, style, or specific points to cover.",
  },
  {
    number: "02",
    title: "AI Does the Work",
    description: "Our AI writes the script, generates visuals, synthesizes voice, and assembles everything into a polished video.",
  },
  {
    number: "03",
    title: "Download & Share",
    description: "Get your video in minutes. Download in the perfect format for YouTube Shorts, TikTok, or Instagram Reels.",
  },
]

const stats = [
  { value: "50K+", label: "Videos Created" },
  { value: "5min", label: "Avg. Generation Time" },
  { value: "4.9/5", label: "User Rating" },
  { value: "99.9%", label: "Uptime" },
]

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50 pb-20 pt-16 lg:pb-32 lg:pt-24">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6">
              <Zap className="mr-1 size-3" />
              Powered by Advanced AI
            </Badge>
            
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Create Viral Short Videos{" "}
              <span className="text-gradient">in Minutes</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Transform your ideas into professional faceless videos for YouTube Shorts, TikTok, and Instagram Reels. 
              No editing skills required — just describe your topic and let AI do the rest.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="xl" asChild>
                <Link href="/signup">
                  Start Creating Free
                  <ArrowRight />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="#how-it-works">
                  <Play className="size-4" />
                  See How It Works
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required. 3 free videos to start.
            </p>
          </div>

          {/* Video preview mockup */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="aspect-video overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10">
                    <Play className="size-10 text-primary" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">Video Preview Demo</p>
                </div>
              </div>
            </div>
            {/* Floating elements */}
            <div className="absolute -left-4 top-1/4 hidden animate-pulse-glow rounded-lg border border-primary/20 bg-card p-3 shadow-lg lg:block">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-5 text-primary" />
                <span className="text-sm font-medium">Script Generated</span>
              </div>
            </div>
            <div className="absolute -right-4 top-1/2 hidden animate-pulse-glow rounded-lg border border-primary/20 bg-card p-3 shadow-lg lg:block" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center gap-2">
                <Activity className="size-5 text-primary" />
                <span className="text-sm font-medium">Rendering 78%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary lg:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Create Amazing Videos
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our AI handles every step of video creation so you can focus on growing your audience.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="group relative overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="size-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-y border-border/50 bg-muted/30 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three Simple Steps to Your Video
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From idea to published content in minutes, not hours.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-0.5 w-full -translate-x-1/2 bg-gradient-to-r from-primary/50 to-transparent lg:block" />
                )}
                <div className="relative rounded-xl border border-border bg-card p-8 text-center">
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                    {step.number}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link href="/create">
                Try It Now
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="secondary" className="mb-4">Why MoneyPrint</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Built for Creators Who Value Their Time
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Stop spending hours editing. Our AI creates professional videos that engage viewers and grow your channel.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  { icon: Clock, text: "Save 10+ hours per video compared to manual editing" },
                  { icon: Shield, text: "100% commercial rights to all generated content" },
                  { icon: Zap, text: "Priority queue for faster generation times" },
                  { icon: CheckCircle, text: "Automatic refunds if generation fails" },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <item.icon className="size-3.5 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button size="lg" asChild>
                  <Link href="/pricing">
                    View Pricing
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl border border-border bg-gradient-to-br from-muted to-muted/50 p-8">
                <div className="flex h-full flex-col items-center justify-center gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-[9/16] w-24 rounded-lg bg-card shadow-lg" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Your video library grows fast</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="border-t border-border/50 bg-muted/30 py-20 lg:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to know about MoneyPrint Video Gen.
            </p>
          </div>

          <Accordion type="single" collapsible className="mt-12">
            {mockFAQs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-8 text-center lg:p-16">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Create Your First Video?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Join thousands of creators using MoneyPrint to grow their channels. Start with 3 free videos today.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="xl" asChild>
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-black text-primary-foreground text-sm">
                M
              </div>
              <span className="font-semibold">MoneyPrint Video Gen</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
              <Link href="#features" className="transition-colors hover:text-foreground">Features</Link>
              <Link href="#faq" className="transition-colors hover:text-foreground">FAQ</Link>
              <Link href="/login" className="transition-colors hover:text-foreground">Log in</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} MoneyPrint. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
