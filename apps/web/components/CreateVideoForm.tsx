"use client"

import { calculateCreditCost } from "@moneyprint/shared"
import { Loader2, Sparkles, Wand2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { interpolate } from "@/lib/i18n"
import { useI18n } from "@/components/I18nProvider"

type CreateResponse = {
  jobId?: string
  error?: string
}

const voiceOptions = [
  { value: "en-US-JennyNeural-Female" },
  { value: "en-US-GuyNeural-Male" },
  { value: "en-US-AriaNeural-Female" },
]

const subtitleOptions = [
  { value: "bold" },
  { value: "clean" },
]

const musicOptions = [
  { value: "none" },
]

function supportedValue(options: Array<{ value: string }>, value: string | null, fallback: string) {
  return value && options.some((option) => option.value === value) ? value : fallback
}

export function CreateVideoForm() {
  const { dict } = useI18n()
  const searchParams = useSearchParams()
  const [topic, setTopic] = useState(() => searchParams.get("topic") || "")
  const [prompt, setPrompt] = useState("")
  const [durationSeconds, setDurationSeconds] = useState<"30" | "60">(() =>
    searchParams.get("duration") === "60" ? "60" : "30"
  )
  const [voiceId, setVoiceId] = useState(() =>
    supportedValue(voiceOptions, searchParams.get("voice"), "en-US-JennyNeural-Female")
  )
  const [subtitleStyle, setSubtitleStyle] = useState(() =>
    supportedValue(subtitleOptions, searchParams.get("subtitle"), "bold")
  )
  const [musicStyle, setMusicStyle] = useState(() =>
    supportedValue(musicOptions, searchParams.get("music"), "none")
  )
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const creditCost = useMemo(
    () => calculateCreditCost(Number(durationSeconds), 1),
    [durationSeconds]
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    const response = await fetch("/api/videos/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        prompt,
        language: "en",
        aspectRatio: "9:16",
        durationSeconds: Number(durationSeconds),
        voiceId,
        subtitleStyle,
        musicStyle,
        variants: 1,
      }),
    })
    const payload = (await response.json()) as CreateResponse
    setIsSubmitting(false)

    if (!response.ok || !payload.jobId) {
      setMessage(payload.error || dict.create.createError)
      return
    }

    window.location.href = `/videos/${payload.jobId}`
  }

  const handleSuggestionClick = (suggestion: string) => {
    setTopic(suggestion)
  }
  const creditCostLabel = interpolate(creditCost === 1 ? dict.create.oneCredit : dict.create.manyCredits, {
    count: creditCost,
  })

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          {dict.create.formTitle}
        </CardTitle>
        <CardDescription>
          {dict.create.formDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic input */}
          <div className="space-y-2">
            <Label htmlFor="topic">{dict.create.topic}</Label>
            <Input
              id="topic"
              placeholder={dict.create.topicPlaceholder}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              minLength={3}
              maxLength={240}
              required
            />
          </div>

          {/* Quick suggestions */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">{dict.create.suggestions}</Label>
            <div className="flex flex-wrap gap-2">
              {dict.create.suggestionsList.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {suggestion.length > 35 ? suggestion.substring(0, 35) + "..." : suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Direction textarea */}
          <div className="space-y-2">
            <Label htmlFor="prompt">{dict.create.direction}</Label>
            <Textarea
              id="prompt"
              placeholder={dict.create.directionPlaceholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={2000}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {dict.create.directionHelp}
            </p>
          </div>

          {/* Duration and Voice row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duration">{dict.create.duration}</Label>
              <Select value={durationSeconds} onValueChange={(v) => setDurationSeconds(v as "30" | "60")}>
                <SelectTrigger id="duration">
                  <SelectValue placeholder={dict.create.selectDuration} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">{dict.create.seconds30}</SelectItem>
                  <SelectItem value="60">{dict.create.seconds60}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice">{dict.create.voice}</Label>
              <Select value={voiceId} onValueChange={setVoiceId}>
                <SelectTrigger id="voice">
                  <SelectValue placeholder={dict.create.selectVoice} />
                </SelectTrigger>
                <SelectContent>
                  {voiceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {dict.create.voices[option.value as keyof typeof dict.create.voices] ?? option.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subtitles and Music row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subtitles">{dict.create.subtitleStyle}</Label>
              <Select value={subtitleStyle} onValueChange={setSubtitleStyle}>
                <SelectTrigger id="subtitles">
                  <SelectValue placeholder={dict.create.selectStyle} />
                </SelectTrigger>
                <SelectContent>
                  {subtitleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.value === "bold" ? dict.create.boldCaptions : dict.create.cleanLowerThird}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="music">{dict.create.music}</Label>
              <Select value={musicStyle} onValueChange={setMusicStyle}>
                <SelectTrigger id="music">
                  <SelectValue placeholder={dict.create.selectMusic} />
                </SelectTrigger>
                <SelectContent>
                  {musicOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {dict.create.noMusic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Credit cost notice */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">
              {interpolate(dict.create.creditNotice, {
                credits: creditCostLabel,
              })}
            </p>
          </div>

          {/* Error message */}
          {message && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {message}
            </div>
          )}

          {/* Submit button */}
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !topic.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                {dict.create.creating}
              </>
            ) : (
              <>
                <Wand2 />
                {dict.create.queue}
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {dict.create.generationNote}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
