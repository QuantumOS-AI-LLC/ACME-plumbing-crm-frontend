# Active Context: ACME Plumbing CRM

## 1. Current Work Focus

*   **Feature Implementation:** Successfully integrated frontend GPS tracking with backend APIs, dynamically initialized the GPS toggle state, and displays location in both decimal and DMS formats with highly zoomed-in map visualization.
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
*   Implemented frontend GPS tracking with Google Maps and backend integration:
    *   Added a GPS tracking toggle to `src/pages/ProfilePage.jsx`.
    *   Created a `useGPSLocation` hook in `src/hooks/useGPSLocation.js` to handle geolocation.
    *   Uninstalled `leaflet` and `react-leaflet`.
    *   Installed `@react-google-maps/api`.
    *   Modified `LocationMap` component in `src/components/common/LocationMap.jsx` to use Google Maps API.
    *   Integrated `LocationMap` into `src/pages/ProfilePage.jsx` to display live location on a Google Map for testing.
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

## 3. Next Steps (High-Level)

1.  **User Verification:** User to verify the frontend display (both decimal and DMS formats, zoomed map), dynamic toggle initialization, and backend integration (checking backend logs).
2.  **Further Enhancements (Optional):** Based on user feedback, consider adding features like:
    *   Troubleshooting the marker visibility issue further if needed.
    *   Implementing backend logic to store and utilize location data (e.g., display on a map for other users, track routes).
    *   Improving error handling and user feedback for API calls.
3.  **Memory Bank Update:** Ensure all Memory Bank files are up-to-date with the latest changes and decisions.

## 4. Active Decisions & Considerations

*   **Frontend and Backend Integration:** Implemented API calls to sync GPS tracking state and location data with the backend.
*   **API Endpoints:** Used `/users/toggle-tracking` (PUT) and `/users/location` (PUT) as specified.
*   **Authentication:** Relies on the existing `axios` interceptor in `api.js` to include the Authorization header.
*   **Environment Variables:** Backend base URL is fetched from `VITE_API_BASE_URL` in `.env`.
*   **Location Data Format:** Sending latitude and longitude as floats to the backend. Displaying in both decimal and DMS formats on the frontend.
*   **Map Visualization:** Using Google Maps API (`@react-google-maps/api`) with a high zoom level.
*   **Unresolved Marker Visibility:** The marker icon is currently not visible on the map.
*   **Dynamic Toggle Initialization:** The initial state of the GPS toggle is now set based on user profile data from the backend.
*   **Toggle API Call Control:** The `toggleLiveTracking` API is now called only on user interaction with the switch.
