// Package utils provides common utility functions used across the application.
package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/hookstorm/backend/models"
)

// GetExpiryTime calculates an expiration time based on a TTL in seconds.
func GetExpiryTime(defaultTTL, customTTL int) time.Time {
	ttl := defaultTTL
	if customTTL > 0 {
		ttl = customTTL
	}
	return time.Now().Add(time.Duration(ttl) * time.Second)
}

// GetFullURL constructs a full URL for a webhook endpoint path.
func GetFullURL(req *http.Request, path string) string {
	scheme := "http"
	if req.TLS != nil {
		scheme = "https"
	}
	baseURL := fmt.Sprintf("%s://%s", scheme, req.Host)
	return baseURL + path
}

// ParseJSONBody attempts to parse the request body as JSON.
// If parsing fails, it returns a map with the raw body as a string.
// It also restores the request body for subsequent reads.
func ParseJSONBody(req *http.Request) (map[string]interface{}, error) {
	bodyData, err := io.ReadAll(req.Body)
	if err != nil {
		return nil, err
	}

	// Restore the body for potential middleware
	req.Body = io.NopCloser(bytes.NewBuffer(bodyData))

	var body map[string]interface{}

	if len(bodyData) > 0 {
		if err := json.Unmarshal(bodyData, &body); err != nil {
			// If not valid JSON, store as raw string
			body = map[string]interface{}{
				"raw": string(bodyData),
			}
		}
	} else {
		body = make(map[string]interface{})
	}

	return body, nil
}

// ReplayEvent sends a webhook event to a target URL with the original headers,
// query parameters, and body.
func ReplayEvent(
	method string,
	targetURL string,
	headers map[string][]string,
	queryParams map[string][]string,
	body map[string]interface{},
) models.ReplayResponse {
	result := models.ReplayResponse{}

	// Create a new HTTP client and request
	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	bodyJSON, err := json.Marshal(body)
	if err != nil {
		result.Success = false
		result.Error = "Failed to prepare request body: " + err.Error()
		return result
	}
	req, err := http.NewRequest(method, targetURL, bytes.NewBuffer(bodyJSON))
	if err != nil {
		result.Success = false
		result.Error = "Failed to create request: " + err.Error()
		return result
	}

	// Add headers
	for k, values := range headers {
		// Do not use original host header
		if k != "Host" {
			for _, v := range values {
				req.Header.Add(k, v)
			}
		}
	}

	// Add query parameters
	if len(queryParams) > 0 {
		q := req.URL.Query()
		for k, values := range queryParams {
			for _, v := range values {
				q.Add(k, v)
			}
		}
		req.URL.RawQuery = q.Encode()
	}

	result.ReplayedAt = time.Now().UTC()

	// Send the request
	resp, err := client.Do(req)
	if err != nil {
		result.Success = false
		result.Error = err.Error()
		return result
	}
	defer resp.Body.Close()

	result.Success = true
	result.ResponseCode = resp.StatusCode
	return result
}
