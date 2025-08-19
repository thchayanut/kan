# Implementation Plan

- [x] 1. Set up database schema and migrations

  - Create migration file for `card_images` table with all required fields
  - Add new activity types to the existing `activityTypes` enum
  - Update database schema files with new table definitions and relations
  - _Requirements: 1.6, 2.1, 3.3_

- [x] 2. Create image data models and validation

  - Define TypeScript interfaces for `CardImage` and related types
  - Create Zod validation schemas for image upload and management
  - Implement database repository methods for image CRUD operations
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 3. Implement S3 service utilities

  - Create S3 service class for image upload, deletion, and URL generation
  - Implement presigned URL generation for secure uploads
  - Add thumbnail generation and optimization utilities
  - Write unit tests for S3 service methods
  - _Requirements: 1.6, 4.5_

- [x] 4. Create tRPC image router

  - Implement image upload endpoint with presigned URL generation
  - Create image deletion endpoint with S3 cleanup
  - Add image retrieval endpoint for card images
  - Implement proper error handling and validation
  - Write unit tests for all endpoints
  - _Requirements: 1.1, 1.2, 1.6, 3.1, 3.2, 3.3_

- [x] 5. Update existing card router and queries

  - Extend card.byId query to include images relationship
  - Update card creation/update logic to handle image associations
  - Add activity logging for image operations
  - Update existing card-related types to include images
  - _Requirements: 2.1, 3.1_

- [x] 6. Create ImageUpload component

  - Build file input component with drag-and-drop support
  - Implement client-side file validation (type, size)
  - Add upload progress tracking and error handling
  - Create presigned URL upload flow to S3
  - Write component tests for upload scenarios
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 7. Create ImageDisplay component

  - Build image grid component with thumbnail display
  - Implement lazy loading with intersection observer
  - Add modal/overlay for full-size image viewing
  - Create loading states and error placeholders
  - Write component tests for display scenarios
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3_

- [x] 8. Create image management components

  - Build image deletion confirmation dialog
  - Implement image replacement functionality
  - Add image management controls (delete, replace buttons)
  - Create error handling for management operations
  - Write component tests for management workflows
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 9. Update Card component to display images

  - Integrate ImageDisplay component into existing Card layout
  - Add conditional rendering for cards with/without images
  - Ensure responsive design and proper spacing
  - Maintain existing card functionality and styling
  - Test card component with various image scenarios
  - _Requirements: 2.1, 2.2_

- [x] 10. Update CardModal component for image management

  - Add ImageUpload component to card editing interface
  - Integrate image management controls in card modal
  - Update modal layout to accommodate image section
  - Ensure proper state management for image operations
  - Test modal functionality with image workflows
  - _Requirements: 1.1, 3.1, 3.2_

- [ ] 11. Implement performance optimizations

  - Add lazy loading for images not in viewport
  - Implement image caching strategies
  - Create skeleton loading states for image sections
  - Optimize image loading order based on visibility
  - Add error retry mechanisms for failed image loads
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 12. Add comprehensive error handling

  - Create user-friendly error messages for all failure scenarios
  - Implement proper error boundaries for image components
  - Add logging for image operation failures
  - Create fallback UI states for broken images
  - Test error scenarios and recovery flows
  - _Requirements: 1.5, 3.5, 4.3_

- [ ] 13. Write integration tests

  - Create end-to-end tests for complete image upload workflow
  - Test image display and lazy loading functionality
  - Verify image management operations (delete, replace)
  - Test error handling and edge cases
  - Validate performance under various load conditions
  - _Requirements: All requirements validation_

- [ ] 14. Update database queries and optimize performance
  - Add proper database indexes for image queries
  - Optimize card queries to efficiently include images
  - Implement query batching for multiple card images
  - Add database query performance monitoring
  - Test query performance with large datasets
  - _Requirements: 4.1, 4.4_
