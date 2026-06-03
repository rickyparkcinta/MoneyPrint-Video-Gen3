import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Download, RefreshCw, Share2, Trash2, Clock, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/StatusBadge"
import { JobProgressSteps } from "@/components/JobProgressSteps"
import { formatDateTime, formatDuration } from "@/lib/utils"
import { mockVideos } from "@/lib/mock-data"
import { createSignedOutputUrl } from "@/lib/jobs"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Video Details",
  description: "View video generation details and download",
}

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Try to get real data, fall back to mock
  let video = mockVideos.find((v) => v.id === id) || mockVideos[0]
  let outputUrl: string | null = null

  try {
    const { user } = await getAuthenticatedUser()
    if (user) {
      const { data: job } = await getSupabaseAdmin()
        .from("video_jobs")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (job) {
        video = {
          id: job.id,
          userId: user.id,
          prompt: job.topic,
          status: job.status as "queued" | "processing" | "completed" | "failed",
          steps: [],
          progress: job.progress || 0,
          createdAt: job.created_at,
          completedAt: job.completed_at,
          error: job.error_message,
          duration: job.duration_seconds,
        }
        outputUrl = await createSignedOutputUrl(job.output_path)
      }
    }
  } catch {
    // Use mock data if Supabase is not configured
  }

  const isCompleted = video.status === "completed"
  const isProcessing = video.status === "processing"
  const isFailed = video.status === "failed"

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
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {video.prompt}
            </h1>
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

          {/* Progress steps */}
          {(isProcessing || video.steps.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generation Progress</CardTitle>
                <CardDescription>
                  Track each step of the video creation process
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isProcessing && (
                  <div className="mb-6">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">{video.currentStep || "Processing..."}</span>
                      <span className="text-muted-foreground">{video.progress}%</span>
                    </div>
                    <Progress value={video.progress} className="h-2" />
                  </div>
                )}
                <JobProgressSteps steps={video.steps} />
              </CardContent>
            </Card>
          )}

          {/* Job details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Job ID</dt>
                  <dd className="mt-1 font-mono text-sm">{video.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Credits Used</dt>
                  <dd className="mt-1 text-sm">1 credit</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Aspect Ratio</dt>
                  <dd className="mt-1 text-sm">9:16 (Vertical)</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Target Duration</dt>
                  <dd className="mt-1 text-sm">{video.duration || 30} seconds</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {isCompleted && (
              <>
                <Button asChild>
                  <a href={outputUrl || "#"} download>
                    <Download />
                    Download Video
                  </a>
                </Button>
                <Button variant="outline">
                  <Share2 />
                  Share
                </Button>
              </>
            )}
            {isFailed && (
              <Button>
                <RefreshCw />
                Retry Generation
              </Button>
            )}
            <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 />
              Delete
            </Button>
          </div>
        </div>

        {/* Video preview */}
        <div className="lg:sticky lg:top-24">
          <Card className="overflow-hidden">
            <div className="aspect-[9/16] bg-gradient-to-br from-muted to-muted/50">
              {isCompleted && outputUrl ? (
                <video
                  controls
                  src={outputUrl}
                  className="size-full object-cover"
                  poster={video.thumbnailUrl}
                />
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
                        <RefreshCw className="size-8 text-destructive" />
                      </div>
                      <p className="text-sm font-medium text-destructive">Generation Failed</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Click retry to try again
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mb-4 rounded-full bg-muted p-4">
                        <Clock className="size-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">Waiting in Queue</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Your video will start processing soon
                      </p>
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
