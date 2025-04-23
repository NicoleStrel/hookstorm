// Package main for the hookstorm backend webhook API.
package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/hookstorm/backend/config"
	"github.com/hookstorm/backend/handlers"
	"github.com/hookstorm/backend/router"
)

func main() {
	cfg := config.LoadConfig()
	log.Printf("Webhook expiry set to %d seconds", cfg.WebhookExpirySeconds)
	handlers.Setup(cfg)

	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := router.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting hookstorm webhook server on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start hookstorm webhook server: %v", err)
	}
}
