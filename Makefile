.PHONY: build up down restart logs ps db-push db-migrate db-studio db-seed dev install setup clean help

# Variables
APP_NAME = markify-app
DB_NAME = markify-db

# Default target
all: help

# --- Docker Commands ---

# Build and start all services
up:
	docker-compose up -d --build
	@echo "Services are running. Access app at http://localhost:3000"

# Stop and remove all containers, networks, and images
down:
	docker-compose down

# Restart services
restart:
	docker-compose restart

# View logs for the application
logs:
	docker-compose logs -f app

# Show running containers
ps:
	docker-compose ps

# --- Database / Prisma Commands ---

# Sync database schema with Prisma (use for initial setup/dev)
db-push:
	docker exec $(APP_NAME) npx prisma db push

# Run Prisma migrations (use for production-like flow)
db-migrate:
	docker exec $(APP_NAME) npx prisma migrate dev

# Open Prisma Studio (access at http://localhost:5555)
db-studio:
	docker exec -it $(APP_NAME) npx prisma studio --port 5555 --browser none

# Run database seed
db-seed:
	docker exec $(APP_NAME) npx prisma db seed

# --- Development Commands ---

# Run local development server (non-docker)
dev:
	npm run dev

# Install local dependencies
install:
	npm install

# Full setup flow
setup: install up db-push
	@echo "Setup complete! App is ready."

# --- Quality & Cleanup ---

# Clean up docker images and volumes
clean:
	docker-compose down -v
	docker rmi $(APP_NAME) || true

# Help command
help:
	@echo "Available commands:"
	@echo "  make up          - Build and start services in Docker"
	@echo "  make down        - Stop and remove Docker services"
	@echo "  make logs        - Follow app logs in Docker"
	@echo "  make db-push     - Sync DB schema using Prisma"
	@echo "  make db-studio   - Open Prisma Studio"
	@echo "  make dev         - Run Next.js dev server locally"
	@echo "  make setup       - Full install and docker setup"
	@echo "  make clean       - Remove all Docker artifacts including volumes"
