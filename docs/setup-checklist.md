# Setup Checklist

Use this checklist to ensure your Markify application is properly configured.

## ✅ Initial Setup

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed (or Docker ready)
- [ ] Google Cloud Console account created
- [ ] Project cloned/downloaded
- [ ] Dependencies installed (`npm install`)

## ✅ Database Setup

### Option 1: Docker (Recommended)

- [ ] Docker installed and running
- [ ] PostgreSQL container created:
  ```bash
  docker run --name markify-postgres \
    -e POSTGRES_DB=markify \
    -e POSTGRES_USER=markify_user \
    -e POSTGRES_PASSWORD=markify123 \
    -p 5432:5432 \
    -d postgres:16-alpine
  ```
- [ ] Container is running (`docker ps`)

### Option 2: Local PostgreSQL

- [ ] PostgreSQL service running
- [ ] Database `markify` created
- [ ] User `markify_user` created with password
- [ ] Permissions granted

### Option 3: Cloud Database

- [ ] Account created (Neon/Supabase/Railway)
- [ ] Database provisioned
- [ ] Connection string obtained

## ✅ Google OAuth Setup

- [ ] Google Cloud project created
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth credentials created (Web application)
- [ ] Authorized redirect URI added:
  - Development: `http://localhost:3000/api/auth/callback/google`
  - Production: `https://yourdomain.com/api/auth/callback/google`
- [ ] Client ID copied
- [ ] Client Secret copied

## ✅ Environment Configuration

- [ ] `.env` file created in root directory
- [ ] `NEXTAUTH_SECRET` generated (`openssl rand -base64 32`)
- [ ] All environment variables set:
  ```env
  DATABASE_URL="postgresql://markify_user:markify123@localhost:5432/markify?schema=public"
  NEXTAUTH_SECRET="your-generated-secret"
  NEXTAUTH_URL="http://localhost:3000"
  GOOGLE_CLIENT_ID="your-google-client-id"
  GOOGLE_CLIENT_SECRET="your-google-client-secret"
  ```
- [ ] `.env` file NOT committed to git (check `.gitignore`)

## ✅ Database Migration

- [ ] Prisma Client generated (`npm run db:generate`)
- [ ] Initial migration created (`npm run db:migrate`)
- [ ] Migration applied successfully
- [ ] Database tables created (verify with `npm run db:studio`)

## ✅ Development Testing

- [ ] Development server started (`npm run dev`)
- [ ] Application accessible at `http://localhost:3000`
- [ ] Sign-in page loads (`/auth/signin`)
- [ ] Google sign-in works
- [ ] Redirected to dashboard after sign-in
- [ ] User info displayed correctly
- [ ] File upload works
- [ ] File list displays
- [ ] File download works
- [ ] File delete works
- [ ] Sign-out works

## ✅ Code Quality

- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] All components render correctly
- [ ] No console errors in browser
- [ ] Responsive design works on mobile

## ✅ Security Checks

- [ ] `.env` file in `.gitignore`
- [ ] No secrets in code
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] Database password is strong
- [ ] OAuth redirect URIs are correct
- [ ] File upload validation works
- [ ] File ownership verification works
- [ ] Protected routes require authentication

## ✅ Production Preparation

### Environment

- [ ] Production database provisioned
- [ ] Production DATABASE_URL obtained
- [ ] Production NEXTAUTH_SECRET generated (different from dev)
- [ ] Production NEXTAUTH_URL set
- [ ] Google OAuth production redirect URI added

### Deployment Platform

#### Vercel

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported in Vercel
- [ ] Environment variables added in Vercel
- [ ] Build settings configured
- [ ] Domain configured (optional)

#### Railway

- [ ] Railway account created
- [ ] Railway CLI installed
- [ ] Project initialized
- [ ] Environment variables set
- [ ] Database connected

#### Docker

- [ ] Dockerfile tested locally
- [ ] Environment variables configured
- [ ] Docker image built
- [ ] Container runs successfully

### Database

- [ ] Production database accessible
- [ ] SSL enabled (if required)
- [ ] Connection pooling configured
- [ ] Backups enabled
- [ ] Migrations applied (`npx prisma migrate deploy`)

### Post-Deployment

- [ ] Application accessible at production URL
- [ ] Google sign-in works in production
- [ ] File upload works in production
- [ ] Database operations work
- [ ] No errors in logs
- [ ] Performance is acceptable

## ✅ Optional Enhancements

- [ ] Rate limiting implemented
- [ ] Error tracking (Sentry) configured
- [ ] Analytics (Vercel Analytics) enabled
- [ ] Monitoring (UptimeRobot) set up
- [ ] CDN configured for file delivery
- [ ] S3/Cloudinary integration (instead of local storage)
- [ ] Email notifications configured
- [ ] 2FA enabled
- [ ] Audit logging implemented

## ✅ Documentation

- [ ] README.md reviewed
- [ ] Setup guides read
- [ ] API documentation reviewed
- [ ] Team members onboarded
- [ ] Deployment process documented

## Troubleshooting

If any step fails, refer to:

1. **[Quick Start Guide](./quick-start.md)** - Basic setup
2. **[Auth Setup Guide](./auth-setup.md#troubleshooting)** - Detailed troubleshooting
3. **[Environment Setup](./environment-setup.md)** - Environment configuration
4. **[Implementation Summary](./implementation-summary.md)** - Technical details

## Common Issues

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps  # For Docker
sudo systemctl status postgresql  # For local

# Test connection
psql -h localhost -U markify_user -d markify
```

### Prisma Client Not Generated

```bash
npm run db:generate
```

### OAuth Redirect Error

- Verify redirect URI matches exactly in Google Console
- Check for http vs https
- Ensure no trailing slashes

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Success Criteria

Your setup is complete when:

✅ You can sign in with Google  
✅ Dashboard loads with your user info  
✅ You can upload a file  
✅ File appears in the list  
✅ You can download the file  
✅ You can delete the file  
✅ You can sign out  
✅ Protected routes redirect to sign-in when not authenticated  

## Next Steps

After completing this checklist:

1. **Customize the application** - Add your branding, features
2. **Integrate PDF conversion** - Connect with existing PDF generation
3. **Add more features** - Templates, sharing, collaboration
4. **Deploy to production** - Follow production checklist
5. **Monitor and maintain** - Set up monitoring, backups

## Support

Need help? Check:

- 📖 [Documentation](../docs/)
- 🐛 [GitHub Issues](https://github.com/yourusername/markify/issues)
- 💬 [Discussions](https://github.com/yourusername/markify/discussions)

---

**Last Updated**: January 2026  
**Version**: 1.0.0
