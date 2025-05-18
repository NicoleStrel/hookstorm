"use server"

import { EndpointExpiredError, EndpointNotFoundError, ApiError } from "@/lib/errors"

// Type definition for an endpoint
type Endpoint = {
  id: string
  name: string
  url: string
  createdAt: string
  expiresAt: string
  status: "active" | "deleted"
  eventCount: number
}

const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [snakeToCamel(key)]: toCamelCase(obj[key])
      }),
      {}
    );
  }
  return obj;
};

const snakeToCamel = (str: string): string => 
  str.replace(/([-_][a-z])/g, group => 
    group.toUpperCase()
      .replace('-', '')
      .replace('_', '')
  );

/**
 * Handle common API response status codes
 * @param response The fetch Response object
 * @throws Custom error types for known status codes
 */
const handleApiResponse = (response: Response): void => {
  if (response.status === 410) {
    throw new EndpointExpiredError()
  }

  if (response.status === 404) {
    throw new EndpointNotFoundError()
  }

  if (!response.ok) {
    throw new ApiError(`API request failed: ${response.statusText}`)
  }
}

/**
 * Create a new webhook endpoint
 * @param name The name of the endpoint
 * @returns The newly created endpoint
 */
export async function createEndpoint(name: string): Promise<Endpoint> {
  try {
    // Call the existing API endpoint on port 8000
    const response = await fetch("http://127.0.0.1:8080/api/endpoints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    })

    handleApiResponse(response)

    const data = await response.json();
    return toCamelCase(data);
  } catch (error) {
    console.error("Error creating endpoint:", error)
    throw error
  }
}

/**
 * Get a webhook endpoint by ID
 * @param id The ID of the endpoint to get
 * @returns The endpoint
 */
export async function getEndpoint(id?: string): Promise<Endpoint | null> {
  if (!id) {
    return null;
  }
  
  try {
    const response = await fetch(`http://127.0.0.1:8080/api/endpoints/${id}`)
    handleApiResponse(response)

    const data = await response.json();
    return toCamelCase(data);
  } catch (error) {
    console.error("Error getting endpoint:", error)
    throw error
  }
}

/**
 * Get events for a webhook endpoint
 * @param id The ID of the endpoint
 * @returns The events
 */
export async function getEvents(id: string): Promise<any[]> {
  try {
    const response = await fetch(`http://127.0.0.1:8080/api/endpoints/${id}/events`)
    handleApiResponse(response)

    const data = await response.json();
    return toCamelCase(data);
  } catch (error) {
    console.error("Error getting events:", error)
    throw error
  }
}

/**
 * Replay an event
 * @param endpointId The ID of the endpoint
 * @param eventId The ID of the event to replay
 * @param targetUrl The URL to replay the event to
 * @returns A success message
 */
export async function replayEvent(endpointId: string, eventId: string, targetUrl: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`http://127.0.0.1:8080/api/endpoints/${endpointId}/events/${eventId}/replay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target_url: targetUrl }),
    })
    handleApiResponse(response)

    return { success: true }
  } catch (error) {
    console.error("Error replaying event:", error)
    throw error
  }
}