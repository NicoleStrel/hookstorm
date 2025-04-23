# HookStorm's Webhook API Backend

## Running the API

```bash
go mod tidy
go run main.go
```

## Configuration

Hookstorm supports the following env variables:

- `WEBHOOK_EXPIRY_SECONDS`: Time in seconds until webhook endpoints expire (default: 86400, which is 24 hours)
- `PORT`: The port to run the server on (default: 8080)
- `GIN_MODE`: Set to "release" for production mode

Example:
```bash
WEBHOOK_EXPIRY_SECONDS=3600 PORT=9000 go run main.go
```

## API Endpoints

### Create a Webhook Endpoint
- **URL**: `POST /api/endpoints`
- **Body**:
  ```json
  {
    "name": "My Webhook",
    "ttl_seconds": 3600  // Optional
  }
  ```
- **Response**:
  ```json
  {
    "id": "id",
    "name": "My Webhook",
    "created_at": "2025-04-23T15:06:14Z",
    "expires_at": "2025-04-24T15:06:14Z",
    "event_count": 0,
    "url": "http://example.com/unique-id"
  }
  ```

### Get Webhook Endpoint Details
- **URL**: `GET /api/endpoints/:id`
- **Response**: Same as create webhook response
- **Note**: Returns a 410 Gone status if the endpoint has expired

### List Events for an Endpoint
- **URL**: `GET /api/endpoints/:id/events`
- **Response**:
  ```json
  [
    {
      "id": "event-id",
      "endpoint_id": "endpoint-id",
      "received_at": "2025-04-23T15:06:14Z",
      "headers": { "Content-Type": "application/json" },
      "query_params": { "param1": "value1" },
      "body": { "key": "value" },
      "method": "POST",
      "replay_count": 0
    }
  ]
  ```

### Replay an Event
- **URL**: `POST /api/endpoints/:id/events/:event_id/replay`
- **Body**:
  ```json
  {
    "target_url": "https://target-url.com/webhook"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "replayed_at": "2025-04-23T15:06:14Z",
    "response_code": 200
  }
  ```

### Receive a Webhook
- **URL**: `ANY /id`
- **Note**: This endpoint will receive and log all incoming webhooks. All methods (GET, POST, PUT, etc.) are supported.
- **Response**:
  ```json
  {
    "status": "received"
  }
  ```
- **Note**: Returns a 410 Gone status if the endpoint has expired 