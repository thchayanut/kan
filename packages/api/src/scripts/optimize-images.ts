#!/usr/bin/env node

/**
 * Image optimization script for existing images
 * 
 * This script:
 * 1. Finds all existing images
 * 2. Optimizes large original images for web delivery
 * 3. Generates thumbnails if missing
 * 4. Updates database metadata
 * 
 * Usage: pnpm tsx src/scripts/optimize-images.ts
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
    width: number | null;
    height: number | null;
}

async function main() {
    console.log("🚀 Starting image optimization...");

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
        // Find all active images
        const images = await db
            .select({
                id: cardImages.id,
                publicId: cardImages.publicId,
                s3Key: cardImages.s3Key,
                thumbnailS3Key: cardImages.thumbnailS3Key,
                filename: cardImages.filename,
                originalName: cardImages.originalName,
                width: cardImages.width,
                height: cardImages.height,
            })
            .from(cardImages)
            .where(isNull(cardImages.deletedAt));

        console.log(`📊 Found ${images.length} images to process`);

        if (images.length === 0) {
            console.log("✅ No images need optimization");
            return;
        }

        let optimizedCount = 0;
        let thumbnailCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const image of images) {
            try {
                console.log(`🔄 Processing ${image.originalName} (${image.publicId})...`);

                let needsOptimization = false;
                let needsThumbnail = false;

                // Check if original needs optimization (if no width/height recorded, assume it needs checking)
                if (!image.width || !image.height) {
                    needsOptimization = true;
                } else if (image.width > 1920 || image.height > 1920) {
                    needsOptimization = true;
                }

                // Check if thumbnail is missing
                if (image.thumbnailS3Key) {
                    try {
                        const thumbnailUrl = await s3Service.generatePresignedDownloadUrl(image.thumbnailS3Key, 60);
                        const response = await fetch(thumbnailUrl, { method: 'HEAD' });
                        if (!response.ok) {
                            needsThumbnail = true;
                        }
                    } catch {
                        needsThumbnail = true;
                    }
                }

                if (!needsOptimization && !needsThumbnail) {
                    console.log(`✅ ${image.originalName} is already optimized`);
                    skipCount++;
                    continue;
                }

                // Optimize original image if needed
                if (needsOptimization) {
                    try {
                        await s3Service.optimizeOriginalImage(
                            image.s3Key,
                            1920, // Max width
                            1920, // Max height
                            90    // Quality
                        );
                        optimizedCount++;
                        console.log(`📦 Optimized ${image.originalName}`);
                    } catch (error) {
                        console.warn(`⚠️  Failed to optimize ${image.originalName}:`, error);
                    }
                }

                // Generate thumbnail if needed
                if (needsThumbnail && image.thumbnailS3Key) {
                    try {
                        await s3Service.generateAndUploadThumbnail(
                            image.s3Key,
                            image.thumbnailS3Key,
                            {
                                width: 200,
                                height: 200,
                                quality: 85,
                            }
                        );
                        thumbnailCount++;
                        console.log(`🖼️  Generated thumbnail for ${image.originalName}`);
                    } catch (error) {
                        console.warn(`⚠️  Failed to generate thumbnail for ${image.originalName}:`, error);
                    }
                }

                // Update metadata in database
                try {
                    const metadata = await s3Service.getImageMetadata(image.s3Key);
                    
                    await db
                        .update(cardImages)
                        .set({
                            width: metadata.width || null,
                            height: metadata.height || null,
                        })
                        .where(eq(cardImages.id, image.id));

                    console.log(`📏 Updated metadata for ${image.originalName} (${metadata.width}x${metadata.height})`);
                } catch (error) {
                    console.warn(`⚠️  Failed to update metadata for ${image.originalName}:`, error);
                }

            } catch (error) {
                console.error(`❌ Failed to process ${image.originalName}:`, error);
                errorCount++;
                continue;
            }

            // Add small delay to avoid overwhelming S3
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log("\n📈 Optimization Summary:");
        console.log(`🖼️  Images optimized: ${optimizedCount}`);
        console.log(`📷 Thumbnails generated: ${thumbnailCount}`);
        console.log(`⚠️  Skipped (already optimized): ${skipCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        console.log(`📊 Total processed: ${images.length}`);

        if (errorCount > 0) {
            console.log("\n⚠️  Some images failed to process. Check the logs above for details.");
        } else {
            console.log("\n🎉 Image optimization completed successfully!");
        }

        // Performance recommendations
        console.log("\n📋 Performance Recommendations:");
        console.log("1. 🌐 Consider setting up CloudFront CDN for faster global delivery");
        console.log("2. 🔒 Apply restrictive S3 bucket policies for better security");
        console.log("3. 📏 Monitor image sizes and consider WebP format in the future");

    } catch (error) {
        console.error("❌ Optimization failed:", error);
        process.exit(1);
    }
}

// Run the optimization
main().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
});