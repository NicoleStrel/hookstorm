/**
 * Custom error types for API responses
 */

export class EndpointExpiredError extends Error {
  constructor() {
    super("Endpoint has expired")
    this.name = "EndpointExpiredError"
  }
}

export class EndpointNotFoundError extends Error {
  constructor() {
    super("Endpoint not found")
    this.name = "EndpointNotFoundError"
  }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ApiError"
  }
} 