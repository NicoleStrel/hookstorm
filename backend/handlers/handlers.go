// Package handlers provides HTTP request handlers for the hookstorm webhook API.
// It implements endpoints for creating, retrieving, and interacting with webhooks.
package handlers

import (
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
	"github.com/hookstorm/backend/config"
	"github.com/hookstorm/backend/models"
	"github.com/hookstorm/backend/storage"
	"github.com/hookstorm/backend/utils"
)

var appConfig config.Config

// InitHandlers initializes the handlers with application configuration.
func InitHandlers(cfg config.Config) {
	appConfig = cfg
}

// CreateEndpoint creates a new webhook endpoint.
// It accepts a name and optional TTL (expiry time) in seconds.
// Returns the created endpoint with a unique URL.
func CreateEndpoint(c *gin.Context) {
	var req models.CreateEndpointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	expiresAt := utils.GetExpiryTime(appConfig.WebhookExpirySeconds, req.TTLSeconds)
	endpoint := storage.CreateEndpoint(req.Name, expiresAt, req.TTLSeconds)

	// Include the full URL in the response
	endpoint.URL = utils.GetFullURL(c.Request, endpoint.ID)

	c.JSON(http.StatusCreated, endpoint)
}

// GetEndpoint retrieves details for a specific webhook endpoint.
// It accepts an endpoint ID as a parameter.
// Returns 404 if the endpoint doesn't exist or 410 if it has expired.
func GetEndpoint(c *gin.Context) {
	id := c.Param("id")
	endpoint, err := storage.GetEndpoint(id)
	if err != nil {
		if err.Error() == "endpoint has expired" {
			c.JSON(http.StatusGone, gin.H{"error": "This webhook endpoint has expired"})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint not found"})
		return
	}

	endpoint.URL = utils.GetFullURL(c.Request, endpoint.ID)

	c.JSON(http.StatusOK, endpoint)
}

// ListEvents lists all events received by a specific webhook endpoint.
// It accepts an endpoint ID as a parameter.
// Returns 404 if the endpoint doesn't exist. Events are returned even if the endpoint has expired.
func ListEvents(c *gin.Context) {
	id := c.Param("id")
	events, err := storage.GetEventsByEndpoint(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint not found"})
		return
	}

	c.JSON(http.StatusOK, events)
}

// ReceiveWebhook receives and logs incoming webhook requests.
// It accepts an endpoint ID as a parameter.
// It captures headers, query parameters, and body from any HTTP method.
// Returns 410 Gone if the endpoint has expired.
func ReceiveWebhook(c *gin.Context) {
	endpointID := c.Param("id")

	// Check if endpoint has expired
	_, err := storage.GetEndpoint(endpointID)
	if err != nil {
		c.JSON(http.StatusGone, gin.H{"error": "This webhook endpoint has expired"})
		return
	}

	// Extract headers and query params
	headers := c.Request.Header
	queryParams := c.Request.URL.Query()

	// Parse body
	body, err := utils.ParseJSONBody(c.Request)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read request body"})
		return
	}

	// Store the event
	_, err = storage.SaveEvent(endpointID, headers, queryParams, body, c.Request.Method)
	if err != nil {
		if err.Error() == "endpoint has expired" {
			c.JSON(http.StatusGone, gin.H{"error": "This webhook endpoint has expired"})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "received"})
}

// validateTargetURL parses a target URL from the request and validates it
// It accepts a gin context as a parameter.
// Returns an error if the target URL is not provided or invalid
func validateTargetURL(c *gin.Context) (string, error) {
	var request struct {
		TargetURL string `json:"target_url" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		return "", err
	}

	// Parse the target URL to validate it
	_, err := url.Parse(request.TargetURL)
	if err != nil {
		return "", err
	}

	return request.TargetURL, nil
}

// ReplayEvent replays a specific webhook event to a target URL.
// It accepts an endpoint ID and event ID as parameters.
// It recreates the original request with all headers, query parameters, and body.
// Returns information about the replay attempt, including success and response code.
func ReplayEvent(c *gin.Context) {
	endpointID := c.Param("id")
	eventID := c.Param("event_id")

	// Get the event to be replayed
	event, err := storage.GetEvent(eventID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	// Check if this event belongs to the specified endpoint
	if event.EndpointID != endpointID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event does not belong to this endpoint"})
		return
	}

	// Validate target URL
	targetURL, err := validateTargetURL(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Target URL is required"})
		return
	}

	// Replay the event
	result := utils.ReplayEvent(
		event.Method,
		targetURL,
		event.Headers,
		event.QueryParams,
		event.Body,
	)

	// If successful, increment the replay count
	if result.Success {
		storage.IncrementReplayCount(eventID)
	}

	c.JSON(http.StatusOK, result)
}
