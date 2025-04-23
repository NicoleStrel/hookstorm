// Package handlers provides HTTP request handlers for the hookstorm webhook API.
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hookstorm/backend/internal/storage"
	"github.com/hookstorm/backend/models"
	"github.com/hookstorm/backend/utils"
)

var WebhookExpirySeconds int

func InitEndpoint(expirySeconds int) {
	WebhookExpirySeconds = expirySeconds
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

	ttl := WebhookExpirySeconds
	if req.TTLSeconds > 0 {
		ttl = req.TTLSeconds
	}
	expiresAt := utils.GetExpiryTime(WebhookExpirySeconds, ttl)

	endpoint := storage.CreateEndpoint(req.Name, expiresAt, ttl)
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
