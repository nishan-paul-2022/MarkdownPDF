# Docker Quick Start Guide

This guide covers how to run the Markify application and PostgreSQL database using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

## Running with Docker Compose

1. **Configure Environment Variables**
   Ensure your `.env` file exists in the root directory. If you are using Google OAuth, make sure the `NEXTAUTH_URL` is set correctly (e.g., `http://localhost:3000`).

2. **Start the Services**
   Run the following command to build the image and start the containers in detached mode:
   ```bash
   docker-compose up -d --build
   ```

3. **Verify Database Connection**
   Wait a few seconds for the database to initialize.

4. **Run Database Migrations**
   You need to push your schema or run migrations on the Docker container's database:
   ```bash
   docker exec markify-app npx prisma db push
   ```
   *Note: Using `db push` is recommended for initial setup. For production, use `npx prisma migrate deploy`.*

5. **Access the Application**
   Open your browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

## Useful Commands

### View Logs
```bash
docker-compose logs -f app
```

### Stop Services
```bash
docker-compose down
```

### Open Database Studio (Drizzle/Prisma)
If you want to view the database content via Prisma Studio while running in Docker:
```bash
docker exec -it markify-app npx prisma studio --port 5555 --browser none
```
Then access it at `http://localhost:5555`.

### Open Database via pgAdmin
You can now also use pgAdmin to browse the database:
1.  Navigate to `http://localhost:5050`
2.  Login with:
    *   **Email**: `admin@markify.com` (unless changed in `.env`)
    *   **Password**: `admin123` (unless changed in `.env`)
3.  Add a New Server:
    *   **Name**: `Markify DB`
    *   **Host**: `db`
    *   **Port**: `5432`
    *   **Maintenance database**: `markify`
    *   **Username**: `markify_user`
    *   **Password**: `markify123`

### Reset Everything
```bash
docker-compose down -v
docker-compose up -d --build
```

## Troubleshooting

- **Database Connection Error**: If the app starts before the DB is ready, it might crash. Docker Compose `restart: always` will handle the retry.
- **Google OAuth**: Ensure `http://localhost:3000/api/auth/callback/google` is added to your authorized redirect URIs in the Google Cloud Console.
- **Port Conflicts**: If port 3000 or 5432 is already in use, change the mapping in `docker-compose.yml`.
