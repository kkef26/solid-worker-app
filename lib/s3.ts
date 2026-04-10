import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Netlify reserves AWS_* env vars, so we use SOLID_AWS_* prefix in production.
// Fall back to standard AWS_* for local dev compatibility.
const s3 = new S3Client({
  region: process.env.SOLID_AWS_REGION ?? process.env.AWS_REGION ?? 'eu-west-1',
  credentials: {
    accessKeyId: (process.env.SOLID_AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID)!,
    secretAccessKey: (process.env.SOLID_AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY)!,
  },
})

const BUCKET = process.env.S3_BUCKET ?? 'anadomisi-documents'
const PHOTOS_PREFIX = 'photos/'

export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: `${PHOTOS_PREFIX}${key}`,
    ContentType: contentType,
  })
  return getSignedUrl(s3, command, { expiresIn: 300 })
}

export async function getPresignedViewUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
  })
  return getSignedUrl(s3, command, { expiresIn: 3600 })
}

export function buildS3Key(assignmentId: string, workerId: string, filename: string): string {
  const timestamp = Date.now()
  return `${assignmentId}/${workerId}/${timestamp}-${filename}`
}
