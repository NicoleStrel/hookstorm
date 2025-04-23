// Package router provides route setup for the hookstorm application.
package router

import (
	"github.com/gin-gonic/gin"
	"github.com/hookstorm/backend/handlers"
)

// SetupRouter configures all application routes.
func SetupRouter() *gin.Engine {
	r := gin.Default()

	// API routes
	api := r.Group("/api")
	{
		endpoints := api.Group("/endpoints")
		{
			endpoints.POST("", handlers.CreateEndpoint)
			endpoints.GET("/:id", handlers.GetEndpoint)
			endpoints.GET("/:id/events", handlers.ListEvents)
			endpoints.POST("/:id/events/:event_id/replay", handlers.ReplayEvent)
		}
	}

	// Webhook receiver route
	r.Any("/hook/:id", handlers.ReceiveWebhook)

	return r
}
