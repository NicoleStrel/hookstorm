import { createEndpoint, getEndpoint } from "@/app/actions"
import { showNotification } from "@/lib/toast-utils"
import { Endpoint } from "@/lib/types"

interface CreateEndpointOptions {
  onSuccess?: (endpoint: Endpoint) => void | Promise<void>
  isInitialCreation?: boolean
  showToast?: boolean
}

// Singleton to manage endpoint creation and prevent race conditions
class EndpointManager {
  private static instance: EndpointManager
  private creatingEndpoint: Promise<Endpoint> | null = null

  private constructor() {}

  static getInstance(): EndpointManager {
    if (!EndpointManager.instance) {
      EndpointManager.instance = new EndpointManager()
    }
    return EndpointManager.instance
  }

  async getValidEndpoint(showToast = false): Promise<Endpoint> {
    // If we're already creating an endpoint, wait for that one
    if (this.creatingEndpoint) {
      return this.creatingEndpoint
    }

    // First try to get from localStorage
    const storedData = localStorage.getItem('webhookEndpoint')
    if (!storedData) {
      return this.createNewEndpoint({ showToast, isInitialCreation: true })
    }

    try {
      const endpoint = JSON.parse(storedData) as Endpoint
      
      // Always verify with backend first
      const verifiedEndpoint = await getEndpoint(endpoint.id)
      if (!verifiedEndpoint) {
        localStorage.removeItem('webhookEndpoint')
        return this.createNewEndpoint({ showToast })
      }
      return verifiedEndpoint
    } catch (error) {
      // Handle JSON parse errors or other unexpected errors
      console.error("Error with stored endpoint data:", error)
      localStorage.removeItem('webhookEndpoint')
      return this.createNewEndpoint({ showToast, isInitialCreation: true })
    }
  }

  async createNewEndpoint({
    onSuccess,
    isInitialCreation = false,
    showToast = true
  }: CreateEndpointOptions = {}): Promise<Endpoint> {
    // If we're already creating an endpoint, return that promise
    if (this.creatingEndpoint) {
      return this.creatingEndpoint
    }

    // Create a new promise for endpoint creation
    this.creatingEndpoint = (async () => {
      try {
        const newEndpoint = await createEndpoint("Webhook Endpoint")
        
        localStorage.setItem('webhookEndpoint', JSON.stringify(newEndpoint))
        
        // Show notification
        if (showToast) {
          if (isInitialCreation) {
            showNotification("endpointCreated")
          } else {
            showNotification("endpointRenewed")
          }
        }

        // Call success callback if provided
        if (onSuccess) {
          await onSuccess(newEndpoint)
        }

        return newEndpoint
      } catch (error) {
        // Clean up localStorage if we failed to create the endpoint
        localStorage.removeItem('webhookEndpoint')
        throw error
      } finally {
        // Clear the creating promise
        this.creatingEndpoint = null
      }
    })()

    return this.creatingEndpoint
  }
}

// Export singleton instance methods
const manager = EndpointManager.getInstance()
export const getValidEndpoint = manager.getValidEndpoint.bind(manager)
export const createNewEndpoint = manager.createNewEndpoint.bind(manager) 