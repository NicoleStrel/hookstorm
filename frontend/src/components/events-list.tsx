"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, RefreshCw, ChevronDown, Play, Repeat } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getEvents, replayEvent, getEndpoint } from "@/app/actions"
import { showNotification } from "@/lib/toast-utils"
import { getValidEndpoint } from "@/lib/endpoint-utils"
import { Endpoint } from "@/lib/types"
import { toast } from "sonner"

export default function EventsList() {
  const [endpoint, setEndpoint] = useState<Endpoint | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replayingEvent, setReplayingEvent] = useState<string | null>(null)
  const [showReplayDialog, setShowReplayDialog] = useState(false)
  const [targetUrl, setTargetUrl] = useState("")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [openCollapsibles, setOpenCollapsibles] = useState<Set<string>>(new Set())
  const inFlightRequestRef = useRef<boolean>(false)
  const endpointRef = useRef<Endpoint | null>(null)

  // Initial endpoint fetch
  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      if (!mounted) return
      
      try {
        const validEndpoint = await getValidEndpoint(false)
        if (!mounted) return
        
        setEndpoint(validEndpoint)
        endpointRef.current = validEndpoint

        const eventsData = await getEvents(validEndpoint.id)
        if (!mounted) return
        
        setEvents(eventsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        if (mounted) {
          showNotification("fetchError")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, []) // Empty dependency array - only run once

  // Separate polling effect
  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    const pollEvents = async () => {
      // Don't poll if:
      // 1. Component is unmounted
      // 2. No endpoint
      // 3. Request in flight
      // 4. Currently replaying an event
      if (!mounted || !endpointRef.current || inFlightRequestRef.current || replayingEvent) return

      try {
        inFlightRequestRef.current = true
        
        const verifiedEndpoint = await getEndpoint(endpointRef.current.id)
        if (!mounted) return
        
        if (!verifiedEndpoint) {
          return
        }
        
        const eventsData = await getEvents(endpointRef.current.id)
        if (!mounted) return
        
        setEvents(eventsData)
      } catch (error) {
        console.error("Error refreshing events:", error)
      } finally {
        inFlightRequestRef.current = false
      }
    }

    const startPolling = () => {
      const poll = () => {
        pollEvents()
        timeoutId = setTimeout(poll, 5000)
      }
      
      timeoutId = setTimeout(poll, 5000)
    }

    startPolling()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [replayingEvent]) // Only depend on replayingEvent state

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
      setTargetUrl("")
      
      // Fetch events immediately after replay
      const eventsData = await getEvents(endpoint.id)
      setEvents(eventsData)
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid target URL provided. Please enter a valid URL.') {
        setShowReplayDialog(true)
        toast.error("Invalid URL", {
          description: "Please enter a valid URL (e.g., https://example.com/webhook)"
        })
      } else {
        showNotification("eventReplayError")
      }
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
