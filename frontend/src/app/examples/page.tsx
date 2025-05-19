import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ExampleTabs from "@/components/example-tabs"

export default function ExamplesPage() {
  // Simple hello world payload example
  const examplePayload = {
    event: "test",
    data: {
      message: "Hello World",
      timestamp: Date.now(),
    },
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Endpoint
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Example Payload</CardTitle>
            <CardDescription>A simple "Hello World" webhook payload you can use for testing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-muted p-4 mb-4">
              <pre className="text-xs overflow-auto max-h-60">{JSON.stringify(examplePayload, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sending Methods</CardTitle>
            <CardDescription>Choose your preferred method to send the webhook</CardDescription>
          </CardHeader>
          <CardContent>
            <ExampleTabs examplePayload={examplePayload} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
