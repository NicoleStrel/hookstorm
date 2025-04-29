#!/bin/bash

# Help
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  echo "Usage: ./run.sh [options]"
  echo ""
  echo "Options:"
  echo "  --dev      Run in development mode (default)"
  echo "  --prod     Run in production mode"
  echo "  -h, --help Display this help message"
  exit 0
fi

export PORT=${PORT:-8080}
export WEBHOOK_EXPIRY_SECONDS=${WEBHOOK_EXPIRY_SECONDS:-4}

if [ "$1" == "--prod" ]; then
  export GIN_MODE=release
  echo "Running in production mode"
else
  echo "Running in development mode"
fi

echo "Building and running Hookstorm..."
cd "$(dirname "$0")"
echo "Running go mod tidy..."
go mod tidy
go run cmd/hookstorm/main.go 