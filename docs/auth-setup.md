# Authentication & Database Setup Guide

This guide covers the complete setup of Google OAuth authentication and PostgreSQL database integration for Markify.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Database Setup](#database-setup)
4. [Google OAuth Configuration](#google-oauth-configuration)
5. [Environment Variables](#environment-variables)
6. [Running Migrations](#running-migrations)
7. [Testing the Setup](#testing-the-setup)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

### Technology Stack

- **Authentication**: NextAuth.js v5 (Auth.js)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **OAuth Provider**: Google
- **Session Storage**: Database (secure, server-side)
- **File Storage**: Local filesystem (with database metadata)

### Database Schema

```
users
├── id (cuid)
├── name
├── email (unique)
├── emailVerified
├── image
├── createdAt
└── updatedAt

accounts (OAuth providers)
├── id
├── userId (FK -> users)
├── provider (google)
├── providerAccountId
├── access_token
├── refresh_token
└── ...

sessions
├── id
├── sessionToken (unique)
├── userId (FK -> users)
└── expires

files
├── id
├── userId (FK -> users)
├── filename
├── originalName
├── mimeType
├── size
├── storageKey
├── url
├── metadata (JSON)
├── createdAt
└── updatedAt
```

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed (or access to a cloud database)
- Google Cloud Console account
- Terminal/Command line access

## Database Setup

### Option 1: Local PostgreSQL (Development)

#### Ubuntu/Debian

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL shell:

```sql
CREATE DATABASE markify;
CREATE USER markify_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE markify TO markify_user;
ALTER DATABASE markify OWNER TO markify_user;
\q
```

#### macOS

```bash
# Install PostgreSQL via Homebrew
brew install postgresql@16

# Start PostgreSQL
brew services start postgresql@16

# Create database
createdb markify
```

#### Windows

1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer
3. Use pgAdmin or command line to create database

### Option 2: Docker PostgreSQL (Recommended for Development)

```bash
# Create and run PostgreSQL container
docker run --name markify-postgres \
  -e POSTGRES_DB=markify \
  -e POSTGRES_USER=markify_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -v markify-data:/var/lib/postgresql/data \
  -d postgres:16-alpine

# Verify it's running
docker ps

# View logs
docker logs markify-postgres
```

To stop/start the container:

```bash
docker stop markify-postgres
docker start markify-postgres
```

### Option 3: Cloud Database (Production)

#### Neon (Recommended - Free Tier Available)

1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Copy the connection string
4. Use it as your `DATABASE_URL`

#### Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (Transaction mode)

#### Railway

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL service
4. Copy the connection string

#### Vercel Postgres

```bash
# Install Vercel CLI
npm i -g vercel

# Create Postgres database
vercel postgres create
```

## Google OAuth Configuration

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "Markify Auth"
4. Click "Create"

### Step 2: Enable Google+ API

1. In the left sidebar, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (unless you have Google Workspace)
3. Click "Create"
4. Fill in the required fields:
   - App name: "Markify"
   - User support email: your email
   - Developer contact: your email
5. Click "Save and Continue"
6. Skip "Scopes" (click "Save and Continue")
7. Add test users (your email) for development
8. Click "Save and Continue"

### Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Name: "Markify Web Client"
5. Add Authorized JavaScript origins:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
6. Add Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Click "Create"
8. **IMPORTANT**: Copy the Client ID and Client Secret

### Step 5: Save Credentials

Copy the Client ID and Client Secret to your `.env` file (see next section).

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://markify_user:your_secure_password@localhost:5432/markify?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-this-with-openssl-command-below"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy the output and paste it as the value for `NEXTAUTH_SECRET`.

### Important Notes

- **Never commit `.env` to version control**
- The `.env` file is already in `.gitignore`
- For production, use environment variables from your hosting platform
- Keep your secrets secure and rotate them regularly

## Running Migrations

### Step 1: Generate Prisma Client

```bash
npm run db:generate
```

This generates the Prisma Client based on your schema.

### Step 2: Create Initial Migration

```bash
npm run db:migrate
```

When prompted, enter a migration name: `init`

This will:
- Create the migration files
- Apply the migration to your database
- Generate the Prisma Client

### Step 3: Verify Database

```bash
npm run db:studio
```

This opens Prisma Studio in your browser where you can:
- View all tables
- Inspect the schema
- Manually add/edit data (for testing)

## Testing the Setup

### Step 1: Start Development Server

```bash
npm run dev
```

### Step 2: Test Authentication Flow

1. Open `http://localhost:3000`
2. Navigate to `/auth/signin`
3. Click "Continue with Google"
4. Sign in with your Google account
5. You should be redirected to `/dashboard`

### Step 3: Test File Upload

1. In the dashboard, upload a test file
2. Verify it appears in the file list
3. Check Prisma Studio to see the database record
4. Check `public/uploads/[user-id]/` for the physical file

### Step 4: Test File Management

1. Download a file
2. Delete a file
3. Verify the file is removed from both database and filesystem

## Production Deployment

### Environment Variables

Set these in your hosting platform (Vercel, Railway, etc.):

```bash
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://yourdomain.com"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Database Migration

```bash
# Push schema to production database
npm run db:push

# Or run migrations
npx prisma migrate deploy
```

### Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET

# Redeploy
vercel --prod
```

### Important Production Considerations

1. **Database Connection Pooling**: Use PgBouncer or Prisma Accelerate
2. **File Storage**: Consider using S3, Cloudinary, or similar for production
3. **SSL**: Enable SSL for database connections
4. **Backups**: Set up automated database backups
5. **Monitoring**: Use logging and error tracking (Sentry, LogRocket)
6. **Rate Limiting**: Implement rate limiting on API routes
7. **CORS**: Configure CORS properly for your domain

## Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list  # macOS
docker ps  # Docker

# Test connection
psql -h localhost -U markify_user -d markify
```

**Error**: `Authentication failed`

- Verify username and password in `DATABASE_URL`
- Check PostgreSQL user permissions
- Ensure database exists

### Prisma Issues

**Error**: `Prisma Client not generated`

```bash
npm run db:generate
```

**Error**: `Migration failed`

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or manually fix and retry
npm run db:migrate
```

### OAuth Issues

**Error**: `redirect_uri_mismatch`

- Verify the redirect URI in Google Console matches exactly
- Check for http vs https
- Ensure no trailing slashes

**Error**: `OAuthAccountNotLinked`

- This email is already linked to another provider
- User needs to sign in with original provider
- Or implement account linking

**Error**: `Access blocked: This app's request is invalid`

- OAuth consent screen not configured
- App not published (add yourself as test user)
- Missing required scopes

### Session Issues

**Error**: `No session found`

- Check `NEXTAUTH_SECRET` is set
- Verify database connection
- Clear browser cookies
- Check middleware configuration

### File Upload Issues

**Error**: `Failed to upload file`

- Check file size (max 10MB)
- Verify file type is allowed
- Ensure upload directory has write permissions
- Check disk space

```bash
# Create upload directory
mkdir -p public/uploads
chmod 755 public/uploads
```

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use different secrets for dev/prod
   - Rotate secrets regularly

2. **Database**
   - Use strong passwords
   - Enable SSL in production
   - Regular backups
   - Limit user permissions

3. **Authentication**
   - Use database sessions (not JWT)
   - Set appropriate session expiry
   - Implement CSRF protection (built-in)
   - Enable 2FA for admin accounts

4. **File Upload**
   - Validate file types
   - Limit file sizes
   - Scan for malware
   - Use signed URLs for downloads

5. **API Routes**
   - Always check authentication
   - Verify resource ownership
   - Implement rate limiting
   - Validate all inputs

## Additional Resources

- [NextAuth.js Documentation](https://authjs.dev)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review error logs
3. Check Prisma Studio for database state
4. Verify environment variables
5. Test with Prisma Studio and database directly

## Next Steps

After completing this setup:

1. ✅ Test authentication flow
2. ✅ Test file upload/download
3. ✅ Review security settings
4. ✅ Set up production database
5. ✅ Configure production OAuth
6. ✅ Deploy to production
7. ✅ Set up monitoring and logging
8. ✅ Configure backups
