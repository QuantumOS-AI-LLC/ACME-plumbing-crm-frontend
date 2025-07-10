import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to detect and track video element aspect ratio
 * @param {boolean} isVideoEnabled - Whether video is currently enabled
 * @returns {number} aspectRatio - The current aspect ratio (width/height)
 */
export const useVideoAspectRatio = (isVideoEnabled = true) => {
  const [aspectRatio, setAspectRatio] = useState(16 / 9); // Default 16:9
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const videoRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                    window.innerWidth <= 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Orientation detection
  useEffect(() => {
    const handleOrientationChange = () => {
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      setOrientation(newOrientation);
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Function to calculate aspect ratio from video element
  const calculateAspectRatio = (videoElement) => {
    if (!videoElement) return 16 / 9;

    // Try to get actual video dimensions first
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;

    if (videoWidth && videoHeight && videoWidth > 0 && videoHeight > 0) {
      const ratio = videoWidth / videoHeight;
      // Clamp aspect ratio to reasonable bounds (0.5 to 3.0)
      return Math.max(0.5, Math.min(3.0, ratio));
    }

    // Fallback to element dimensions if video dimensions not available
    const elementWidth = videoElement.offsetWidth;
    const elementHeight = videoElement.offsetHeight;

    if (elementWidth && elementHeight && elementWidth > 0 && elementHeight > 0) {
      const ratio = elementWidth / elementHeight;
      return Math.max(0.5, Math.min(3.0, ratio));
    }

    return 16 / 9; // Default fallback
  };

  // Function to update aspect ratio - always use natural video dimensions
  const updateAspectRatio = (videoElement) => {
    // Always use dynamic detection based on actual video content
    const newRatio = calculateAspectRatio(videoElement);
    setAspectRatio(newRatio);
  };

  // Reset to default aspect ratio when video is disabled or mobile state changes
  useEffect(() => {
    if (!isVideoEnabled) {
      setAspectRatio(16 / 9); // Default fallback
    }
  }, [isVideoEnabled, isMobile, orientation]);

  // Function to attach video element for monitoring
  const attachVideoElement = (element) => {
    if (!element || !isVideoEnabled) return;

    videoRef.current = element;

    // Set up event listeners for video metadata
    const handleLoadedMetadata = () => updateAspectRatio(element);
    const handleResize = () => updateAspectRatio(element);

    element.addEventListener('loadedmetadata', handleLoadedMetadata);
    element.addEventListener('resize', handleResize);

    // Set up ResizeObserver for element size changes
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        updateAspectRatio(element);
      });
      resizeObserverRef.current.observe(element);
    }

    // Initial calculation
    updateAspectRatio(element);

    // Cleanup function
    return () => {
      element.removeEventListener('loadedmetadata', handleLoadedMetadata);
      element.removeEventListener('resize', handleResize);
      
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  };

  // Reset to default when video is disabled
  useEffect(() => {
    if (!isVideoEnabled) {
      setAspectRatio(16 / 9);
      
      // Clean up observers
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    }
  }, [isVideoEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  return {
    aspectRatio,
    attachVideoElement,
  };
};

export default useVideoAspectRatio;
