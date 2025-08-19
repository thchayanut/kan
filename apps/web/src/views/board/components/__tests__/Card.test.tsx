import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Card from "../Card";

import type { CardImage } from "@kan/api/src/types/cardImage.types";

// Mock the ImageDisplay component
vi.mock("~/components/ImageDisplay", () => ({
    default: ({ images, cardPublicId, isEditable, className }: {
        images: CardImage[];
        cardPublicId: string;
        isEditable: boolean;
        className: string;
    }) => (
        <div data-testid="image-display" data-card-id={cardPublicId} data-editable={isEditable} className={className}>
            {images.length} images
        </div>
    ),
}));

// Mock other components
vi.mock("~/components/Avatar", () => ({
    default: ({ name, email }: { name: string; email: string }) => (
        <div data-testid="avatar">{name || email}</div>
    ),
}));

vi.mock("~/components/Badge", () => ({
    default: ({ value }: { value: string }) => (
        <div data-testid="badge">{value}</div>
    ),
}));

vi.mock("~/components/CircularProgress", () => ({
    default: ({ progress }: { progress: number }) => (
        <div data-testid="progress">{progress}%</div>
    ),
}));

vi.mock("~/components/LabelIcon", () => ({
    default: ({ colourCode }: { colourCode: string | null }) => (
        <div data-testid="label-icon" data-color={colourCode} />
    ),
}));

vi.mock("~/utils/helpers", () => ({
    getAvatarUrl: (image: string) => `avatar-url-${image}`,
}));

const mockCardImage: CardImage = {
    id: 1,
    publicId: "img123456789",
    cardId: 1,
    filename: "test-image.jpg",
    originalName: "test-image.jpg",
    mimeType: "image/jpeg",
    fileSize: 1024,
    s3Key: "images/test-image.jpg",
    s3Url: "https://example.com/test-image.jpg",
    thumbnailS3Key: "thumbnails/test-image.jpg",
    thumbnailS3Url: "https://example.com/thumbnails/test-image.jpg",
    width: 800,
    height: 600,
    createdAt: new Date("2023-01-01"),
};

describe("Card Component", () => {
    const defaultProps = {
        title: "Test Card",
        labels: [],
        members: [],
        checklists: [],
        cardPublicId: "card123456789",
    };

    it("renders card title", () => {
        render(<Card {...defaultProps} />);
        expect(screen.getByText("Test Card")).toBeInTheDocument();
    });

    it("renders without images when no images provided", () => {
        render(<Card {...defaultProps} />);
        expect(screen.queryByTestId("image-display")).not.toBeInTheDocument();
    });

    it("renders without images when empty images array provided", () => {
        render(<Card {...defaultProps} images={[]} />);
        expect(screen.queryByTestId("image-display")).not.toBeInTheDocument();
    });

    it("renders images when images are provided", () => {
        render(<Card {...defaultProps} images={[mockCardImage]} />);

        const imageDisplay = screen.getByTestId("image-display");
        expect(imageDisplay).toBeInTheDocument();
        expect(imageDisplay).toHaveAttribute("data-card-id", "card123456789");
        expect(imageDisplay).toHaveAttribute("data-editable", "false");
        expect(imageDisplay).toHaveClass("max-h-32");
        expect(imageDisplay).toHaveTextContent("1 images");
    });

    it("renders multiple images", () => {
        const secondImage = { ...mockCardImage, id: 2, publicId: "img987654321" };
        render(<Card {...defaultProps} images={[mockCardImage, secondImage]} />);

        const imageDisplay = screen.getByTestId("image-display");
        expect(imageDisplay).toHaveTextContent("2 images");
    });

    it("renders labels", () => {
        const labels = [
            { name: "Bug", colourCode: "#ff0000" },
            { name: "Feature", colourCode: "#00ff00" },
        ];
        render(<Card {...defaultProps} labels={labels} />);

        expect(screen.getAllByTestId("badge")).toHaveLength(2);
        expect(screen.getByText("Bug")).toBeInTheDocument();
        expect(screen.getByText("Feature")).toBeInTheDocument();
    });

    it("renders members", () => {
        const members = [
            {
                publicId: "member1",
                email: "user@example.com",
                user: { name: "John Doe", email: "user@example.com", image: "avatar.jpg" },
            },
        ];
        render(<Card {...defaultProps} members={members} />);

        expect(screen.getByTestId("avatar")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders checklist progress", () => {
        const checklists = [
            {
                publicId: "checklist1",
                name: "Tasks",
                items: [
                    { publicId: "item1", title: "Task 1", completed: true, index: 0 },
                    { publicId: "item2", title: "Task 2", completed: false, index: 1 },
                ],
            },
        ];
        render(<Card {...defaultProps} checklists={checklists} />);

        expect(screen.getByTestId("progress")).toBeInTheDocument();
        expect(screen.getByText("1/2")).toBeInTheDocument();
    });

    it("renders card with images and other content", () => {
        const props = {
            ...defaultProps,
            images: [mockCardImage],
            labels: [{ name: "Bug", colourCode: "#ff0000" }],
            members: [
                {
                    publicId: "member1",
                    email: "user@example.com",
                    user: { name: "John Doe", email: "user@example.com", image: "avatar.jpg" },
                },
            ],
            checklists: [
                {
                    publicId: "checklist1",
                    name: "Tasks",
                    items: [
                        { publicId: "item1", title: "Task 1", completed: true, index: 0 },
                    ],
                },
            ],
        };

        render(<Card {...props} />);

        expect(screen.getByText("Test Card")).toBeInTheDocument();
        expect(screen.getByTestId("image-display")).toBeInTheDocument();
        expect(screen.getByText("Bug")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("1/1")).toBeInTheDocument();
    });

    it("maintains responsive design with proper spacing", () => {
        render(<Card {...defaultProps} images={[mockCardImage]} />);

        const imageDisplay = screen.getByTestId("image-display");
        expect(imageDisplay.parentElement).toHaveClass("mt-2");
        expect(imageDisplay).toHaveClass("max-h-32");
    });

    it("renders images section before labels and members", () => {
        const props = {
            ...defaultProps,
            images: [mockCardImage],
            labels: [{ name: "Bug", colourCode: "#ff0000" }],
        };

        const { container } = render(<Card {...props} />);
        const imageSection = container.querySelector('[data-testid="image-display"]')?.parentElement;
        const labelsSection = container.querySelector('[data-testid="badge"]')?.parentElement?.parentElement;

        expect(imageSection).toBeInTheDocument();
        expect(labelsSection).toBeInTheDocument();

        // Image section should come before labels section in DOM order
        const imageSectionIndex = Array.from(container.children[0]!.children).indexOf(imageSection);
        const labelsSectionIndex = Array.from(container.children[0]!.children).indexOf(labelsSection);

        expect(imageSectionIndex).toBeLessThan(labelsSectionIndex);
    });
});