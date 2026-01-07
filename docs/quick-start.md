# Quick Start Guide

Get Markify up and running with authentication in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL installed (or use Docker)
- Google account

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Database

### Option A: Docker (Easiest)

```bash
docker run --name markify-postgres \
  -e POSTGRES_DB=markify \
  -e POSTGRES_USER=markify_user \
  -e POSTGRES_PASSWORD=markify123 \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### Option B: Local PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE markify;
CREATE USER markify_user WITH PASSWORD 'markify123';
GRANT ALL PRIVILEGES ON DATABASE markify TO markify_user;
\q
```

## 3. Configure Environment Variables

Create `.env` file in the root directory:

```bash
# Generate secret
openssl rand -base64 32
```

Then create `.env`:

```env
DATABASE_URL="postgresql://markify_user:markify123@localhost:5432/markify?schema=public"
NEXTAUTH_SECRET="paste-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

## 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth credentials:
   - Type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret to `.env`

**Detailed instructions**: See [docs/auth-setup.md](./auth-setup.md#google-oauth-configuration)

## 5. Run Database Migrations

```bash
npm run db:migrate
```

Enter migration name: `init`

## 6. Start Development Server

```bash
npm run dev
```

## 7. Test It Out!

1. Open http://localhost:3000
2. Go to http://localhost:3000/auth/signin
3. Sign in with Google
4. You should see the dashboard!

## Common Issues

### Can't connect to database

```bash
# Check if PostgreSQL is running
docker ps  # For Docker
sudo systemctl status postgresql  # For local install
```

### OAuth redirect error

- Make sure redirect URI in Google Console is exactly: `http://localhost:3000/api/auth/callback/google`
- No trailing slash!
- Use http (not https) for localhost

### Prisma errors

```bash
# Regenerate Prisma Client
npm run db:generate

# Reset database (deletes all data)
npx prisma migrate reset
```

## Useful Commands

```bash
# View database in browser
npm run db:studio

# Generate Prisma Client
npm run db:generate

# Create new migration
npm run db:migrate

# Push schema without migration
npm run db:push
```

## Next Steps

- Read the [full setup guide](./auth-setup.md)
- Review the [environment setup guide](./environment-setup.md)
- Check out the [API documentation](./api-documentation.md)

## Need Help?

Check the [troubleshooting section](./auth-setup.md#troubleshooting) in the full setup guide.
