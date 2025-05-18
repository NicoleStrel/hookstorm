import { toast } from "sonner"

type ToastType = "success" | "error" | "info"

interface ToastOptions {
  title: string
  description: string
  type?: ToastType
}

const toastMessages = {
  endpointRenewed: {
    title: "Endpoint renewed",
    description: "Your webhook endpoint has been automatically renewed.",
    type: "success" as const,
  },
  endpointCreated: {
    title: "Endpoint created",
    description: "Your new webhook endpoint has been created successfully.",
    type: "success" as const,
  },
  endpointError: {
    title: "Error",
    description: "Failed to renew webhook endpoint. Please refresh the page.",
    type: "error" as const,
  },
  endpointCreateError: {
    title: "Error",
    description: "Failed to create webhook endpoint. Please try again.",
    type: "error" as const,
  },
  copiedToClipboard: {
    title: "Copied to clipboard",
    description: "The content has been copied to your clipboard.",
    type: "info" as const,
  },
  curlCommandCopied: {
    title: "Curl command copied",
    description: "The curl command has been copied to your clipboard.",
    type: "info" as const,
  },
  eventReplayed: {
    title: "Event replayed",
    description: "The webhook event has been replayed successfully.",
    type: "success" as const,
  },
  eventReplayError: {
    title: "Error",
    description: "Failed to replay webhook event. Please try again.",
    type: "error" as const,
  },
  fetchError: {
    title: "Error",
    description: "Failed to fetch webhook data. Please try refreshing the page.",
    type: "error" as const,
  },
} as const

export function showNotification(key: keyof typeof toastMessages) {
  const message = toastMessages[key]
  if (message.type === "error") {
    toast.error(message.title, {
      description: message.description,
    })
  } else {
    toast(message.title, {
      description: message.description,
    })
  }
} 