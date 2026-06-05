import type { Metadata } from "next"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Gift, Network, ReceiptText, ShieldAlert, Users } from "lucide-react"
import { ReferralInviteCard } from "@/components/ReferralInviteCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { appUrl } from "@/lib/env"
import { getI18n } from "@/lib/i18n-server"
import { interpolate, type Dictionary } from "@/lib/i18n"
import { formatCredits, formatDate } from "@/lib/utils"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Referrals",
  description: "View your referral link, tree, and credit rewards",
}

type ReferralTreeRow = {
  user_id: string
  referrer_user_id: string
  level: number
  created_at: string
  email: string | null
  full_name: string | null
}

type ReferralRewardRow = {
  id: string
  payer_user_id: string
  level: number
  basis_credits: number
  reward_percent: number | string
  granted_credits: number
  source: string
  created_at: string
}

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
}

export default async function ReferralsPage() {
  const { locale, dict } = await getI18n()

  try {
    const { user } = await getAuthenticatedUser()
    if (!user) {
      return <AuthRequired dict={dict} />
    }

    const admin = getSupabaseAdmin()
    const { data: codeData, error: codeError } = await admin.rpc("ensure_referral_code", { p_user_id: user.id })
    if (codeError || typeof codeData !== "string") {
      throw new Error(codeError?.message || "Referral code unavailable")
    }

    const referralCode = typeof codeData === "string" ? codeData : ""
    const inviteUrl = `${appUrl()}/r/${referralCode}`

    const [
      sponsorResult,
      directResult,
      treeResult,
      rewardResult,
    ] = await Promise.all([
      admin
        .from("referrals")
        .select("referrer_user_id,created_at,referral_code")
        .eq("referred_user_id", user.id)
        .maybeSingle(),
      admin
        .from("referrals")
        .select("referred_user_id", { count: "exact", head: true })
        .eq("referrer_user_id", user.id),
      admin.rpc("get_referral_tree", { p_root_user_id: user.id }),
      admin
        .from("referral_rewards")
        .select("id,payer_user_id,level,basis_credits,reward_percent,granted_credits,source,created_at")
        .eq("earner_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5000),
    ])

    if (sponsorResult.error || directResult.error || treeResult.error || rewardResult.error) {
      throw new Error(
        sponsorResult.error?.message ||
          directResult.error?.message ||
          treeResult.error?.message ||
          rewardResult.error?.message ||
          "Referral data unavailable"
      )
    }

    const sponsorRow = sponsorResult.data
    const directCount = directResult.count
    const treeRows = treeResult.data
    const rewardRows = rewardResult.data

    const sponsorId = typeof sponsorRow?.referrer_user_id === "string" ? sponsorRow.referrer_user_id : null
    const { data: sponsorProfile } = sponsorId
      ? await admin.from("profiles").select("id,email,full_name").eq("id", sponsorId).maybeSingle()
      : { data: null }

    const rewards = (rewardRows ?? []) as ReferralRewardRow[]
    const tree = (treeRows ?? []) as ReferralTreeRow[]
    const payerIds = Array.from(new Set(rewards.map((reward) => reward.payer_user_id)))
    const { data: payerProfiles } = payerIds.length > 0
      ? await admin.from("profiles").select("id,email,full_name").in("id", payerIds)
      : { data: [] }
    const profileById = new Map((payerProfiles ?? []).map((profile: ProfileRow) => [profile.id, profile]))
    const earnedCredits = rewards.reduce((sum, reward) => sum + reward.granted_credits, 0)
    const levelSummary = summarizeLevels(rewards)

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{dict.referrals.title}</h1>
          <p className="mt-1 text-muted-foreground">{dict.referrals.subtitle}</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label={dict.referrals.inviteCode} value={referralCode} icon={Gift} mono />
          <SummaryCard label={dict.referrals.directReferrals} value={formatCredits(directCount ?? 0, locale)} icon={Users} />
          <SummaryCard label={dict.referrals.fullTree} value={formatCredits(tree.length, locale)} icon={Network} />
          <SummaryCard label={dict.referrals.creditsEarned} value={formatCredits(earnedCredits, locale)} icon={ReceiptText} />
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{dict.referrals.inviteLink}</CardTitle>
            <CardDescription>{dict.referrals.inviteDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <ReferralInviteCard
              code={referralCode}
              inviteUrl={inviteUrl}
              labels={{
                inviteCode: dict.referrals.inviteCode,
                inviteLink: dict.referrals.inviteLink,
                copyLink: dict.referrals.copyLink,
                copied: dict.referrals.copied,
              }}
            />
          </CardContent>
        </Card>

        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{dict.referrals.sponsor}</CardTitle>
              <CardDescription>{dict.referrals.sponsorDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {sponsorProfile ? (
                <div>
                  <div className="font-medium">{displayProfile(sponsorProfile)}</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {sponsorRow?.created_at
                      ? interpolate(dict.referrals.claimedOn, { date: formatDate(sponsorRow.created_at, locale) })
                      : dict.referrals.sponsor}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{dict.referrals.noSponsor}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.referrals.levelSummary}</CardTitle>
              <CardDescription>{dict.referrals.levelSummaryDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {levelSummary.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {levelSummary.slice(0, 6).map((level) => (
                    <div key={level.level} className="rounded-lg border border-border p-3">
                      <div className="text-xs text-muted-foreground">
                        {interpolate(dict.referrals.levelLabel, { level: level.level })}
                      </div>
                      <div className="mt-1 text-xl font-semibold">{formatCredits(level.credits, locale)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{dict.referrals.noRewards}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{dict.referrals.treeTitle}</CardTitle>
            <CardDescription>{dict.referrals.treeDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {tree.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dict.referrals.user}</TableHead>
                    <TableHead>{dict.referrals.level}</TableHead>
                    <TableHead>{dict.referrals.joined}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tree.slice(0, 50).map((item) => (
                    <TableRow key={item.user_id}>
                      <TableCell>
                        <div className="font-medium">{displayProfile(item)}</div>
                        <div className="text-xs text-muted-foreground">{item.user_id}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{interpolate(dict.referrals.levelLabel, { level: item.level })}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(item.created_at, locale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{dict.referrals.noTree}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.referrals.rewardHistory}</CardTitle>
            <CardDescription>{dict.referrals.rewardHistoryDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {rewards.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dict.referrals.paidBy}</TableHead>
                    <TableHead>{dict.referrals.level}</TableHead>
                    <TableHead>{dict.referrals.basis}</TableHead>
                    <TableHead>{dict.referrals.reward}</TableHead>
                    <TableHead>{dict.referrals.date}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.slice(0, 50).map((reward) => {
                    const payer = profileById.get(reward.payer_user_id)
                    return (
                      <TableRow key={reward.id}>
                        <TableCell>
                          <div className="font-medium">{payer ? displayProfile(payer) : reward.payer_user_id.slice(0, 8)}</div>
                          <div className="text-xs text-muted-foreground">{reward.source.replaceAll("_", " ")}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{interpolate(dict.referrals.levelLabel, { level: reward.level })}</Badge>
                        </TableCell>
                        <TableCell>{formatCredits(reward.basis_credits, locale)}</TableCell>
                        <TableCell className="font-semibold text-primary">
                          +{formatCredits(reward.granted_credits, locale)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(reward.created_at, locale)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{dict.referrals.noRewards}</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  } catch {
    return <ReferralsUnavailable dict={dict} />
  }
}

function summarizeLevels(rewards: ReferralRewardRow[]) {
  const byLevel = new Map<number, number>()
  rewards.forEach((reward) => {
    byLevel.set(reward.level, (byLevel.get(reward.level) ?? 0) + reward.granted_credits)
  })

  return Array.from(byLevel.entries())
    .map(([level, credits]) => ({ level, credits }))
    .sort((a, b) => a.level - b.level)
}

function displayProfile(profile: { email: string | null; full_name: string | null }) {
  return profile.full_name || profile.email || "Unnamed user"
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  mono = false,
}: {
  label: string
  value: string
  icon: LucideIcon
  mono?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={mono ? "font-mono text-2xl font-bold" : "text-3xl font-bold"}>{value}</div>
      </CardContent>
    </Card>
  )
}

function AuthRequired({ dict }: { dict: Dictionary }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-4 rounded-full bg-muted p-4">
            <ShieldAlert className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">{dict.referrals.authTitle}</CardTitle>
          <CardDescription className="mb-6">{dict.referrals.authDescription}</CardDescription>
          <Button asChild>
            <Link href="/login">{dict.common.login}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ReferralsUnavailable({ dict }: { dict: Dictionary }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <CardTitle className="mb-2">{dict.referrals.unavailableTitle}</CardTitle>
          <CardDescription>{dict.referrals.unavailableDescription}</CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
