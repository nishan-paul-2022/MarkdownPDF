.PHONY: build run stop clean

APP_NAME = markify
PORT = 3000

# Default target
all: build run

# Build the docker image
build:
	docker build -t $(APP_NAME) .

# Run the docker container
run:
	docker run -p $(PORT):3000 --name $(APP_NAME) -d $(APP_NAME)
	@echo "App is running at http://localhost:$(PORT)"

# Stop and remove the docker container
stop:
	docker stop $(APP_NAME) || true
	docker rm $(APP_NAME) || true

# Clean up docker images
clean:
	docker rmi $(APP_NAME) || true

# Dev mode (local)
dev:
	npm run dev

# Install dependencies
install:
	npm install
