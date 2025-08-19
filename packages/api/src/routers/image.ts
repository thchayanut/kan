import { TRPCError } from "@trpc/server";
import { z } from "zod";

import * as cardRepo from "@kan/db/repository/card.repo";
import * as cardImageRepo from "@kan/db/repository/cardImage.repo";
import * as cardActivityRepo from "@kan/db/repository/cardActivity.repo";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { assertUserInWorkspace } from "../utils/auth";
import { createS3Service } from "../utils/s3";
import { logS3Configuration, checkS3Configuration } from "../utils/checkS3Config";
import {
    imageUploadSchema,
    imageDeleteSchema,
    getImagesByCardSchema,
} from "../types/cardImage.types";

// Create S3 service instance
const getS3Service = () => {
    // Check S3 configuration first
    const configCheck = checkS3Configuration();

    if (!configCheck.isValid) {
        logS3Configuration();
        throw new Error(`S3 configuration error: ${configCheck.errors.join(', ')}`);
    }

    return createS3Service({
        S3_REGION: process.env.S3_REGION,
        S3_ENDPOINT: process.env.S3_ENDPOINT,
        S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE,
        S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
        S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
        NEXT_PUBLIC_AVATAR_BUCKET_NAME: process.env.NEXT_PUBLIC_AVATAR_BUCKET_NAME,
        NEXT_PUBLIC_STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL,
    });
};

export const imageRouter = createTRPCRouter({
    upload: protectedProcedure
        .meta({
            openapi: {
                summary: "Upload an image to a card",
                method: "POST",
                path: "/cards/{cardPublicId}/images",
                description: "Generates a presigned URL for uploading an image to a card",
                tags: ["Images"],
                protect: true,
            },
        })
        .input(imageUploadSchema)
        .output(
            z.object({
                image: z.object({
                    id: z.number(),
                    publicId: z.string(),
                    cardId: z.number(),
                    filename: z.string(),
                    originalName: z.string(),
                    mimeType: z.string(),
                    fileSize: z.number(),
                    s3Key: z.string(),
                    s3Url: z.string(),
                    thumbnailS3Key: z.string().nullable(),
                    thumbnailS3Url: z.string().nullable(),
                    width: z.number().nullable(),
                    height: z.number().nullable(),
                    uploadedBy: z.string().nullable(),
                    createdAt: z.date(),
                }),
                uploadUrl: z.string(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            console.log("Image upload request received:", {
                cardPublicId: input.cardPublicId,
                filename: input.filename,
                originalName: input.originalName,
                mimeType: input.mimeType,
                fileSize: input.fileSize,
            });

            const userId = ctx.user?.id;

            if (!userId) {
                throw new TRPCError({
                    message: "User not authenticated",
                    code: "UNAUTHORIZED",
                });
            }

            // Verify card exists and user has access
            const card = await cardRepo.getWorkspaceAndCardIdByCardPublicId(
                ctx.db,
                input.cardPublicId,
            );

            if (!card) {
                throw new TRPCError({
                    message: `Card with public ID ${input.cardPublicId} not found`,
                    code: "NOT_FOUND",
                });
            }

            await assertUserInWorkspace(ctx.db, userId, card.workspaceId);

            try {
                console.log("Starting image upload process...");

                // Validate file type and size
                console.log("Creating S3 service...");
                const s3Service = getS3Service();

                console.log("Validating image file...");
                s3Service.validateImageFile(input.mimeType, input.fileSize);

                // Generate presigned URL for upload
                console.log("Generating presigned URL...");
                const uploadResult = await s3Service.generatePresignedUploadUrl({
                    filename: input.filename,
                    mimeType: input.mimeType,
                    fileSize: input.fileSize,
                    cardPublicId: input.cardPublicId,
                    userId,
                });

                console.log("Presigned URL generated successfully:", {
                    s3Key: uploadResult.s3Key,
                    s3Url: uploadResult.s3Url,
                });

                // Create database record
                console.log("Creating database record...");
                const imageRecord = await cardImageRepo.create(ctx.db, {
                    cardId: card.id,
                    filename: input.filename,
                    originalName: input.originalName,
                    mimeType: input.mimeType,
                    fileSize: input.fileSize,
                    s3Key: uploadResult.s3Key,
                    s3Url: uploadResult.s3Url,
                    thumbnailS3Key: uploadResult.thumbnailS3Key,
                    thumbnailS3Url: uploadResult.thumbnailS3Url,
                    uploadedBy: userId,
                });

                console.log("Database record created successfully:", {
                    imageId: imageRecord.id,
                    publicId: imageRecord.publicId,
                });

                // Create activity log
                console.log("Creating activity log...");
                await cardActivityRepo.create(ctx.db, {
                    type: "card.updated.image.added",
                    cardId: card.id,
                    createdBy: userId,
                });

                console.log("Activity log created successfully");

                return {
                    image: imageRecord,
                    uploadUrl: uploadResult.uploadUrl,
                };
            } catch (error) {
                console.error("Image upload error:", error);
                console.error("Error details:", {
                    name: error instanceof Error ? error.name : 'Unknown',
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });

                if (error instanceof Error) {
                    throw new TRPCError({
                        message: error.message,
                        code: "BAD_REQUEST",
                    });
                }
                throw new TRPCError({
                    message: "Failed to process image upload",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        }),

    processThumbnail: protectedProcedure
        .meta({
            openapi: {
                summary: "Process image thumbnail after upload",
                method: "POST", 
                path: "/images/{imagePublicId}/process-thumbnail",
                description: "Generates thumbnail for an uploaded image",
                tags: ["Images"],
                protect: true,
            },
        })
        .input(
            z.object({
                imagePublicId: z.string(),
            }),
        )
        .output(
            z.object({
                success: z.boolean(),
                thumbnailGenerated: z.boolean(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user?.id;

            if (!userId) {
                throw new TRPCError({
                    message: "User not authenticated",
                    code: "UNAUTHORIZED",
                });
            }

            // Get image record
            const image = await cardImageRepo.getByPublicId(
                ctx.db,
                input.imagePublicId,
            );

            if (!image) {
                throw new TRPCError({
                    message: `Image with public ID ${input.imagePublicId} not found`,
                    code: "NOT_FOUND",
                });
            }

            // Verify user has access to this image's card
            const card = await ctx.db.query.cards.findFirst({
                columns: { id: true },
                where: (cards, { eq, isNull, and }) =>
                    and(eq(cards.id, image.cardId), isNull(cards.deletedAt)),
                with: {
                    list: {
                        columns: {},
                        with: {
                            board: {
                                columns: {},
                                with: {
                                    workspace: {
                                        columns: { id: true },
                                        with: {
                                            members: {
                                                columns: { userId: true },
                                                where: (members, { eq, isNull, and }) =>
                                                    and(eq(members.userId, userId), isNull(members.deletedAt)),
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!card?.list?.board?.workspace?.members?.length) {
                throw new TRPCError({
                    message: "Access denied",
                    code: "FORBIDDEN",
                });
            }

            try {
                console.log(`Processing thumbnail for image ${input.imagePublicId}...`);
                
                const s3Service = getS3Service();
                
                // Optimize original image and generate thumbnail
                if (image.thumbnailS3Key) {
                    // Optimize the original image for better web delivery
                    await s3Service.optimizeOriginalImage(
                        image.s3Key,
                        1920, // Max width
                        1920, // Max height
                        90    // Quality
                    );

                    // Generate and upload thumbnail
                    await s3Service.generateAndUploadThumbnail(
                        image.s3Key,
                        image.thumbnailS3Key,
                        {
                            width: 200,
                            height: 200,
                            quality: 85,
                        }
                    );

                    // Get metadata and update database
                    const metadata = await s3Service.getImageMetadata(image.s3Key);
                    
                    await cardImageRepo.updateMetadata(ctx.db, {
                        imagePublicId: input.imagePublicId,
                        width: metadata.width || null,
                        height: metadata.height || null,
                    });

                    console.log(`Image optimized and thumbnail generated for ${input.imagePublicId}`);
                    
                    return {
                        success: true,
                        thumbnailGenerated: true,
                    };
                }

                return {
                    success: true,
                    thumbnailGenerated: false,
                };
            } catch (error) {
                console.error(`Failed to process thumbnail for image ${input.imagePublicId}:`, error);
                
                // Don't fail the entire operation if thumbnail generation fails
                return {
                    success: true,
                    thumbnailGenerated: false,
                };
            }
        }),

    delete: protectedProcedure
        .meta({
            openapi: {
                summary: "Delete an image from a card",
                method: "DELETE",
                path: "/images/{imagePublicId}",
                description: "Deletes an image and removes it from S3 storage",
                tags: ["Images"],
                protect: true,
            },
        })
        .input(imageDeleteSchema)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user?.id;

            if (!userId) {
                throw new TRPCError({
                    message: "User not authenticated",
                    code: "UNAUTHORIZED",
                });
            }

            // Get image record
            const image = await cardImageRepo.getByPublicId(
                ctx.db,
                input.imagePublicId,
            );

            if (!image) {
                throw new TRPCError({
                    message: `Image with public ID ${input.imagePublicId} not found`,
                    code: "NOT_FOUND",
                });
            }

            // Get card by ID to verify user access (we already have the card ID from the image)
            const cardById = await ctx.db.query.cards.findFirst({
                columns: { publicId: true },
                where: (cards, { eq, isNull, and }) =>
                    and(eq(cards.id, image.cardId), isNull(cards.deletedAt)),
            });

            if (!cardById) {
                throw new TRPCError({
                    message: "Card not found",
                    code: "NOT_FOUND",
                });
            }

            const cardInfo = await cardRepo.getWorkspaceAndCardIdByCardPublicId(
                ctx.db,
                cardById.publicId,
            );

            if (!cardInfo) {
                throw new TRPCError({
                    message: "Card workspace information not found",
                    code: "NOT_FOUND",
                });
            }

            await assertUserInWorkspace(ctx.db, userId, cardInfo.workspaceId);

            try {
                // Delete from S3
                const s3Service = getS3Service();
                await s3Service.deleteImageWithThumbnail(
                    image.s3Key,
                    image.thumbnailS3Key ?? undefined,
                );

                // Soft delete from database
                const deletedImage = await cardImageRepo.softDeleteByPublicId(ctx.db, {
                    imagePublicId: input.imagePublicId,
                    deletedAt: new Date(),
                    deletedBy: userId,
                });

                if (!deletedImage) {
                    throw new TRPCError({
                        message: "Failed to delete image from database",
                        code: "INTERNAL_SERVER_ERROR",
                    });
                }

                // Create activity log
                await cardActivityRepo.create(ctx.db, {
                    type: "card.updated.image.removed",
                    cardId: image.cardId,
                    createdBy: userId,
                });

                return { success: true };
            } catch (error) {
                if (error instanceof TRPCError) {
                    throw error;
                }

                console.error("Error deleting image:", error);
                throw new TRPCError({
                    message: "Failed to delete image",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        }),

    getByCard: publicProcedure
        .meta({
            openapi: {
                summary: "Get all images for a card",
                method: "GET",
                path: "/cards/{cardPublicId}/images",
                description: "Retrieves all images associated with a card",
                tags: ["Images"],
            },
        })
        .input(getImagesByCardSchema)
        .output(
            z.array(
                z.object({
                    id: z.number(),
                    publicId: z.string(),
                    cardId: z.number(),
                    filename: z.string(),
                    originalName: z.string(),
                    mimeType: z.string(),
                    fileSize: z.number(),
                    s3Key: z.string(),
                    s3Url: z.string(),
                    thumbnailS3Key: z.string().nullable(),
                    thumbnailS3Url: z.string().nullable(),
                    width: z.number().nullable(),
                    height: z.number().nullable(),
                    uploadedBy: z.string().nullable(),
                    createdAt: z.date(),
                }),
            ),
        )
        .query(async ({ ctx, input }) => {
            // Verify card exists and handle visibility
            const card = await cardRepo.getWorkspaceAndCardIdByCardPublicId(
                ctx.db,
                input.cardPublicId,
            );

            if (!card) {
                throw new TRPCError({
                    message: `Card with public ID ${input.cardPublicId} not found`,
                    code: "NOT_FOUND",
                });
            }

            // Check workspace visibility and user access
            if (card.workspaceVisibility === "private") {
                const userId = ctx.user?.id;

                if (!userId) {
                    throw new TRPCError({
                        message: "User not authenticated",
                        code: "UNAUTHORIZED",
                    });
                }

                await assertUserInWorkspace(ctx.db, userId, card.workspaceId);
            }

            // Get all images for the card
            const images = await cardImageRepo.getAllByCardPublicId(
                ctx.db,
                input.cardPublicId,
            );

            return images;
        }),

    getPresignedUrls: protectedProcedure
        .meta({
            openapi: {
                summary: "Get presigned URLs for image display",
                method: "POST",
                path: "/images/presigned-urls",
                description: "Generates presigned URLs for displaying images securely",
                tags: ["Images"],
            },
        })
        .input(
            z.object({
                cardPublicId: z.string(),
                imagePublicIds: z.array(z.string()).optional(),
            }),
        )
        .output(
            z.array(
                z.object({
                    imagePublicId: z.string(),
                    originalUrl: z.string(),
                    thumbnailUrl: z.string().optional(),
                    s3Key: z.string(),
                    thumbnailS3Key: z.string().nullable(),
                }),
            ),
        )
        .query(async ({ ctx, input }) => {
            // Verify card exists and handle visibility
            const card = await cardRepo.getWorkspaceAndCardIdByCardPublicId(
                ctx.db,
                input.cardPublicId,
            );

            if (!card) {
                throw new TRPCError({
                    message: `Card with public ID ${input.cardPublicId} not found`,
                    code: "NOT_FOUND",
                });
            }

            // Check workspace visibility and user access
            if (card.workspaceVisibility === "private") {
                const userId = ctx.user?.id;

                if (!userId) {
                    throw new TRPCError({
                        message: "User not authenticated",
                        code: "UNAUTHORIZED",
                    });
                }

                await assertUserInWorkspace(ctx.db, userId, card.workspaceId);
            }

            // Get images for the card (optionally filtered by specific image IDs)
            let images;
            if (input.imagePublicIds && input.imagePublicIds.length > 0) {
                images = await Promise.all(
                    input.imagePublicIds.map(async (imagePublicId) => {
                        const image = await cardImageRepo.getByPublicId(ctx.db, imagePublicId);
                        if (!image) {
                            throw new TRPCError({
                                message: `Image with public ID ${imagePublicId} not found`,
                                code: "NOT_FOUND",
                            });
                        }
                        return image;
                    }),
                );
            } else {
                images = await cardImageRepo.getAllByCardPublicId(
                    ctx.db,
                    input.cardPublicId,
                );
            }

            try {
                const s3Service = getS3Service();
                
                // Generate short-lived presigned URLs (only 10 minutes for security)
                const urlPromises = images.map(async (image) => {
                    const urls = await s3Service.generateImageDisplayUrls(
                        image.s3Key,
                        image.thumbnailS3Key ?? undefined,
                        600 // 10 minutes expiry instead of 1 hour for better security
                    );

                    return {
                        imagePublicId: image.publicId,
                        originalUrl: urls.originalUrl,
                        thumbnailUrl: urls.thumbnailUrl,
                        s3Key: image.s3Key,
                        thumbnailS3Key: image.thumbnailS3Key,
                    };
                });

                const results = await Promise.all(urlPromises);
                return results;

            } catch (error) {
                console.error("Error generating presigned URLs:", error);
                throw new TRPCError({
                    message: "Failed to generate presigned URLs",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        }),
});