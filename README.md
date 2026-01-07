# Markify

A professional web application built with Next.js, Shadcn UI, and Playwright to convert Markdown (with Mermaid diagram support) into high-quality PDF reports. Features secure authentication and file management.

## Features

- **🔐 Authentication**: Secure Google OAuth authentication with NextAuth.js v5
- **📁 File Management**: Upload, store, and manage markdown files with PostgreSQL
- **👤 User Dashboard**: Personalized dashboard with file statistics and management
- **📝 Live Preview**: Real-time rendering of Markdown content
- **📊 Mermaid Support**: Seamlessly render diagrams within your markdown
- **📄 PDF Generation**: High-fidelity PDF output using Playwright
- **🎨 Modern UI**: Built with Shadcn UI and Tailwind CSS v4
- **🐳 Dockerized**: Easy deployment with Docker
- **🔒 Secure**: Database sessions, file ownership verification, and proper authentication

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Database**: PostgreSQL with Prisma ORM
- **UI**: Shadcn UI, Tailwind CSS v4, Radix UI
- **PDF Generation**: Playwright
- **Deployment**: Docker, Vercel-ready

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)
- Google Cloud Console account (for OAuth)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

**Using Docker (Recommended)**:
```bash
docker run --name markify-postgres \
  -e POSTGRES_DB=markify \
  -e POSTGRES_USER=markify_user \
  -e POSTGRES_PASSWORD=markify123 \
  -p 5432:5432 \
  -d postgres:16-alpine
```

**Or install PostgreSQL locally** - See [docs/quick-start.md](docs/quick-start.md)

### 3. Configure Environment Variables

Create a `.env` file:

```bash
# Generate secret
openssl rand -base64 32
```

```env
DATABASE_URL="postgresql://markify_user:markify123@localhost:5432/markify?schema=public"
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

See [docs/environment-setup.md](docs/environment-setup.md) for detailed configuration.

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth credentials with redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy credentials to `.env`

**Detailed guide**: [docs/auth-setup.md](docs/auth-setup.md#google-oauth-configuration)

### 5. Run Database Migrations

```bash
npm run db:migrate
```

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in!

## Documentation

- **[Quick Start Guide](docs/quick-start.md)** - Get up and running in 5 minutes
- **[Authentication Setup](docs/auth-setup.md)** - Complete auth and database setup
- **[Environment Setup](docs/environment-setup.md)** - Environment configuration details
- **[API Documentation](docs/api-documentation.md)** - API endpoints and usage

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database commands
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
markify/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/  # Auth endpoints
│   │   │   └── files/               # File management API
│   │   ├── auth/                    # Auth pages
│   │   ├── dashboard/               # Protected dashboard
│   │   └── page.tsx                 # Home page
│   ├── components/
│   │   ├── ui/                      # Shadcn UI components
│   │   ├── file-upload.tsx          # File upload component
│   │   ├── file-list.tsx            # File list component
│   │   └── user-nav.tsx             # User navigation
│   ├── lib/
│   │   ├── auth.ts                  # NextAuth configuration
│   │   └── prisma.ts                # Prisma client
│   └── middleware.ts                # Route protection
├── prisma/
│   └── schema.prisma                # Database schema
├── docs/                            # Documentation
└── public/
    └── uploads/                     # User file uploads
```

## Features in Detail

### Authentication

- Google OAuth integration
- Database-backed sessions for security
- Protected routes with middleware
- User profile management
- Automatic session refresh

### File Management

- Secure file upload with validation
- File type restrictions (markdown, images, PDF)
- File size limits (10MB)
- User-specific file storage
- Download and delete functionality
- Pagination support

### Dashboard

- User statistics (file count, storage used)
- File upload interface with drag-and-drop
- File list with search and filtering
- User profile dropdown
- Responsive design

## Using Docker

### Build and Run

```bash
# Build image
make build

# Run container
make run

# Stop container
make stop
```

### Docker Compose (with PostgreSQL)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: markify
      POSTGRES_USER: markify_user
      POSTGRES_PASSWORD: markify123
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://markify_user:markify123@postgres:5432/markify
      NEXTAUTH_SECRET: your-secret
      NEXTAUTH_URL: http://localhost:3000
    depends_on:
      - postgres

volumes:
  postgres-data:
```

## Production Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

**Database**: Use [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Vercel Postgres](https://vercel.com/storage/postgres)

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Docker

```bash
# Build production image
docker build -t markify .

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="..." \
  -e GOOGLE_CLIENT_ID="..." \
  -e GOOGLE_CLIENT_SECRET="..." \
  markify
```

## Security Best Practices

✅ Database sessions (not JWT)  
✅ HTTP-only cookies  
✅ CSRF protection (built-in)  
✅ File ownership verification  
✅ Input validation  
✅ SQL injection prevention (Prisma)  
✅ Environment variable protection  
✅ Secure password hashing (handled by OAuth)

## Industry Best Practices

- **Next.js App Router**: Server Components and Server Actions
- **TypeScript**: Full type safety across the stack
- **Prisma ORM**: Type-safe database queries
- **NextAuth.js v5**: Modern authentication solution
- **Modular Components**: Reusable UI with Shadcn
- **Database Migrations**: Version-controlled schema changes
- **Error Handling**: Comprehensive error boundaries
- **Responsive Design**: Mobile-first approach
- **Accessibility**: ARIA labels and keyboard navigation

## Troubleshooting

See [docs/auth-setup.md#troubleshooting](docs/auth-setup.md#troubleshooting) for common issues and solutions.

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

## License

MIT

## Support

- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/yourusername/markify/issues)
- 💬 [Discussions](https://github.com/yourusername/markify/discussions)

