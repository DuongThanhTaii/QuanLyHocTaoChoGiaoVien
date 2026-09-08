import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_SUBMISSIONS_BUCKET'] as const;

function config() {
  for (const key of required) if (!process.env[key]) throw new Error(`Thiếu cấu hình ${key}`);
  return {
    bucket: process.env.R2_SUBMISSIONS_BUCKET!,
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
    }),
  };
}

export async function createSubmissionUploadUrl(key: string, contentType: string) {
  const { client, bucket } = config();
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: 60 * 10 });
}

export async function createSubmissionDownloadUrl(key: string, download = false) {
  const { client, bucket } = config();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: download ? 'attachment' : undefined }), { expiresIn: 60 * 10 });
}

export async function deleteSubmissionObject(key: string) {
  const { client, bucket } = config();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
