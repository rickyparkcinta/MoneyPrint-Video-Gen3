import Link from "next/link"
import type { Metadata } from "next"
import { Film, Wallet, Workflow, Plus, ArrowRight, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "@/components/StatusBadge"
import { VideoCard } from "@/components/VideoCard"
import { formatDate } from "@/lib/utils"
import { mockUser, mockVideos } from "@/lib/mock-data"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your credits, jobs, and generated videos",
}

export default async function DashboardPage() {
  // Try to get real data, fall back to mock
  let credits = mockUser.credits
  let jobs: Array<{
    id: string
    topic: string
    status: string
    credit_cost: number
    created_at: string
  }> = []
  let isAuthenticated = false

  try {
    const { user } = await getAuthenticatedUser()
    if (user) {
      isAuthenticated = true
      const admin = getSupabaseAdmin()
      const [{ data: balance }, { data: realJobs }] = await Promise.all([
        admin.from("credit_balances").select("balance").eq("user_id", user.id).single(),
        admin
          .from("video_jobs")
          .select("id,topic,status,credit_cost,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6),
      ])
      credits = balance?.balance ?? mockUser.credits
      jobs = realJobs || []
    }
  } catch {
    // Use mock data if Supabase is not configured
  }

  // Use mock videos for the grid if no real jobs
  const recentVideos = mockVideos.slice(0, 4)
  const completedCount = mockVideos.filter((v) => v.status === "completed").length
  const activeCount = mockVideos.filter((v) => v.status === "processing" || v.status === "queued").length

  // Calculate credit usage percentage (assuming 100 credits max for visualization)
  const maxCredits = 100
  const creditUsagePercent = Math.min((credits / maxCredits) * 100, 100)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {mockUser.name.split(" ")[0]}
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
              <span className="text-3xl font-bold capitalize">{mockUser.plan}</span>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recentVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
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
              {(jobs.length > 0 ? jobs : mockVideos.slice(0, 5)).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/videos/${item.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {"topic" in item ? item.topic : item.prompt}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status as "queued" | "processing" | "completed" | "failed"} />
                  </TableCell>
                  <TableCell>{"credit_cost" in item ? item.credit_cost : 1}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate("created_at" in item ? item.created_at : item.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
