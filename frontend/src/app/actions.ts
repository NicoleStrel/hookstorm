"use server"

import { Endpoint } from "@/lib/types"
import isUrl from 'is-url'

// Add a type for the API response status
type ApiResponseStatus = {
  status: 'success' | 'expired' | 'not_found' | 'error'
  error?: string
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
 * @returns ApiResponseStatus indicating the result
 */
const handleApiResponse = (response: Response): ApiResponseStatus => {
  if (response.status === 410) {
    return { status: 'expired' }
  }

  if (response.status === 404) {
    return { status: 'not_found' }
  }

  if (!response.ok) {
    return { 
      status: 'error',
      error: `API request failed: ${response.statusText}`
    }
  }

  return { status: 'success' }
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

    const status = handleApiResponse(response)

    if (status.status !== 'success') {
      throw new Error(status.error || 'Unknown error')
    }

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
 * @returns The endpoint or null if not found/expired
 */
export async function getEndpoint(id?: string): Promise<Endpoint | null> {
  if (!id) {
    return null;
  }
  
  try {
    const response = await fetch(`http://127.0.0.1:8080/api/endpoints/${id}`)
    const status = handleApiResponse(response)

    if (status.status !== 'success') {
      return null
    }

    const data = await response.json();
    return toCamelCase(data);
  } catch (error) {
    console.error("Error getting endpoint:", error)
    return null
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
    const status = handleApiResponse(response)

    if (status.status !== 'success') {
      throw new Error(status.error || 'Unknown error')
    }

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
 * @throws Error if the target URL is invalid
 */
export async function replayEvent(endpointId: string, eventId: string, targetUrl: string): Promise<{ success: boolean }> {
  // Strip whitespace from the URL
  const trimmedUrl = targetUrl.trim()
  
  // Validate the URL
  if (!isUrl(trimmedUrl)) {
    throw new Error('Invalid target URL provided. Please enter a valid URL.')
  }

  try {
    const response = await fetch(`http://127.0.0.1:8080/api/endpoints/${endpointId}/events/${eventId}/replay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target_url: trimmedUrl }),
    })
    const status = handleApiResponse(response)

    if (status.status !== 'success') {
      throw new Error(status.error || 'Unknown error')
    }

    return { success: true }
  } catch (error) {
    console.error("Error replaying event:", error)
    throw error
  }
}