# Active Context: ACME Plumbing CRM

## 1. Current Work Focus

*   **Video Sharing WebRTC Implementation:** Successfully implemented comprehensive WebRTC peer-to-peer video sharing system with proper authentication fix.
    *   **Fixed Authentication Error**: Removed incorrect TelnyxRTC SIP client initialization that was causing "Authentication Required" errors
    *   **Implemented Pure WebRTC Solution**: Created custom WebRTC peer manager for direct peer-to-peer video connections
    *   **Created WebRTC Peer Manager** (`src/utils/webrtcPeerManager.js`):
        - Handles RTCPeerConnection creation and management for multiple participants
        - Manages ICE candidate exchange via video socket signaling
        - Processes offer/answer WebRTC negotiation
        - Provides connection state monitoring and error recovery
        - Includes automatic ICE restart on connection failures
        - Supports dynamic stream updates and participant management
    *   **Updated TelnyxContext** (`src/contexts/TelnyxContext.jsx`):
        - Removed unnecessary TelnyxRTC SIP client for video rooms
        - Integrated WebRTC peer manager with proper lifecycle management
        - Simplified authentication to use pure WebRTC without SIP credentials
        - Added peer manager callbacks for remote stream management
        - Maintained existing media access and room joining functionality
    *   **Enhanced VideoRoomComponent** (`src/components/VideoRoom/VideoRoomComponent.jsx`):
        - Integrated with WebRTC peer manager for real-time connections
        - Added connection monitoring and debugging capabilities
        - Exposed peer manager to window for debugging (window.peerManager)
        - Enhanced error handling and user feedback
        - Added connection statistics monitoring every 5 seconds
*   **Anonymous Video Room Migration:** Successfully migrated video room system to use anonymous `/video` namespace with hybrid approach.
    *   **Created VideoSocketContext** (`src/contexts/VideoSocketContext.jsx`):
        - Anonymous socket connection to `/video` namespace (no authentication required)
        - Handles participant management, room events, and WebRTC signaling
        - Supports both internal users and external contacts with `externalParticipant` flag
        - Includes retry logic, error handling, and connection management
    *   **Updated TelnyxContext** (`src/contexts/TelnyxContext.jsx`):
        - Integrated with VideoSocketContext for video room operations
        - Updated join/leave room functions with anonymous participant parameters
        - Added participant type logic (users vs contacts)
        - Replaced main socket usage with video socket for video room features
    *   **Updated App.jsx**:
        - Added VideoSocketProvider to provider chain
        - Wrapped video room route with VideoSocketProvider and TelnyxProvider
        - Maintained separation between authenticated and anonymous features
    *   **Updated VideoRoomPage** (`src/pages/VideoRoomPage.jsx`):
        - Added URL parameter parsing for userId/contactId
        - Implemented participant type detection:
          - **Users**: URL has `userId` → `participantId = userId`, `externalParticipant = false`
          - **Contacts**: URL has only `contactId` → `participantId = contactId`, `externalParticipant = true`
        - Removed provider wrapping (now handled in App.jsx)
    *   **Updated VideoRoomComponent** (`src/components/VideoRoom/VideoRoomComponent.jsx`):
        - Uses new anonymous participant parameters in join room logic
        - Updated participant state management and cleanup
        - Integrated with video socket for real-time communication
    *   **Hybrid Architecture Implementation**:
        - **Room Management**: Authenticated API calls (create, delete, update, list)
        - **Room Joining**: Anonymous video socket for ALL users (internal and external)
        - **ContactDetailsPage**: Join buttons redirect to VideoRoomPage in new tabs
        - **URL Generation**: Proper participant identification via URL parameters
        - **Unified Experience**: All video rooms use the same optimized socket system
*   **Dual-API Video Room Integration:** Successfully implemented comprehensive video room system with Telnyx + Backend synchronization.
*   **Google Calendar Integration:** Successfully implemented complete Google Calendar OAuth authentication and integration in the frontend.
*   **Feature Implementation:** Fixed the logout functionality and ensured proper clearing of authentication data.
*   **Memory Bank Initialization:** Completed the initial setup of core Memory Bank documentation files.

## 2. Recent Changes

*   Created initial Memory Bank files:
    *   `projectbrief.md`
    *   `productContext.md`
    *   `techContext.md`
    *   `systemPatterns.md`
    *   `activeContext.md`
    *   `progress.md`
    *   `.clinerules`
*   Implemented frontend GPS tracking with Google Maps and backend integration (for testing):
    *   Added a GPS tracking toggle to `src/pages/ProfilePage.jsx`.
    *   Created a `useGPSLocation` hook in `src/hooks/useGPSLocation.js`.
    *   Integrated Google Maps API (`@react-google-maps/api`) for map visualization.
    *   Added backend API calls for toggle state and location updates in `src/services/api.js` and `src/pages/ProfilePage.jsx`.
    *   Implemented dynamic toggle initialization and controlled API calls on user interaction.
    *   Added DMS location format display.
    *   Note: Marker visibility is an unresolved issue.
*   Implemented WebSocket keep-alive and auto-reconnect:
    *   Modified `src/contexts/SocketContext.jsx` to send 'ping' events every 45 seconds.
    *   Added a basic auto-reconnection attempt with a 3-second delay in the 'disconnect' handler.
*   Confirmed Functionality:** GPS tracking and WebSocket features are working as expected.
*   **Fixed Logout Issue:** Modified `src/services/localStorage.js` to ensure authentication token and user data are cleared on logout.
*   **Google Calendar Integration Implementation:**
    *   Added Google Calendar OAuth API functions to `src/services/api.js`:
        - `initiateGoogleCalendarAuth()` - Starts OAuth flow
        - `getGoogleCalendarStatus()` - Checks connection status
        - `disconnectGoogleCalendar()` - Disconnects account
    *   Created `src/hooks/useGoogleCalendar.js` custom hook for managing Google Calendar state
    *   Created `src/components/profile/GoogleCalendarSettings.jsx` component with:
        - Connection status display
        - Connect/disconnect functionality
        - User-friendly interface with Google branding
        - Confirmation dialog for disconnection
    *   Created `src/pages/GoogleCalendarCallback.jsx` for OAuth callback handling
    *   Updated `src/pages/ProfilePage.jsx` to include Google Calendar settings
    *   Added OAuth callback route `/auth/google/callback` to `src/App.jsx`
    *   Integration allows users to connect their Google Calendar from profile settings
    *   Backend handles OAuth flow and credential storage securely
*   **Dual-API Video Room Integration Implementation:**
    *   **Backend Room Management APIs** added to `src/services/api.js`:
        - `createRoomInSystem(roomData)` - Stores room metadata in system database
        - `getRoomsFromSystem(params)` - Retrieves rooms from system database
        - `getRoomFromSystem(id)` - Gets specific room from system database
        - `updateRoomInSystem(id, roomData)` - Updates room in system database
        - `deleteRoomFromSystem(id)` - Deletes room from system database
    *   **Dual-API Synchronization Functions** added to `src/services/api.js`:
        - `createRoomWithSync(contactId)` - Creates room in Telnyx + stores in system
        - `updateRoomWithSync(systemId, telnyxRoomId, updateData)` - Updates both systems
        - `deleteRoomWithSync(systemId, telnyxRoomId)` - Deletes from both systems
        - Includes automatic cleanup if one API fails
        - Comprehensive error handling and logging
    *   **Enhanced Video Room Hook** (`src/hooks/useVideoRoom.js`):
        - Updated to use dual-API synchronization functions
        - Added `getRoomsForContact(contactId)` - Gets all rooms for a contact
        - Added `getAllRooms()` - Gets all rooms for current user
        - Enhanced error handling for system database operations
        - Added room listing and management capabilities
    *   **Enhanced Contact Details Page** (`src/pages/ContactDetailsPage.jsx`):
        - Updated to use new dual-API functions with correct parameters
        - Added "Existing Video Rooms" section showing all rooms for contact
        - Displays room metadata (creation date, creator, max participants)
        - Individual join/share/delete actions for each existing room
        - Automatic refresh of room list after operations
        - Enhanced UI with proper room status display
    *   **Key Integration Features:**
        - **Create**: Telnyx first → System storage second (with cleanup on failure)
        - **Update**: Telnyx first → System sync second
        - **Delete**: Telnyx first → System cleanup second
        - **Read**: System first (faster, includes metadata and relationships)
        - Full room history and persistence in system database
        - User and contact relationship tracking
        - Enhanced error handling and user feedback

## 3. Next Steps (High-Level)

1.  **User Verification:** User to verify the fixed logout functionality and data clearing.
2.  **Finalize Memory Bank Update:** Update `progress.md` to reflect completed tasks.
3.  **Attempt Completion:** Present the completed tasks to the user.
4.  **Further Enhancements (Optional):** Based on user feedback, consider:
    *   Troubleshooting the map marker visibility issue.
    *   Implementing backend logic for GPS data utilization.
    *   Implementing a more robust auto-reconnection strategy.
    *   Improving error handling and user feedback.

## 4. Active Decisions & Considerations

*   **Logout Fix:** Ensured complete clearing of authentication data from storage on logout.
*   **GPS Feature Status:** Frontend implementation with backend integration for testing is confirmed working, although marker visibility is an unresolved minor issue.
*   **WebSocket Status:** Keep-alive and auto-reconnection logic are confirmed working.
