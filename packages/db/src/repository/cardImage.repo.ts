import { and, eq, isNull } from "drizzle-orm";

import type { dbClient } from "@kan/db/client";
import { cardImages } from "@kan/db/schema";
import { generateUID } from "@kan/shared/utils";
import type {
    CreateCardImageInput,
    UpdateCardImageInput,
    SoftDeleteCardImageInput,
    SoftDeleteCardImageByPublicIdInput,
    CardImageCreateResult,
    CardImageQueryResult,
    CardImageDeleteResult,
} from "../types/cardImage.types";

export const create = async (
    db: dbClient,
    imageInput: CreateCardImageInput,
): Promise<CardImageCreateResult> => {
    const [result] = await db
        .insert(cardImages)
        .values({
            publicId: generateUID(),
            cardId: imageInput.cardId,
            filename: imageInput.filename,
            originalName: imageInput.originalName,
            mimeType: imageInput.mimeType,
            fileSize: imageInput.fileSize,
            s3Key: imageInput.s3Key,
            s3Url: imageInput.s3Url,
            thumbnailS3Key: imageInput.thumbnailS3Key,
            thumbnailS3Url: imageInput.thumbnailS3Url,
            width: imageInput.width,
            height: imageInput.height,
            uploadedBy: imageInput.uploadedBy,
        })
        .returning({
            id: cardImages.id,
            publicId: cardImages.publicId,
            cardId: cardImages.cardId,
            filename: cardImages.filename,
            originalName: cardImages.originalName,
            mimeType: cardImages.mimeType,
            fileSize: cardImages.fileSize,
            s3Key: cardImages.s3Key,
            s3Url: cardImages.s3Url,
            thumbnailS3Key: cardImages.thumbnailS3Key,
            thumbnailS3Url: cardImages.thumbnailS3Url,
            width: cardImages.width,
            height: cardImages.height,
            uploadedBy: cardImages.uploadedBy,
            createdAt: cardImages.createdAt,
        });

    if (!result) {
        throw new Error("Failed to create card image");
    }

    return result;
};

export const getByPublicId = (
    db: dbClient,
    imagePublicId: string,
): Promise<CardImageQueryResult | undefined> => {
    return db.query.cardImages.findFirst({
        columns: {
            id: true,
            publicId: true,
            cardId: true,
            filename: true,
            originalName: true,
            mimeType: true,
            fileSize: true,
            s3Key: true,
            s3Url: true,
            thumbnailS3Key: true,
            thumbnailS3Url: true,
            width: true,
            height: true,
            uploadedBy: true,
            createdAt: true,
        },
        where: and(eq(cardImages.publicId, imagePublicId), isNull(cardImages.deletedAt)),
    });
};

export const getAllByCardId = (
    db: dbClient,
    cardId: number,
): Promise<CardImageQueryResult[]> => {
    return db.query.cardImages.findMany({
        columns: {
            id: true,
            publicId: true,
            cardId: true,
            filename: true,
            originalName: true,
            mimeType: true,
            fileSize: true,
            s3Key: true,
            s3Url: true,
            thumbnailS3Key: true,
            thumbnailS3Url: true,
            width: true,
            height: true,
            uploadedBy: true,
            createdAt: true,
        },
        where: and(eq(cardImages.cardId, cardId), isNull(cardImages.deletedAt)),
        orderBy: cardImages.createdAt,
    });
};

export const getAllByCardPublicId = async (
    db: dbClient,
    cardPublicId: string,
): Promise<CardImageQueryResult[]> => {
    const result = await db.query.cards.findFirst({
        columns: {
            id: true,
        },
        where: (cards, { eq }) => eq(cards.publicId, cardPublicId),
        with: {
            images: {
                columns: {
                    id: true,
                    publicId: true,
                    cardId: true,
                    filename: true,
                    originalName: true,
                    mimeType: true,
                    fileSize: true,
                    s3Key: true,
                    s3Url: true,
                    thumbnailS3Key: true,
                    thumbnailS3Url: true,
                    width: true,
                    height: true,
                    uploadedBy: true,
                    createdAt: true,
                },
                where: isNull(cardImages.deletedAt),
                orderBy: cardImages.createdAt,
            },
        },
    });

    return result?.images ?? [];
};

export const update = async (
    db: dbClient,
    imageInput: UpdateCardImageInput,
    args: {
        imagePublicId: string;
    },
): Promise<CardImageCreateResult | undefined> => {
    const [result] = await db
        .update(cardImages)
        .set({
            filename: imageInput.filename,
            s3Key: imageInput.s3Key,
            s3Url: imageInput.s3Url,
            thumbnailS3Key: imageInput.thumbnailS3Key,
            thumbnailS3Url: imageInput.thumbnailS3Url,
            width: imageInput.width,
            height: imageInput.height,
        })
        .where(and(eq(cardImages.publicId, args.imagePublicId), isNull(cardImages.deletedAt)))
        .returning({
            id: cardImages.id,
            publicId: cardImages.publicId,
            cardId: cardImages.cardId,
            filename: cardImages.filename,
            originalName: cardImages.originalName,
            mimeType: cardImages.mimeType,
            fileSize: cardImages.fileSize,
            s3Key: cardImages.s3Key,
            s3Url: cardImages.s3Url,
            thumbnailS3Key: cardImages.thumbnailS3Key,
            thumbnailS3Url: cardImages.thumbnailS3Url,
            width: cardImages.width,
            height: cardImages.height,
            uploadedBy: cardImages.uploadedBy,
            createdAt: cardImages.createdAt,
        });

    return result;
};

export const updateMetadata = async (
    db: dbClient,
    args: {
        imagePublicId: string;
        width?: number | null;
        height?: number | null;
    },
): Promise<CardImageCreateResult | undefined> => {
    const [result] = await db
        .update(cardImages)
        .set({
            width: args.width,
            height: args.height,
        })
        .where(and(eq(cardImages.publicId, args.imagePublicId), isNull(cardImages.deletedAt)))
        .returning({
            id: cardImages.id,
            publicId: cardImages.publicId,
            cardId: cardImages.cardId,
            filename: cardImages.filename,
            originalName: cardImages.originalName,
            mimeType: cardImages.mimeType,
            fileSize: cardImages.fileSize,
            s3Key: cardImages.s3Key,
            s3Url: cardImages.s3Url,
            thumbnailS3Key: cardImages.thumbnailS3Key,
            thumbnailS3Url: cardImages.thumbnailS3Url,
            width: cardImages.width,
            height: cardImages.height,
            uploadedBy: cardImages.uploadedBy,
            createdAt: cardImages.createdAt,
        });

    return result;
};

export const softDelete = async (
    db: dbClient,
    args: SoftDeleteCardImageInput,
): Promise<CardImageDeleteResult | undefined> => {
    const [result] = await db
        .update(cardImages)
        .set({
            deletedAt: args.deletedAt,
            deletedBy: args.deletedBy,
        })
        .where(eq(cardImages.id, args.imageId))
        .returning({
            id: cardImages.id,
            publicId: cardImages.publicId,
            cardId: cardImages.cardId,
            s3Key: cardImages.s3Key,
            thumbnailS3Key: cardImages.thumbnailS3Key,
        });

    return result;
};

export const softDeleteByPublicId = async (
    db: dbClient,
    args: SoftDeleteCardImageByPublicIdInput,
): Promise<CardImageDeleteResult | undefined> => {
    const [result] = await db
        .update(cardImages)
        .set({
            deletedAt: args.deletedAt,
            deletedBy: args.deletedBy,
        })
        .where(and(eq(cardImages.publicId, args.imagePublicId), isNull(cardImages.deletedAt)))
        .returning({
            id: cardImages.id,
            publicId: cardImages.publicId,
            cardId: cardImages.cardId,
            s3Key: cardImages.s3Key,
            thumbnailS3Key: cardImages.thumbnailS3Key,
        });

    return result;
};

export const getCardIdByImagePublicId = async (
    db: dbClient,
    imagePublicId: string,
): Promise<number | undefined> => {
    const result = await db.query.cardImages.findFirst({
        columns: {
            cardId: true,
        },
        where: and(eq(cardImages.publicId, imagePublicId), isNull(cardImages.deletedAt)),
    });

    return result?.cardId;
};