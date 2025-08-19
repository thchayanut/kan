#!/usr/bin/env node

/**
 * Migration script to generate thumbnails for existing images
 * 
 * This script:
 * 1. Finds all images without thumbnails
 * 2. Downloads the original images from S3
 * 3. Generates thumbnails using Sharp
 * 4. Uploads thumbnails to S3
 * 5. Updates database records
 * 
 * Usage: pnpm tsx src/scripts/migrate-thumbnails.ts
 */

import { eq, isNull, and } from "drizzle-orm";
import { createS3Service } from "../utils/s3";
import { checkS3Configuration } from "../utils/checkS3Config";
import { createDrizzleClient } from "@kan/db/client";
import { cardImages } from "@kan/db/schema";

interface ImageRecord {
    id: number;
    publicId: string;
    s3Key: string;
    thumbnailS3Key: string | null;
    filename: string;
    originalName: string;
}

async function main() {
    console.log("🚀 Starting thumbnail migration...");

    // Check S3 configuration
    const configCheck = checkS3Configuration();
    if (!configCheck.isValid) {
        console.error("❌ S3 configuration error:", configCheck.errors);
        process.exit(1);
    }

    // Create database client
    const db = createDrizzleClient();

    const s3Service = createS3Service({
        S3_REGION: process.env.S3_REGION,
        S3_ENDPOINT: process.env.S3_ENDPOINT,
        S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE,
        S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
        S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
        NEXT_PUBLIC_AVATAR_BUCKET_NAME: process.env.NEXT_PUBLIC_AVATAR_BUCKET_NAME,
        NEXT_PUBLIC_STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL,
    });

    try {
        // Find all images that need thumbnail generation
        const images = await db
            .select({
                id: cardImages.id,
                publicId: cardImages.publicId,
                s3Key: cardImages.s3Key,
                thumbnailS3Key: cardImages.thumbnailS3Key,
                filename: cardImages.filename,
                originalName: cardImages.originalName,
            })
            .from(cardImages)
            .where(
                and(
                    isNull(cardImages.deletedAt), // Only active images
                    // Images that either don't have thumbnail keys or where thumbnail doesn't exist
                    // We'll check thumbnail existence during processing
                )
            );

        console.log(`📊 Found ${images.length} images to process`);

        if (images.length === 0) {
            console.log("✅ No images need thumbnail processing");
            return;
        }

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const image of images) {
            try {
                console.log(`🔄 Processing ${image.originalName} (${image.publicId})...`);

                // Skip if no thumbnail key (shouldn't happen with current schema)
                if (!image.thumbnailS3Key) {
                    console.log(`⚠️  Skipping ${image.originalName} - no thumbnail key`);
                    skipCount++;
                    continue;
                }

                // Check if thumbnail already exists
                try {
                    const thumbnailUrl = await s3Service.generatePresignedDownloadUrl(image.thumbnailS3Key, 60);
                    // If we can generate a presigned URL, the thumbnail likely exists
                    // Let's try to get metadata to confirm
                    const response = await fetch(thumbnailUrl, { method: 'HEAD' });
                    if (response.ok) {
                        console.log(`✅ Thumbnail already exists for ${image.originalName}`);
                        skipCount++;
                        continue;
                    }
                } catch (thumbnailCheckError) {
                    // Thumbnail doesn't exist, continue with generation
                }

                // Generate thumbnail
                await s3Service.generateAndUploadThumbnail(
                    image.s3Key,
                    image.thumbnailS3Key,
                    {
                        width: 200,
                        height: 200,
                        quality: 80,
                    }
                );

                // Get and update metadata
                try {
                    const metadata = await s3Service.getImageMetadata(image.s3Key);
                    
                    await db
                        .update(cardImages)
                        .set({
                            width: metadata.width || null,
                            height: metadata.height || null,
                        })
                        .where(eq(cardImages.id, image.id));

                    console.log(`✅ Generated thumbnail for ${image.originalName} (${metadata.width}x${metadata.height})`);
                } catch (metadataError) {
                    console.warn(`⚠️  Generated thumbnail for ${image.originalName} but failed to update metadata:`, metadataError);
                }

                successCount++;

            } catch (error) {
                console.error(`❌ Failed to process ${image.originalName}:`, error);
                errorCount++;
                
                // Continue with next image instead of failing entirely
                continue;
            }

            // Add small delay to avoid overwhelming S3
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log("\n📈 Migration Summary:");
        console.log(`✅ Successfully processed: ${successCount}`);
        console.log(`⚠️  Skipped (already existed): ${skipCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        console.log(`📊 Total: ${images.length}`);

        if (errorCount > 0) {
            console.log("\n⚠️  Some images failed to process. Check the logs above for details.");
            process.exit(1);
        } else {
            console.log("\n🎉 Thumbnail migration completed successfully!");
        }

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

// Run the migration
main().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
});