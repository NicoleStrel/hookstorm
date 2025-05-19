"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, ArrowRight, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import WaitingAnimation from "@/components/waiting-animation"
import { getValidEndpoint } from "@/lib/endpoint-utils"
import { Endpoint } from "@/lib/types"
import { showNotification } from "@/lib/toast-utils"

export default function WebhookEndpoint() {
  const [endpoint, setEndpoint] = useState<Endpoint | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState("")
  const [isExpired, setIsExpired] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const handleCreateEndpoint = async () => {
    setIsCreating(true)
    try {
      const newEndpoint = await getValidEndpoint()
      setEndpoint(newEndpoint)
      setIsExpired(false)
    } finally {
      setIsCreating(false)
      if (loading) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    handleCreateEndpoint()
  }, [])

  useEffect(() => {
    if (!endpoint || isExpired) {
      return
    }

    const interval = setInterval(async () => {
      try {
        // Use getValidEndpoint to verify and potentially refresh the endpoint
        const validEndpoint = await getValidEndpoint(false)
        setEndpoint(validEndpoint)
        
        const now = new Date()
        const expiry = new Date(validEndpoint.expiresAt)

        if (now >= expiry) {
          setIsExpired(true)
          setTimeRemaining("Creating new endpoint...")
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
      } catch (error) {
        console.error("Error checking endpoint:", error)
        setIsExpired(true)
        setTimeRemaining("Creating new endpoint...")
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [endpoint, isExpired])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showNotification("copiedToClipboard")
  }

  const copyCurlCommand = () => {
    if (!endpoint) return // Add null check here
    
    const curlCommand = `curl -X POST ${endpoint.url} \\
  -H "Content-Type: application/json" \\
  -d '{"event": "test", "data": {"message": "Hello World"}}'`
    navigator.clipboard.writeText(curlCommand)
    showNotification("curlCommandCopied")
  }

  if (loading || isCreating) {
    return null // The parent component will show a skeleton
  }

  if (!endpoint) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Webhook Endpoint</CardTitle>
              <CardDescription className="mt-1">
                Creating new endpoint...
              </CardDescription>
            </div>
            <Badge variant="secondary">Creating...</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground font-medium">Creating new endpoint...</p>
            <WaitingAnimation />
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
              {isCreating ? (
                "Creating new endpoint..."
              ) : (
                <>
                  Expires in: <span className="font-medium">{timeRemaining}</span>
                </>
              )}
            </CardDescription>
          </div>
          <Badge variant={isExpired ? "secondary" : "default"}>{isExpired ? "Renewing..." : "Active"}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm flex-1 truncate">
            {endpoint.url}
          </code>
          <Button variant="outline" size="icon" onClick={() => copyToClipboard(endpoint.url)} disabled={isExpired || isCreating}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6">
          {isCreating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground font-medium">Creating new endpoint...</p>
              <WaitingAnimation />
            </div>
          ) : (
            <WaitingAnimation />
          )}
        </div>

        {!isExpired && !isCreating && endpoint && (
          <div className="mt-6 text-sm">
            <h3 className="font-medium mb-2">Try sending a request to your webhook URL:</h3>
            <div className="relative">
              <pre className="rounded bg-muted p-3 font-mono text-xs overflow-x-auto">
                {`curl -X POST ${endpoint.url} \\
  -H "Content-Type: application/json" \\
  -d '{"event": "test", "data": {"message": "Hello World"}}'`}
              </pre>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute top-2 right-2" 
                onClick={copyCurlCommand}
                disabled={isExpired || isCreating}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
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
      </CardFooter>
    </Card>
  )
}
