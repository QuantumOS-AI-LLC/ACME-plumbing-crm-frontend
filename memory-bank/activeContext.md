# Active Context: ACME Plumbing CRM

## 1. Current Work Focus

*   **Feature Implementation:** Successfully added the frontend components for the GPS live location tracking feature, including highly zoomed-in map visualization using Google Maps API and location displayed in DMS format.
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
*   Implemented frontend GPS tracking with Google Maps:
    *   Added a GPS tracking toggle to `src/pages/ProfilePage.jsx`.
    *   Created a `useGPSLocation` hook in `src/hooks/useGPSLocation.js` to handle geolocation.
    *   Uninstalled `leaflet` and `react-leaflet`.
    *   Installed `@react-google-maps/api`.
    *   Modified `LocationMap` component in `src/components/common/LocationMap.jsx` to use Google Maps API.
    *   Integrated `LocationMap` into `src/pages/ProfilePage.jsx` to display live location on a Google Map for testing.
    *   User added Google Maps API key to `.env` with `VITE_` prefix.
    *   Resolved issue with multiple script loading by using `useLoadScript` in `ProfilePage.jsx` and removing `LoadScript` from `LocationMap.jsx`.
    *   Adjusted map zoom level in `LocationMap.jsx` for a closer view (zoom level 16).
    *   Further increased map zoom level in `LocationMap.jsx` (zoom level 18).
    *   Attempted to ensure marker visibility by adding explicit options and trying a custom icon URL, although the marker is still not visible.
    *   Created `src/utils/locationHelpers.js` with a function to format coordinates to DMS.
    *   Modified `src/pages/ProfilePage.jsx` to display location coordinates in DMS format.

## 3. Next Steps (High-Level)

1.  **User Verification:** User to test the implemented GPS tracking feature with highly zoomed-in Google Maps visualization and location in DMS format on the frontend.
2.  **Further Enhancements (Optional):** Based on user feedback, consider adding features like:
    *   Backend integration to store location data.
    *   Integrating location data with job tracking.
    *   Troubleshooting the marker visibility issue further if needed.
3.  **Memory Bank Update:** Ensure all Memory Bank files are up-to-date with the latest changes and decisions.

## 4. Active Decisions & Considerations

*   **Frontend Only for Testing:** The current implementation focuses solely on frontend tracking and display for testing purposes, as per the initial request. Backend integration for persistence or advanced features is not included yet.
*   **User Privacy:** Geolocation requires user consent, which is handled by the browser's native permission prompts triggered by `navigator.geolocation`.
*   **Map Library Choice:** Switched from Leaflet to Google Maps API (`@react-google-maps/api`) due to compatibility issues with the project's React version. Requires a Google Maps API key with `VITE_` prefix for Vite.
*   **Map Loading Strategy:** Using `useLoadScript` in the parent component to ensure the Google Maps script is loaded only once.
*   **Map Zoom Level:** Adjusted to provide a highly zoomed-in view of the user's location.
*   **Marker Visibility:** The default and a custom marker icon are currently not visible, which is an unresolved issue, although the map itself is loading and centering correctly.
*   **Location Display Format:** Changed from decimal degrees to Degrees, Minutes, Seconds (DMS).
