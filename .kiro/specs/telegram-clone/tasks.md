# Implementation Plan

- [x] 1. Set up project structure and dependencies


  - Initialize Node.js TypeScript project with Express.js
  - Install dependencies: express, socket.io, pg, redis, amqplib, jest, fast-check, jsonwebtoken, bcrypt
  - Configure TypeScript with strict mode
  - Set up project directory structure (services, models, routes, utils, tests)
  - Create environment configuration files
  - _Requirements: All_

- [ ] 2. Set up database and schema
  - Create PostgreSQL database connection module
  - Implement database migration system
  - Create all database tables from schema (users, chats, messages, contacts, etc.)
  - Create database indexes for performance
  - Set up connection pooling
  - _Requirements: All_

- [ ] 3. Implement Encryption Service
  - [ ] 3.1 Create encryption service with key generation
    - Implement RSA-2048 key pair generation
    - Implement AES-256 encryption/decryption for storage
    - Implement message encryption/decryption with public/private keys
    - _Requirements: 8.1, 8.2, 8.5_

  - [ ] 3.2 Write property test for encryption round-trip
    - **Property 33: Encryption round-trip**
    - **Validates: Requirements 8.2**

  - [ ] 3.3 Write property test for cryptographic algorithm compliance
    - **Property 36: Cryptographic algorithm compliance**
    - **Validates: Requirements 8.5**


- [ ] 4. Implement Authentication Service
  - [ ] 4.1 Create verification session management
    - Implement sendVerificationCode method with session creation
    - Implement code generation and storage
    - Add expiration time (5 minutes) and attempt counter (3 attempts)
    - _Requirements: 1.1_

  - [ ] 4.2 Write property test for verification session creation
    - **Property 1: Verification session creation**

    - **Validates: Requirements 1.1**

  - [ ] 4.3 Implement code verification and authentication
    - Implement verifyCode method with validation
    - Create user account on successful verification
    - Generate JWT access and refresh tokens
    - Handle invalid codes and attempt decrement
    - _Requirements: 1.2, 1.3_

  - [ ] 4.4 Write property test for valid code authentication
    - **Property 2: Valid code authentication**
    - **Validates: Requirements 1.2**

  - [x] 4.5 Write property test for invalid code rejection

    - **Property 3: Invalid code rejection**
    - **Validates: Requirements 1.3**

  - [ ] 4.6 Implement token refresh and session management
    - Implement refreshToken method
    - Implement logout functionality
    - Add token expiration validation (30 days)
    - _Requirements: 1.4_

  - [x] 4.7 Write property test for session persistence

    - **Property 4: Session persistence**
    - **Validates: Requirements 1.4**

- [ ] 5. Implement User Service
  - [ ] 5.1 Create user profile management
    - Implement createProfile method
    - Implement updateProfile method
    - Implement getUser method
    - Store profile data with encryption keys
    - _Requirements: 1.5_

  - [ ] 5.2 Write property test for profile data round-trip
    - **Property 5: Profile data round-trip**
    - **Validates: Requirements 1.5**

  - [ ] 5.3 Implement contact management
    - Implement addContact method
    - Implement removeContact method with history preservation
    - Implement blockUser method
    - Implement getContacts method with alphabetical sorting
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 5.4 Write property test for contact addition
    - **Property 27: Contact addition**
    - **Validates: Requirements 7.1**

  - [ ] 5.5 Write property test for contact removal preserves history
    - **Property 28: Contact removal preserves history**
    - **Validates: Requirements 7.2**

  - [ ] 5.6 Write property test for blocking prevents messages
    - **Property 29: Blocking prevents messages**
    - **Validates: Requirements 7.3**

  - [ ] 5.7 Write property test for contact list sorting
    - **Property 30: Contact list sorting**
    - **Validates: Requirements 7.4**

  - [ ] 5.8 Implement online status management
    - Implement updateOnlineStatus method
    - Update last seen timestamp on disconnect
    - Add privacy settings support
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ] 5.9 Write property test for active user online status
    - **Property 23: Active user online status**
    - **Validates: Requirements 6.1**

  - [ ] 5.10 Write property test for last seen update on disconnect
    - **Property 24: Last seen update on disconnect**
    - **Validates: Requirements 6.2**

  - [ ] 5.11 Write property test for status retrieval
    - **Property 25: Status retrieval**
    - **Validates: Requirements 6.3**

  - [ ] 5.12 Write property test for privacy-respecting status display
    - **Property 26: Privacy-respecting status display**
    - **Validates: Requirements 6.4**

  - [ ] 5.13 Write property test for profile update synchronization
    - **Property 31: Profile update synchronization**
    - **Validates: Requirements 7.5**

- [ ] 6. Implement Chat Service
  - [ ] 6.1 Create chat creation methods
    - Implement createDirectChat method
    - Implement createGroupChat method with settings
    - Store chat data and participants
    - _Requirements: 3.1_

  - [ ] 6.2 Write property test for group creation with participants
    - **Property 11: Group creation with participants**
    - **Validates: Requirements 3.1**

  - [ ] 6.3 Implement participant management
    - Implement addParticipant method with notifications
    - Implement removeParticipant method with notifications
    - Implement assignAdmin method for role changes
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ] 6.4 Write property test for participant addition
    - **Property 12: Participant addition**
    - **Validates: Requirements 3.2**

  - [ ] 6.5 Write property test for participant removal
    - **Property 13: Participant removal**
    - **Validates: Requirements 3.3**

  - [ ] 6.6 Write property test for admin role assignment
    - **Property 14: Admin role assignment**
    - **Validates: Requirements 3.4**

  - [ ] 6.7 Implement chat settings and retrieval
    - Implement updateChatSettings method
    - Implement getChat method
    - Implement getUserChats method
    - _Requirements: 3.5_

  - [ ] 6.8 Write property test for group settings persistence
    - **Property 15: Group settings persistence**
    - **Validates: Requirements 3.5**

- [ ] 7. Implement Message Service
  - [ ] 7.1 Create message sending functionality
    - Implement sendMessage method with encryption
    - Store message in database
    - Handle message types (text, image, video, audio, document)
    - _Requirements: 2.1, 8.1, 8.3, 8.4_

  - [ ] 7.2 Write property test for message delivery to all participants
    - **Property 6: Message delivery to all participants**
    - **Validates: Requirements 2.1**

  - [ ] 7.3 Write property test for message encryption before transmission
    - **Property 32: Message encryption before transmission**
    - **Validates: Requirements 8.1**

  - [ ] 7.4 Write property test for storage encryption
    - **Property 34: Storage encryption**
    - **Validates: Requirements 8.3**

  - [ ] 7.5 Write property test for direct chat E2E encryption
    - **Property 35: Direct chat E2E encryption**
    - **Validates: Requirements 8.4**

  - [ ] 7.6 Implement delivery and read status tracking
    - Implement markAsDelivered method
    - Implement markAsRead method
    - Store delivery and read status in database
    - _Requirements: 2.2, 2.3_

  - [ ] 7.7 Write property test for delivery status tracking
    - **Property 7: Delivery status tracking**
    - **Validates: Requirements 2.2**

  - [ ] 7.8 Write property test for read status tracking
    - **Property 8: Read status tracking**
    - **Validates: Requirements 2.3**

  - [ ] 7.9 Implement message retrieval and queuing
    - Implement getMessages method with pagination
    - Implement offline message queuing logic
    - _Requirements: 2.4_

  - [ ] 7.10 Write property test for offline message queuing
    - **Property 9: Offline message queuing**
    - **Validates: Requirements 2.4**

  - [ ] 7.11 Implement message editing and deletion
    - Implement editMessage method with 48-hour time limit
    - Implement deleteMessage method with deleteForAll option
    - Update isEdited flag and editedAt timestamp
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

  - [ ] 7.12 Write property test for message editing within time limit
    - **Property 41: Message editing within time limit**
    - **Validates: Requirements 10.1, 10.3**

  - [ ] 7.13 Write property test for message deletion for all
    - **Property 42: Message deletion for all**
    - **Validates: Requirements 10.2**

  - [ ] 7.14 Write property test for self-deletion visibility
    - **Property 43: Self-deletion visibility**
    - **Validates: Requirements 10.4**

  - [ ] 7.15 Write property test for time-limited editing enforcement
    - **Property 44: Time-limited editing enforcement**
    - **Validates: Requirements 10.5**

  - [ ] 7.16 Implement message search functionality
    - Implement searchMessages method with query matching
    - Implement chat-scoped search
    - Generate highlighted content for results
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 7.17 Write property test for search result matching
    - **Property 20: Search result matching**
    - **Validates: Requirements 5.1**

  - [ ] 7.18 Write property test for search result highlighting
    - **Property 21: Search result highlighting**
    - **Validates: Requirements 5.2**

  - [ ] 7.19 Write property test for chat-scoped search
    - **Property 22: Chat-scoped search**
    - **Validates: Requirements 5.3**

- [ ] 8. Implement Media Service
  - [ ] 8.1 Create media upload functionality
    - Implement uploadMedia method with file storage
    - Store media metadata in database
    - Handle file chunking for large files (>100MB)
    - Emit upload progress events
    - _Requirements: 4.1, 4.5_

  - [ ] 8.2 Write property test for media upload creates message
    - **Property 16: Media upload creates message**
    - **Validates: Requirements 4.1**

  - [ ] 8.3 Write property test for upload progress events
    - **Property 19: Upload progress events**
    - **Validates: Requirements 4.5**

  - [ ] 8.4 Implement thumbnail generation and retrieval
    - Implement generateThumbnail method for images and videos
    - Implement getMedia method
    - Implement deleteMedia method
    - _Requirements: 4.2, 4.3_

  - [ ] 8.5 Write property test for thumbnail generation
    - **Property 17: Thumbnail generation**
    - **Validates: Requirements 4.2**

  - [ ] 8.6 Write property test for media retrieval
    - **Property 18: Media retrieval**
    - **Validates: Requirements 4.3**

- [ ] 9. Implement Real-time Service with WebSocket
  - [ ] 9.1 Set up Socket.io server
    - Configure Socket.io with Express
    - Implement connection authentication
    - Handle connect and disconnect events
    - _Requirements: 2.1, 6.1, 6.2_

  - [ ] 9.2 Implement real-time message broadcasting
    - Implement broadcastMessage method
    - Send messages to all chat participants via WebSocket
    - _Requirements: 2.1_

  - [ ] 9.3 Implement typing indicators
    - Implement sendTypingIndicator method
    - Broadcast typing status to chat participants
    - _Requirements: 2.5_

  - [ ] 9.4 Write property test for typing indicator broadcast
    - **Property 10: Typing indicator broadcast**
    - **Validates: Requirements 2.5, 6.5**

  - [ ] 9.5 Implement online status updates
    - Implement updateOnlineStatus method
    - Broadcast status changes to contacts
    - Update last seen on disconnect
    - _Requirements: 6.1, 6.2_

- [ ] 10. Implement Notification Service
  - [ ] 10.1 Create notification sending functionality
    - Implement sendNotification method
    - Implement registerDevice and unregisterDevice methods
    - Integrate with push notification service (Firebase/APNs)
    - _Requirements: 9.1_

  - [ ] 10.2 Write property test for background message notifications
    - **Property 37: Background message notifications**
    - **Validates: Requirements 9.1**

  - [ ] 10.3 Implement notification grouping and muting
    - Implement notification grouping by chat
    - Implement muteChat and unmuteChat methods
    - Check mute status before sending notifications
    - Respect user notification preferences
    - _Requirements: 9.2, 9.3, 9.5_

  - [ ] 10.4 Write property test for notification grouping by chat
    - **Property 38: Notification grouping by chat**
    - **Validates: Requirements 9.2**

  - [ ] 10.5 Write property test for muted chat notification suppression
    - **Property 39: Muted chat notification suppression**
    - **Validates: Requirements 9.3**



  - [ ] 10.6 Write property test for notification preference respect
    - **Property 40: Notification preference respect**
    - **Validates: Requirements 9.5**

- [ ] 11. Implement API Routes and Controllers
  - [ ] 11.1 Create authentication routes
    - POST /auth/send-code - Send verification code
    - POST /auth/verify - Verify code and authenticate
    - POST /auth/refresh - Refresh access token
    - POST /auth/logout - Logout user
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 11.2 Create user routes
    - POST /users/profile - Create/update profile
    - GET /users/:id - Get user profile
    - POST /users/contacts - Add contact
    - DELETE /users/contacts/:id - Remove contact
    - POST /users/block/:id - Block user
    - GET /users/contacts - Get contact list
    - _Requirements: 1.5, 7.1, 7.2, 7.3, 7.4_

  - [ ] 11.3 Create chat routes
    - POST /chats/direct - Create direct chat
    - POST /chats/group - Create group chat
    - POST /chats/:id/participants - Add participant
    - DELETE /chats/:id/participants/:userId - Remove participant
    - PUT /chats/:id/settings - Update chat settings
    - POST /chats/:id/admins/:userId - Assign admin
    - GET /chats/:id - Get chat details
    - GET /chats - Get user chats
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 11.4 Create message routes
    - POST /messages - Send message
    - PUT /messages/:id - Edit message
    - DELETE /messages/:id - Delete message
    - GET /chats/:id/messages - Get messages
    - POST /messages/:id/delivered - Mark as delivered
    - POST /messages/:id/read - Mark as read
    - GET /messages/search - Search messages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 10.1, 10.2, 10.4, 10.5_

  - [ ] 11.5 Create media routes
    - POST /media/upload - Upload media file
    - GET /media/:id - Get media file
    - DELETE /media/:id - Delete media file
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 12. Implement middleware and utilities
  - Create JWT authentication middleware
  - Create error handling middleware
  - Create request validation middleware
  - Create rate limiting middleware
  - Create logging utilities
  - _Requirements: All_

- [ ] 13. Set up Redis cache and message queue
  - Configure Redis connection for caching
  - Implement session caching
  - Configure RabbitMQ for message queuing
  - Implement offline message queue
  - Implement notification queue
  - _Requirements: 2.4, 9.1_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Create API documentation
  - Document all API endpoints with request/response examples
  - Document WebSocket events
  - Document error codes and messages
  - Create Postman collection for testing
  - _Requirements: All_

- [ ] 16. Write integration tests
  - Test complete authentication flow
  - Test end-to-end message sending and receiving
  - Test group chat creation and management
  - Test media upload and retrieval
  - Test real-time features via WebSocket
  - _Requirements: All_

- [ ] 17. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
