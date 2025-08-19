import { t } from "@lingui/core/macro";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { HiChevronLeft, HiChevronRight, HiXMark, HiPhoto, HiExclamationTriangle } from "react-icons/hi2";
import { twMerge } from "tailwind-merge";

import type { CardImage } from "@kan/api/src/types/cardImage.types";
import { ImageManagement } from "./ImageManagement";
import { api } from "~/utils/api";

interface ImageDisplayProps {
    images: CardImage[];
    cardPublicId: string;
    onImageDelete?: (imageId: string) => void;
    onImageReplace?: (oldImageId: string, newImage: CardImage) => void;
    onError?: (error: string) => void;
    isEditable?: boolean;
    className?: string;
}

interface ImageItemProps {
    image: CardImage;
    index: number;
    cardPublicId: string;
    onImageClick: (index: number) => void;
    onImageDelete?: (imageId: string) => void;
    onImageReplace?: (oldImageId: string, newImage: CardImage) => void;
    onError?: (error: string) => void;
    isEditable?: boolean;
}

// Custom hook for intersection observer
const useIntersectionObserver = (
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit,
) => {
    const observer = useRef<IntersectionObserver | null>(null);
    const elementsRef = useRef<Set<Element>>(new Set());

    useEffect(() => {
        // Only create observer in client environment
        if (typeof window !== 'undefined' && typeof IntersectionObserver !== 'undefined') {
            observer.current = new IntersectionObserver(callback, {
                threshold: 0.1,
                rootMargin: "100px", // Load images 100px before they enter viewport
                ...options,
            });

            // Observe all existing elements
            elementsRef.current.forEach((element) => {
                observer.current?.observe(element);
            });
        }

        return () => {
            if (observer.current && typeof observer.current.disconnect === 'function') {
                observer.current.disconnect();
            }
        };
    }, [callback, options]);

    const addElement = useCallback((element: Element | null) => {
        if (element && !elementsRef.current.has(element)) {
            elementsRef.current.add(element);
            // Only observe in client environment
            if (typeof window !== 'undefined' && observer.current && typeof observer.current.observe === 'function') {
                observer.current.observe(element);
            }
        }
    }, []);

    return { addElement };
};

// Individual image item component with lazy loading
const ImageItem: React.FC<ImageItemProps> = ({
    image,
    index,
    cardPublicId,
    onImageClick,
    onImageDelete,
    onImageReplace,
    onError,
    isEditable = false,
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(false); // Always start false for consistent SSR
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    // Fetch presigned URLs when image comes into view
    const { data: presignedUrls, isLoading: urlsLoading } = api.image.getPresignedUrls.useQuery(
        {
            cardPublicId,
            imagePublicIds: [image.publicId],
        },
        {
            enabled: isInView && isMounted,
            staleTime: 5 * 60 * 1000, // 5 minutes (URLs expire in 10 minutes)
        }
    );

    // Track when component is mounted on client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (presignedUrls && presignedUrls.length > 0) {
            const urlData = presignedUrls[0];
            // Use thumbnail URL if available, otherwise use original
            setImageUrl(urlData?.thumbnailUrl || urlData?.originalUrl || null);
        }
    }, [presignedUrls]);

    const { addElement } = useIntersectionObserver(
        useCallback((entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                }
            });
        }, []),
    );

    useEffect(() => {
        // Only run after component is mounted on client
        if (isMounted) {
            if (imgRef.current) {
                addElement(imgRef.current);
            }

            // If IntersectionObserver is not available, show images immediately
            if (typeof IntersectionObserver === 'undefined') {
                setIsInView(true);
            }
        }
    }, [addElement, isMounted]);

    const handleImageLoad = useCallback(() => {
        setIsLoaded(true);
        setHasError(false);
    }, []);

    const handleImageError = useCallback(() => {
        // If thumbnail fails to load, try to fall back to original URL
        if (presignedUrls && presignedUrls.length > 0) {
            const urlData = presignedUrls[0];
            const currentUrl = imageUrl;
            const thumbnailUrl = urlData?.thumbnailUrl;
            const originalUrl = urlData?.originalUrl;
            
            // If we were trying to load thumbnail and it failed, try original
            if (currentUrl === thumbnailUrl && originalUrl && thumbnailUrl !== originalUrl) {
                console.warn('Thumbnail failed to load, falling back to original image');
                setImageUrl(originalUrl);
                setHasError(false); // Reset error state for retry
                return;
            }
        }
        
        // If original also fails or we were already trying original, show error
        setHasError(true);
        setIsLoaded(false);
    }, [presignedUrls, imageUrl]);

    const handleImageClick = useCallback((e: React.MouseEvent) => {
        // Don't open image preview if clicking on management buttons
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[data-image-management]')) {
            return;
        }
        onImageClick(index);
    }, [index, onImageClick]);

    const handleDeleteClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (onImageDelete) {
                onImageDelete(image.publicId);
            }
        },
        [image.publicId, onImageDelete],
    );

    const handleImageReplace = useCallback(
        (oldImageId: string, newImage: CardImage) => {
            if (onImageReplace) {
                onImageReplace(oldImageId, newImage);
            }
        },
        [onImageReplace],
    );

    const handleError = useCallback(
        (error: string) => {
            if (onError) {
                onError(error);
            }
        },
        [onError],
    );

    return (
        <div className="group relative">
            <div
                ref={imgRef}
                className="aspect-square cursor-pointer overflow-hidden rounded-lg border border-light-300 bg-light-100 dark:border-dark-500 dark:bg-dark-200"
                onClick={handleImageClick}
            >
                {/* Loading skeleton - shown until component is mounted and in view */}
                {(!isMounted || !isInView) && (
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="h-8 w-8 animate-pulse rounded bg-light-300 dark:bg-dark-400" />
                    </div>
                )}

                {/* URL loading state */}
                {isMounted && isInView && (urlsLoading || !imageUrl) && !hasError && (
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="flex flex-col items-center space-y-2">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-light-300 border-t-light-600 dark:border-dark-400 dark:border-t-dark-600" />
                            <p className="text-xs text-light-600 dark:text-dark-600">
                                {urlsLoading ? t`Getting secure URL...` : t`Loading...`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error state */}
                {isMounted && isInView && hasError && (
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="flex flex-col items-center space-y-2">
                            <HiExclamationTriangle className="h-8 w-8 text-red-500" />
                            <p className="text-xs text-red-600 dark:text-red-400">
                                {t`Failed to load`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Actual image */}
                {isMounted && isInView && imageUrl && (
                    <img
                        src={imageUrl}
                        alt={image.originalName}
                        className={twMerge(
                            "h-full w-full object-cover transition-opacity duration-300",
                            isLoaded ? "opacity-100" : "opacity-0",
                        )}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        loading="lazy"
                    />
                )}

                {/* Image overlay on hover */}
                <div className="absolute inset-0 bg-black opacity-0 transition-opacity group-hover:opacity-10" />
            </div>

            {/* Management controls OUTSIDE the clickable image area */}
            {isEditable && (onImageDelete || onImageReplace) && (
                <div className="absolute inset-x-2 bottom-2 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                    <div className="pointer-events-auto">
                        <ImageManagement
                            image={image}
                            cardPublicId={cardPublicId}
                            onImageDelete={onImageDelete || (() => { })}
                            onImageReplace={handleImageReplace}
                            onError={handleError}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// Main ImageDisplay component
export const ImageDisplay: React.FC<ImageDisplayProps> = ({
    images,
    cardPublicId,
    onImageDelete,
    onImageReplace,
    onError,
    isEditable = false,
    className,
}) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [modalImageLoaded, setModalImageLoaded] = useState(false);
    const [modalImageError, setModalImageError] = useState(false);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

    const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;

    // Fetch presigned URL for modal image
    const { data: modalPresignedUrls, isLoading: modalUrlLoading } = api.image.getPresignedUrls.useQuery(
        {
            cardPublicId,
            imagePublicIds: selectedImage ? [selectedImage.publicId] : [],
        },
        {
            enabled: selectedImage !== null,
            staleTime: 5 * 60 * 1000, // 5 minutes
        }
    );

    useEffect(() => {
        if (modalPresignedUrls && modalPresignedUrls.length > 0) {
            const urlData = modalPresignedUrls[0];
            // For modal, use original URL (full size)
            setModalImageUrl(urlData?.originalUrl || null);
        } else {
            setModalImageUrl(null);
        }
    }, [modalPresignedUrls]);

    const handleImageClick = useCallback((index: number) => {
        setSelectedImageIndex(index);
        setModalImageLoaded(false);
        setModalImageError(false);
        setModalImageUrl(null);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedImageIndex(null);
        setModalImageLoaded(false);
        setModalImageError(false);
        setModalImageUrl(null);
    }, []);

    const handlePreviousImage = useCallback(() => {
        if (selectedImageIndex !== null && selectedImageIndex > 0) {
            setSelectedImageIndex(selectedImageIndex - 1);
            setModalImageLoaded(false);
            setModalImageError(false);
            setModalImageUrl(null);
        }
    }, [selectedImageIndex]);

    const handleNextImage = useCallback(() => {
        if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
            setSelectedImageIndex(selectedImageIndex + 1);
            setModalImageLoaded(false);
            setModalImageError(false);
            setModalImageUrl(null);
        }
    }, [selectedImageIndex, images.length]);

    const handleModalImageLoad = useCallback(() => {
        setModalImageLoaded(true);
        setModalImageError(false);
    }, []);

    const handleModalImageError = useCallback(() => {
        setModalImageError(true);
        setModalImageLoaded(false);
    }, []);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (selectedImageIndex === null) return;

            switch (event.key) {
                case "Escape":
                    handleCloseModal();
                    break;
                case "ArrowLeft":
                    handlePreviousImage();
                    break;
                case "ArrowRight":
                    handleNextImage();
                    break;
            }
        };

        if (selectedImageIndex !== null) {
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedImageIndex, handleCloseModal, handlePreviousImage, handleNextImage]);

    if (images.length === 0) {
        return null;
    }

    return (
        <>
            {/* Image grid */}
            <div className={twMerge("w-full", className)}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {images.map((image, index) => (
                        <ImageItem
                            key={image.publicId}
                            image={image}
                            index={index}
                            cardPublicId={cardPublicId}
                            onImageClick={handleImageClick}
                            onImageDelete={onImageDelete}
                            onImageReplace={onImageReplace}
                            onError={onError}
                            isEditable={isEditable}
                        />
                    ))}
                </div>
            </div>

            {/* Full-size image modal */}
            <Transition.Root show={selectedImageIndex !== null} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={handleCloseModal}>
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
                                <Dialog.Panel className="relative max-h-[90vh] max-w-[90vw] transform overflow-hidden rounded-lg bg-white shadow-xl transition-all dark:bg-dark-100">
                                    {selectedImage && (
                                        <>
                                            {/* Modal header */}
                                            <div className="flex items-center justify-between border-b border-light-300 px-4 py-3 dark:border-dark-500">
                                                <div className="flex items-center space-x-3">
                                                    <HiPhoto className="h-5 w-5 text-light-600 dark:text-dark-600" />
                                                    <div>
                                                        <h3 className="text-sm font-medium text-light-900 dark:text-dark-900">
                                                            {selectedImage.originalName}
                                                        </h3>
                                                        <p className="text-xs text-light-600 dark:text-dark-600">
                                                            {Math.round(selectedImage.fileSize / 1024)} KB
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs text-light-600 dark:text-dark-600">
                                                        {selectedImageIndex! + 1} of {images.length}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleCloseModal}
                                                        className="rounded p-1 hover:bg-light-200 dark:hover:bg-dark-300"
                                                    >
                                                        <HiXMark className="h-5 w-5 text-light-600 dark:text-dark-600" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Modal content */}
                                            <div className="relative">
                                                {/* URL Loading state */}
                                                {(modalUrlLoading || !modalImageUrl) && !modalImageError && (
                                                    <div className="flex h-96 w-96 items-center justify-center">
                                                        <div className="flex flex-col items-center space-y-4">
                                                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-light-300 border-t-light-600 dark:border-dark-400 dark:border-t-dark-600" />
                                                            <p className="text-sm text-light-600 dark:text-dark-600">
                                                                {modalUrlLoading ? t`Getting secure URL...` : t`Loading image...`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Error state */}
                                                {modalImageError && (
                                                    <div className="flex h-96 w-96 items-center justify-center">
                                                        <div className="flex flex-col items-center space-y-4">
                                                            <HiExclamationTriangle className="h-12 w-12 text-red-500" />
                                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                                {t`Failed to load image`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Full-size image */}
                                                {modalImageUrl && (
                                                    <img
                                                        src={modalImageUrl}
                                                        alt={selectedImage.originalName}
                                                        className={twMerge(
                                                            "max-h-[70vh] max-w-full object-contain transition-opacity duration-300",
                                                            modalImageLoaded ? "opacity-100" : "opacity-0",
                                                        )}
                                                        onLoad={handleModalImageLoad}
                                                        onError={handleModalImageError}
                                                    />
                                                )}

                                                {/* Navigation buttons */}
                                                {images.length > 1 && (
                                                    <>
                                                        {selectedImageIndex! > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={handlePreviousImage}
                                                                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75"
                                                            >
                                                                <HiChevronLeft className="h-6 w-6" />
                                                            </button>
                                                        )}
                                                        {selectedImageIndex! < images.length - 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={handleNextImage}
                                                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75"
                                                            >
                                                                <HiChevronRight className="h-6 w-6" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    );
};

export default ImageDisplay;