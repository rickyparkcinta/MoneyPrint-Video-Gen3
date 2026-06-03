import type { Metadata } from "next"
import { CreateVideoForm } from "@/components/CreateVideoForm"
import { Card, CardContent } from "@/components/ui/card"
import { Coins } from "lucide-react"
import { mockUser } from "@/lib/mock-data"

export const metadata: Metadata = {
  title: "Create Video",
  description: "Generate a new AI-powered short-form video",
}

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Create a New Video
        </h1>
        <p className="mt-2 text-muted-foreground">
          Describe your video idea and let AI handle the rest.
        </p>
      </div>

      {/* Credit balance indicator */}
      <Card className="mb-8">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Coins className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Available Credits</p>
              <p className="text-xs text-muted-foreground">
                Each video costs 1 credit
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">{mockUser.credits}</span>
            <span className="ml-1 text-sm text-muted-foreground">credits</span>
          </div>
        </CardContent>
      </Card>

      {/* Create form */}
      <CreateVideoForm />
    </div>
  )
}
