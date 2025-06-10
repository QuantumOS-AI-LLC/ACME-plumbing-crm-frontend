# Active Context: ACME Plumbing CRM

## 1. Current Work Focus

*   **Video Room Feature:** Successfully implemented Telnyx Video Room integration for contacts with webhook support.
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
*   **Video Room Feature Implementation:**
    *   Added Telnyx Video Room API configuration to `.env.example`:
        - `VITE_TELNYX_API_KEY` - Telnyx API key for authentication
        - `VITE_VIDEO_ROOM_WEBHOOK_URL` - Webhook URL for sending room details
    *   Created Telnyx Video Room API functions in `src/services/api.js`:
        - `createVideoRoom(contactId)` - Creates video room via Telnyx API
        - `sendVideoRoomWebhook(webhookData)` - Sends room details to webhook
    *   Created `src/hooks/useVideoRoom.js` custom hook for video room management:
        - Handles room creation with loading states
        - Manages webhook data sending (contactId, userId, joinLink, roomId)
        - Provides join room functionality and error handling
        - Shows success/error toast notifications
    *   Updated `src/pages/ContactDetailsPage.jsx` with video room functionality:
        - Added "Video Room" button next to Call/Email buttons
        - Integrated video room creation and join functionality
        - Added video room status display section with join link
        - Shows loading state during room creation
        - Displays success message with option to join room in new tab
    *   Video room workflow: Create room → Send webhook → Display join link → User can join
    *   No time limits on video rooms as requested
    *   Webhook sends: contactId, userId, joinLink, roomId, contactName, userName, timestamp

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
