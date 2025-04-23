// Package handlers provides HTTP request handlers for the hookstorm webhook API.
package handlers

import (
	"github.com/hookstorm/backend/config"
)

// Setup initializes all handlers with config.
func Setup(cfg config.Config) {
	InitEndpoint(cfg.WebhookExpirySeconds)
}
