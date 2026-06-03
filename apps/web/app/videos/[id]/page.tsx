import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Clock, Play, FileText, Captions, Info, Copy as CopyIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/StatusBadge"
import { ProgressTimeline } from "@/components/ProgressTimeline"
import { VideoDetailActions } from "@/components/VideoDetailActions"
import { formatDateTime, formatDuration } from "@/lib/utils"
import type { Video } from "@/lib/types"
import { createSignedOutputUrl, readStorageText } from "@/lib/jobs"
import { mapJobEventRows, mapVideoJobRow } from "@/lib/video-jobs"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Video Details",
  description: "View video generation details and download",
}

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let userId: string | null = null
  try {
    const { user } = await getAuthenticatedUser()
    userId = user?.id ?? null
  } catch {
    userId = null
  }

  if (!userId) {
    return <AuthRequired />
  }

  const admin = getSupabaseAdmin()
  const [{ data: job, error }, { data: eventRows }] = await Promise.all([
    admin
      .from("video_jobs")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single(),
    admin
      .from("job_events")
      .select("*")
      .eq("job_id", id)
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ])

  if (error || !job) {
    return <VideoNotFound />
  }

  const video: Video = mapVideoJobRow(job, userId, mapJobEventRows(eventRows ?? []))
  const [outputUrl, script, subtitles] = await Promise.all([
    createSignedOutputUrl(job.output_path),
    readStorageText(job.script_path),
    readStorageText(job.subtitles_path),
  ])

  video.script = script ?? undefined
  video.subtitles = subtitles ?? undefined

  const isCompleted = video.status === "completed"
  const isProcessing = video.status === "processing"
  const isFailed = video.status === "failed"
  const events = video.events ?? []

  const metadataRows: Array<{ label: string; value: string }> = [
    { label: "Job ID", value: video.id },
    { label: "Status", value: video.status },
    { label: "Language", value: video.language ?? "English" },
    { label: "Aspect Ratio", value: video.aspectRatio === "16:9" ? "16:9 (Horizontal)" : "9:16 (Vertical)" },
    { label: "Target Duration", value: `${video.duration ?? 30} seconds` },
    { label: "Voice", value: video.voice ?? "Female Voice" },
    { label: "Subtitle Style", value: video.subtitleStyle ?? "Clean" },
    { label: "Music", value: video.musicStyle ?? "None" },
    { label: "Variants", value: String(video.variants ?? 1) },
    { label: "Credits Used", value: `${video.creditCost ?? 1} credit${(video.creditCost ?? 1) === 1 ? "" : "s"}` },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/videos">
            <ArrowLeft className="size-4" />
            Back to Videos
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Main content */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="mb-2 flex items-center gap-3">
              <StatusBadge status={video.status} />
              {video.duration && (
                <Badge variant="secondary">
                  <Clock className="mr-1 size-3" />
                  {formatDuration(video.duration)}
                </Badge>
              )}
              {video.aspectRatio && <Badge variant="secondary">{video.aspectRatio}</Badge>}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{video.prompt}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Created {formatDateTime(video.createdAt)}
              {video.completedAt && ` • Completed ${formatDateTime(video.completedAt)}`}
            </p>
          </div>

          {/* Error message */}
          {isFailed && video.error && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="p-4">
                <p className="text-sm text-destructive">{video.error}</p>
              </CardContent>
            </Card>
          )}

          {/* Live progress bar for in-flight jobs */}
          {isProcessing && (
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{video.currentStep || "Processing..."}</span>
                  <span className="text-muted-foreground">{video.progress}%</span>
                </div>
                <Progress value={video.progress} className="h-2" />
              </CardContent>
            </Card>
          )}

          {/* Job event timeline */}
          {events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Timeline</CardTitle>
                <CardDescription>Every step of the generation pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressTimeline events={events} />
              </CardContent>
            </Card>
          )}

          {/* Script / Subtitles / Metadata tabs */}
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="script">
                <TabsList>
                  <TabsTrigger value="script">
                    <FileText className="size-4" />
                    Script
                  </TabsTrigger>
                  <TabsTrigger value="subtitles">
                    <Captions className="size-4" />
                    Subtitles
                  </TabsTrigger>
                  <TabsTrigger value="metadata">
                    <Info className="size-4" />
                    Metadata
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="script">
                  {video.script ? (
                    <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-sm leading-relaxed">
                      {video.script}
                    </pre>
                  ) : (
                    <TabEmpty message="Script will appear here once it has been generated." />
                  )}
                </TabsContent>

                <TabsContent value="subtitles">
                  {video.subtitles ? (
                    <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed">
                      {video.subtitles}
                    </pre>
                  ) : (
                    <TabEmpty message="Subtitles (.srt) will appear here once generated." />
                  )}
                </TabsContent>

                <TabsContent value="metadata">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {metadataRows.map((row) => (
                      <div key={row.label}>
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {row.label}
                        </dt>
                        <dd className="mt-1 break-words font-mono text-sm">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Actions */}
          <VideoDetailActions video={video} outputUrl={outputUrl} />
        </div>

        {/* Video preview */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <div className="aspect-[9/16] bg-gradient-to-br from-muted to-muted/50">
              {isCompleted && outputUrl ? (
                <video controls src={outputUrl} className="size-full object-cover" poster={video.thumbnailUrl} />
              ) : (
                <div className="flex size-full flex-col items-center justify-center p-6 text-center">
                  {isProcessing ? (
                    <>
                      <div className="mb-4 size-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      <p className="text-sm font-medium">{video.currentStep || "Generating..."}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{video.progress}% complete</p>
                    </>
                  ) : isFailed ? (
                    <>
                      <div className="mb-4 rounded-full bg-destructive/10 p-4">
                        <CopyIcon className="size-8 text-destructive" />
                      </div>
                      <p className="text-sm font-medium text-destructive">Generation Failed</p>
                      <p className="mt-1 text-xs text-muted-foreground">Retry to run this job again</p>
                    </>
                  ) : isCompleted ? (
                    <>
                      <div className="mb-4 rounded-full bg-primary/10 p-4">
                        <Play className="size-8 text-primary" />
                      </div>
                      <p className="text-sm font-medium">Preview unavailable</p>
                      <p className="mt-1 text-xs text-muted-foreground">Download the file to watch it</p>
                    </>
                  ) : (
                    <>
                      <div className="mb-4 rounded-full bg-muted p-4">
                        <Clock className="size-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">Waiting in Queue</p>
                      <p className="mt-1 text-xs text-muted-foreground">Your video will start processing soon</p>
                    </>
                  )}
                </div>
              )}
            </div>
            {isCompleted && (
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {video.duration ? formatDuration(video.duration) : "0:30"}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">1080p</span>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function TabEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function AuthRequired() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Clock className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">Sign in to view this video</CardTitle>
          <CardDescription className="mb-6">
            Video jobs and outputs are private to the account that created them.
          </CardDescription>
          <Button asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function VideoNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Info className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">Video job not found</CardTitle>
          <CardDescription className="mb-6">
            This job either does not exist or belongs to another account.
          </CardDescription>
          <Button variant="outline" asChild>
            <Link href="/videos">
              <ArrowLeft className="size-4" />
              Back to Videos
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
