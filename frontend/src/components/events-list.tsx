"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, RefreshCw, ChevronDown, Play, Repeat } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getEndpoint, getEvents, replayEvent } from "@/app/actions"
import { EndpointExpiredError, EndpointNotFoundError } from "@/lib/errors"
import { showNotification } from "@/lib/toast-utils"
import { createNewEndpoint } from "@/lib/endpoint-utils"

export default function EventsList() {
  const [endpoint, setEndpoint] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replayingEvent, setReplayingEvent] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showReplayDialog, setShowReplayDialog] = useState(false)
  const [targetUrl, setTargetUrl] = useState("")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [openCollapsibles, setOpenCollapsibles] = useState<Set<string>>(new Set())

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

  const handleReplayClick = (eventId: string) => {
    setSelectedEventId(eventId)
    setShowReplayDialog(true)
  }

  const handleReplayEvent = async () => {
    if (!endpoint || !selectedEventId || !targetUrl) return

    setReplayingEvent(selectedEventId)
    setShowReplayDialog(false)

    try {
      await replayEvent(endpoint.id, selectedEventId, targetUrl)
      showNotification("eventReplayed")
      // Clear the target URL after successful replay
      setTargetUrl("")
    } catch (error) {
      showNotification("eventReplayError")
    } finally {
      setReplayingEvent(null)
      setSelectedEventId(null)
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
    <TooltipProvider>
      <>
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Events received by your webhook endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...events].reverse().map((event) => (
                <Collapsible 
                  key={event.id} 
                  className="w-full"
                  open={openCollapsibles.has(event.id)}
                  onOpenChange={(isOpen) => {
                    setOpenCollapsibles(prev => {
                      const next = new Set(prev)
                      if (isOpen) {
                        next.add(event.id)
                      } else {
                        next.delete(event.id)
                      }
                      return next
                    })
                  }}
                >
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="cursor-default">{event.statusCode}</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>HTTP Status Code</p>
                            </TooltipContent>
                          </Tooltip>
                          {event.replayCount > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="flex items-center gap-1 cursor-default">
                                  <Repeat className="h-3 w-3" />
                                  {event.replayCount}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Number of times this event has been replayed</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openCollapsibles.has(event.id) ? 'rotate-180' : ''}`} />
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
                          onClick={() => handleReplayClick(event.id)}
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

        <Dialog open={showReplayDialog} onOpenChange={setShowReplayDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Replay Webhook Event</DialogTitle>
              <DialogDescription>
                Enter the target URL where you want to replay this webhook event.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="target-url">Target URL</Label>
                <Input
                  id="target-url"
                  placeholder="https://example.com/webhook"
                  value={targetUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetUrl(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReplayDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleReplayEvent} disabled={!targetUrl}>
                Replay Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    </TooltipProvider>
  )
}
