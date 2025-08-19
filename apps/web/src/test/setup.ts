import "@testing-library/jest-dom";

// Mock environment variables
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_STORAGE_URL = "https://test-bucket.s3.amazonaws.com";
process.env.NEXT_PUBLIC_AVATAR_BUCKET_NAME = "test-bucket";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock XMLHttpRequest for upload progress testing
global.XMLHttpRequest = vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    send: vi.fn(),
    setRequestHeader: vi.fn(),
    addEventListener: vi.fn(),
    upload: {
        addEventListener: vi.fn(),
    },
    status: 200,
    statusText: "OK",
}));