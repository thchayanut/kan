import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ImageDisplay } from "../ImageDisplay";
import type { CardImage } from "@kan/api/src/types/cardImage.types";

// Mock the lingui macro
vi.mock("@lingui/core/macro", () => ({
    t: (str: TemplateStringsArray | string) => str,
}));

// Mock the ImageManagement component
vi.mock("../ImageManagement", () => ({
    ImageManagement: ({ image, onImageDelete, onImageReplace, onError }: any) => (
        <div data-testid="image-management">
            <button
                onClick={() => onImageDelete(image.publicId)}
                data-testid="management-delete-button"
            >
                Delete
            </button>
            <button
                onClick={() => onImageReplace(image.publicId, { ...image, filename: "replaced.jpg" })}
                data-testid="management-replace-button"
            >
                Replace
            </button>
            <button
                onClick={() => onError("Management error")}
                data-testid="management-error-button"
            >
                Trigger Error
            </button>
        </div>
    ),
}));

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();
let intersectionCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null;

const mockIntersectionObserver = vi.fn().mockImplementation((callback) => {
    intersectionCallback = callback;
    return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
    };
});
window.IntersectionObserver = mockIntersectionObserver;

// Helper to trigger intersection
const triggerIntersection = (isIntersecting = true) => {
    if (intersectionCallback) {
        const mockEntry = {
            isIntersecting,
            target: document.querySelector(".aspect-square"),
        } as IntersectionObserverEntry;
        intersectionCallback([mockEntry]);
    }
};

// Mock image loading
const mockImage = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    src: "",
    onload: null as ((this: GlobalEventHandlers, ev: Event) => any) | null,
    onerror: null as ((this: GlobalEventHandlers, ev: ErrorEvent) => any) | null,
};

// Override Image constructor
global.Image = vi.fn(() => mockImage) as any;

// Sample test data
const mockImages: CardImage[] = [
    {
        id: 1,
        publicId: "img1",
        cardId: 1,
        filename: "test1.jpg",
        originalName: "test-image-1.jpg",
        mimeType: "image/jpeg",
        fileSize: 1024000,
        s3Key: "images/test1.jpg",
        s3Url: "https://example.com/test1.jpg",
        thumbnailS3Key: "thumbnails/test1.jpg",
        thumbnailS3Url: "https://example.com/thumbnails/test1.jpg",
        width: 800,
        height: 600,
        uploadedBy: "user1",
        createdAt: new Date("2023-01-01"),
    },
    {
        id: 2,
        publicId: "img2",
        cardId: 1,
        filename: "test2.png",
        originalName: "test-image-2.png",
        mimeType: "image/png",
        fileSize: 2048000,
        s3Key: "images/test2.png",
        s3Url: "https://example.com/test2.png",
        thumbnailS3Key: "thumbnails/test2.png",
        thumbnailS3Url: "https://example.com/thumbnails/test2.png",
        width: 1200,
        height: 800,
        uploadedBy: "user1",
        createdAt: new Date("2023-01-02"),
    },
];

describe("ImageDisplay", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockObserve.mockClear();
        mockUnobserve.mockClear();
        mockDisconnect.mockClear();
        mockIntersectionObserver.mockClear();
        intersectionCallback = null;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Basic Rendering", () => {
        it("renders nothing when no images are provided", () => {
            const { container } = render(
                <ImageDisplay
                    images={[]}
                    cardPublicId="card123"
                />
            );
            expect(container.firstChild).toBeNull();
        });

        it("renders image grid when images are provided", () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Should render grid container
            const grid = document.querySelector(".grid");
            expect(grid).toBeInTheDocument();
        });

        it("renders correct number of image items", () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Should render 2 image containers
            const imageContainers = document.querySelectorAll(".aspect-square");
            expect(imageContainers).toHaveLength(2);
        });

        it("applies custom className", () => {
            const { container } = render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                    className="custom-class"
                />
            );

            expect(container.firstChild).toHaveClass("custom-class");
        });
    });

    describe("Lazy Loading", () => {
        it("shows loading skeleton initially", () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Should show loading skeletons
            const skeletons = document.querySelectorAll(".animate-pulse");
            expect(skeletons.length).toBeGreaterThan(0);
        });

        it("sets up intersection observer for each image", () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // IntersectionObserver should be called for each image
            expect(mockIntersectionObserver).toHaveBeenCalled();
        });

        it("shows loading spinner when image is in view but not loaded", async () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Trigger intersection to make images visible
            triggerIntersection(true);

            await waitFor(() => {
                const loadingSpinners = document.querySelectorAll(".animate-spin");
                expect(loadingSpinners.length).toBeGreaterThan(0);
            });
        });
    });

    describe("Image Loading States", () => {
        it("shows error state when image fails to load", async () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Trigger intersection to make images visible
            triggerIntersection(true);

            await waitFor(() => {
                const images = document.querySelectorAll("img");
                expect(images.length).toBeGreaterThan(0);
            });

            // Find and trigger error on an image
            const images = document.querySelectorAll("img");
            if (images[0]) {
                fireEvent.error(images[0]);
            }

            await waitFor(() => {
                expect(screen.getByText("Failed to load")).toBeInTheDocument();
            });
        });

        it("shows loaded image when loading succeeds", async () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Trigger intersection to make images visible
            triggerIntersection(true);

            await waitFor(() => {
                const images = document.querySelectorAll("img");
                expect(images.length).toBeGreaterThan(0);
            });

            // Find and trigger load on an image
            const images = document.querySelectorAll("img");
            if (images[0]) {
                fireEvent.load(images[0]);
            }

            await waitFor(() => {
                const updatedImages = document.querySelectorAll("img");
                expect(updatedImages[0]).toHaveClass("opacity-100");
            });
        });

        it("uses thumbnail URL when available", async () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Trigger intersection to make images visible
            triggerIntersection(true);

            await waitFor(() => {
                const images = document.querySelectorAll("img");
                expect(images[0]).toHaveAttribute("src", mockImages[0].thumbnailS3Url);
            });
        });

        it("falls back to main URL when thumbnail is not available", async () => {
            const imagesWithoutThumbnail = [
                {
                    ...mockImages[0],
                    thumbnailS3Url: null,
                },
            ];

            render(
                <ImageDisplay
                    images={imagesWithoutThumbnail}
                    cardPublicId="card123"
                />
            );

            // Trigger intersection to make images visible
            triggerIntersection(true);

            await waitFor(() => {
                const images = document.querySelectorAll("img");
                expect(images[0]).toHaveAttribute("src", mockImages[0].s3Url);
            });
        });
    });

    describe("Modal Functionality", () => {
        it("opens modal when image is clicked", async () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Click on first image container
            const imageContainer = document.querySelector(".aspect-square");
            if (imageContainer) {
                fireEvent.click(imageContainer);
            }

            await waitFor(() => {
                expect(screen.getByRole("dialog")).toBeInTheDocument();
            });
        });

        it("displays correct image information in modal", async () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Click on first image
            const imageContainer = document.querySelector(".aspect-square");
            if (imageContainer) {
                fireEvent.click(imageContainer);
            }

            await waitFor(() => {
                expect(screen.getByText(mockImages[0].originalName)).toBeInTheDocument();
                expect(screen.getByText("1000 KB")).toBeInTheDocument(); // fileSize / 1024
                expect(screen.getByText("1 of 2")).toBeInTheDocument();
            });
        });

        it("closes modal when close button is clicked", async () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Open modal
            const imageContainer = document.querySelector(".aspect-square");
            if (imageContainer) {
                fireEvent.click(imageContainer);
            }

            await waitFor(() => {
                expect(screen.getByRole("dialog")).toBeInTheDocument();
            });

            // Close modal - find the X button in the modal header
            const closeButton = document.querySelector("button svg[viewBox='0 0 24 24']")?.parentElement;
            if (closeButton) {
                fireEvent.click(closeButton);
            }

            await waitFor(() => {
                expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
            });
        });

        it("navigates to next image with arrow key", async () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Open modal
            const imageContainer = document.querySelector(".aspect-square");
            if (imageContainer) {
                fireEvent.click(imageContainer);
            }

            await waitFor(() => {
                expect(screen.getByText("1 of 2")).toBeInTheDocument();
            });

            // Press right arrow
            fireEvent.keyDown(document, { key: "ArrowRight" });

            await waitFor(() => {
                expect(screen.getByText("2 of 2")).toBeInTheDocument();
            });
        });

        it("navigates to previous image with arrow key", async () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Open modal on second image
            const imageContainers = document.querySelectorAll(".aspect-square");
            if (imageContainers[1]) {
                fireEvent.click(imageContainers[1]);
            }

            await waitFor(() => {
                expect(screen.getByText("2 of 2")).toBeInTheDocument();
            });

            // Press left arrow
            fireEvent.keyDown(document, { key: "ArrowLeft" });

            await waitFor(() => {
                expect(screen.getByText("1 of 2")).toBeInTheDocument();
            });
        });

        it("closes modal with escape key", async () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Open modal
            const imageContainer = document.querySelector(".aspect-square");
            if (imageContainer) {
                fireEvent.click(imageContainer);
            }

            await waitFor(() => {
                expect(screen.getByRole("dialog")).toBeInTheDocument();
            });

            // Press escape
            fireEvent.keyDown(document, { key: "Escape" });

            await waitFor(() => {
                expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
            });
        });
    });

    describe("Editable Mode", () => {
        it("shows image management controls when in editable mode", () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                    isEditable={true}
                    onImageDelete={vi.fn()}
                />
            );

            const managementControls = screen.getAllByTestId("image-management");
            expect(managementControls).toHaveLength(2);
        });

        it("does not show management controls when not in editable mode", () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                    isEditable={false}
                />
            );

            const managementControls = screen.queryAllByTestId("image-management");
            expect(managementControls).toHaveLength(0);
        });

        it("calls onImageDelete when delete is triggered from management", () => {
            const mockOnDelete = vi.fn();
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                    isEditable={true}
                    onImageDelete={mockOnDelete}
                />
            );

            const deleteButtons = screen.getAllByTestId("management-delete-button");
            fireEvent.click(deleteButtons[0]);

            expect(mockOnDelete).toHaveBeenCalledWith(mockImages[0].publicId);
        });

        it("calls onImageReplace when replace is triggered from management", () => {
            const mockOnReplace = vi.fn();
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                    isEditable={true}
                    onImageReplace={mockOnReplace}
                />
            );

            const replaceButtons = screen.getAllByTestId("management-replace-button");
            fireEvent.click(replaceButtons[0]);

            expect(mockOnReplace).toHaveBeenCalledWith(
                mockImages[0].publicId,
                expect.objectContaining({ filename: "replaced.jpg" })
            );
        });

        it("calls onError when error is triggered from management", () => {
            const mockOnError = vi.fn();
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                    isEditable={true}
                    onError={mockOnError}
                />
            );

            const errorButtons = screen.getAllByTestId("management-error-button");
            fireEvent.click(errorButtons[0]);

            expect(mockOnError).toHaveBeenCalledWith("Management error");
        });

        it("shows management controls only when both delete and replace handlers are provided", () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                    isEditable={true}
                    onImageDelete={vi.fn()}
                    onImageReplace={vi.fn()}
                />
            );

            const managementControls = screen.getAllByTestId("image-management");
            expect(managementControls).toHaveLength(2);
        });

        it("shows management controls when only delete handler is provided", () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                    isEditable={true}
                    onImageDelete={vi.fn()}
                />
            );

            const managementControls = screen.getAllByTestId("image-management");
            expect(managementControls).toHaveLength(2);
        });
    });

    describe("Accessibility", () => {
        it("provides proper alt text for images", async () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Trigger intersection to make images visible
            triggerIntersection(true);

            await waitFor(() => {
                const images = document.querySelectorAll("img");
                expect(images[0]).toHaveAttribute("alt", mockImages[0].originalName);
                expect(images[1]).toHaveAttribute("alt", mockImages[1].originalName);
            });
        });

        it("supports keyboard navigation in modal", async () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Open modal
            const imageContainer = document.querySelector(".aspect-square");
            if (imageContainer) {
                fireEvent.click(imageContainer);
            }

            await waitFor(() => {
                expect(screen.getByRole("dialog")).toBeInTheDocument();
            });

            // Test all keyboard shortcuts
            fireEvent.keyDown(document, { key: "ArrowRight" });
            fireEvent.keyDown(document, { key: "ArrowLeft" });
            fireEvent.keyDown(document, { key: "Escape" });

            // Should close modal
            await waitFor(() => {
                expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
            });
        });

        it("provides proper management controls in editable mode", () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                    isEditable={true}
                    onImageDelete={vi.fn()}
                />
            );

            const managementControls = screen.getAllByTestId("image-management");
            expect(managementControls).toHaveLength(2);
        });
    });

    describe("Performance", () => {
        it("uses lazy loading attribute on images", () => {
            render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            const images = document.querySelectorAll("img");
            images.forEach((img) => {
                expect(img).toHaveAttribute("loading", "lazy");
            });
        });

        it("cleans up intersection observer on unmount", () => {
            const { unmount } = render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            unmount();

            expect(mockDisconnect).toHaveBeenCalled();
        });

        it("removes event listeners on unmount", () => {
            const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

            const { unmount } = render(
                <ImageDisplay
                    images={mockImages}
                    cardPublicId="card123"
                />
            );

            // Open modal to add event listeners
            const imageContainer = document.querySelector(".aspect-square");
            if (imageContainer) {
                fireEvent.click(imageContainer);
            }

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
        });
    });
});