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

export interface Video {
  id: string
  userId: string
  prompt: string
  status: JobStatus
  steps: JobStep[]
  currentStep?: string
  progress: number
  thumbnailUrl?: string
  videoUrl?: string
  duration?: number
  createdAt: string
  completedAt?: string
  error?: string
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
