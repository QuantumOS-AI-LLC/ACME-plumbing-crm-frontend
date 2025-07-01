import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for mobile-specific video call functionality
 * Handles touch gestures, orientation changes, and mobile UX optimizations
 */
export const useMobileVideoCall = () => {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [gestureHintVisible, setGestureHintVisible] = useState(false);
  
  const controlsTimeoutRef = useRef(null);
  const gestureHintTimeoutRef = useRef(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       window.innerWidth <= 768;
      setIsMobileDevice(isMobile);
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

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Auto-hide controls functionality
  const resetControlsTimer = useCallback(() => {
    if (!isMobileDevice) return;

    setControlsVisible(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 4000); // 4 seconds for mobile
  }, [isMobileDevice]);

  // Show gesture hint
  const showGestureHint = useCallback(() => {
    if (!isMobileDevice) return;

    setGestureHintVisible(true);
    
    if (gestureHintTimeoutRef.current) {
      clearTimeout(gestureHintTimeoutRef.current);
    }

    gestureHintTimeoutRef.current = setTimeout(() => {
      setGestureHintVisible(false);
    }, 2000);
  }, [isMobileDevice]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async (element) => {
    if (!element) return;

    try {
      if (!document.fullscreenElement) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }, []);

  // Handle mobile-specific touch events
  const handleMobileTap = useCallback(() => {
    if (!isMobileDevice) return;
    
    setControlsVisible(prev => !prev);
    if (controlsVisible) {
      resetControlsTimer();
    }
  }, [isMobileDevice, controlsVisible, resetControlsTimer]);

  const handleMobileDoubleTap = useCallback((element) => {
    if (!isMobileDevice) return;
    
    toggleFullscreen(element);
  }, [isMobileDevice, toggleFullscreen]);

  const handleSwipeUp = useCallback(() => {
    if (!isMobileDevice) return;
    
    setControlsVisible(true);
    resetControlsTimer();
    showGestureHint();
  }, [isMobileDevice, resetControlsTimer, showGestureHint]);

  const handleSwipeDown = useCallback(() => {
    if (!isMobileDevice) return;
    
    setControlsVisible(false);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  }, [isMobileDevice]);

  // Prevent zoom on double tap (iOS Safari)
  useEffect(() => {
    if (!isMobileDevice) return;

    const preventZoom = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventDoubleTapZoom = (e) => {
      e.preventDefault();
    };

    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('gesturestart', preventDoubleTapZoom);

    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('gesturestart', preventDoubleTapZoom);
    };
  }, [isMobileDevice]);

  // Handle device rotation
  const handleRotation = useCallback(() => {
    if (!isMobileDevice) return;

    // Reset controls visibility on rotation
    resetControlsTimer();
    
    // Show gesture hint after rotation
    setTimeout(() => {
      showGestureHint();
    }, 500);
  }, [isMobileDevice, resetControlsTimer, showGestureHint]);

  useEffect(() => {
    if (!isMobileDevice) return;

    window.addEventListener('orientationchange', handleRotation);
    return () => window.removeEventListener('orientationchange', handleRotation);
  }, [isMobileDevice, handleRotation]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (gestureHintTimeoutRef.current) {
        clearTimeout(gestureHintTimeoutRef.current);
      }
    };
  }, []);

  // Get mobile-specific CSS classes
  const getMobileClasses = useCallback(() => {
    const classes = [];
    
    if (isMobileDevice) {
      classes.push('mobile-device');
    }
    
    if (orientation === 'landscape') {
      classes.push('landscape-mode');
    } else {
      classes.push('portrait-mode');
    }
    
    if (isFullscreen) {
      classes.push('fullscreen-mode');
    }
    
    if (gestureHintVisible) {
      classes.push('show-gesture-hint');
    }
    
    return classes.join(' ');
  }, [isMobileDevice, orientation, isFullscreen, gestureHintVisible]);

  // Haptic feedback (if supported)
  const triggerHapticFeedback = useCallback((type = 'light') => {
    if (!isMobileDevice || !navigator.vibrate) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [50, 50, 50]
    };

    navigator.vibrate(patterns[type] || patterns.light);
  }, [isMobileDevice]);

  return {
    // State
    isMobileDevice,
    orientation,
    isFullscreen,
    controlsVisible,
    gestureHintVisible,
    
    // Actions
    toggleFullscreen,
    resetControlsTimer,
    showGestureHint,
    triggerHapticFeedback,
    
    // Event handlers
    handleMobileTap,
    handleMobileDoubleTap,
    handleSwipeUp,
    handleSwipeDown,
    
    // Utilities
    getMobileClasses,
    
    // Manual control
    setControlsVisible,
    setGestureHintVisible
  };
};

export default useMobileVideoCall;
