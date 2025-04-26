import { Suspense } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import WebhookEndpoint from "@/components/webhook-endpoint"
import { Skeleton } from "@/components/ui/skeleton"
import EventsList from "@/components/events-list"

export default function Home() {
  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhook Testing</h1>
          <p className="text-muted-foreground">
            Send webhook events to your temporary endpoint and inspect the results
          </p>
        </div>

        <Suspense fallback={<EndpointSkeleton />}>
          <WebhookEndpoint />
        </Suspense>

        <Suspense fallback={<EventsSkeleton />}>
          <EventsList />
        </Suspense>
      </div>
    </div>
  )
}

function EndpointSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24 mt-2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
        <div className="mt-6 flex flex-col items-center justify-center py-8">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-4 w-40 mt-4" />
          <Skeleton className="h-3 w-60 mt-2" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-40" />
      </CardFooter>
    </Card>
  )
}

function EventsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}