"use client"

import { calculateCreditCost } from "@moneyprint/shared"
import { Loader2, Sparkles, Wand2 } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type CreateResponse = {
  jobId?: string
  error?: string
}

const voiceOptions = [
  { value: "en-US-JennyNeural-Female", label: "Jenny - Natural Female" },
  { value: "en-US-GuyNeural-Male", label: "Guy - Clear Male" },
  { value: "en-US-AriaNeural-Female", label: "Aria - Energetic Female" },
]

const subtitleOptions = [
  { value: "bold", label: "Bold Captions" },
  { value: "clean", label: "Clean Lower Third" },
]

const musicOptions = [
  { value: "none", label: "No Music" },
  { value: "licensed_pack_1", label: "Licensed Pack 1" },
]

const promptSuggestions = [
  "Top 5 AI tools that will change your workflow",
  "Why remote work is the future of productivity",
  "3 morning habits of successful entrepreneurs",
]

export function CreateVideoForm() {
  const [topic, setTopic] = useState("")
  const [prompt, setPrompt] = useState("")
  const [durationSeconds, setDurationSeconds] = useState<"30" | "60">("30")
  const [voiceId, setVoiceId] = useState("en-US-JennyNeural-Female")
  const [subtitleStyle, setSubtitleStyle] = useState("bold")
  const [musicStyle, setMusicStyle] = useState("none")
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
      setMessage(payload.error || "Could not create the video job.")
      return
    }

    window.location.href = `/videos/${payload.jobId}`
  }

  const handleSuggestionClick = (suggestion: string) => {
    setTopic(suggestion)
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          Create New Video
        </CardTitle>
        <CardDescription>
          Describe your video idea and our AI will generate a complete short-form video for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic input */}
          <div className="space-y-2">
            <Label htmlFor="topic">Video Topic</Label>
            <Input
              id="topic"
              placeholder="Example: Three money habits that compound quietly"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              minLength={3}
              maxLength={240}
              required
            />
          </div>

          {/* Quick suggestions */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Quick suggestions</Label>
            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((suggestion, index) => (
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
            <Label htmlFor="prompt">Direction (Optional)</Label>
            <Textarea
              id="prompt"
              placeholder="Optional tone, audience, hook, or must-include points..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={2000}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Add specific instructions for tone, target audience, or key points to include.
            </p>
          </div>

          {/* Duration and Voice row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={durationSeconds} onValueChange={(v) => setDurationSeconds(v as "30" | "60")}>
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice">Voice</Label>
              <Select value={voiceId} onValueChange={setVoiceId}>
                <SelectTrigger id="voice">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voiceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subtitles and Music row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subtitles">Subtitle Style</Label>
              <Select value={subtitleStyle} onValueChange={setSubtitleStyle}>
                <SelectTrigger id="subtitles">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {subtitleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="music">Background Music</Label>
              <Select value={musicStyle} onValueChange={setMusicStyle}>
                <SelectTrigger id="music">
                  <SelectValue placeholder="Select music" />
                </SelectTrigger>
                <SelectContent>
                  {musicOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Credit cost notice */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">
              This will create one English 9:16 video and costs{" "}
              <span className="font-semibold text-primary">
                {creditCost} credit{creditCost === 1 ? "" : "s"}
              </span>
              .
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
                Creating Video...
              </>
            ) : (
              <>
                <Wand2 />
                Queue Video
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Generation typically takes 5-15 minutes. You&apos;ll be notified when complete.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
