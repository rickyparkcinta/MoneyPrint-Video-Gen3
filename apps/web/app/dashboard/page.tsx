import Link from "next/link"
import type { Metadata } from "next"
import { Film, Wallet, Workflow, Plus, ArrowRight, TrendingUp, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "@/components/StatusBadge"
import { VideoCard } from "@/components/VideoCard"
import { formatDate } from "@/lib/utils"
import { BILLING_PLANS } from "@moneyprint/shared"
import { mapVideoJobRow, toUiJobStatus } from "@/lib/video-jobs"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"
import type { Video as VideoRecord } from "@/lib/types"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your credits, jobs, and generated videos",
}

export default async function DashboardPage() {
  let credits = 0
  let jobs: Array<{
    id: string
    topic: string
    status: string
    credit_cost: number
    created_at: string
  }> = []
  let recentVideos: VideoRecord[] = []
  let displayName = "Creator"
  let currentPlanName = "Free Trial"
  let isAuthenticated = false

  try {
    const { user } = await getAuthenticatedUser()
    if (user) {
      isAuthenticated = true
      const admin = getSupabaseAdmin()
      const [{ data: balance }, { data: realJobs }, { data: profile }, { data: subscriptions }] = await Promise.all([
        admin.from("credit_balances").select("balance").eq("user_id", user.id).single(),
        admin
          .from("video_jobs")
          .select("id,user_id,topic,status,progress,credit_cost,duration_seconds,aspect_ratio,created_at,completed_at,error_message")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6),
        admin.from("profiles").select("full_name,email").eq("id", user.id).single(),
        admin
          .from("subscriptions")
          .select("plan_id,status")
          .eq("user_id", user.id)
          .in("status", ["active", "trialing"])
          .order("created_at", { ascending: false })
          .limit(1),
      ])
      credits = balance?.balance ?? 0
      displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Creator"
      jobs = realJobs || []
      recentVideos = jobs.map((job) => mapVideoJobRow(job, user.id)).slice(0, 4)
      const activeSubscription = subscriptions?.[0]
      currentPlanName = BILLING_PLANS.find((plan) => plan.id === activeSubscription?.plan_id)?.name || "Free Trial"
    }
  } catch {
    isAuthenticated = false
  }

  if (!isAuthenticated) {
    return <AuthRequired />
  }

  const completedCount = jobs.filter((job) => toUiJobStatus(job.status) === "completed").length
  const activeCount = jobs.filter((job) => {
    const status = toUiJobStatus(job.status)
    return status === "processing" || status === "queued"
  }).length

  // Calculate credit usage percentage (assuming 100 credits max for visualization)
  const maxCredits = 100
  const creditUsagePercent = Math.min((credits / maxCredits) * 100, 100)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {displayName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here&apos;s what&apos;s happening with your videos today.
          </p>
        </div>
        <Button size="lg" asChild>
          <Link href="/create">
            <Plus />
            Create Video
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Credits
            </CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{credits}</div>
            <div className="mt-2">
              <Progress value={creditUsagePercent} className="h-1.5" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              <Link href="/pricing" className="text-primary hover:underline">
                Buy more credits
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Jobs
            </CardTitle>
            <Workflow className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCount}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {activeCount > 0 ? "Videos currently processing" : "No active jobs"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Videos
            </CardTitle>
            <Film className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedCount}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Total videos generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Plan
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{currentPlanName}</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              <Link href="/billing" className="text-primary hover:underline">
                Manage subscription
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent videos grid */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Videos</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/videos">
              View all
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
        {recentVideos.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Film className="size-8 text-muted-foreground" />
              </div>
              <CardTitle className="mb-2">No videos yet</CardTitle>
              <CardDescription className="mb-6">Create your first real render job to fill this dashboard.</CardDescription>
              <Button asChild>
                <Link href="/create">
                  <Plus />
                  Create Video
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent jobs table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest video generation jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/videos/${item.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {item.topic}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>{item.credit_cost}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(item.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {jobs.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AuthRequired() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-4 rounded-full bg-muted p-4">
            <LayoutDashboard className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">Sign in to view your dashboard</CardTitle>
          <CardDescription className="mb-6">
            Credits, jobs, and generated videos are tied to your account.
          </CardDescription>
          <Button asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
