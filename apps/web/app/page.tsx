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
import { getI18n } from "@/lib/i18n-server"

const featureIcons = [Sparkles, Mic, Image, Download, Activity, Layers]
const benefitIcons = [Clock, Shield, Zap, CheckCircle]

export default async function HomePage() {
  const { dict } = await getI18n()
  const features = dict.home.features.map(([title, description], index) => ({
    title,
    description,
    icon: featureIcons[index] ?? Sparkles,
  }))
  const steps = dict.home.steps.map(([number, title, description]) => ({ number, title, description }))
  const benefits = dict.home.benefits.map((text, index) => ({
    text,
    icon: benefitIcons[index] ?? CheckCircle,
  }))
  const faqs = dict.home.faqs.map(([question, answer]) => ({ question, answer }))

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
              {dict.home.badge}
            </Badge>
            
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {dict.home.titleA}{" "}
              {dict.home.titleB && <span className="text-gradient">{dict.home.titleB}</span>}
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              {dict.home.subtitle}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="xl" asChild>
                <Link href="/signup">
                  {dict.home.primaryCta}
                  <ArrowRight />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="#how-it-works">
                  <Play className="size-4" />
                  {dict.home.secondaryCta}
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {dict.home.note}
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
                  <p className="text-lg font-medium text-muted-foreground">{dict.home.preview}</p>
                </div>
              </div>
            </div>
            {/* Floating elements */}
            <div className="absolute -left-4 top-1/4 hidden animate-pulse-glow rounded-lg border border-primary/20 bg-card p-3 shadow-lg lg:block">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-5 text-primary" />
                <span className="text-sm font-medium">{dict.home.jobCreated}</span>
              </div>
            </div>
            <div className="absolute -right-4 top-1/2 hidden animate-pulse-glow rounded-lg border border-primary/20 bg-card p-3 shadow-lg lg:block" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center gap-2">
                <Activity className="size-5 text-primary" />
                <span className="text-sm font-medium">{dict.home.worker}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">{dict.home.featuresBadge}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {dict.home.featuresTitle}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {dict.home.featuresSubtitle}
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
            <Badge variant="secondary" className="mb-4">{dict.home.howBadge}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {dict.home.howTitle}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {dict.home.howSubtitle}
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
                {dict.home.tryNow}
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
              <Badge variant="secondary" className="mb-4">{dict.home.whyBadge}</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {dict.home.whyTitle}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {dict.home.whySubtitle}
              </p>

              <ul className="mt-8 space-y-4">
                {benefits.map((item) => (
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
                    {dict.header.pricing}
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
                  <p className="text-sm text-muted-foreground">{dict.common.videos}</p>
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
            <Badge variant="secondary" className="mb-4">{dict.home.faqBadge}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {dict.home.faqTitle}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {dict.home.featuresSubtitle}
            </p>
          </div>

          <Accordion type="single" collapsible className="mt-12">
            {faqs.map((faq, index) => (
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
                {dict.home.finalTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                {dict.home.finalSubtitle}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="xl" asChild>
                  <Link href="/signup">
                    {dict.home.primaryCta}
                    <ArrowRight />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="/pricing">{dict.header.pricing}</Link>
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
              <Link href="/pricing" className="transition-colors hover:text-foreground">{dict.header.pricing}</Link>
              <Link href="#features" className="transition-colors hover:text-foreground">{dict.header.features}</Link>
              <Link href="#faq" className="transition-colors hover:text-foreground">{dict.header.faq}</Link>
              <Link href="/login" className="transition-colors hover:text-foreground">{dict.common.login}</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} MoneyPrint.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
