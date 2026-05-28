const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const DEFAULT_REGION = process.env.S3_REGION || 'ap-south-1';
const DEFAULT_BUCKET = process.env.S3_BUCKET_NAME;
const DEFAULT_PREFIX = process.env.S3_CATALOG_PREFIX || 'catalog';
const DEFAULT_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL;

let s3Client = null;

function getS3Client(region) {
  if (!s3Client) {
    s3Client = new S3Client({ region });
  }
  return s3Client;
}

function sanitizeFilename(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  const base = path.basename(filename || 'image', ext).toLowerCase();
  const safeBase = base.replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'image';
  return { safeBase, ext: ext || '.jpg' };
}

function buildPublicUrl({ bucket, region, key }) {
  if (DEFAULT_PUBLIC_BASE_URL) {
    return `${DEFAULT_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  }

  if (region === 'us-east-1') {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Uploads an image to an S3 bucket and returns its metadata and URL.
 * 
 * Here is how this function works:
 * - It receives a `buffer` (the raw image data), `mimeType`, `originalName` of the file, 
 *   and an optional `prefix` (folder name/path in the bucket).
 * - It determines the S3 bucket and region using environment variables.
 * - If a prefix is provided, it uses that for organizing images into subfolders within the bucket;
 *   otherwise, it uses a default prefix (e.g., "catalog").
 * - It sanitizes the filename and constructs a unique S3 object key. The key looks like:
 *     "<prefix>/<timestamp>-<random-uuid>-<sanitized-filename>.<ext>"
 *   This avoids filename collisions and ensures safe, accessible filenames.
 * - It sends a `PutObjectCommand` to AWS S3 using the AWS SDK, uploading the file contents (`buffer`)
 *   along with its content type (so S3 knows it's an image).
 * - If the upload succeeds, it builds the public URL where the image can be accessed, using either
 *   a custom base URL (if set), or the default S3 public URL format.
 * - Returns an object containing the `bucket`, `key`, and `url` for the uploaded image.
 */
async function uploadImageToS3({ buffer, mimeType, originalName, prefix }) {
  // Get S3 bucket and region from environment variables/config
  const bucket = DEFAULT_BUCKET;
  const region = DEFAULT_REGION;
  // Use provided prefix or default; clean up leading/trailing slashes
  const folderPrefix = (prefix || DEFAULT_PREFIX).replace(/^\/+|\/+$/g, '');

  if (!bucket) {
    throw new Error('S3_BUCKET_NAME is not configured');
  }

  // Sanitize original filename and get safe base name and file extension
  const { safeBase, ext } = sanitizeFilename(originalName);

  // Construct the S3 object key to uniquely identify this file in the bucket
  const key = `${folderPrefix}/${Date.now()}-${crypto.randomUUID()}-${safeBase}${ext}`;

  // Upload the image buffer to S3
  await getS3Client(region).send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  // Build the public URL for accessing the uploaded image
  return {
    bucket,
    key,
    url: buildPublicUrl({ bucket, region, key }),
  };
}

module.exports = {
  uploadImageToS3,
};
