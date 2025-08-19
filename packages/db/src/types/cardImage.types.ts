// Database-level CardImage types
export interface CardImageRecord {
    id: number;
    publicId: string;
    cardId: number;
    filename: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    s3Key: string;
    s3Url: string;
    thumbnailS3Key: string | null;
    thumbnailS3Url: string | null;
    width: number | null;
    height: number | null;
    uploadedBy: string | null;
    createdAt: Date;
    deletedAt: Date | null;
    deletedBy: string | null;
}

// Input types for repository operations
export interface CreateCardImageInput {
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
    uploadedBy: string;
}

export interface UpdateCardImageInput {
    filename?: string;
    s3Key?: string;
    s3Url?: string;
    thumbnailS3Key?: string;
    thumbnailS3Url?: string;
    width?: number;
    height?: number;
}

export interface SoftDeleteCardImageInput {
    imageId: number;
    deletedAt: Date;
    deletedBy: string;
}

export interface SoftDeleteCardImageByPublicIdInput {
    imagePublicId: string;
    deletedAt: Date;
    deletedBy: string;
}

// Return types for repository operations
export type CardImageCreateResult = Pick<
    CardImageRecord,
    | "id"
    | "publicId"
    | "cardId"
    | "filename"
    | "originalName"
    | "mimeType"
    | "fileSize"
    | "s3Key"
    | "s3Url"
    | "thumbnailS3Key"
    | "thumbnailS3Url"
    | "width"
    | "height"
    | "uploadedBy"
    | "createdAt"
>;

export type CardImageQueryResult = Pick<
    CardImageRecord,
    | "id"
    | "publicId"
    | "cardId"
    | "filename"
    | "originalName"
    | "mimeType"
    | "fileSize"
    | "s3Key"
    | "s3Url"
    | "thumbnailS3Key"
    | "thumbnailS3Url"
    | "width"
    | "height"
    | "uploadedBy"
    | "createdAt"
>;

export type CardImageDeleteResult = Pick<
    CardImageRecord,
    "id" | "publicId" | "cardId" | "s3Key" | "thumbnailS3Key"
>;