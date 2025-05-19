/**
 * Common types used across the application
 */

export type Endpoint = {
  id: string
  name: string
  url: string
  createdAt: string
  expiresAt: string
  status: "active" | "deleted"
  eventCount: number
} 