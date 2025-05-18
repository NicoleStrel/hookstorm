import { createEndpoint } from "@/app/actions"
import { showNotification } from "@/lib/toast-utils"

interface CreateEndpointOptions {
  onSuccess?: (endpoint: any) => void | Promise<void>
  isInitialCreation?: boolean
  showToast?: boolean
}

export async function createNewEndpoint({
  onSuccess,
  isInitialCreation = false,
  showToast = true
}: CreateEndpointOptions = {}) {
  try {
    const newEndpoint = await createEndpoint("Webhook Endpoint")
    
    // Store in localStorage
    localStorage.setItem('webhookEndpoint', JSON.stringify(newEndpoint))
    
    // Show appropriate notification
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
    if (showToast) {
      if (isInitialCreation) {
        showNotification("endpointCreateError")
      } else {
        showNotification("endpointError")
      }
    }
    throw error
  }
} 