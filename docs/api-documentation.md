# API Documentation

## Authentication Endpoints

### Sign In

**Endpoint**: `GET /api/auth/signin`

Redirects to the sign-in page.

### Sign Out

**Endpoint**: `GET /api/auth/signout`

Signs out the current user and redirects to home page.

### Session

**Endpoint**: `GET /api/auth/session`

Returns the current user session.

**Response**:
```json
{
  "user": {
    "id": "clx123...",
    "name": "John Doe",
    "email": "john@example.com",
    "image": "https://..."
  },
  "expires": "2024-02-01T00:00:00.000Z"
}
```

## File Management Endpoints

All file endpoints require authentication. Include session cookie in requests.

### Upload File

**Endpoint**: `POST /api/files`

**Content-Type**: `multipart/form-data`

**Request Body**:
```
file: File (required)
```

**Allowed File Types**:
- `text/markdown` (.md)
- `text/plain` (.txt)
- `application/pdf` (.pdf)
- `image/png` (.png)
- `image/jpeg` (.jpg, .jpeg)
- `image/gif` (.gif)
- `image/webp` (.webp)

**File Size Limit**: 10MB

**Success Response** (201):
```json
{
  "success": true,
  "file": {
    "id": "clx123...",
    "filename": "uuid.md",
    "originalName": "document.md",
    "url": "/uploads/user-id/uuid.md",
    "size": 1024,
    "mimeType": "text/markdown",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:

401 Unauthorized:
```json
{
  "error": "Unauthorized"
}
```

400 Bad Request:
```json
{
  "error": "No file provided"
}
```

```json
{
  "error": "File size exceeds 10MB limit"
}
```

```json
{
  "error": "Invalid file type"
}
```

**Example (JavaScript)**:
```javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])

const response = await fetch('/api/files', {
  method: 'POST',
  body: formData,
})

const data = await response.json()
```

**Example (cURL)**:
```bash
curl -X POST http://localhost:3000/api/files \
  -H "Cookie: next-auth.session-token=..." \
  -F "file=@document.md"
```

### List Files

**Endpoint**: `GET /api/files`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Success Response** (200):
```json
{
  "files": [
    {
      "id": "clx123...",
      "filename": "uuid.md",
      "originalName": "document.md",
      "mimeType": "text/markdown",
      "size": 1024,
      "url": "/uploads/user-id/uuid.md",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Example**:
```javascript
const response = await fetch('/api/files?page=1&limit=20')
const data = await response.json()
```

### Get File Details

**Endpoint**: `GET /api/files/[id]`

**Path Parameters**:
- `id`: File ID

**Success Response** (200):
```json
{
  "file": {
    "id": "clx123...",
    "filename": "uuid.md",
    "originalName": "document.md",
    "mimeType": "text/markdown",
    "size": 1024,
    "url": "/uploads/user-id/uuid.md",
    "metadata": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "userId": "clx456..."
  }
}
```

**Error Responses**:

404 Not Found:
```json
{
  "error": "File not found"
}
```

403 Forbidden:
```json
{
  "error": "Forbidden"
}
```

### Delete File

**Endpoint**: `DELETE /api/files/[id]`

**Path Parameters**:
- `id`: File ID

**Success Response** (200):
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Error Responses**:

404 Not Found:
```json
{
  "error": "File not found"
}
```

403 Forbidden:
```json
{
  "error": "Forbidden"
}
```

**Example**:
```javascript
const response = await fetch(`/api/files/${fileId}`, {
  method: 'DELETE',
})

const data = await response.json()
```

## Error Handling

All API endpoints follow consistent error response format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (authenticated but not authorized)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. For production, consider implementing:

- Per-user rate limits
- Per-IP rate limits
- File upload limits per day/hour

## Authentication

All protected endpoints require a valid session. The session is managed via HTTP-only cookies set by NextAuth.js.

### Client-Side (React)

```javascript
import { useSession } from 'next-auth/react'

function Component() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return <div>Not signed in</div>
  
  return <div>Signed in as {session.user.email}</div>
}
```

### Server-Side (API Routes)

```typescript
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Your logic here
}
```

### Server Components

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }
  
  return <div>Protected content</div>
}
```

## Database Schema

### User

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts      Account[]
  sessions      Session[]
  files         File[]
}
```

### File

```prisma
model File {
  id          String   @id @default(cuid())
  userId      String
  filename    String
  originalName String
  mimeType    String
  size        Int
  storageKey  String   @unique
  url         String?
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Best Practices

### File Upload

1. **Always validate file type and size on the server**
2. **Use unique filenames** (UUID) to prevent conflicts
3. **Store metadata in database** for easy querying
4. **Implement virus scanning** for production
5. **Use signed URLs** for sensitive files

### Security

1. **Always verify user ownership** before allowing access
2. **Use database sessions** instead of JWT for better security
3. **Implement CSRF protection** (built-in with NextAuth)
4. **Sanitize file names** to prevent path traversal
5. **Set appropriate CORS headers**

### Performance

1. **Implement pagination** for large file lists
2. **Use database indexes** on frequently queried fields
3. **Consider CDN** for file delivery
4. **Implement caching** where appropriate
5. **Use connection pooling** for database

## Migration to Cloud Storage

For production, consider migrating from local filesystem to cloud storage:

### AWS S3 Example

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToS3(file: File, key: string) {
  const buffer = Buffer.from(await file.arrayBuffer())
  
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  )
  
  return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`
}
```

### Cloudinary Example

```typescript
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadToCloudinary(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')
  const dataURI = `data:${file.type};base64,${base64}`
  
  const result = await cloudinary.uploader.upload(dataURI, {
    folder: 'markify',
  })
  
  return result.secure_url
}
```

## Testing

### Example Test (Jest/Vitest)

```typescript
import { POST } from '@/app/api/files/route'

describe('File Upload API', () => {
  it('should upload file successfully', async () => {
    const formData = new FormData()
    const file = new File(['content'], 'test.md', { type: 'text/markdown' })
    formData.append('file', file)
    
    const request = new Request('http://localhost:3000/api/files', {
      method: 'POST',
      body: formData,
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.file).toBeDefined()
  })
  
  it('should reject unauthorized requests', async () => {
    // Mock unauthenticated session
    const response = await POST(new Request('http://localhost:3000/api/files'))
    
    expect(response.status).toBe(401)
  })
})
```

## Webhooks (Future Enhancement)

Consider implementing webhooks for:

- File upload completion
- File processing status
- User registration
- Quota limits reached

Example webhook payload:

```json
{
  "event": "file.uploaded",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "fileId": "clx123...",
    "userId": "clx456...",
    "filename": "document.md",
    "size": 1024
  }
}
```
