// Package config provides configuration management for the hookstorm webhook API
package config

import (
	"os"
	"strconv"
)

// Config holds application configuration settings.
type Config struct {
	// WebhookExpirySeconds is the time in seconds until webhook endpoints expire.
	WebhookExpirySeconds int
}

// LoadConfig loads configuration from environment variables with defaults.
func LoadConfig() Config {
	config := Config{
		WebhookExpirySeconds: 86400, // Default to 24 hours (86400 seconds) 
	}

	if expiryStr := os.Getenv("WEBHOOK_EXPIRY_SECONDS"); expiryStr != "" {
		if expiry, err := strconv.Atoi(expiryStr); err == nil && expiry > 0 {
			config.WebhookExpirySeconds = expiry
		}
	}

	return config
} 