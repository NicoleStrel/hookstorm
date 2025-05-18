// Package storage provides in-memory storage for webhook endpoints and events for the hookstorm webhook API.
package storage

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/hookstorm/backend/models"
)

// In-memory storage for endpoints and events
var (
	endpoints        = make(map[string]models.WebhookEndpoint)
	events           = make(map[string]models.WebhookEvent)
	eventsByEndpoint = make(map[string][]string) // Maps endpoint IDs to event IDs
	mu               sync.RWMutex
)

// CreateEndpoint creates a new webhook endpoint with the given name
// and expiration time. It returns the created endpoint.
func CreateEndpoint(name string, expiresAt time.Time, ttlSeconds int) models.WebhookEndpoint {
	mu.Lock()
	defer mu.Unlock()

	id := uuid.New().String()
	endpoint := models.WebhookEndpoint{
		ID:         id,
		Name:       name,
		CreatedAt:  time.Now(),
		ExpiresAt:  expiresAt,
		EventCount: 0,
		URL:        id,
	}

	endpoints[id] = endpoint
	eventsByEndpoint[id] = []string{}

	return endpoint
}

// validateEndpoint checks if an endpoint exists and has not expired.
// Returns the endpoint and nil if valid, or empty endpoint and an error otherwise.
func validateEndpoint(endpointID string) (models.WebhookEndpoint, error) {
	endpoint, exists := endpoints[endpointID]
	if !exists {
		return models.WebhookEndpoint{}, errors.New("endpoint not found")
	}
	if time.Now().After(endpoint.ExpiresAt) {
		return models.WebhookEndpoint{}, errors.New("endpoint has expired")
	}
	return endpoint, nil
}

// GetEndpoint retrieves an endpoint by ID. It returns an error if the endpoint
// doesn't exist or has expired.
func GetEndpoint(id string) (models.WebhookEndpoint, error) {
	mu.RLock()
	defer mu.RUnlock()

	return validateEndpoint(id)
}

// SaveEvent saves a webhook event for a specific endpoint. It captures headers,
// query parameters, body, and request method. Returns an error if the endpoint
// doesn't exist or has expired.
func SaveEvent(endpointID string, headers map[string][]string, queryParams map[string][]string,
	body map[string]interface{}, method string, statusCode int) (models.WebhookEvent, error) {
	mu.Lock()
	defer mu.Unlock()

	// Check if endpoint exists and hasn't expired
	endpoint, err := validateEndpoint(endpointID)
	if err != nil {
		return models.WebhookEvent{}, err
	}

	// Create new event
	eventID := uuid.New().String()
	event := models.WebhookEvent{
		ID:          eventID,
		EndpointID:  endpointID,
		ReceivedAt:  time.Now(),
		Headers:     headers,
		QueryParams: queryParams,
		Body:        body,
		Method:      method,
		ReplayCount: 0,
		StatusCode:  statusCode,
	}

	// Save event
	events[eventID] = event
	eventsByEndpoint[endpointID] = append(eventsByEndpoint[endpointID], eventID)

	// Update endpoint event count
	endpoint.EventCount++
	endpoints[endpointID] = endpoint

	return event, nil
}

// GetEvent retrieves an event by ID. Returns an error if the event doesn't exist.
func GetEvent(eventID string) (models.WebhookEvent, error) {
	mu.RLock()
	defer mu.RUnlock()

	event, exists := events[eventID]
	if !exists {
		return models.WebhookEvent{}, errors.New("event not found")
	}

	return event, nil
}

// GetEventsByEndpoint retrieves all events for an endpoint.
// Returns an error if the endpoint doesn't exist.
func GetEventsByEndpoint(endpointID string) ([]models.WebhookEvent, error) {
	mu.RLock()
	defer mu.RUnlock()

	// Check if endpoint exists
	_, exists := endpoints[endpointID]
	if !exists {
		return nil, errors.New("endpoint not found")
	}

	eventIDs, exists := eventsByEndpoint[endpointID]
	if !exists {
		return []models.WebhookEvent{}, nil
	}

	result := make([]models.WebhookEvent, 0, len(eventIDs))
	for _, id := range eventIDs {
		if event, ok := events[id]; ok {
			result = append(result, event)
		}
	}

	return result, nil
}

// IncrementReplayCount increments the replay count for an event.
// Returns an error if the event doesn't exist.
func IncrementReplayCount(eventID string) error {
	mu.Lock()
	defer mu.Unlock()

	event, exists := events[eventID]
	if !exists {
		return errors.New("event not found")
	}

	event.ReplayCount++
	events[eventID] = event

	return nil
}
