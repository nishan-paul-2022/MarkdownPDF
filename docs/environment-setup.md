# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/markify?schema=public"

# NextAuth.js
# Generate a secret with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
# Get credentials from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Optional: File Storage (if using S3 or similar)
# AWS_ACCESS_KEY_ID="your-aws-access-key"
# AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
# AWS_REGION="us-east-1"
# AWS_S3_BUCKET="your-bucket-name"
```

## Setup Instructions

### 1. Database Setup

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE markify;
CREATE USER markify_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE markify TO markify_user;
\q

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://markify_user:your_password@localhost:5432/markify?schema=public"
```

**Option B: Docker PostgreSQL**
```bash
docker run --name markify-postgres \
  -e POSTGRES_DB=markify \
  -e POSTGRES_USER=markify_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:16-alpine
```

**Option C: Cloud Database (Recommended for Production)**
- [Neon](https://neon.tech) - Free tier with PostgreSQL
- [Supabase](https://supabase.com) - Free tier with PostgreSQL
- [Railway](https://railway.app) - PostgreSQL hosting
- [Vercel Postgres](https://vercel.com/storage/postgres) - Integrated with Vercel

### 2. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output and set it as `NEXTAUTH_SECRET` in your `.env` file.

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://yourdomain.com/api/auth/callback/google`
5. Copy the Client ID and Client Secret to your `.env` file

### 4. Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

## Production Deployment

### Environment Variables for Production

Update these values for production:

```bash
NEXTAUTH_URL="https://yourdomain.com"
DATABASE_URL="your-production-database-url"
```

### Security Checklist

- ✅ Use strong, unique `NEXTAUTH_SECRET`
- ✅ Never commit `.env` file to version control
- ✅ Use environment-specific URLs
- ✅ Enable SSL for database connections in production
- ✅ Rotate OAuth credentials regularly
- ✅ Use connection pooling for database (Prisma Accelerate or PgBouncer)
- ✅ Set up database backups
- ✅ Monitor database performance and logs

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
npx prisma db pull

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### OAuth Issues

- Verify redirect URIs match exactly (including http/https)
- Check that Google+ API is enabled
- Ensure credentials are correctly copied (no extra spaces)
- Clear browser cookies and try again
