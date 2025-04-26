"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, ArrowRight, Trash2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import WaitingAnimation from "@/components/waiting-animation"
import { createEndpoint, deleteEndpoint, getEndpoint } from "@/app/actions"

export default function WebhookEndpoint() {
  const [endpoint, setEndpoint] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState("")
  const [isExpired, setIsExpired] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Fetch the endpoint from the backend
    const fetchEndpoint = async () => {
      try {
        const data = await getEndpoint()
        setEndpoint(data)

        // Check if the endpoint is expired
        const now = new Date()
        const expiry = new Date(data.expiresAt)
        setIsExpired(now >= expiry)

        setLoading(false)
      } catch (error) {
        console.error("Error fetching endpoint:", error)
        // If there's no endpoint, we'll show the create button
        setEndpoint(null)
        setIsExpired(true)
        setLoading(false)
      }
    }

    fetchEndpoint()
  }, [])

  useEffect(() => {
    if (!endpoint || isExpired) return

    const interval = setInterval(() => {
      const now = new Date()
      const expiry = new Date(endpoint.expiresAt)

      if (now >= expiry) {
        setIsExpired(true)
        setTimeRemaining("Expired")
        clearInterval(interval)
        return
      }

      const diff = expiry.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`)
      } else {
        setTimeRemaining(`${seconds}s`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [endpoint, isExpired])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "URL copied to clipboard",
      description: "The webhook URL has been copied to your clipboard.",
    })
  }

  const handleDeleteEndpoint = async () => {
    if (!endpoint) return

    setIsDeleting(true)

    try {
      // Call the server action that will call the backend API
      await deleteEndpoint(endpoint.id)

      toast({
        title: "Endpoint deleted",
        description: "Your webhook endpoint has been deleted successfully.",
      })

      setEndpoint({
        ...endpoint,
        status: "deleted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete webhook endpoint. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateNewEndpoint = async () => {
    setIsCreating(true)

    try {
      // Call the server action that will call the backend API
      const newEndpoint = await createEndpoint("Webhook Endpoint")

      setEndpoint(newEndpoint)
      setIsExpired(false)

      toast({
        title: "Endpoint created",
        description: "Your new webhook endpoint has been created successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create webhook endpoint. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) {
    return null // The parent component will show a skeleton
  }

  // If there's no endpoint or it's been deleted, show the create button
  if (!endpoint || endpoint.status === "deleted") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Webhook Endpoint</CardTitle>
          <CardDescription>You don't have an active webhook endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground font-medium">Create a new endpoint to start testing</p>
            <Button className="mt-4" onClick={handleCreateNewEndpoint} disabled={isCreating}>
              {isCreating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create New Endpoint"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Webhook Endpoint</CardTitle>
            <CardDescription className="mt-1">
              {isExpired ? (
                "This endpoint has expired"
              ) : (
                <>
                  Expires in: <span className="font-medium">{timeRemaining}</span>
                </>
              )}
            </CardDescription>
          </div>
          <Badge variant={isExpired ? "secondary" : "default"}>{isExpired ? "Inactive" : "Active"}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm flex-1 truncate">
            {endpoint.url}
          </code>
          <Button variant="outline" size="icon" onClick={() => copyToClipboard(endpoint.url)} disabled={isExpired}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" asChild disabled={isExpired}>
            <a href={endpoint.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <div className="mt-6">
          {isExpired ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground font-medium">This webhook endpoint has expired</p>
              <p className="mt-2 text-sm text-muted-foreground">Create a new endpoint to continue testing</p>
              <Button className="mt-4" onClick={handleCreateNewEndpoint} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create New Endpoint"
                )}
              </Button>
            </div>
          ) : (
            <WaitingAnimation />
          )}
        </div>

        {!isExpired && (
          <div className="mt-6 text-sm">
            <h3 className="font-medium mb-2">Try sending a request to your webhook URL:</h3>
            <pre className="rounded bg-muted p-3 font-mono text-xs overflow-x-auto">
              {`curl -X POST ${endpoint.url} \\
  -H "Content-Type: application/json" \\
  -d '{"event": "test", "data": {"message": "Hello World"}}'`}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/examples">
            View Example Methods
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        {isExpired && endpoint.status !== "deleted" && (
          <Button variant="destructive" onClick={handleDeleteEndpoint} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Endpoint
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
