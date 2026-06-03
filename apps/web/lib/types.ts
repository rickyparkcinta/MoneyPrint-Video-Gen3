// Job status types
export type JobStatus = "queued" | "processing" | "completed" | "failed"

export interface JobStep {
  id: string
  name: string
  status: JobStatus
  progress?: number
  message?: string
  startedAt?: string
  completedAt?: string
}

// A single event in a job's lifecycle timeline
export interface JobEvent {
  id: string
  label: string
  status: "completed" | "processing" | "queued" | "failed"
  timestamp?: string
  detail?: string
}

export type Language = string
export type AspectRatio = string
export type VoiceStyle = string
export type SubtitleStyle = string
export type MusicStyle = string

export interface Video {
  id: string
  userId: string
  prompt: string
  status: JobStatus
  steps: JobStep[]
  events?: JobEvent[]
  currentStep?: string
  progress: number
  thumbnailUrl?: string
  videoUrl?: string
  duration?: number
  createdAt: string
  completedAt?: string
  error?: string
  // Generation settings / metadata
  language?: Language
  aspectRatio?: AspectRatio
  voice?: VoiceStyle
  subtitleStyle?: SubtitleStyle
  musicStyle?: MusicStyle
  variants?: number
  creditCost?: number
  // Generated content
  script?: string
  subtitles?: string
}

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  credits: number
  plan: PlanTier
  createdAt: string
}

// Pricing types
export type PlanTier = "free" | "starter" | "pro" | "enterprise"

export interface Plan {
  id: PlanTier
  name: string
  description: string
  price: number
  credits: number
  features: string[]
  popular?: boolean
}

// Billing types
export interface Transaction {
  id: string
  userId: string
  type: "purchase" | "usage" | "refund"
  amount: number
  credits: number
  description: string
  createdAt: string
}

export interface Subscription {
  id: string
  userId: string
  plan: PlanTier
  status: "active" | "canceled" | "past_due"
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

// Admin types
export interface AdminStats {
  totalUsers: number
  totalVideos: number
  totalRevenue: number
  activeJobs: number
  usersGrowth: number
  videosGrowth: number
  revenueGrowth: number
}

export interface AdminUser extends User {
  videosCount: number
  totalSpent: number
  lastActiveAt: string
}

// Admin: queue + worker health
export interface QueueHealth {
  queued: number
  processing: number
  avgWaitSeconds: number
  oldestQueuedAt?: string
}

export interface WorkerHealth {
  status: "healthy" | "degraded" | "down"
  activeWorkers: number
  maxWorkers: number
  region: string
  lastHeartbeatAt: string
}

export interface FailedJob {
  id: string
  userEmail: string
  topic: string
  error: string
  failedAt: string
}

// User notification preferences
export interface NotificationPreferences {
  jobCompleted: boolean
  jobFailed: boolean
  weeklyDigest: boolean
  productUpdates: boolean
}

// FAQ type
export interface FAQ {
  question: string
  answer: string
}

// Feature type for landing page
export interface Feature {
  title: string
  description: string
  icon: string
}
