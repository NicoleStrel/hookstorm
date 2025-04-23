// Package models defines the data structures used in the hookstorm webhook API
package models

import (
	"time"
)

// WebhookEndpoint represents a temporary webhook endpoint
type WebhookEndpoint struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	CreatedAt  time.Time `json:"created_at"`
	ExpiresAt  time.Time `json:"expires_at"`
	EventCount int       `json:"event_count"`
	URL        string    `json:"url"`
}

// WebhookEvent represents a received webhook event
type WebhookEvent struct {
	ID          string                 `json:"id"`
	EndpointID  string                 `json:"endpoint_id"`
	ReceivedAt  time.Time              `json:"received_at"`
	Headers     map[string][]string    `json:"headers"`
	QueryParams map[string][]string    `json:"query_params,omitempty"`
	Body        map[string]interface{} `json:"body"`
	Method      string                 `json:"method"`
	ReplayCount int                    `json:"replay_count"`
}

// CreateEndpointRequest is used for creating a new webhook endpoint
type CreateEndpointRequest struct {
	Name       string `json:"name" binding:"required"`
	TTLSeconds int    `json:"ttl_seconds,omitempty"`
}

// ReplayResponse represents the result of a webhook replay operation.
// It is used both internally and as an API response.
type ReplayResponse struct {
	Success      bool      `json:"success"`
	ReplayedAt   time.Time `json:"replayed_at"`
	ResponseCode int       `json:"response_code,omitempty"`
	Error        string    `json:"error,omitempty"`
}
