# Base stage
FROM node:20-slim AS base
WORKDIR /app

# Dependencies stage
FROM base AS deps
# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
# Copy prisma schema so postinstall 'prisma generate' works
COPY prisma ./prisma/
RUN npm ci

# Build stage
FROM base AS builder
# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM mcr.microsoft.com/playwright:v1.49.1-noble AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install fonts and openssl
RUN apt-get update && apt-get install -y \
    fonts-inter \
    fonts-liberation \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy standalone build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Copy prisma directory for migrations/client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Note: We use a simple node startup, but you can run migrations before this if needed
CMD ["node", "server.js"]
