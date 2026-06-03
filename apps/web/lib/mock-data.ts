import type { User, Video, Plan, Transaction, Subscription, AdminStats, AdminUser, FAQ, Feature } from "./types"

// Current user mock
export const mockUser: User = {
  id: "user_1",
  email: "creator@example.com",
  name: "Alex Creator",
  credits: 47,
  plan: "starter",
  createdAt: "2024-11-15T10:00:00Z",
}

// Videos mock data
export const mockVideos: Video[] = [
  {
    id: "vid_1",
    userId: "user_1",
    prompt: "Top 5 AI tools that will change your workflow in 2025",
    status: "completed",
    steps: [
      { id: "step_1", name: "Script Generation", status: "completed", completedAt: "2024-12-01T10:02:00Z" },
      { id: "step_2", name: "Voice Synthesis", status: "completed", completedAt: "2024-12-01T10:05:00Z" },
      { id: "step_3", name: "Visual Generation", status: "completed", completedAt: "2024-12-01T10:12:00Z" },
      { id: "step_4", name: "Video Assembly", status: "completed", completedAt: "2024-12-01T10:15:00Z" },
    ],
    progress: 100,
    thumbnailUrl: "/thumbnails/ai-tools.jpg",
    videoUrl: "/videos/ai-tools.mp4",
    duration: 58,
    createdAt: "2024-12-01T10:00:00Z",
    completedAt: "2024-12-01T10:15:00Z",
  },
  {
    id: "vid_2",
    userId: "user_1",
    prompt: "Why remote work is the future of productivity",
    status: "processing",
    steps: [
      { id: "step_1", name: "Script Generation", status: "completed", completedAt: "2024-12-02T14:02:00Z" },
      { id: "step_2", name: "Voice Synthesis", status: "completed", completedAt: "2024-12-02T14:05:00Z" },
      { id: "step_3", name: "Visual Generation", status: "processing", progress: 65 },
      { id: "step_4", name: "Video Assembly", status: "queued" },
    ],
    currentStep: "Visual Generation",
    progress: 65,
    createdAt: "2024-12-02T14:00:00Z",
  },
  {
    id: "vid_3",
    userId: "user_1",
    prompt: "3 morning habits of successful entrepreneurs",
    status: "queued",
    steps: [
      { id: "step_1", name: "Script Generation", status: "queued" },
      { id: "step_2", name: "Voice Synthesis", status: "queued" },
      { id: "step_3", name: "Visual Generation", status: "queued" },
      { id: "step_4", name: "Video Assembly", status: "queued" },
    ],
    progress: 0,
    createdAt: "2024-12-02T15:30:00Z",
  },
  {
    id: "vid_4",
    userId: "user_1",
    prompt: "The psychology behind viral content",
    status: "failed",
    steps: [
      { id: "step_1", name: "Script Generation", status: "completed", completedAt: "2024-11-28T09:02:00Z" },
      { id: "step_2", name: "Voice Synthesis", status: "failed", message: "Voice synthesis service temporarily unavailable" },
      { id: "step_3", name: "Visual Generation", status: "queued" },
      { id: "step_4", name: "Video Assembly", status: "queued" },
    ],
    progress: 25,
    createdAt: "2024-11-28T09:00:00Z",
    error: "Voice synthesis service temporarily unavailable. Credits have been refunded.",
  },
  {
    id: "vid_5",
    userId: "user_1",
    prompt: "How to build a personal brand on social media",
    status: "completed",
    steps: [
      { id: "step_1", name: "Script Generation", status: "completed" },
      { id: "step_2", name: "Voice Synthesis", status: "completed" },
      { id: "step_3", name: "Visual Generation", status: "completed" },
      { id: "step_4", name: "Video Assembly", status: "completed" },
    ],
    progress: 100,
    thumbnailUrl: "/thumbnails/personal-brand.jpg",
    videoUrl: "/videos/personal-brand.mp4",
    duration: 45,
    createdAt: "2024-11-25T16:00:00Z",
    completedAt: "2024-11-25T16:18:00Z",
  },
]

// Pricing plans
export const mockPlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for trying out the platform",
    price: 0,
    credits: 3,
    features: [
      "3 videos per month",
      "720p video quality",
      "Basic voice options",
      "Standard support",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "Great for content creators getting started",
    price: 1900,
    credits: 25,
    features: [
      "25 videos per month",
      "1080p video quality",
      "Premium voice options",
      "Priority queue",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For serious creators and small agencies",
    price: 4900,
    credits: 100,
    popular: true,
    features: [
      "100 videos per month",
      "4K video quality",
      "All voice options",
      "Priority queue",
      "Custom branding",
      "API access",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large teams",
    price: 0,
    credits: -1,
    features: [
      "Unlimited videos",
      "4K+ video quality",
      "Custom voice cloning",
      "Dedicated queue",
      "White-label options",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
  },
]

// Transactions mock
export const mockTransactions: Transaction[] = [
  {
    id: "txn_1",
    userId: "user_1",
    type: "purchase",
    amount: 1900,
    credits: 25,
    description: "Starter Plan - Monthly",
    createdAt: "2024-12-01T00:00:00Z",
  },
  {
    id: "txn_2",
    userId: "user_1",
    type: "usage",
    amount: 0,
    credits: -1,
    description: "Video generation: Top 5 AI tools...",
    createdAt: "2024-12-01T10:15:00Z",
  },
  {
    id: "txn_3",
    userId: "user_1",
    type: "usage",
    amount: 0,
    credits: -1,
    description: "Video generation: How to build a personal brand...",
    createdAt: "2024-11-25T16:18:00Z",
  },
  {
    id: "txn_4",
    userId: "user_1",
    type: "refund",
    amount: 0,
    credits: 1,
    description: "Refund: Failed video generation",
    createdAt: "2024-11-28T09:05:00Z",
  },
]

// Subscription mock
export const mockSubscription: Subscription = {
  id: "sub_1",
  userId: "user_1",
  plan: "starter",
  status: "active",
  currentPeriodStart: "2024-12-01T00:00:00Z",
  currentPeriodEnd: "2025-01-01T00:00:00Z",
  cancelAtPeriodEnd: false,
}

// Admin stats mock
export const mockAdminStats: AdminStats = {
  totalUsers: 1247,
  totalVideos: 8934,
  totalRevenue: 4523100,
  activeJobs: 23,
  usersGrowth: 12.5,
  videosGrowth: 28.3,
  revenueGrowth: 15.8,
}

// Admin users mock
export const mockAdminUsers: AdminUser[] = [
  {
    id: "user_1",
    email: "creator@example.com",
    name: "Alex Creator",
    credits: 47,
    plan: "starter",
    createdAt: "2024-11-15T10:00:00Z",
    videosCount: 12,
    totalSpent: 3800,
    lastActiveAt: "2024-12-02T14:00:00Z",
  },
  {
    id: "user_2",
    email: "agency@example.com",
    name: "Sarah Agency",
    credits: 89,
    plan: "pro",
    createdAt: "2024-10-01T08:00:00Z",
    videosCount: 156,
    totalSpent: 19600,
    lastActiveAt: "2024-12-02T16:30:00Z",
  },
  {
    id: "user_3",
    email: "john@startup.io",
    name: "John Startup",
    credits: 2,
    plan: "free",
    createdAt: "2024-12-01T12:00:00Z",
    videosCount: 1,
    totalSpent: 0,
    lastActiveAt: "2024-12-01T12:45:00Z",
  },
]

// FAQ data
export const mockFAQs: FAQ[] = [
  {
    question: "How long does it take to generate a video?",
    answer: "Most videos are generated within 5-15 minutes, depending on complexity and current queue. Pro and Enterprise users get priority processing for faster turnaround.",
  },
  {
    question: "What video formats and resolutions are supported?",
    answer: "We support MP4 output optimized for all major platforms. Free users get 720p, Starter gets 1080p, and Pro/Enterprise get up to 4K resolution.",
  },
  {
    question: "Can I use the videos commercially?",
    answer: "Yes! All videos you generate are yours to use commercially. You retain full rights to the content you create with MoneyPrint.",
  },
  {
    question: "What happens if a video generation fails?",
    answer: "If a video fails to generate due to a system error, your credits are automatically refunded within minutes. You can also retry the generation at no extra cost.",
  },
  {
    question: "Do unused credits roll over?",
    answer: "Credits on monthly plans reset at the start of each billing cycle. Annual plans include a larger credit pool that rolls over throughout the year.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel anytime. Your access continues until the end of your current billing period, and you keep any remaining credits until then.",
  },
]

// Features for landing page
export const mockFeatures: Feature[] = [
  {
    title: "AI Script Generation",
    description: "Transform your ideas into engaging scripts with our advanced AI. Just describe your topic and watch the magic happen.",
    icon: "Sparkles",
  },
  {
    title: "Natural Voice Synthesis",
    description: "Choose from dozens of realistic AI voices in multiple languages and accents. Your videos sound professional, every time.",
    icon: "Mic",
  },
  {
    title: "Dynamic Visuals",
    description: "Our AI generates relevant, eye-catching visuals that perfectly match your content and keep viewers engaged.",
    icon: "Image",
  },
  {
    title: "One-Click Export",
    description: "Export directly to YouTube Shorts, TikTok, or Instagram Reels format. Optimized for each platform automatically.",
    icon: "Download",
  },
  {
    title: "Real-Time Progress",
    description: "Track every step of your video generation with live updates. Know exactly when your content will be ready.",
    icon: "Activity",
  },
  {
    title: "Batch Processing",
    description: "Queue multiple videos at once and let our system work while you focus on other things. Perfect for content calendars.",
    icon: "Layers",
  },
]
