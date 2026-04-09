import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Netlify reserves AWS_* env vars — use SOLID_AWS_* prefix
const s3Client = new S3Client({
  region: process.env.SOLID_AWS_REGION || process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: (process.env.SOLID_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID)!,
    secretAccessKey: (process.env.SOLID_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)!,
  },
});

const BUCKET = process.env.S3_BUCKET || 'anadomisi-documents';

export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 300 });
}

export function buildS3Key(assignmentId: string, workerId: string, filename: string): string {
  const timestamp = Date.now();
  return `photos/${assignmentId}/${workerId}/${timestamp}_${filename}`;
}
