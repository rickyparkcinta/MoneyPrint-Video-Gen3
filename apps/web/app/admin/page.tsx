import type { Metadata } from "next"
import { Users, Film, AlertTriangle, DollarSign, Activity, Server, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { StatCard } from "@/components/StatCard"
import { AdminJobActions } from "@/components/AdminJobActions"
import { AdminCreditGrant } from "@/components/AdminCreditGrant"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import {
  mockAdminStats,
  mockFailedJobs,
  mockQueueHealth,
  mockWorkerHealth,
  mockAdminUsers,
} from "@/lib/mock-data"
import type { FailedJob, WorkerHealth } from "@/lib/types"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Admin",
  description: "Operations dashboard for users, jobs, and platform health",
}

const workerStatusVariant: Record<WorkerHealth["status"], "success" | "warning" | "destructive"> = {
  healthy: "success",
  degraded: "warning",
  down: "destructive",
}

export default async function AdminPage() {
  // When Supabase is configured we enforce the admin role; when it isn't
  // (local/preview), we render the full mockup so the UI stays reviewable.
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  let isAdmin = false
  let failedJobs: FailedJob[] = mockFailedJobs

  if (supabaseConfigured) {
    try {
      const { user } = await getAuthenticatedUser()
      if (user) {
        const admin = getSupabaseAdmin()
        const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
        isAdmin = profile?.role === "admin"

        if (isAdmin) {
          const { data: jobs } = await admin
            .from("video_jobs")
            .select("id,topic,status,user_id,created_at,error_message")
            .eq("status", "failed")
            .order("created_at", { ascending: false })
            .limit(25)

          if (jobs && jobs.length > 0) {
            failedJobs = jobs.map((job) => ({
              id: job.id,
              userEmail: job.user_id,
              topic: job.topic,
              error: job.error_message || "Unknown error",
              failedAt: job.created_at,
            }))
          }
        }
      }
    } catch {
      // Treat config/auth errors as not-admin for safety.
      isAdmin = false
    }
  }

  if (supabaseConfigured && !isAdmin) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-4">
          <ShieldAlert className="size-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Admin access required</h1>
        <p className="mt-2 text-muted-foreground">
          This dashboard is restricted to profiles with the <code className="font-mono">admin</code> role.
        </p>
      </div>
    )
  }

  const stats = mockAdminStats
  const queue = mockQueueHealth
  const worker = mockWorkerHealth
  const workerLoadPercent = Math.round((worker.activeWorkers / worker.maxWorkers) * 100)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin</h1>
            <Badge variant="info">Operations</Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            Platform health, failed renders, and account management.
          </p>
        </div>
      </div>

      {/* Top stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} icon={Users} change={stats.usersGrowth} />
        <StatCard label="Total Videos" value={stats.totalVideos.toLocaleString()} icon={Film} change={stats.videosGrowth} />
        <StatCard label="Failed Jobs (24h)" value={failedJobs.length} icon={AlertTriangle} hint="Across all users" />
        <StatCard label="Revenue (MTD)" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} change={stats.revenueGrowth} />
      </div>

      {/* Health */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        {/* Queue health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-primary" />
              Queue Health
            </CardTitle>
            <Badge variant={queue.queued > 50 ? "warning" : "success"}>
              {queue.queued > 50 ? "Backed up" : "Nominal"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">{queue.queued}</div>
                <p className="text-xs text-muted-foreground">Queued</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{queue.processing}</div>
                <p className="text-xs text-muted-foreground">Processing</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{queue.avgWaitSeconds}s</div>
                <p className="text-xs text-muted-foreground">Avg wait</p>
              </div>
            </div>
            {queue.oldestQueuedAt && (
              <p className="mt-4 text-xs text-muted-foreground">
                Oldest queued job since {formatDateTime(queue.oldestQueuedAt)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Worker health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="size-4 text-primary" />
              Worker Health
            </CardTitle>
            <Badge variant={workerStatusVariant[worker.status]} className="capitalize">
              {worker.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active workers</span>
              <span className="font-medium">
                {worker.activeWorkers} / {worker.maxWorkers}
              </span>
            </div>
            <Progress value={workerLoadPercent} className="h-1.5" />
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Region {worker.region}</span>
              <span>Heartbeat {formatDateTime(worker.lastHeartbeatAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent failed jobs */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Failed Jobs</CardTitle>
          <CardDescription>Retry, refund, or cancel failed renders</CardDescription>
        </CardHeader>
        <CardContent>
          {failedJobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.topic}</TableCell>
                    <TableCell className="text-muted-foreground">{job.userEmail}</TableCell>
                    <TableCell className="max-w-xs">
                      <span className="text-sm text-destructive">{job.error}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(job.failedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <AdminJobActions jobId={job.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No failed jobs right now. 🎉</p>
          )}
        </CardContent>
      </Card>

      {/* Credit adjustment + users */}
      <div className="grid gap-8 lg:grid-cols-2">
        <AdminCreditGrant />

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Recent accounts and their credit balances</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAdminUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {u.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{u.credits}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
