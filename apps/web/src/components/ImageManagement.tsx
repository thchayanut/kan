import { t } from "@lingui/core/macro";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useCallback, useState } from "react";
import { HiTrash, HiArrowPath, HiExclamationTriangle, HiXMark } from "react-icons/hi2";
import { twMerge } from "tailwind-merge";

import { api } from "~/utils/api";
import type { CardImage } from "@kan/api/src/types/cardImage.types";
import { ImageUpload } from "./ImageUpload";

interface ImageManagementProps {
    image: CardImage;
    cardPublicId: string;
    onImageDelete: (imageId: string) => void;
    onImageReplace: (oldImageId: string, newImage: CardImage) => void;
    onError: (error: string) => void;
    className?: string;
}

interface DeleteConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    imageName: string;
    isDeleting: boolean;
}

interface ReplaceImageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    image: CardImage;
    cardPublicId: string;
    onImageReplace: (oldImageId: string, newImage: CardImage) => void;
    onError: (error: string) => void;
}

// Delete confirmation dialog component
const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    imageName,
    isDeleting,
}) => {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all dark:bg-dark-100">
                                <div className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                                            <HiExclamationTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div className="flex-1">
                                            <Dialog.Title className="text-lg font-medium text-light-900 dark:text-dark-900">
                                                {t`Delete Image`}
                                            </Dialog.Title>
                                            <p className="mt-1 text-sm text-light-700 dark:text-dark-700">
                                                {t`Are you sure you want to delete "${imageName}"? This action cannot be undone.`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 border-t border-light-300 px-6 py-4 dark:border-dark-500">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={isDeleting}
                                        className="rounded-md border border-light-300 bg-white px-4 py-2 text-sm font-medium text-light-700 hover:bg-light-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-500 dark:bg-dark-200 dark:text-dark-700 dark:hover:bg-dark-300"
                                    >
                                        {t`Cancel`}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onConfirm}
                                        disabled={isDeleting}
                                        className="flex items-center space-x-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isDeleting && (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        )}
                                        <span>{isDeleting ? t`Deleting...` : t`Delete`}</span>
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

// Replace image dialog component
const ReplaceImageDialog: React.FC<ReplaceImageDialogProps> = ({
    isOpen,
    onClose,
    image,
    cardPublicId,
    onImageReplace,
    onError,
}) => {
    const [isReplacing, setIsReplacing] = useState(false);

    const deleteMutation = api.image.delete.useMutation({
        onSuccess: () => {
            // Image deleted successfully, the upload component will handle the new upload
        },
        onError: (error) => {
            setIsReplacing(false);
            onError(error.message || t`Failed to delete old image`);
        },
    });

    const handleUploadComplete = useCallback(
        (newImage: CardImage) => {
            // Delete the old image after successful upload
            deleteMutation.mutate(
                { imagePublicId: image.publicId },
                {
                    onSuccess: () => {
                        onImageReplace(image.publicId, newImage);
                        setIsReplacing(false);
                        onClose();
                    },
                    onError: (error) => {
                        // If deletion fails, we still have the new image uploaded
                        // but the old one remains. This is better than losing both.
                        console.warn("Failed to delete old image after replacement:", error);
                        onImageReplace(image.publicId, newImage);
                        setIsReplacing(false);
                        onClose();
                    },
                }
            );
        },
        [deleteMutation, image.publicId, onImageReplace, onClose]
    );

    const handleUploadError = useCallback(
        (error: string) => {
            setIsReplacing(false);
            onError(error);
        },
        [onError]
    );

    const handleUploadStart = useCallback(() => {
        setIsReplacing(true);
    }, []);

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all dark:bg-dark-100">
                                <div className="flex items-center justify-between border-b border-light-300 px-6 py-4 dark:border-dark-500">
                                    <Dialog.Title className="text-lg font-medium text-light-900 dark:text-dark-900">
                                        {t`Replace Image`}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={isReplacing}
                                        className="rounded p-1 hover:bg-light-200 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-dark-300"
                                    >
                                        <HiXMark className="h-5 w-5 text-light-600 dark:text-dark-600" />
                                    </button>
                                </div>

                                <div className="px-6 py-4">
                                    <div className="mb-4">
                                        <p className="text-sm text-light-700 dark:text-dark-700">
                                            {t`Current image: ${image.originalName}`}
                                        </p>
                                        <p className="mt-1 text-xs text-light-600 dark:text-dark-600">
                                            {t`Select a new image to replace it with. The old image will be deleted.`}
                                        </p>
                                    </div>

                                    <ImageUpload
                                        cardPublicId={cardPublicId}
                                        onUploadComplete={handleUploadComplete}
                                        onUploadError={handleUploadError}
                                        disabled={isReplacing}
                                    />

                                    {isReplacing && (
                                        <div className="mt-4 flex items-center space-x-2 text-sm text-light-700 dark:text-dark-700">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-light-300 border-t-light-600 dark:border-dark-400 dark:border-t-dark-600" />
                                            <span>{t`Replacing image...`}</span>
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

// Main image management component
export const ImageManagement: React.FC<ImageManagementProps> = ({
    image,
    cardPublicId,
    onImageDelete,
    onImageReplace,
    onError,
    className,
}) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showReplaceDialog, setShowReplaceDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteMutation = api.image.delete.useMutation({
        onSuccess: () => {
            setIsDeleting(false);
            setShowDeleteDialog(false);
            onImageDelete(image.publicId);
        },
        onError: (error) => {
            setIsDeleting(false);
            onError(error.message || t`Failed to delete image`);
        },
    });

    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening image preview
        setShowDeleteDialog(true);
    }, []);

    const handleReplaceClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening image preview
        setShowReplaceDialog(true);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        setIsDeleting(true);
        deleteMutation.mutate({ imagePublicId: image.publicId });
    }, [deleteMutation, image.publicId]);

    const handleDeleteCancel = useCallback(() => {
        if (!isDeleting) {
            setShowDeleteDialog(false);
        }
    }, [isDeleting]);

    const handleReplaceCancel = useCallback(() => {
        setShowReplaceDialog(false);
    }, []);

    return (
        <>
            <div 
                className={twMerge("flex items-center space-x-2", className)}
                onClick={(e) => e.stopPropagation()}
                data-image-management="true"
            >
                <button
                    type="button"
                    onClick={handleReplaceClick}
                    className="flex items-center space-x-1 rounded-md bg-light-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-light-700 dark:bg-dark-600 dark:hover:bg-dark-700"
                    title={t`Replace image`}
                >
                    <HiArrowPath className="h-3 w-3" />
                    <span>{t`Replace`}</span>
                </button>

                <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="flex items-center space-x-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    title={t`Delete image`}
                >
                    <HiTrash className="h-3 w-3" />
                    <span>{t`Delete`}</span>
                </button>
            </div>

            <DeleteConfirmationDialog
                isOpen={showDeleteDialog}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                imageName={image.originalName}
                isDeleting={isDeleting}
            />

            <ReplaceImageDialog
                isOpen={showReplaceDialog}
                onClose={handleReplaceCancel}
                image={image}
                cardPublicId={cardPublicId}
                onImageReplace={onImageReplace}
                onError={onError}
            />
        </>
    );
};

export default ImageManagement;