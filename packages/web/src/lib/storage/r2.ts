import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

/**
 * Returns a lazily-initialised S3Client configured for Cloudflare R2.
 *
 * Environment variables required:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 */
let _client: S3Client | undefined;

export function getR2Client(): S3Client {
  if (!_client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing R2 environment variables: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY',
      );
    }

    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return _client;
}

/**
 * Uploads a tarball to Cloudflare R2 and returns the public CDN URL.
 *
 * @param key    - The object key (e.g. `@scope/agent/1.0.0.tar.gz`)
 * @param body   - The tarball contents as a Buffer
 * @param sha256 - The SHA-256 hash of the tarball for integrity verification
 * @returns The public CDN URL for the uploaded tarball
 */
export async function uploadTarball(
  key: string,
  body: Buffer,
  sha256: string,
): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucket) {
    throw new Error('Missing R2_BUCKET_NAME environment variable');
  }
  if (!publicUrl) {
    throw new Error('Missing R2_PUBLIC_URL environment variable');
  }

  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'application/gzip',
      ChecksumSHA256: sha256,
      Metadata: {
        'sha256': sha256,
      },
    }),
  );

  // Return the public CDN URL (strip trailing slash if present)
  const base = publicUrl.replace(/\/+$/, '');
  return `${base}/${key}`;
}

/**
 * Deletes a tarball from Cloudflare R2.
 *
 * @param key - The object key to delete
 */
export async function deleteTarball(key: string): Promise<void> {
  const bucket = process.env.R2_BUCKET_NAME;

  if (!bucket) {
    throw new Error('Missing R2_BUCKET_NAME environment variable');
  }

  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}
