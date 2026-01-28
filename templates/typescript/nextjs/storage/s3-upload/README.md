# AWS S3 File Upload

S3 file upload with presigned URLs. Secure client-side uploads directly to S3 without server proxy.

## Features

- **Presigned URLs**: Generate secure, time-limited upload URLs
- **Direct Upload**: Files upload directly to S3, bypassing your server
- **Progress Tracking**: Real-time upload progress with XHR
- **Type Safety**: Full TypeScript support
- **Flexible**: Support for any file type and configurable size limits

## Installation

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner uuid
pnpm add -D @types/uuid
```

## Environment Variables

Add these to your `.env.local`:

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=my-uploads-bucket
```

## AWS S3 Setup

### 1. Create S3 Bucket

Create a bucket in the AWS Console or via CLI:

```bash
aws s3 mb s3://my-uploads-bucket --region us-east-1
```

### 2. Configure CORS

Add this CORS configuration to your bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 3. IAM Policy

Create an IAM user with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::my-uploads-bucket/*"
    }
  ]
}
```

### 4. Public Access (Optional)

If you want uploaded files to be publicly accessible, add this bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-uploads-bucket/uploads/*"
    }
  ]
}
```

## Usage

### File Structure

Copy the template files to your project:

```
src/
├── lib/
│   └── s3.ts                    # S3 client and utilities
├── app/
│   └── api/
│       └── upload/
│           └── route.ts         # Presigned URL API
└── components/
    └── file-upload.tsx          # Upload component
```

### Using the FileUpload Component

```tsx
import { FileUpload } from '@/components/file-upload';

export default function MyPage() {
  const handleUploadComplete = (url: string, key: string) => {
    console.log('File uploaded:', url);
    // Save the URL to your database
  };

  return (
    <FileUpload
      onUploadComplete={handleUploadComplete}
      accept="image/*"
      maxSize={5 * 1024 * 1024} // 5MB
    />
  );
}
```

### Programmatic Upload

```typescript
async function uploadFile(file: File) {
  // 1. Get presigned URL
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
    }),
  });

  const { url, key, publicUrl } = await response.json();

  // 2. Upload directly to S3
  await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  return publicUrl;
}
```

### S3 Utilities

```typescript
import {
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
  deleteFile,
  getPublicUrl,
} from '@/lib/s3';

// Generate upload URL (1 hour expiry by default)
const { url, key } = await getUploadPresignedUrl('uploads/file.jpg', 'image/jpeg');

// Generate download URL for private files
const downloadUrl = await getDownloadPresignedUrl('uploads/file.jpg', 3600);

// Delete a file
await deleteFile('uploads/file.jpg');

// Get public URL (if bucket allows public access)
const publicUrl = getPublicUrl('uploads/file.jpg');
```

## API Reference

### POST /api/upload

Request a presigned upload URL.

**Request Body:**
```json
{
  "filename": "photo.jpg",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "url": "https://bucket.s3.amazonaws.com/...",
  "key": "uploads/user-id/uuid.jpg",
  "publicUrl": "https://bucket.s3.region.amazonaws.com/uploads/user-id/uuid.jpg"
}
```

## Security Considerations

1. **Authentication**: The API route requires authentication via `auth()`. Adjust based on your auth setup.
2. **File Validation**: Add server-side validation for allowed file types and sizes.
3. **Key Structure**: Files are organized by user ID to prevent unauthorized access.
4. **URL Expiry**: Presigned URLs expire after 1 hour by default.

## Customization

### Custom File Key Structure

Modify the key generation in `upload-route.ts`:

```typescript
// By date
const key = `uploads/${year}/${month}/${uuidv4()}.${extension}`;

// By content type
const folder = contentType.startsWith('image/') ? 'images' : 'documents';
const key = `${folder}/${uuidv4()}.${extension}`;
```

### File Type Validation

Add validation in the API route:

```typescript
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

if (!allowedTypes.includes(contentType)) {
  return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
}
```

### Size Limits

The component supports `maxSize` prop for client-side validation. Add server-side limits via S3 bucket policies or pre-validation.
