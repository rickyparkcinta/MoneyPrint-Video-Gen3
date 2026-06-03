import type { Metadata } from "next"
import { ACTIVE_JOB_STATUSES } from "@moneyprint/shared"
import { Users, Film, AlertTriangle, Activity, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/StatCard"
import { AdminJobActions } from "@/components/AdminJobActions"
import { AdminCreditGrant } from "@/components/AdminCreditGrant"
import { formatDateTime } from "@/lib/utils"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Admin",
  description: "Operations dashboard for users, jobs, and platform health",
}

type FailedJob = {
  id: string
  userEmail: string
  topic: string
  error: string
  failedAt: string
}

type AdminUserRow = {
  id: string
  email: string | null
  full_name: string | null
  role: string
  credits: number
}

export default async function AdminPage() {
  let isAdmin = false

  try {
    const { user } = await getAuthenticatedUser()
    if (user) {
      const { data: profile } = await getSupabaseAdmin().from("profiles").select("role").eq("id", user.id).single()
      isAdmin = profile?.role === "admin"
    }
  } catch {
    isAdmin = false
  }

  if (!isAdmin) {
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

  const admin = getSupabaseAdmin()
  const activeStatuses = Array.from(ACTIVE_JOB_STATUSES)
  const [
    { count: totalUsers },
    { count: totalVideos },
    { count: activeJobs },
    { data: failedJobRows },
    { data: queuedRows },
    { data: recentProfiles },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("video_jobs").select("id", { count: "exact", head: true }),
    admin.from("video_jobs").select("id", { count: "exact", head: true }).in("status", activeStatuses),
    admin
      .from("video_jobs")
      .select("id,topic,status,user_id,created_at,error_message")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(25),
    admin
      .from("video_jobs")
      .select("id,status,created_at")
      .in("status", activeStatuses)
      .order("created_at", { ascending: true })
      .limit(500),
    admin
      .from("profiles")
      .select("id,email,full_name,role,created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  const profileIds = (recentProfiles ?? []).map((profile) => profile.id)
  const { data: balances } = profileIds.length > 0
    ? await admin.from("credit_balances").select("user_id,balance").in("user_id", profileIds)
    : { data: [] }
  const balanceByUser = new Map((balances ?? []).map((balance) => [balance.user_id, balance.balance ?? 0]))

  const users: AdminUserRow[] = (recentProfiles ?? []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
    credits: balanceByUser.get(profile.id) ?? 0,
  }))

  const failedJobs: FailedJob[] = (failedJobRows ?? []).map((job) => ({
    id: job.id,
    userEmail: job.user_id,
    topic: job.topic,
    error: job.error_message || "Unknown error",
    failedAt: job.created_at,
  }))
  const queuedCount = (queuedRows ?? []).filter((job) => job.status === "queued").length
  const processingCount = (queuedRows ?? []).length - queuedCount
  const oldestQueuedAt = queuedRows?.[0]?.created_at

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={(totalUsers ?? 0).toLocaleString()} icon={Users} />
        <StatCard label="Total Videos" value={(totalVideos ?? 0).toLocaleString()} icon={Film} />
        <StatCard label="Active Jobs" value={(activeJobs ?? 0).toLocaleString()} icon={Activity} />
        <StatCard label="Failed Jobs" value={failedJobs.length} icon={AlertTriangle} hint="Most recent failed jobs" />
      </div>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4 text-primary" />
            Queue Health
          </CardTitle>
          <Badge variant={queuedCount > 50 ? "warning" : "success"}>
            {queuedCount > 50 ? "Backed up" : "Nominal"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <div className="text-2xl font-bold">{queuedCount}</div>
              <p className="text-xs text-muted-foreground">Queued</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{processingCount}</div>
              <p className="text-xs text-muted-foreground">Processing</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{activeJobs ?? 0}</div>
              <p className="text-xs text-muted-foreground">Active total</p>
            </div>
          </div>
          {oldestQueuedAt && (
            <p className="mt-4 text-xs text-muted-foreground">
              Oldest active job since {formatDateTime(oldestQueuedAt)}
            </p>
          )}
        </CardContent>
      </Card>

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
            <p className="py-8 text-center text-sm text-muted-foreground">No failed jobs right now.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <AdminCreditGrant />

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Recent accounts and their credit balances</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.full_name || "Unnamed user"}</div>
                        <div className="text-xs text-muted-foreground">{user.email || user.id}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{user.credits}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
