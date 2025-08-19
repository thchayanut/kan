import { t } from "@lingui/core/macro";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { HiCloudArrowUp, HiPhoto, HiXMark } from "react-icons/hi2";
import { twMerge } from "tailwind-merge";

import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import type { CardImage } from "@kan/api/src/types/cardImage.types";

interface ImageUploadProps {
    cardPublicId: string;
    onUploadComplete: (image: CardImage) => void;
    onUploadError: (error: string) => void;
    className?: string;
    disabled?: boolean;
}

interface UploadProgress {
    filename: string;
    progress: number;
    status: "uploading" | "processing" | "complete" | "error";
    error?: string;
    file?: File;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export const ImageUpload: React.FC<ImageUploadProps> = ({
    cardPublicId,
    onUploadComplete,
    onUploadError,
    className,
    disabled = false,
}) => {
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
        null,
    );

    const uploadToS3 = useCallback(
        async (file: File, uploadUrl: string, mimeType: string) => {
            return new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // Set up progress tracking
                xhr.upload.addEventListener("progress", (event) => {
                    if (event.lengthComputable) {
                        const progress = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress((prev) =>
                            prev ? { ...prev, progress, status: "uploading" } : null,
                        );
                    }
                });

                // Set up completion handler
                xhr.addEventListener("load", () => {
                    console.log("S3 upload response:", {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText,
                    });
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed: ${xhr.statusText} (${xhr.status})`));
                    }
                });

                // Set up error handler
                xhr.addEventListener("error", () => {
                    reject(new Error("Upload failed due to network error"));
                });

                // Start the upload
                console.log("Starting S3 upload:", {
                    uploadUrl,
                    mimeType,
                    fileSize: file.size,
                    fileName: file.name,
                });
                xhr.open("PUT", uploadUrl);
                xhr.setRequestHeader("Content-Type", mimeType);
                xhr.send(file);
            });
        },
        [],
    );

    const processThumbnailMutation = api.image.processThumbnail.useMutation();

    const uploadMutation = api.image.upload.useMutation({
        onSuccess: async (data: RouterOutputs["image"]["upload"]) => {
            const { image, uploadUrl } = data;

            try {
                // Get the file from upload progress
                const file = uploadProgress?.file;

                if (!file) {
                    throw new Error("File not found for upload");
                }

                // Upload to S3 with progress tracking
                await uploadToS3(file, uploadUrl, image.mimeType);

                // Process thumbnail after successful upload
                try {
                    await processThumbnailMutation.mutateAsync({
                        imagePublicId: image.publicId,
                    });
                } catch (thumbnailError) {
                    // Don't fail the entire upload if thumbnail processing fails
                    console.warn("Thumbnail generation failed:", thumbnailError);
                }

                setUploadProgress((prev) =>
                    prev
                        ? { ...prev, status: "complete", progress: 100 }
                        : null,
                );

                // Call success callback
                onUploadComplete(image);

                // Clear progress after a short delay
                setTimeout(() => {
                    setUploadProgress(null);
                }, 1000);
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : "Upload failed";
                setUploadProgress((prev) =>
                    prev
                        ? { ...prev, status: "error", error: errorMessage }
                        : null,
                );
                onUploadError(errorMessage);
            }
        },
        onError: (error: unknown) => {
            const errorMessage = (error instanceof Error ? error.message : String(error)) || "Failed to initiate upload";
            setUploadProgress((prev) =>
                prev
                    ? { ...prev, status: "error", error: errorMessage }
                    : null,
            );
            onUploadError(errorMessage);
        },
    });

    const validateFile = useCallback((file: File): string | null => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return t`File must be JPEG, PNG, GIF, or WebP`;
        }

        if (file.size > MAX_FILE_SIZE) {
            return t`File size must be under 5MB`;
        }

        return null;
    }, []);

    const handleFileUpload = useCallback(
        async (files: File[]) => {
            if (disabled || uploadProgress?.status === "uploading") {
                return;
            }

            const file = files[0];
            if (!file) return;

            // Validate file
            const validationError = validateFile(file);
            if (validationError) {
                onUploadError(validationError);
                return;
            }

            // Set initial progress with file reference
            setUploadProgress({
                filename: file.name,
                progress: 0,
                status: "processing",
                file,
            });

            // Generate filename with timestamp to avoid conflicts
            const timestamp = Date.now();
            const extension = file.name.split(".").pop() || "";
            const filename = `${timestamp}.${extension}`;

            // Validate and normalize MIME type
            const normalizedMimeType = (() => {
                switch (file.type) {
                    case "image/jpeg":
                    case "image/jpg":
                        return "image/jpeg";
                    case "image/png":
                        return "image/png";
                    case "image/gif":
                        return "image/gif";
                    case "image/webp":
                        return "image/webp";
                    default:
                        throw new Error(`Unsupported file type: ${file.type}`);
                }
            })();

            // Start upload process
            uploadMutation.mutate({
                cardPublicId,
                filename,
                originalName: file.name,
                mimeType: normalizedMimeType,
                fileSize: file.size,
            });
        },
        [
            cardPublicId,
            disabled,
            onUploadError,
            uploadMutation,
            uploadProgress?.status,
            validateFile,
        ],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleFileUpload,
        accept: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/gif": [".gif"],
            "image/webp": [".webp"],
        },
        maxFiles: 1,
        disabled: disabled || uploadProgress?.status === "uploading",
    });

    const handleCancelUpload = useCallback(() => {
        setUploadProgress(null);
        // Note: In a real implementation, you might want to cancel the actual upload request
    }, []);

    const isUploading = uploadProgress?.status === "uploading";
    const isProcessing = uploadProgress?.status === "processing";
    const hasError = uploadProgress?.status === "error";
    const isComplete = uploadProgress?.status === "complete";

    return (
        <div className={twMerge("w-full", className)}>
            {uploadProgress ? (
                <div className="rounded-lg border border-light-600 bg-light-50 p-4 dark:border-dark-600 dark:bg-dark-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <HiPhoto className="h-5 w-5 text-light-700 dark:text-dark-700" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-light-900 dark:text-dark-900">
                                    {uploadProgress.filename}
                                </p>
                                {hasError ? (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {uploadProgress.error}
                                    </p>
                                ) : isComplete ? (
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        {t`Upload complete`}
                                    </p>
                                ) : isProcessing ? (
                                    <p className="text-sm text-light-700 dark:text-dark-700">
                                        {t`Processing...`}
                                    </p>
                                ) : (
                                    <p className="text-sm text-light-700 dark:text-dark-700">
                                        {t`Uploading...`} {uploadProgress.progress}%
                                    </p>
                                )}
                            </div>
                        </div>
                        {!isComplete && (
                            <button
                                type="button"
                                onClick={handleCancelUpload}
                                className="rounded p-1 hover:bg-light-200 dark:hover:bg-dark-400"
                            >
                                <HiXMark className="h-4 w-4 text-light-700 dark:text-dark-700" />
                            </button>
                        )}
                    </div>
                    {(isUploading || isProcessing) && (
                        <div className="mt-3">
                            <div className="h-2 w-full rounded-full bg-light-200 dark:bg-dark-400">
                                <div
                                    className="h-2 rounded-full bg-light-600 transition-all duration-300 dark:bg-dark-600"
                                    style={{
                                        width: isProcessing ? "50%" : `${uploadProgress.progress}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={twMerge(
                        "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                        isDragActive
                            ? "border-light-600 bg-light-100 dark:border-dark-600 dark:bg-dark-200"
                            : "border-light-400 hover:border-light-600 hover:bg-light-50 dark:border-dark-500 dark:hover:border-dark-600 dark:hover:bg-dark-300",
                        disabled && "cursor-not-allowed opacity-50",
                    )}
                >
                    <input {...getInputProps()} />
                    <HiCloudArrowUp className="mx-auto h-12 w-12 text-light-600 dark:text-dark-600" />
                    <div className="mt-4">
                        <p className="text-sm font-medium text-light-900 dark:text-dark-900">
                            {isDragActive
                                ? t`Drop the image here`
                                : t`Click to upload or drag and drop`}
                        </p>
                        <p className="mt-1 text-xs text-light-700 dark:text-dark-700">
                            {t`JPEG, PNG, GIF, or WebP up to 5MB`}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;