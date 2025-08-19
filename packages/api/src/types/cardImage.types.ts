import { z } from "zod";

// Base CardImage interface matching the database schema
export interface CardImage {
    id: number;
    publicId: string;
    cardId: number;
    filename: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    s3Key: string;
    s3Url: string;
    thumbnailS3Key?: string;
    thumbnailS3Url?: string;
    width?: number;
    height?: number;
    uploadedBy?: string;
    createdAt: Date;
    deletedAt?: Date;
    deletedBy?: string;
}

// Extended Card interface that includes images
export interface CardWithImages {
    id: number;
    publicId: string;
    title: string;
    description?: string;
    listId: number;
    images: CardImage[];
    // ... other card properties
}

// Image upload input type
export interface ImageUploadInput {
    cardPublicId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
}

// Image upload response type
export interface ImageUploadResponse {
    image: CardImage;
    uploadUrl: string;
    uploadFields: Record<string, string>;
}

// Image management input types
export interface ImageDeleteInput {
    imagePublicId: string;
}

export interface ImageReplaceInput {
    imagePublicId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
}

// Validation schemas
export const imageUploadSchema = z.object({
    cardPublicId: z.string().min(12, "Card public ID must be at least 12 characters"),
    filename: z.string().min(1, "Filename is required"),
    originalName: z.string().min(1, "Original filename is required"),
    mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"], {
        errorMap: () => ({ message: "File must be JPEG, PNG, GIF, or WebP" }),
    }),
    fileSize: z
        .number()
        .min(1, "File size must be greater than 0")
        .max(5 * 1024 * 1024, "File size must be under 5MB"),
});

export const imageDeleteSchema = z.object({
    imagePublicId: z.string().min(12, "Image public ID must be at least 12 characters"),
});

export const imageReplaceSchema = z.object({
    imagePublicId: z.string().min(12, "Image public ID must be at least 12 characters"),
    filename: z.string().min(1, "Filename is required"),
    originalName: z.string().min(1, "Original filename is required"),
    mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"], {
        errorMap: () => ({ message: "File must be JPEG, PNG, GIF, or WebP" }),
    }),
    fileSize: z
        .number()
        .min(1, "File size must be greater than 0")
        .max(5 * 1024 * 1024, "File size must be under 5MB"),
});

export const getImagesByCardSchema = z.object({
    cardPublicId: z.string().min(12, "Card public ID must be at least 12 characters"),
});

// Client-side file validation schema (for frontend use)
export const clientFileValidationSchema = z.object({
    file: z
        .custom<File>()
        .refine(
            (file) => file.size <= 5 * 1024 * 1024,
            "File size must be under 5MB",
        )
        .refine(
            (file) =>
                ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
                    file.type,
                ),
            "File must be JPEG, PNG, GIF, or WebP",
        ),
    cardPublicId: z.string().min(12, "Card public ID must be at least 12 characters"),
});

// Error types for image operations
export enum ImageErrorType {
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
    FILE_TOO_LARGE = "FILE_TOO_LARGE",
    UPLOAD_FAILED = "UPLOAD_FAILED",
    STORAGE_ERROR = "STORAGE_ERROR",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    IMAGE_NOT_FOUND = "IMAGE_NOT_FOUND",
    CARD_NOT_FOUND = "CARD_NOT_FOUND",
}

export interface ImageError {
    type: ImageErrorType;
    message: string;
    details?: Record<string, unknown>;
}