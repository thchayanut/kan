import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// Dynamic import for Sharp to handle platform compatibility
let sharpInstance: any = null;

// Initialize Sharp lazily
async function getSharp() {
    if (!sharpInstance) {
        try {
            const sharpModule = await import('sharp');
            sharpInstance = sharpModule.default;
        } catch (error) {
            console.warn('Sharp not available:', error);
            throw new Error('Image processing is not available in this environment. Sharp library failed to load.');
        }
    }
    return sharpInstance;
}
import { generateUID } from "@kan/shared";

export interface S3Config {
    region: string;
    endpoint?: string;
    forcePathStyle?: boolean;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    storageUrl: string;
}

export interface ImageUploadOptions {
    filename: string;
    mimeType: string;
    fileSize: number;
    cardPublicId: string;
    userId: string;
}

export interface PresignedUploadResult {
    uploadUrl: string;
    s3Key: string;
    s3Url: string;
    thumbnailS3Key: string;
    thumbnailS3Url: string;
}

export interface ThumbnailOptions {
    width?: number;
    height?: number;
    quality?: number;
}

export class S3Service {
    private client: S3Client;
    private config: S3Config;

    constructor(config: S3Config) {
        this.config = config;
        this.client = new S3Client({
            region: config.region,
            ...(config.endpoint && { endpoint: config.endpoint }),
            forcePathStyle: config.forcePathStyle,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
    }

    /**
     * Generate a presigned URL for image upload
     */
    async generatePresignedUploadUrl(
        options: ImageUploadOptions,
    ): Promise<PresignedUploadResult> {
        const imageId = generateUID();
        const fileExtension = this.getFileExtension(options.mimeType);

        // Generate S3 keys
        const s3Key = `cards/${options.cardPublicId}/images/${imageId}${fileExtension}`;
        const thumbnailS3Key = `cards/${options.cardPublicId}/images/thumbnails/${imageId}${fileExtension}`;

        // Generate URLs
        const s3Url = `${this.config.storageUrl}/${s3Key}`;
        const thumbnailS3Url = `${this.config.storageUrl}/${thumbnailS3Key}`;

        // Create presigned URL for upload (simplified for browser compatibility)
        const uploadCommand = new PutObjectCommand({
            Bucket: this.config.bucketName,
            Key: s3Key,
            ContentType: options.mimeType,
        });

        const uploadUrl = await getSignedUrl(this.client, uploadCommand, {
            expiresIn: 900, // 15 minutes
        });



        return {
            uploadUrl,
            s3Key,
            s3Url,
            thumbnailS3Key,
            thumbnailS3Url,
        };
    }

    /**
     * Delete an image from S3
     */
    async deleteImage(s3Key: string): Promise<void> {
        const deleteCommand = new DeleteObjectCommand({
            Bucket: this.config.bucketName,
            Key: s3Key,
        });

        await this.client.send(deleteCommand);
    }

    /**
     * Delete both original and thumbnail images
     */
    async deleteImageWithThumbnail(
        s3Key: string,
        thumbnailS3Key?: string,
    ): Promise<void> {
        // Delete original image
        await this.deleteImage(s3Key);

        // Delete thumbnail if it exists
        if (thumbnailS3Key) {
            try {
                await this.deleteImage(thumbnailS3Key);
            } catch (error) {
                // Log error but don't fail the operation if thumbnail deletion fails
                console.warn(`Failed to delete thumbnail ${thumbnailS3Key}:`, error);
            }
        }
    }

    /**
     * Generate and upload a thumbnail for an image
     */
    async generateAndUploadThumbnail(
        originalS3Key: string,
        thumbnailS3Key: string,
        options: ThumbnailOptions = {},
    ): Promise<void> {
        const { width = 200, height = 200, quality = 85 } = options;

        try {
            // Download original image
            const getCommand = new GetObjectCommand({
                Bucket: this.config.bucketName,
                Key: originalS3Key,
            });

            const response = await this.client.send(getCommand);

            if (!response.Body) {
                throw new Error("Failed to download original image");
            }

            // Convert stream to buffer
            const imageBuffer = await this.streamToBuffer(response.Body);

            // Generate optimized thumbnail using Sharp
            const Sharp = await getSharp();
            const thumbnailBuffer = await Sharp(imageBuffer)
                .resize(width, height, {
                    fit: "inside",
                    withoutEnlargement: true,
                    kernel: 'lanczos3', // Better quality resizing
                })
                .jpeg({ 
                    quality,
                    progressive: true, // Progressive JPEG for better loading
                    mozjpeg: true, // Use mozjpeg encoder for better compression
                    optimiseScans: true,
                })
                .toBuffer();

            // Upload thumbnail
            const putCommand = new PutObjectCommand({
                Bucket: this.config.bucketName,
                Key: thumbnailS3Key,
                Body: thumbnailBuffer,
                ContentType: "image/jpeg",
                CacheControl: 'public, max-age=31536000', // 1 year cache for thumbnails
                ContentDisposition: 'inline',
            });

            await this.client.send(putCommand);
        } catch (error) {
            console.error(`Failed to generate thumbnail for ${originalS3Key}:`, error);
            throw error;
        }
    }

    /**
     * Get image metadata from S3
     */
    async getImageMetadata(s3Key: string) {
        try {
            const getCommand = new GetObjectCommand({
                Bucket: this.config.bucketName,
                Key: s3Key,
            });

            const response = await this.client.send(getCommand);

            if (!response.Body) {
                throw new Error("Image not found");
            }

            // Get image buffer to extract dimensions using Sharp
            const imageBuffer = await this.streamToBuffer(response.Body);
            const Sharp = await getSharp();
            const metadata = await Sharp(imageBuffer).metadata();

            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: response.ContentLength,
                lastModified: response.LastModified,
            };
        } catch (error) {
            console.error(`Failed to get metadata for ${s3Key}:`, error);
            throw error;
        }
    }

    /**
     * Optimize an original image for better web delivery
     */
    async optimizeOriginalImage(
        originalS3Key: string,
        maxWidth = 1920,
        maxHeight = 1920,
        quality = 90,
    ): Promise<void> {
        try {
            // Download original image
            const getCommand = new GetObjectCommand({
                Bucket: this.config.bucketName,
                Key: originalS3Key,
            });

            const response = await this.client.send(getCommand);

            if (!response.Body) {
                throw new Error("Failed to download original image for optimization");
            }

            // Convert stream to buffer
            const imageBuffer = await this.streamToBuffer(response.Body);
            const Sharp = await getSharp();
            const metadata = await Sharp(imageBuffer).metadata();

            // Only optimize if image is larger than max dimensions
            if (metadata.width && metadata.height && 
                (metadata.width > maxWidth || metadata.height > maxHeight)) {
                
                // Generate optimized version
                const optimizedBuffer = await Sharp(imageBuffer)
                    .resize(maxWidth, maxHeight, {
                        fit: "inside",
                        withoutEnlargement: false,
                        kernel: 'lanczos3',
                    })
                    .jpeg({ 
                        quality,
                        progressive: true,
                        mozjpeg: true,
                        optimiseScans: true,
                    })
                    .toBuffer();

                // Upload optimized version back to S3
                const putCommand = new PutObjectCommand({
                    Bucket: this.config.bucketName,
                    Key: originalS3Key,
                    Body: optimizedBuffer,
                    ContentType: response.ContentType || "image/jpeg",
                    CacheControl: 'public, max-age=31536000',
                    ContentDisposition: 'inline',
                });

                await this.client.send(putCommand);
                console.log(`Optimized image ${originalS3Key}: ${metadata.width}x${metadata.height} -> ${maxWidth}x${maxHeight}`);
            }
        } catch (error) {
            console.error(`Failed to optimize image ${originalS3Key}:`, error);
            throw error;
        }
    }

    /**
     * Generate a presigned URL for downloading/viewing an image
     */
    async generatePresignedDownloadUrl(
        s3Key: string,
        expiresIn = 3600,
    ): Promise<string> {
        const getCommand = new GetObjectCommand({
            Bucket: this.config.bucketName,
            Key: s3Key,
        });

        return await getSignedUrl(this.client, getCommand, { expiresIn });
    }

    /**
     * Generate presigned URLs for multiple images (batch operation)
     */
    async generateBatchPresignedUrls(
        s3Keys: string[],
        expiresIn = 3600,
    ): Promise<Record<string, string>> {
        const urlPromises = s3Keys.map(async (s3Key) => {
            const url = await this.generatePresignedDownloadUrl(s3Key, expiresIn);
            return { s3Key, url };
        });

        const results = await Promise.all(urlPromises);
        
        return results.reduce((acc, { s3Key, url }) => {
            acc[s3Key] = url;
            return acc;
        }, {} as Record<string, string>);
    }

    /**
     * Generate presigned URLs for both original and thumbnail images
     */
    async generateImageDisplayUrls(
        originalS3Key: string,
        thumbnailS3Key?: string,
        expiresIn = 3600,
    ): Promise<{ originalUrl: string; thumbnailUrl?: string }> {
        const originalUrl = await this.generatePresignedDownloadUrl(originalS3Key, expiresIn);
        
        let thumbnailUrl: string | undefined;
        if (thumbnailS3Key) {
            // Always generate presigned URL for thumbnail
            // The URL will work if the thumbnail exists, otherwise the client will get 404
            // This is better than trying to check existence which might be blocked by restrictive policies
            thumbnailUrl = await this.generatePresignedDownloadUrl(thumbnailS3Key, expiresIn);
        }

        return { originalUrl, thumbnailUrl };
    }

    /**
     * Validate image file type and size
     */
    validateImageFile(mimeType: string, fileSize: number): void {
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(mimeType)) {
            throw new Error(
                `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
            );
        }

        if (fileSize > maxSize) {
            throw new Error(`File size too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
        }
    }

    /**
     * Get file extension from MIME type
     */
    private getFileExtension(mimeType: string): string {
        const extensions: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/gif": ".gif",
            "image/webp": ".webp",
        };

        return extensions[mimeType] || ".jpg";
    }

    /**
     * Convert stream to buffer
     */
    private async streamToBuffer(stream: any): Promise<Buffer> {
        const chunks: Uint8Array[] = [];

        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        return Buffer.concat(chunks);
    }
}

/**
 * Create S3 service instance from environment variables
 */
export function createS3Service(env: {
    S3_REGION?: string;
    S3_ENDPOINT?: string;
    S3_FORCE_PATH_STYLE?: string;
    S3_ACCESS_KEY_ID?: string;
    S3_SECRET_ACCESS_KEY?: string;
    NEXT_PUBLIC_AVATAR_BUCKET_NAME?: string;
    NEXT_PUBLIC_STORAGE_URL?: string;
}): S3Service {
    if (!env.S3_REGION || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
        throw new Error("Missing required S3 configuration");
    }

    if (!env.NEXT_PUBLIC_AVATAR_BUCKET_NAME || !env.NEXT_PUBLIC_STORAGE_URL) {
        throw new Error("Missing required S3 public configuration");
    }

    return new S3Service({
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT ?? undefined,
        forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        bucketName: env.NEXT_PUBLIC_AVATAR_BUCKET_NAME,
        storageUrl: env.NEXT_PUBLIC_STORAGE_URL,
    });
}