import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { S3Service, createS3Service } from "../s3";
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Mock AWS SDK
vi.mock("@aws-sdk/client-s3");
vi.mock("@aws-sdk/s3-request-presigner");

// Mock sharp - simplified mock for basic functionality
vi.mock("sharp", () => ({
    default: vi.fn(() => ({
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from("mock-thumbnail")),
        metadata: vi.fn().mockResolvedValue({ width: 100, height: 100, format: "jpeg" }),
    })),
}));

const mockS3Client = {
    send: vi.fn(),
};

const mockGetSignedUrl = vi.mocked(getSignedUrl);
const mockS3ClientConstructor = vi.mocked(S3Client);

describe("S3Service", () => {
    let s3Service: S3Service;
    const mockConfig = {
        region: "us-east-1",
        accessKeyId: "test-access-key",
        secretAccessKey: "test-secret-key",
        bucketName: "test-bucket",
        storageUrl: "https://test-bucket.s3.amazonaws.com",
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockS3ClientConstructor.mockImplementation(() => mockS3Client as any);
        s3Service = new S3Service(mockConfig);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("constructor", () => {
        it("should create S3Client with correct configuration", () => {
            expect(S3Client).toHaveBeenCalledWith({
                region: mockConfig.region,
                endpoint: undefined,
                forcePathStyle: undefined,
                credentials: {
                    accessKeyId: mockConfig.accessKeyId,
                    secretAccessKey: mockConfig.secretAccessKey,
                },
            });
        });

        it("should create S3Client with custom endpoint and forcePathStyle", () => {
            const customConfig = {
                ...mockConfig,
                endpoint: "https://custom-endpoint.com",
                forcePathStyle: true,
            };

            new S3Service(customConfig);

            expect(S3Client).toHaveBeenCalledWith({
                region: customConfig.region,
                endpoint: customConfig.endpoint,
                forcePathStyle: customConfig.forcePathStyle,
                credentials: {
                    accessKeyId: customConfig.accessKeyId,
                    secretAccessKey: customConfig.secretAccessKey,
                },
            });
        });
    });

    describe("generatePresignedUploadUrl", () => {
        it("should generate presigned upload URL with correct parameters", async () => {
            const mockUploadUrl = "https://test-bucket.s3.amazonaws.com/presigned-url";
            mockGetSignedUrl.mockResolvedValue(mockUploadUrl);

            const options = {
                filename: "test-image.jpg",
                mimeType: "image/jpeg",
                fileSize: 1024,
                cardPublicId: "card-123",
                userId: "user-456",
            };

            const result = await s3Service.generatePresignedUploadUrl(options);

            expect(result).toMatchObject({
                uploadUrl: mockUploadUrl,
                s3Key: expect.stringMatching(/^cards\/card-123\/images\/[a-zA-Z0-9]+\.jpg$/),
                s3Url: expect.stringMatching(/^https:\/\/test-bucket\.s3\.amazonaws\.com\/cards\/card-123\/images\/[a-zA-Z0-9]+\.jpg$/),
                thumbnailS3Key: expect.stringMatching(/^cards\/card-123\/images\/thumbnails\/[a-zA-Z0-9]+\.jpg$/),
                thumbnailS3Url: expect.stringMatching(/^https:\/\/test-bucket\.s3\.amazonaws\.com\/cards\/card-123\/images\/thumbnails\/[a-zA-Z0-9]+\.jpg$/),
            });

            expect(mockGetSignedUrl).toHaveBeenCalledWith(
                mockS3Client,
                expect.any(Object), // PutObjectCommand instance
                { expiresIn: 900 }
            );
        });

        it("should handle different file types correctly", async () => {
            const mockUploadUrl = "https://test-bucket.s3.amazonaws.com/presigned-url";
            mockGetSignedUrl.mockResolvedValue(mockUploadUrl);

            const testCases = [
                { mimeType: "image/png", expectedExt: ".png" },
                { mimeType: "image/gif", expectedExt: ".gif" },
                { mimeType: "image/webp", expectedExt: ".webp" },
                { mimeType: "image/unknown", expectedExt: ".jpg" }, // fallback
            ];

            for (const testCase of testCases) {
                const options = {
                    filename: "test-image",
                    mimeType: testCase.mimeType,
                    fileSize: 1024,
                    cardPublicId: "card-123",
                    userId: "user-456",
                };

                const result = await s3Service.generatePresignedUploadUrl(options);
                expect(result.s3Key).toMatch(new RegExp(`${testCase.expectedExt}$`));
            }
        });
    });

    describe("deleteImage", () => {
        it("should delete image from S3", async () => {
            const s3Key = "cards/card-123/images/test-image.jpg";
            mockS3Client.send.mockResolvedValue({});

            await s3Service.deleteImage(s3Key);

            expect(mockS3Client.send).toHaveBeenCalledWith(
                expect.any(Object) // DeleteObjectCommand instance
            );
        });

        it("should handle S3 deletion errors", async () => {
            const s3Key = "cards/card-123/images/test-image.jpg";
            const error = new Error("S3 deletion failed");
            mockS3Client.send.mockRejectedValue(error);

            await expect(s3Service.deleteImage(s3Key)).rejects.toThrow("S3 deletion failed");
        });
    });

    describe("deleteImageWithThumbnail", () => {
        it("should delete both original and thumbnail images", async () => {
            const s3Key = "cards/card-123/images/test-image.jpg";
            const thumbnailS3Key = "cards/card-123/images/thumbnails/test-image.jpg";
            mockS3Client.send.mockResolvedValue({});

            await s3Service.deleteImageWithThumbnail(s3Key, thumbnailS3Key);

            expect(mockS3Client.send).toHaveBeenCalledTimes(2);
            expect(mockS3Client.send).toHaveBeenNthCalledWith(1, expect.any(Object)); // DeleteObjectCommand
            expect(mockS3Client.send).toHaveBeenNthCalledWith(2, expect.any(Object)); // DeleteObjectCommand
        });

        it("should delete original image even if thumbnail deletion fails", async () => {
            const s3Key = "cards/card-123/images/test-image.jpg";
            const thumbnailS3Key = "cards/card-123/images/thumbnails/test-image.jpg";

            mockS3Client.send
                .mockResolvedValueOnce({}) // Original image deletion succeeds
                .mockRejectedValueOnce(new Error("Thumbnail deletion failed")); // Thumbnail deletion fails

            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => { });

            await expect(s3Service.deleteImageWithThumbnail(s3Key, thumbnailS3Key)).resolves.not.toThrow();

            expect(mockS3Client.send).toHaveBeenCalledTimes(2);
            expect(consoleSpy).toHaveBeenCalledWith(
                `Failed to delete thumbnail ${thumbnailS3Key}:`,
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        it("should only delete original image when no thumbnail key provided", async () => {
            const s3Key = "cards/card-123/images/test-image.jpg";
            mockS3Client.send.mockResolvedValue({});

            await s3Service.deleteImageWithThumbnail(s3Key);

            expect(mockS3Client.send).toHaveBeenCalledTimes(1);
            expect(mockS3Client.send).toHaveBeenCalledWith(
                expect.any(Object) // DeleteObjectCommand instance
            );
        });
    });

    describe("generatePresignedDownloadUrl", () => {
        it("should generate presigned download URL", async () => {
            const s3Key = "cards/card-123/images/test-image.jpg";
            const mockDownloadUrl = "https://test-bucket.s3.amazonaws.com/download-url";
            mockGetSignedUrl.mockResolvedValue(mockDownloadUrl);

            const result = await s3Service.generatePresignedDownloadUrl(s3Key);

            expect(result).toBe(mockDownloadUrl);
            expect(mockGetSignedUrl).toHaveBeenCalledWith(
                mockS3Client,
                expect.any(Object), // GetObjectCommand instance
                { expiresIn: 3600 }
            );
        });

        it("should use custom expiration time", async () => {
            const s3Key = "cards/card-123/images/test-image.jpg";
            const mockDownloadUrl = "https://test-bucket.s3.amazonaws.com/download-url";
            const customExpiresIn = 7200;
            mockGetSignedUrl.mockResolvedValue(mockDownloadUrl);

            await s3Service.generatePresignedDownloadUrl(s3Key, customExpiresIn);

            expect(mockGetSignedUrl).toHaveBeenCalledWith(
                mockS3Client,
                expect.any(Object),
                { expiresIn: customExpiresIn }
            );
        });
    });

    describe("validateImageFile", () => {
        it("should validate allowed image types", () => {
            const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
            const fileSize = 1024; // 1KB

            allowedTypes.forEach(mimeType => {
                expect(() => s3Service.validateImageFile(mimeType, fileSize)).not.toThrow();
            });
        });

        it("should reject invalid image types", () => {
            const invalidTypes = ["image/bmp", "image/tiff", "text/plain", "application/pdf"];
            const fileSize = 1024;

            invalidTypes.forEach(mimeType => {
                expect(() => s3Service.validateImageFile(mimeType, fileSize)).toThrow(
                    "Invalid file type. Allowed types: image/jpeg, image/png, image/gif, image/webp"
                );
            });
        });

        it("should validate file size limits", () => {
            const mimeType = "image/jpeg";
            const validSize = 4 * 1024 * 1024; // 4MB
            const invalidSize = 6 * 1024 * 1024; // 6MB

            expect(() => s3Service.validateImageFile(mimeType, validSize)).not.toThrow();
            expect(() => s3Service.validateImageFile(mimeType, invalidSize)).toThrow(
                "File size too large. Maximum size: 5MB"
            );
        });
    });

    describe("thumbnail and metadata methods", () => {
        it("should have thumbnail generation method", () => {
            expect(typeof s3Service.generateAndUploadThumbnail).toBe("function");
        });

        it("should have metadata extraction method", () => {
            expect(typeof s3Service.getImageMetadata).toBe("function");
        });
    });
});

describe("createS3Service", () => {
    it("should create S3Service with valid environment variables", () => {
        const env = {
            S3_REGION: "us-east-1",
            S3_ACCESS_KEY_ID: "test-access-key",
            S3_SECRET_ACCESS_KEY: "test-secret-key",
            NEXT_PUBLIC_AVATAR_BUCKET_NAME: "test-bucket",
            NEXT_PUBLIC_STORAGE_URL: "https://test-bucket.s3.amazonaws.com",
        };

        const service = createS3Service(env);
        expect(service).toBeInstanceOf(S3Service);
    });

    it("should throw error when required S3 configuration is missing", () => {
        const incompleteEnv = {
            S3_REGION: "us-east-1",
            // Missing S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY
        };

        expect(() => createS3Service(incompleteEnv)).toThrow("Missing required S3 configuration");
    });

    it("should throw error when required public configuration is missing", () => {
        const incompleteEnv = {
            S3_REGION: "us-east-1",
            S3_ACCESS_KEY_ID: "test-access-key",
            S3_SECRET_ACCESS_KEY: "test-secret-key",
            // Missing NEXT_PUBLIC_AVATAR_BUCKET_NAME and NEXT_PUBLIC_STORAGE_URL
        };

        expect(() => createS3Service(incompleteEnv)).toThrow("Missing required S3 public configuration");
    });

    it("should handle optional configuration parameters", () => {
        const env = {
            S3_REGION: "us-east-1",
            S3_ENDPOINT: "https://custom-endpoint.com",
            S3_FORCE_PATH_STYLE: "true",
            S3_ACCESS_KEY_ID: "test-access-key",
            S3_SECRET_ACCESS_KEY: "test-secret-key",
            NEXT_PUBLIC_AVATAR_BUCKET_NAME: "test-bucket",
            NEXT_PUBLIC_STORAGE_URL: "https://test-bucket.s3.amazonaws.com",
        };

        const service = createS3Service(env);
        expect(service).toBeInstanceOf(S3Service);
    });
});