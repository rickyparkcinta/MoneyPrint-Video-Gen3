import type { Metadata } from "next"
import { ACTIVE_JOB_STATUSES } from "@moneyprint/shared"
import { Users, Film, AlertTriangle, Activity, ShieldAlert, Network, ReceiptText } from "lucide-react"
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

type ReferralRow = {
  referred_user_id: string
  referrer_user_id: string
  created_at: string
}

type ReferralRewardRow = {
  id: string
  payer_user_id: string
  earner_user_id: string
  level: number
  basis_credits: number
  granted_credits: number
  source: string
  created_at: string
}

type ProfileLabelRow = {
  id: string
  email: string | null
  full_name: string | null
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
    { count: totalReferrals },
    { data: referralRows },
    { data: referralRewardRows },
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
    admin.from("referrals").select("referred_user_id", { count: "exact", head: true }),
    admin
      .from("referrals")
      .select("referred_user_id,referrer_user_id,created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    admin
      .from("referral_rewards")
      .select("id,payer_user_id,earner_user_id,level,basis_credits,granted_credits,source,created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
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
  const referralStats = summarizeAdminReferrals(
    (referralRows ?? []) as ReferralRow[],
    (referralRewardRows ?? []) as ReferralRewardRow[]
  )
  const referralProfileIds = Array.from(new Set([
    ...referralStats.topReferrers.map((row) => row.userId),
    ...referralStats.recentRewards.flatMap((row) => [row.earner_user_id, row.payer_user_id]),
  ]))
  const { data: referralProfiles } = referralProfileIds.length > 0
    ? await admin.from("profiles").select("id,email,full_name").in("id", referralProfileIds)
    : { data: [] }
  const referralProfileById = new Map((referralProfiles ?? []).map((profile: ProfileLabelRow) => [profile.id, profile]))

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
        <StatCard label="Referral Links" value={(totalReferrals ?? 0).toLocaleString()} icon={Network} hint="Claimed sponsor relationships" />
        <StatCard label="Referral Credits" value={referralStats.totalCredits.toLocaleString()} icon={ReceiptText} hint="Credits granted to earners" />
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

      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Referral Tree Summary</CardTitle>
            <CardDescription>Top referrers by direct and downstream accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {referralStats.topReferrers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead className="text-right">Direct</TableHead>
                    <TableHead className="text-right">Tree</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralStats.topReferrers.map((row) => (
                    <TableRow key={row.userId}>
                      <TableCell>
                        <div className="font-medium">{profileLabel(referralProfileById.get(row.userId), row.userId)}</div>
                        <div className="text-xs text-muted-foreground">{row.userId}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{row.directCount}</TableCell>
                      <TableCell className="text-right font-mono">{row.treeCount}</TableCell>
                      <TableCell className="text-right font-mono">{row.creditsEarned}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No referral relationships yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Referral Rewards</CardTitle>
            <CardDescription>Credit grants from paid referral conversions</CardDescription>
          </CardHeader>
          <CardContent>
            {referralStats.recentRewards.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Earner</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralStats.recentRewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell>
                        <div className="font-medium">{profileLabel(referralProfileById.get(reward.earner_user_id), reward.earner_user_id)}</div>
                        <div className="text-xs text-muted-foreground">{reward.source.replaceAll("_", " ")}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {profileLabel(referralProfileById.get(reward.payer_user_id), reward.payer_user_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">L{reward.level}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">+{reward.granted_credits}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(reward.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No referral rewards yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

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

function summarizeAdminReferrals(referrals: ReferralRow[], rewards: ReferralRewardRow[]) {
  const childrenByReferrer = new Map<string, string[]>()
  referrals.forEach((referral) => {
    const children = childrenByReferrer.get(referral.referrer_user_id) ?? []
    children.push(referral.referred_user_id)
    childrenByReferrer.set(referral.referrer_user_id, children)
  })

  const creditsByEarner = new Map<string, number>()
  rewards.forEach((reward) => {
    creditsByEarner.set(reward.earner_user_id, (creditsByEarner.get(reward.earner_user_id) ?? 0) + reward.granted_credits)
  })

  const directReferrers = Array.from(childrenByReferrer.keys())
  const topReferrers = directReferrers
    .map((userId) => ({
      userId,
      directCount: childrenByReferrer.get(userId)?.length ?? 0,
      treeCount: countReferralTree(userId, childrenByReferrer),
      creditsEarned: creditsByEarner.get(userId) ?? 0,
    }))
    .sort((a, b) => b.treeCount - a.treeCount || b.directCount - a.directCount || b.creditsEarned - a.creditsEarned)
    .slice(0, 10)

  return {
    topReferrers,
    recentRewards: rewards.slice(0, 10),
    totalCredits: rewards.reduce((sum, reward) => sum + reward.granted_credits, 0),
  }
}

function countReferralTree(rootUserId: string, childrenByReferrer: Map<string, string[]>) {
  const seen = new Set<string>()
  const stack = [...(childrenByReferrer.get(rootUserId) ?? [])]

  while (stack.length > 0) {
    const userId = stack.pop()
    if (!userId || seen.has(userId)) {
      continue
    }

    seen.add(userId)
    stack.push(...(childrenByReferrer.get(userId) ?? []))
  }

  return seen.size
}

function profileLabel(profile: ProfileLabelRow | undefined, fallbackId: string) {
  return profile?.full_name || profile?.email || fallbackId.slice(0, 8)
}
