import { useState, useEffect, useRef } from 'react';

const useGPSLocation = (isEnabled, updateLocationCallback = null) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [watcherId, setWatcherId] = useState(null);
  const lastUpdateTime = useRef(0);
  const THROTTLE_INTERVAL = 5000; // 5 seconds as recommended by API

  useEffect(() => {
    if (!isEnabled) {
      // Stop watching position if disabled
      if (watcherId) {
        navigator.geolocation.clearWatch(watcherId);
        setWatcherId(null);
        setLocation(null); // Clear location when disabled
        setError(null); // Clear error when disabled
      }
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const successHandler = (position) => {
      const newLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
      
      setLocation(newLocation);
      setError(null); // Clear any previous errors on success

      // Send to socket if callback provided and throttle interval has passed
      if (updateLocationCallback) {
        const now = Date.now();
        if (now - lastUpdateTime.current >= THROTTLE_INTERVAL) {
          updateLocationCallback(
            newLocation.latitude,
            newLocation.longitude,
            newLocation.accuracy
          );
          lastUpdateTime.current = now;
        }
      }
    };

    const errorHandler = (err) => {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setError("User denied the request for Geolocation.");
          break;
        case err.POSITION_UNAVAILABLE:
          setError("Location information is unavailable.");
          break;
        case err.TIMEOUT:
          setError("The request to get user location timed out.");
          break;
        case err.UNKNOWN_ERROR:
          setError("An unknown error occurred.");
          break;
        default:
          setError("An unexpected error occurred.");
      }
      console.error("Geolocation Error:", err);
      setLocation(null); // Clear location on error
    };

    // Start watching position
    const id = navigator.geolocation.watchPosition(
      successHandler,
      errorHandler,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    setWatcherId(id);

    // Cleanup function to clear the watcher when the component unmounts or isEnabled becomes false
    return () => {
      if (id) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, [isEnabled, updateLocationCallback]); // Re-run effect when isEnabled or callback changes

  return { location, error };
};

export default useGPSLocation;
