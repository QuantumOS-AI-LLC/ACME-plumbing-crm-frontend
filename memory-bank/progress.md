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
    *   Modified `src/pages/ProfilePage.jsx` to display location coordinates in DMS format.
    *   Added `toggleLiveTracking` and `updateLocation` API functions to `src/services/api.js`.
    *   Modified `src/pages/ProfilePage.jsx` to call backend APIs for toggle state changes and location updates.
    *   Modified `src/pages/ProfilePage.jsx` to dynamically set the initial state of the GPS toggle based on fetched user profile data.
    *   Resolved issue with incorrect API calls on load by calling `toggleLiveTracking` directly in the switch's `onChange` handler.
    *   Modified `src/pages/ProfilePage.jsx` to display location coordinates in both decimal and DMS formats.

## 2. What's Left to Build / Current Tasks

*   **User Verification:** The user needs to verify the frontend display (both decimal and DMS formats, zoomed map), dynamic toggle initialization, and backend integration (checking backend logs).
*   **Further Enhancements (Optional):** Based on user feedback, consider adding features like:
    *   Troubleshooting the marker visibility issue further if needed.
    *   Implementing backend logic to store and utilize location data (e.g., display on a map for other users, track routes).
    *   Improving error handling and user feedback for API calls.
*   **Memory Bank Refinement:** Ongoing refinement and detailing of Memory Bank files as the project evolves.

## 3. Current Project Status

*   The project has a functional core CRM structure.
*   The frontend implementation for basic GPS live location tracking with highly zoomed-in Google Maps visualization, location displayed in both decimal and DMS formats, and backend integration (for testing) is complete.
*   Memory Bank documentation is initialized and reflects the current state.

## 4. Known Issues / Blockers

*   None explicitly identified for the current frontend-only implementation.
*   Backend requirements for location data persistence or advanced features are not yet defined.
*   Initial compatibility issues with `react-leaflet` were resolved by switching to `@react-google-maps/api`.
*   Issue with multiple Google Maps script loading was resolved by adjusting the loading strategy.
*   **Unresolved Marker Visibility:** The marker icon is currently not visible on the map. This requires further investigation if a marker is essential.
*   **Location Display Format:** Changed to display both decimal and Degrees, Minutes, Seconds (DMS) formats.
*   **Backend Verification:** The user needs to verify that the backend is receiving the toggle state and location updates.
*   **Dynamic Toggle Initialization:** The initial state of the GPS toggle is now set based on user profile data from the backend.
*   **Toggle API Call Control:** The `toggleLiveTracking` API is now called only on user interaction with the switch.
