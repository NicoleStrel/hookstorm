"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, RefreshCw, ChevronDown, Play } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { getEndpoint, getEvents, replayEvent, createEndpoint } from "@/app/actions"
import { EndpointExpiredError, EndpointNotFoundError } from "@/lib/errors"
import { showNotification } from "@/lib/toast-utils"
import { createNewEndpoint } from "@/lib/endpoint-utils"

export default function EventsList() {
  const [endpoint, setEndpoint] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replayingEvent, setReplayingEvent] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateEndpoint = async () => {
    setIsCreating(true)
    try {
      await createNewEndpoint({
        onSuccess: async (newEndpoint) => {
          setEndpoint(newEndpoint)
          // Get events for the new endpoint
          const eventsData = await getEvents(newEndpoint.id)
          setEvents(eventsData)
        }
      })
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get endpoint from localStorage
        const storedEndpoint = localStorage.getItem('webhookEndpoint')
        if (!storedEndpoint) {
          console.error("No endpoint data in localStorage")
          setLoading(false)
          return
        }

        const endpointData = JSON.parse(storedEndpoint)
        
        // Verify endpoint is still valid with backend
        try {
          await getEndpoint(endpointData.id)
          setEndpoint(endpointData)

          // Then get the events for that endpoint
          const eventsData = await getEvents(endpointData.id)
          setEvents(eventsData)
        } catch (error) {
          if (
            error instanceof EndpointExpiredError ||
            error instanceof EndpointNotFoundError
          ) {
            // Endpoint is expired or not found, create new one
            await handleCreateEndpoint()
          } else {
            throw error // Re-throw other errors
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        showNotification("fetchError")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up polling to refresh events every 5 seconds
    const interval = setInterval(async () => {
      const storedEndpoint = localStorage.getItem('webhookEndpoint')
      if (!storedEndpoint) return

      const endpointData = JSON.parse(storedEndpoint)
      
      try {
        // Verify endpoint is still valid
        await getEndpoint(endpointData.id)
        
        // Get events for the endpoint
        const eventsData = await getEvents(endpointData.id)
        setEvents(eventsData)
      } catch (error) {
        if (
          error instanceof EndpointExpiredError ||
          error instanceof EndpointNotFoundError
        ) {
          // Endpoint is expired or not found, create new one
          await handleCreateEndpoint()
        } else {
          console.error("Error refreshing events:", error)
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])  // Remove endpoint?.id from dependencies since we're using localStorage

  const handleReplayEvent = async (eventId: string) => {
    if (!endpoint) return

    setReplayingEvent(eventId)

    try {
      await replayEvent(endpoint.id, eventId)
      showNotification("eventReplayed")
    } catch (error) {
      showNotification("eventReplayError")
    } finally {
      setReplayingEvent(null)
    }
  }

  if (loading) {
    return null // The parent component will show a skeleton
  }

  if (!endpoint || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Events received by your webhook endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No events received yet</p>
            <p className="text-sm mt-2">Send a webhook to your endpoint to see events here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
        <CardDescription>Events received by your webhook endpoint</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <Collapsible key={event.id} className="w-full">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={event.statusCode >= 200 && event.statusCode < 300 ? "default" : "destructive"}>
                        {event.method}
                      </Badge>
                      <CardTitle className="text-base">{event.body?.event || "Unknown Event"}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{event.statusCode}</Badge>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  <CardDescription className="flex items-center mt-1">
                    <Clock className="mr-1 h-3 w-3" />
                    {new Date(event.receivedAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="rounded-md bg-muted p-4">
                      <h4 className="mb-2 text-sm font-medium">Payload</h4>
                      <pre className="text-xs overflow-auto max-h-60">{JSON.stringify(event.body, null, 2)}</pre>
                    </div>
                    <div className="mt-4 rounded-md bg-muted p-4">
                      <h4 className="mb-2 text-sm font-medium">Headers</h4>
                      <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(event.headers, null, 2)}</pre>
                    </div>
                  </CardContent>
                  <CardContent className="pt-0 pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReplayEvent(event.id)}
                      disabled={replayingEvent === event.id}
                    >
                      {replayingEvent === event.id ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Replaying...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Replay Event
                        </>
                      )}
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
