import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const SIGNED_URL_EXPIRES_SECONDS = 3600; // 1 hour

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly accountId: string;

  constructor() {
    this.accountId = process.env.R2_ACCOUNT_ID ?? '';
    this.bucket = process.env.R2_BUCKET_NAME ?? 'linhiq-uploads';

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  /**
   * Upload a chat image to Cloudflare R2.
   * Returns a pre-signed URL valid for 1 hour.
   */
  async uploadChatImage(
    buffer: Buffer,
    mimeType: string,
    userId: string,
  ): Promise<{ url: string; key: string; expiresAt: string }> {
    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported image type: ${mimeType}. Allowed: jpeg, png, webp, gif`,
      );
    }

    // Validate size
    if (buffer.length > MAX_SIZE_BYTES) {
      throw new BadRequestException(
        `Image too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Max 5MB.`,
      );
    }

    const ext = mimeType.split('/')[1];
    const key = `chat-images/${userId}/${randomUUID()}.${ext}`;

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          // Cache for 1 hour
          CacheControl: 'private, max-age=3600',
        }),
      );

      // Generate pre-signed GET URL
      const getCommand = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      const url = await getSignedUrl(this.s3, getCommand, {
        expiresIn: SIGNED_URL_EXPIRES_SECONDS,
      });

      const expiresAt = new Date(
        Date.now() + SIGNED_URL_EXPIRES_SECONDS * 1000,
      ).toISOString();

      this.logger.log(`Uploaded chat image: ${key} for user ${userId}`);
      return { url, key, expiresAt };
    } catch (error) {
      this.logger.error('R2 upload failed:', error);
      throw new BadRequestException('Image upload failed. Please try again.');
    }
  }
}
