# Progress: ACME Plumbing CRM

## 1. What Works / Implemented Features

*   **Core CRM Structure (Inferred):** Based on the file structure, the application has a foundational structure for managing various CRM aspects like:
    *   Dashboard (`src/pages/DashboardPage.jsx`)
    *   Contacts (`src/pages/ContactsPage.jsx`, `src/components/contacts/`)
    *   Estimates (`src/pages/EstimatesPage.jsx`, `src/components/estimates/`)
    *   Jobs (`src/pages/JobsPage.jsx`, `src/components/jobs/`)
    *   Services (`src/pages/MyServicesPage.jsx`, `src/components/services/`)
    *   Calendar (`src/pages/CalendarPage.jsx`, `src/components/calendar/`)
    *   AI Assistant (`src/pages/AIAssistantPage.jsx`, `src/components/ai-assistant/`)
    *   User Authentication & Profile (`src/contexts/AuthContext.jsx`, `src/pages/LoginPage.jsx`, `src/pages/ProfilePage.jsx`, `src/pages/ProfileSettingsPage.jsx`)
    *   Notifications (`src/contexts/NotificationContext.jsx`, `src/pages/NotificationsPage.jsx`)
*   **Memory Bank Initialization:** The core Memory Bank documentation files have been created and updated.
*   **Frontend GPS Live Location Tracking (for testing) with Google Maps and Backend Integration:**
    *   Added a toggle in the Profile settings page (`src/pages/ProfilePage.jsx`).
    *   Implemented a custom hook (`src/hooks/useGPSLocation.js`) to fetch live location using `navigator.geolocation.watchPosition()`.
    *   Switched from Leaflet to Google Maps API (`@react-google-maps/api`) for map visualization due to compatibility issues.
    *   Created/Modified a `LocationMap` component (`src/components/common/LocationMap.jsx`) to use Google Maps API.
    *   Integrated the `LocationMap` component into the Profile page to display live location on a Google Map for testing.
    *   User added Google Maps API key to `.env` with `VITE_` prefix (`VITE_GOOGLE_MAPS_API_KEY`).
    *   Resolved issue with multiple script loading by using `useLoadScript` in `ProfilePage.jsx` and removing `LoadScript` from `LocationMap.jsx`.
    *   Adjusted map zoom level in `LocationMap.jsx` for a closer view (zoom level 18).
    *   Attempted to ensure marker visibility by adding explicit options and trying a custom icon URL, although the marker is still not visible.
    *   Created `src/utils/locationHelpers.js` with a function to format coordinates to DMS.
    *   Modified `src/pages/ProfilePage.jsx` to display location coordinates in both decimal and DMS formats.
    *   Added `toggleLiveTracking` and `updateLocation` API functions to `src/services/api.js`.
    *   Modified `src/pages/ProfilePage.jsx` to call backend APIs for toggle state changes and location updates.
    *   Modified `src/pages/ProfilePage.jsx` to dynamically set the initial state of the GPS toggle based on fetched user profile data.
    *   Resolved issue with incorrect API calls on load by calling `toggleLiveTracking` directly in the switch's `onChange` handler.
*   **WebSocket Keep-Alive and Auto-reconnection:**
    *   Modified `src/contexts/SocketContext.jsx` to send 'ping' events every 45 seconds to prevent Cloudflare idle timeouts.
    *   Added a basic auto-reconnection attempt with a 3-second delay in the socket's 'disconnect' handler.
*   **Fixed Logout and Data Persistence:**
    *   Modified `src/services/localStorage.js` to ensure authentication token, `isLoggedIn` status, and user/company profile data are correctly cleared from storage on logout, respecting the "Remember Me" setting.

## 2. What's Left to Build / Current Tasks

*   **User Verification:** The user needs to verify the fixed logout functionality and data clearing.
*   **Memory Bank Refinement:** Ongoing refinement and detailing of Memory Bank files as the project evolves.
*   **Further Enhancements (Optional):** Based on user feedback, consider:
    *   Troubleshooting the map marker visibility issue in `src/components/common/LocationMap.jsx`.
    *   Implementing backend logic for GPS data utilization (e.g., display on a map for other users, track routes).
    *   Implementing a more robust auto-reconnection strategy (e.g., exponential backoff, retry limits) in `src/contexts/SocketContext.jsx`.
    *   Improving error handling and user feedback for API calls.

## 3. Current Project Status

*   The project has a functional core CRM structure.
*   The frontend implementation for basic GPS live location tracking with highly zoomed-in Google Maps visualization, location displayed in both decimal and DMS formats, and backend integration (for testing) is complete and confirmed working.
*   WebSocket keep-alive and basic auto-reconnection logic have been added and confirmed working.
*   The critical issue with logout and persistent authentication/data has been addressed.
*   Memory Bank documentation is initialized and reflects the current state.

## 4. Known Issues / Blockers

*   None explicitly identified for the current frontend implementation tasks.
*   Backend requirements for location data persistence or advanced features are not yet defined.
*   Initial compatibility issues with `react-leaflet` were resolved by switching to `@react-google-maps/api`.
*   Issue with multiple Google Maps script loading was resolved by adjusting the loading strategy.
*   Issue with incorrect toggle API calls on load was resolved by adjusting the handler.
*   **Unresolved Marker Visibility:** The marker icon is currently not visible on the map. This requires further investigation if a marker is essential.
*   **WebSocket Auto-reconnection Robustness:** The current auto-reconnection is a basic attempt. A more robust strategy might be needed for production.
