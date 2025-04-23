// Package main for the hookstorm backend webhook API.
package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/hookstorm/backend/config"
	"github.com/hookstorm/backend/handlers"
)

func main() {
	cfg := config.LoadConfig()
	log.Printf("Webhook expiry set to %d seconds", cfg.WebhookExpirySeconds)
	handlers.InitHandlers(cfg)

	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

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

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting hookstorm webhook server on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start hookstorm webhook server: %v", err)
	}
}
