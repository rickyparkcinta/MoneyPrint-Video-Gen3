import type { Metadata } from "next"
import Link from "next/link"
import { Plus, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VideoCard } from "@/components/VideoCard"
import { StatusBadge } from "@/components/StatusBadge"
import { mapVideoJobRow } from "@/lib/video-jobs"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"
import type { Video as VideoRecord } from "@/lib/types"

export const metadata: Metadata = {
  title: "Videos",
  description: "View and manage all your generated videos",
}

export default async function VideosPage() {
  let videos: VideoRecord[] = []
  let isAuthenticated = false

  try {
    const { user } = await getAuthenticatedUser()
    if (user) {
      isAuthenticated = true
      const { data: jobs } = await getSupabaseAdmin()
        .from("video_jobs")
        .select("id,user_id,topic,status,progress,credit_cost,duration_seconds,aspect_ratio,created_at,completed_at,error_message")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (jobs && jobs.length > 0) {
        videos = jobs.map((job) => mapVideoJobRow(job, user.id))
      }
    }
  } catch {
    videos = []
  }

  if (!isAuthenticated) {
    return <AuthRequired />
  }

  // Filter videos by status
  const allVideos = videos
  const processingVideos = videos.filter((v) => v.status === "processing" || v.status === "queued")
  const completedVideos = videos.filter((v) => v.status === "completed")
  const failedVideos = videos.filter((v) => v.status === "failed")

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your Videos</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage all your generated videos
          </p>
        </div>
        <Button size="lg" asChild>
          <Link href="/create">
            <Plus />
            Create Video
          </Link>
        </Button>
      </div>

      {/* Search and filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search videos..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="size-4" />
          Filters
        </Button>
      </div>

      {/* Status summary */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
          <span className="text-sm font-medium">{allVideos.length}</span>
          <span className="text-sm text-muted-foreground">Total</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
          <StatusBadge status="processing" showIcon={false} />
          <span className="text-sm">{processingVideos.length}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
          <StatusBadge status="completed" showIcon={false} />
          <span className="text-sm">{completedVideos.length}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
          <StatusBadge status="failed" showIcon={false} />
          <span className="text-sm">{failedVideos.length}</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({allVideos.length})</TabsTrigger>
          <TabsTrigger value="processing">In Progress ({processingVideos.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedVideos.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedVideos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {allVideos.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {allVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </TabsContent>

        <TabsContent value="processing">
          {processingVideos.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {processingVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <EmptyState message="No videos currently processing" />
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedVideos.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {completedVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <EmptyState message="No completed videos yet" />
          )}
        </TabsContent>

        <TabsContent value="failed">
          {failedVideos.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {failedVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <EmptyState message="No failed videos" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ message = "No videos found" }: { message?: string }) {
  return (
    <Card className="mt-8">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Plus className="size-8 text-muted-foreground" />
        </div>
        <CardTitle className="mb-2">{message}</CardTitle>
        <CardDescription className="mb-6">
          Create your first video to get started
        </CardDescription>
        <Button asChild>
          <Link href="/create">
            <Plus />
            Create Video
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function AuthRequired() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Plus className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">Sign in to view videos</CardTitle>
          <CardDescription className="mb-6">
            Your generated videos are stored in your account.
          </CardDescription>
          <Button asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
