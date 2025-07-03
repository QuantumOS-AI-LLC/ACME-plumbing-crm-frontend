import React, { useState, useEffect, useRef } from "react";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import {
  StreamVideo,
  StreamCall,
  SpeakerLayout,
  ParticipantView,
  useCallStateHooks,
  StreamTheme,
  CallControls,
} from "@stream-io/video-react-sdk";
import { useVideoClient } from "../../contexts/VideoContext";
import { useVideoAspectRatio } from "../../hooks/useVideoAspectRatio";
import "./VideoCall.css";

// Enhanced device detection utility for mobile, tablet, and desktop
const getDeviceType = () => {
  const userAgent = navigator.userAgent;
  const screenWidth = window.innerWidth;
  const hasTouch = 'ontouchstart' in window;
  
  // iPad detection (including modern iPads that report as desktop)
  if (/iPad/.test(userAgent) || 
      (screenWidth >= 768 && screenWidth <= 1024 && hasTouch) ||
      (screenWidth >= 1024 && screenWidth <= 1366 && hasTouch && /Safari/.test(userAgent))) {
    return 'tablet';
  }
  
  // Phone detection
  if (screenWidth <= 767 || 
      /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS/i.test(userAgent)) {
    return 'mobile';
  }
  
  // Desktop detection
  return 'desktop';
};

// Legacy mobile detection for backward compatibility
const isMobile = () => {
  return getDeviceType() === 'mobile';
};

// Touch gesture hook for mobile interactions
const useTouchGestures = (onTap, onDoubleTap, onSwipeUp, onSwipeDown) => {
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const lastTapRef = useRef(0);

  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;

    touchEndRef.current = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now()
    };

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time;

    // Detect swipe gestures
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50 && deltaTime < 300) {
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }
    // Detect tap gestures
    else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      
      if (timeSinceLastTap < 300 && onDoubleTap) {
        onDoubleTap();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
        setTimeout(() => {
          if (lastTapRef.current === now && onTap) {
            onTap();
          }
        }, 300);
      }
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  return { handleTouchStart, handleTouchEnd };
};



// Custom Mobile Floating Participant - Clean implementation without GetStream UI (Phones)
const MobileFloatingParticipant = React.memo(({ participant, isCameraOff, call }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [dynamicAspectRatio, setDynamicAspectRatio] = useState('9/16'); // fallback to phone camera ratio
  const [currentVideoTrack, setCurrentVideoTrack] = useState(null);
  const aspectRatioTimeoutRef = useRef(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  // Stable video track reference to prevent flickering
  const videoTrackId = participant?.videoStream?.getVideoTracks()?.[0]?.id;

  // Check for multiple cameras on component mount
  useEffect(() => {
    const checkCameraCapabilities = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(cameras.length > 1);
      } catch (error) {
        console.error('Error checking camera capabilities:', error);
        setHasMultipleCameras(false);
      }
    };

    checkCameraCapabilities();
  }, []);

  // Camera switching function
  const switchCamera = async () => {
    if (!call?.camera || isSwitchingCamera) return;

    setIsSwitchingCamera(true);
    try {
      await call.camera.flip();
    } catch (error) {
      console.error('Camera switch failed:', error);
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  // Attach video stream to video element using stable track reference
  useEffect(() => {
    if (!isCameraOff && videoRef.current && participant?.videoStream) {
      const videoTrack = participant.videoStream.getVideoTracks()?.[0];
      
      // Only update if track actually changed (prevents flickering on audio activity)
      if (videoTrack && videoTrack.id !== currentVideoTrack?.id) {
        setCurrentVideoTrack(videoTrack);
        
        const stream = new MediaStream([videoTrack]);
        videoRef.current.srcObject = stream;
      }
    } else if (videoRef.current && (isCameraOff || !participant?.videoStream)) {
      videoRef.current.srcObject = null;
      setCurrentVideoTrack(null);
    }
  }, [participant?.userId, isCameraOff, videoTrackId]); // Use stable references

  // Debounced aspect ratio update function
  const updateAspectRatio = React.useCallback(() => {
    const video = videoRef.current;
    if (video && video.videoWidth && video.videoHeight) {
      const ratio = video.videoWidth / video.videoHeight;
      setDynamicAspectRatio(ratio.toString());
    }
  }, []);

  // Monitor video element for aspect ratio changes with debouncing
  useEffect(() => {
    const video = videoRef.current;
    if (video && !isCameraOff && currentVideoTrack) {
      const debouncedUpdateAspectRatio = () => {
        // Clear previous timeout
        if (aspectRatioTimeoutRef.current) {
          clearTimeout(aspectRatioTimeoutRef.current);
        }
        
        // Debounce aspect ratio updates to prevent flickering
        aspectRatioTimeoutRef.current = setTimeout(updateAspectRatio, 150);
      };
      
      video.addEventListener('loadedmetadata', debouncedUpdateAspectRatio);
      video.addEventListener('resize', debouncedUpdateAspectRatio);
      
      // Check immediately if metadata is already loaded
      if (video.videoWidth && video.videoHeight) {
        debouncedUpdateAspectRatio();
      }
      
      return () => {
        video.removeEventListener('loadedmetadata', debouncedUpdateAspectRatio);
        video.removeEventListener('resize', debouncedUpdateAspectRatio);
        
        // Clear timeout on cleanup
        if (aspectRatioTimeoutRef.current) {
          clearTimeout(aspectRatioTimeoutRef.current);
        }
      };
    }
  }, [isCameraOff, currentVideoTrack, updateAspectRatio]);

  // Apply dynamic aspect ratio to container
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.aspectRatio = dynamicAspectRatio;
    }
  }, [dynamicAspectRatio]);

  if (!participant) {
    return null;
  }

  // Get participant initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="mobile-floating-participant" ref={containerRef}>
      {isCameraOff ? (
        <div className="mobile-avatar">
          <span className="avatar-initials">
            {getInitials(participant.name || participant.userId)}
          </span>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="mobile-video"
        />
      )}
    </div>
  );
});

// Custom Tablet Floating Participant - Hybrid approach for iPads
const TabletFloatingParticipant = React.memo(({ participant, isCameraOff, call }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [dynamicAspectRatio, setDynamicAspectRatio] = useState('9/16'); // fallback to phone camera ratio
  const [currentVideoTrack, setCurrentVideoTrack] = useState(null);
  const aspectRatioTimeoutRef = useRef(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  // Stable video track reference to prevent flickering
  const videoTrackId = participant?.videoStream?.getVideoTracks()?.[0]?.id;

  // Check for multiple cameras on component mount
  useEffect(() => {
    const checkCameraCapabilities = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(cameras.length > 1);
      } catch (error) {
        console.error('Error checking camera capabilities:', error);
        setHasMultipleCameras(false);
      }
    };

    checkCameraCapabilities();
  }, []);

  // Camera switching function
  const switchCamera = async () => {
    if (!call?.camera || isSwitchingCamera) return;

    setIsSwitchingCamera(true);
    try {
      await call.camera.flip();
    } catch (error) {
      console.error('Camera switch failed:', error);
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  // Attach video stream to video element using stable track reference
  useEffect(() => {
    if (!isCameraOff && videoRef.current && participant?.videoStream) {
      const videoTrack = participant.videoStream.getVideoTracks()?.[0];
      
      // Only update if track actually changed (prevents flickering on audio activity)
      if (videoTrack && videoTrack.id !== currentVideoTrack?.id) {
        setCurrentVideoTrack(videoTrack);
        
        const stream = new MediaStream([videoTrack]);
        videoRef.current.srcObject = stream;
      }
    } else if (videoRef.current && (isCameraOff || !participant?.videoStream)) {
      videoRef.current.srcObject = null;
      setCurrentVideoTrack(null);
    }
  }, [participant?.userId, isCameraOff, videoTrackId]); // Use stable references

  // Debounced aspect ratio update function
  const updateAspectRatio = React.useCallback(() => {
    const video = videoRef.current;
    if (video && video.videoWidth && video.videoHeight) {
      const ratio = video.videoWidth / video.videoHeight;
      setDynamicAspectRatio(ratio.toString());
    }
  }, []);

  // Monitor video element for aspect ratio changes with debouncing
  useEffect(() => {
    const video = videoRef.current;
    if (video && !isCameraOff && currentVideoTrack) {
      const debouncedUpdateAspectRatio = () => {
        // Clear previous timeout
        if (aspectRatioTimeoutRef.current) {
          clearTimeout(aspectRatioTimeoutRef.current);
        }
        
        // Debounce aspect ratio updates to prevent flickering
        aspectRatioTimeoutRef.current = setTimeout(updateAspectRatio, 150);
      };
      
      video.addEventListener('loadedmetadata', debouncedUpdateAspectRatio);
      video.addEventListener('resize', debouncedUpdateAspectRatio);
      
      // Check immediately if metadata is already loaded
      if (video.videoWidth && video.videoHeight) {
        debouncedUpdateAspectRatio();
      }
      
      return () => {
        video.removeEventListener('loadedmetadata', debouncedUpdateAspectRatio);
        video.removeEventListener('resize', debouncedUpdateAspectRatio);
        
        // Clear timeout on cleanup
        if (aspectRatioTimeoutRef.current) {
          clearTimeout(aspectRatioTimeoutRef.current);
        }
      };
    }
  }, [isCameraOff, currentVideoTrack, updateAspectRatio]);

  // Apply dynamic aspect ratio to container
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.aspectRatio = dynamicAspectRatio;
    }
  }, [dynamicAspectRatio]);

  if (!participant) {
    return null;
  }

  // Get participant initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="tablet-floating-participant" ref={containerRef}>
      {isCameraOff ? (
        <div className="tablet-avatar">
          <span className="avatar-initials">
            {getInitials(participant.name || participant.userId)}
          </span>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="tablet-video"
        />
      )}
    </div>
  );
});

// Desktop Floating Participant - Uses GetStream's ParticipantView
const DesktopFloatingParticipant = ({ isCameraOff }) => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const { user } = useVideoClient();
  const floatingContainerRef = useRef(null);
  
  // Use the aspect ratio hook to track video dimensions only when camera is on
  const { aspectRatio, attachVideoElement } = useVideoAspectRatio(!isCameraOff);

  // Find the local participant (current user)
  const localParticipant = participants.find((p) => p.userId === user?.id);

  // Update CSS custom property when aspect ratio changes, but only when camera is on
  useEffect(() => {
    if (floatingContainerRef.current) {
      if (!isCameraOff) {
        // Camera is on - use dynamic aspect ratio
        floatingContainerRef.current.style.setProperty(
          '--local-video-aspect-ratio', 
          aspectRatio.toString()
        );
        floatingContainerRef.current.classList.remove('camera-off');
        floatingContainerRef.current.classList.add('camera-on');
      } else {
        // Camera is off - remove aspect ratio constraint and use flexible sizing
        floatingContainerRef.current.style.removeProperty('--local-video-aspect-ratio');
        floatingContainerRef.current.classList.remove('camera-on');
        floatingContainerRef.current.classList.add('camera-off');
      }
    }
  }, [aspectRatio, isCameraOff]);

  // Attach video element for aspect ratio monitoring
  useEffect(() => {
    if (!isCameraOff && floatingContainerRef.current) {
      // Find the video element within the floating participant
      const findVideoElement = () => {
        const videoElement = floatingContainerRef.current.querySelector('video');
        if (videoElement) {
          const cleanup = attachVideoElement(videoElement);
          return cleanup;
        }
        return null;
      };

      // Try to find video element immediately
      let cleanup = findVideoElement();

      // If not found, set up a MutationObserver to watch for video element
      let observer = null;
      if (!cleanup) {
        observer = new MutationObserver(() => {
          if (!cleanup) {
            cleanup = findVideoElement();
            if (cleanup && observer) {
              observer.disconnect();
              observer = null;
            }
          }
        });

        observer.observe(floatingContainerRef.current, {
          childList: true,
          subtree: true,
        });
      }

      // Cleanup function
      return () => {
        if (cleanup && typeof cleanup === 'function') {
          cleanup();
        }
        if (observer) {
          observer.disconnect();
        }
      };
    }
  }, [isCameraOff, attachVideoElement, localParticipant]);

  if (!localParticipant) {
    return null;
  }

  return (
    <div 
      className="floating-local-participant" 
      ref={floatingContainerRef}
    >
      <div className="floating-participant-video">
        {/* Use native GetStream ParticipantView - UI elements hidden via CSS */}
        <ParticipantView participant={localParticipant} />
      </div>
    </div>
  );
};

// Smart Floating Participant - Chooses implementation based on device type
const FloatingLocalParticipant = ({ isCameraOff, call }) => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const { user } = useVideoClient();
  const [deviceType] = useState(getDeviceType());

  // Find the local participant (current user)
  const localParticipant = participants.find((p) => p.userId === user?.id);

  if (!localParticipant) {
    return null;
  }

  // Render different components based on device type
  switch (deviceType) {
    case 'mobile':
      return (
        <MobileFloatingParticipant 
          participant={localParticipant} 
          isCameraOff={isCameraOff}
          call={call}
        />
      );
    case 'tablet':
      return (
        <TabletFloatingParticipant 
          participant={localParticipant} 
          isCameraOff={isCameraOff}
          call={call}
        />
      );
    case 'desktop':
    default:
      return (
        <DesktopFloatingParticipant isCameraOff={isCameraOff} />
      );
  }
};

// Custom control buttons using GetStream hooks
const CustomControlButton = ({
  onClick,
  isActive,
  children,
  className,
  disabled,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`custom-control-btn ${className} ${isActive ? "active" : ""}`}
  >
    {children}
  </button>
);

const VideoCallUI = ({
  onLeave,
  onCallEvent,
  callId,
  call,
  initialCameraOff,
  initialMicMuted,
}) => {
  const { useCallEndedAt, useParticipants } = useCallStateHooks();
  const callEndedAt = useCallEndedAt();
  const participants = useParticipants();
  const { user, userType } = useVideoClient();

  const [isMicMuted, setIsMicMuted] = useState(initialMicMuted || false);
  const [isCameraOff, setIsCameraOff] = useState(initialCameraOff || false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState("good");
  const callStartTime = useState(() => new Date())[0];
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsHideTimeoutRef = React.useRef(null);
  const videoContainerRef = useRef(null);

  // Camera switching state
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  // Mobile-specific state
  const [isMobileDevice] = useState(isMobile());
  const [deviceType] = useState(getDeviceType());

  // Check for multiple cameras on component mount
  useEffect(() => {
    const checkCameraCapabilities = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(cameras.length > 1);
      } catch (error) {
        console.error('Error checking camera capabilities:', error);
        setHasMultipleCameras(false);
      }
    };

    checkCameraCapabilities();
  }, []);

  // Camera switching function
  const switchCamera = async () => {
    if (!call?.camera || isSwitchingCamera) return;

    setIsSwitchingCamera(true);
    try {
      await call.camera.flip();
    } catch (error) {
      console.error('Camera switch failed:', error);
    } finally {
      setIsSwitchingCamera(false);
    }
  };
  
  // Touch gesture handlers for mobile
  const handleTap = () => {
    if (isMobileDevice) {
      // Toggle controls visibility on tap
      setControlsVisible(!controlsVisible);
      resetHideTimer();
    }
  };

  const handleDoubleTap = () => {
    if (isMobileDevice) {
      // Toggle fullscreen on double tap
      toggleFullscreen();
    }
  };

  const handleSwipeUp = () => {
    if (isMobileDevice) {
      // Show controls on swipe up
      setControlsVisible(true);
      resetHideTimer();
    }
  };

  const handleSwipeDown = () => {
    if (isMobileDevice) {
      // Hide controls on swipe down
      setControlsVisible(false);
      if (controlsHideTimeoutRef.current) {
        clearTimeout(controlsHideTimeoutRef.current);
      }
    }
  };

  const { handleTouchStart, handleTouchEnd } = useTouchGestures(
    handleTap,
    handleDoubleTap,
    handleSwipeUp,
    handleSwipeDown
  );

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  // Enhanced hide timer function
  const resetHideTimer = () => {
    setControlsVisible(true);
    if (controlsHideTimeoutRef.current) {
      clearTimeout(controlsHideTimeoutRef.current);
    }
    // Longer timeout on mobile for better UX
    const timeout = isMobileDevice ? 4000 : 3000;
    controlsHideTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, timeout);
  };

  // Call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(Math.floor((new Date() - callStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [callStartTime]);

  // Effect to hide controls after inactivity
  useEffect(() => {
    const hideControls = () => {
      setControlsVisible(false);
    };

    const resetHideTimer = () => {
      setControlsVisible(true);
      if (controlsHideTimeoutRef.current) {
        clearTimeout(controlsHideTimeoutRef.current);
      }
      controlsHideTimeoutRef.current = setTimeout(hideControls, 3000); // Hide after 3 seconds of inactivity
    };

    // Initial setup: show controls and start timer
    resetHideTimer();

    const videoContainer = document.querySelector(".video-container");
    if (videoContainer) {
      videoContainer.addEventListener("mousemove", resetHideTimer);
      videoContainer.addEventListener("mouseenter", resetHideTimer);
      // Removed mouseleave listener to prevent immediate hiding and flickering
    }

    return () => {
      if (controlsHideTimeoutRef.current) {
        clearTimeout(controlsHideTimeoutRef.current);
      }
      if (videoContainer) {
        videoContainer.removeEventListener("mousemove", resetHideTimer);
        videoContainer.removeEventListener("mouseenter", resetHideTimer);
        // Removed mouseleave listener
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Connection quality indicator
  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case "excellent":
        return "📶";
      case "good":
        return "📶";
      case "poor":
        return "📶";
      default:
        return "📶";
    }
  };

  // Clean participant tracking for call events
  useEffect(() => {
    if (participants && onCallEvent) {
      const remoteParticipants = participants.filter((p) => p.userId !== user.id);
      
      remoteParticipants.forEach((participant) => {
        onCallEvent(
          callId,
          participant.userId,
          participant.name,
          "unknown",
          "joined"
        );
      });
    }
  }, [participants, onCallEvent, callId, user.id]);

  const toggleMicrophone = async () => {
    try {
      if (call) {
        if (isMicMuted) {
          // Try different possible unmute methods
          if (call.microphone && typeof call.microphone.enable === "function") {
            await call.microphone.enable();
          } else if (typeof call.unmuteAudio === "function") {
            await call.unmuteAudio();
          } else if (call.audio && typeof call.audio.enable === "function") {
            await call.audio.enable();
          } else if (typeof call.unmute === "function") {
            await call.unmute();
          } else {
            return;
          }
        } else {
          // Try different possible mute methods
          if (
            call.microphone &&
            typeof call.microphone.disable === "function"
          ) {
            await call.microphone.disable();
          } else if (typeof call.muteAudio === "function") {
            await call.muteAudio();
          } else if (call.audio && typeof call.audio.disable === "function") {
            await call.audio.disable();
          } else if (typeof call.mute === "function") {
            await call.mute();
          } else {
            return;
          }
        }

        setIsMicMuted(!isMicMuted);
      }
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  };

  const toggleCamera = async () => {
    try {
      if (call) {
        if (isCameraOff) {
          // Try different possible camera enable methods
          if (call.camera && typeof call.camera.enable === "function") {
            await call.camera.enable();
          } else if (typeof call.enableVideo === "function") {
            await call.enableVideo();
          } else if (call.video && typeof call.video.enable === "function") {
            await call.video.enable();
          } else if (typeof call.startVideo === "function") {
            await call.startVideo();
          } else {
            return;
          }
        } else {
          // Try different possible camera disable methods
          if (call.camera && typeof call.camera.disable === "function") {
            await call.camera.disable();
          } else if (typeof call.disableVideo === "function") {
            await call.disableVideo();
          } else if (call.video && typeof call.video.disable === "function") {
            await call.video.disable();
          } else if (typeof call.stopVideo === "function") {
            await call.stopVideo();
          } else {
            return;
          }
        }

        setIsCameraOff(!isCameraOff);
      }
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (call) {
        if (isScreenSharing) {
          // Try different possible stop methods
          if (typeof call.stopScreenShare === "function") {
            await call.stopScreenShare();
          } else if (
            call.screenShare &&
            typeof call.screenShare.disable === "function"
          ) {
            await call.screenShare.disable();
          } else if (
            call.screenShare &&
            typeof call.screenShare.stop === "function"
          ) {
            await call.screenShare.stop();
          } else {
            return;
          }
        } else {
          // Try different possible start methods
          if (typeof call.startScreenShare === "function") {
            await call.startScreenShare();
          } else if (
            call.screenShare &&
            typeof call.screenShare.enable === "function"
          ) {
            await call.screenShare.enable();
          } else if (
            call.screenShare &&
            typeof call.screenShare.start === "function"
          ) {
            await call.screenShare.start();
          } else {
            return;
          }
        }
        setIsScreenSharing(!isScreenSharing);
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
    }
  };

  if (callEndedAt) {
    return (
      <div className="call-ended">
        <h2>Call has ended</h2>
        <button onClick={onLeave} className="btn-primary">
          Return to Lobby
        </button>
      </div>
    );
  }

  return (
    <StreamTheme>
      <div className="video-call-ui">
        <div className="call-header">
          <span className="call-id">Call: {callId}</span>
          <div className="participants-count">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1.01L14 10l-1.99-1.01A2.5 2.5 0 0 0 10 8H8.46c-.8 0-1.51.37-1.96 1.37L4 17.5H6.5V22h2v-6h2.5l1.5-4.5L14 13v9h2z" />
            </svg>
            {participants.length}
          </div>
          {userType && <span className="user-type">{userType}</span>}
          <span className="call-duration">{formatDuration(callDuration)}</span>
        </div>

        <div 
          className="video-container"
          ref={videoContainerRef}
          onTouchStart={isMobileDevice ? handleTouchStart : undefined}
          onTouchEnd={isMobileDevice ? handleTouchEnd : undefined}
        >
          <div className="remote-participants-grid">
            {participants
              .filter((p) => p.userId !== user.id)
              .map((participant) => (
                <div key={participant.userId} className="participant-container">
                  {/* Let Stream.io handle video/avatar display natively */}
                  <ParticipantView participant={participant} />
                </div>
              ))}
          </div>
          <FloatingLocalParticipant isCameraOff={isCameraOff} call={call} />
        </div>

        <div className={`custom-call-controls ${controlsVisible ? "" : "hide-controls"}`}>
          <CustomControlButton
            onClick={toggleMicrophone}
              isActive={isMicMuted}
              className="microphone-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                {isMicMuted ? (
                  <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                ) : (
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
                )}
              </svg>
            </CustomControlButton>

            <CustomControlButton
              onClick={toggleCamera}
              isActive={isCameraOff}
              className="camera-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                {isCameraOff ? (
                  <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2zM5 16V8h1.73l8 8H5z"/>
                ) : (
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                )}
              </svg>
            </CustomControlButton>

            {/* Camera Switch Button - Only show on mobile/tablet with multiple cameras */}
            {(deviceType === 'mobile' || deviceType === 'tablet') && hasMultipleCameras && !isCameraOff && (
              <CustomControlButton
                onClick={switchCamera}
                disabled={isSwitchingCamera}
                className="camera-switch-btn"
              >
                {isSwitchingCamera ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z">
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 12 12"
                        to="360 12 12"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM9 4.5h6l.83 1.5H9V4.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"/>
                    <path d="M14.5 11.5L16 10l1.5 1.5L16 13l-1.5-1.5z"/>
                  </svg>
                )}
              </CustomControlButton>
            )}

            <CustomControlButton
              onClick={toggleScreenShare}
              isActive={isScreenSharing}
              className="screen-share-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
              </svg>
            </CustomControlButton>

            <CustomControlButton
              onClick={onLeave}
              className="leave-call-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </CustomControlButton>
          {/* <CallControls /> */}
        </div>
      </div>
    </StreamTheme>
  );
};

// Pre-call setup component
const PreCallSetup = ({
  call,
  onJoinCall,
  onLeave,
  callId,
  isJoining,
  isCameraEnabled,
  setIsCameraEnabled,
  isMicEnabled,
  setIsMicEnabled,
}) => {
  const [localStream, setLocalStream] = useState(null);
  const videoRef = React.useRef(null);

  useEffect(() => {
    const setupInitialPreview = async () => {
      try {
        // Initial setup - get user media for preview
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    setupInitialPreview();

    // Cleanup function
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // Remove dependencies to prevent interference

  const toggleCamera = async () => {
    const newCameraState = !isCameraEnabled;
    setIsCameraEnabled(newCameraState);

    if (!newCameraState) {
      // TURNING CAMERA OFF - Immediate shutdown
      if (localStream) {
        // Stop video tracks immediately for instant camera light off
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach((track) => track.stop());

        // Clear video element immediately
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        // Handle audio stream management in background
        const audioTracks = localStream.getAudioTracks();
        if (isMicEnabled && audioTracks.length > 0) {
          // Keep existing audio tracks running
          const audioOnlyStream = new MediaStream(audioTracks);
          setLocalStream(audioOnlyStream);
        } else {
          // Stop all tracks and clear stream
          localStream.getTracks().forEach((track) => track.stop());
          setLocalStream(null);
        }
      }
    } else {
      // TURNING CAMERA ON - Create new stream with video
      if (localStream) {
        // Stop current stream first
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: isMicEnabled,
        });

        setLocalStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (error) {
        console.error("Error enabling camera:", error);
      }
    }
  };

  const toggleMicrophone = async () => {
    const newMicState = !isMicEnabled;
    setIsMicEnabled(newMicState);

    // Stop current stream completely
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // Clear video element first
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Create appropriate stream based on device states
    try {
      if (isCameraEnabled && newMicState) {
        // Both camera and mic enabled
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } else if (isCameraEnabled && !newMicState) {
        // Only camera enabled
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setLocalStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } else if (!isCameraEnabled && newMicState) {
        // Only microphone enabled - NO VIDEO REQUEST
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setLocalStream(newStream);
        // Don't set video element since camera is off
      } else {
        // Both disabled - no stream needed
        setLocalStream(null);
      }
    } catch (error) {
      console.error("Error updating microphone stream:", error);
    }
  };

  const handleJoinCall = () => {
    // Stop preview stream before joining
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    onJoinCall();
  };

  return (
    <div className="pre-call-setup">
      <div className="setup-header">
        <h2>Ready to join call: {callId}</h2>
        <p>Check your camera and microphone before joining</p>
      </div>

      <div className="video-preview-container">
        <div className="video-preview">
          {isCameraEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="preview-video"
            />
          ) : (
            <div className="camera-off-preview">
              <div className="camera-off-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2zM5 16V8h1.73l8 8H5z" />
                </svg>
              </div>
              <p>Camera is off</p>
            </div>
          )}
        </div>
      </div>

      <div className="device-controls">
        <div className="control-group">
          <button
            onClick={toggleMicrophone}
            className={`device-btn ${!isMicEnabled ? "disabled" : ""}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              {!isMicEnabled ? (
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
              ) : (
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" />
              )}
            </svg>
            <span>{isMicEnabled ? "Microphone On" : "Microphone Off"}</span>
          </button>

          <button
            onClick={toggleCamera}
            className={`device-btn ${!isCameraEnabled ? "disabled" : ""}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              {!isCameraEnabled ? (
                <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2zM5 16V8h1.73l8 8H5z" />
              ) : (
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              )}
            </svg>
            <span>{isCameraEnabled ? "Camera On" : "Camera Off"}</span>
          </button>
        </div>
      </div>

      <div className="join-controls">
        <button
          onClick={handleJoinCall}
          disabled={isJoining}
          className="btn-primary"
        >
          {isJoining ? "Joining..." : "Join Call"}
        </button>
      </div>
    </div>
  );
};

const VideoCall = ({
  callId,
  callType = "default",
  onLeave,
  autoJoin = false,
  onCallEvent,
}) => {
  const { client, user, userType } = useVideoClient();
  const [call, setCall] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);
  // Removed showPreCallSetup state - always show pre-call setup when not joined

  // Lift pre-call settings to parent component
  const [preCallCameraEnabled, setPreCallCameraEnabled] = useState(true);
  const [preCallMicEnabled, setPreCallMicEnabled] = useState(true);

  useEffect(() => {
    const setupCall = async () => {
      if (!client || !user) return;

      try {
        const callInstance = client.call(callType, callId);

        // Ensure call exists with proper member data
        await callInstance.getOrCreate({
          data: {
            members: [{ user_id: user.id }],
            custom: {
              user_type: userType || "guest",
              created_at: new Date().toISOString(),
            },
          },
        });

        setCall(callInstance);

        // Auto-join for direct link access
        if (autoJoin && userType === "customer") {
          await joinCall(callInstance);
        }
      } catch (err) {
        setError("Failed to setup call");
        console.error("Call setup error:", err);
      }
    };

    setupCall();
  }, [client, user, callId, callType, autoJoin, userType]);

  const joinCall = async (callInstance = call) => {
    if (!callInstance) return;

    setIsJoining(true);
    setError(null);

    try {
      // Apply pre-call camera setting
      if (!preCallCameraEnabled && callInstance.camera) {
        try {
          await callInstance.camera.disable();
        } catch (error) {
          // Silent fail - camera will be disabled after join
        }
      }

      // Apply pre-call microphone setting
      if (!preCallMicEnabled && callInstance.microphone) {
        try {
          await callInstance.microphone.disable();
        } catch (error) {
          // Silent fail - microphone will be disabled after join
        }
      }

      // Join the call
      if (callInstance && typeof callInstance.join === "function") {
        await callInstance.join({ create: true });
      } else {
        throw new Error("No valid join method found on call instance");
      }

      // Apply settings again after joining (fallback)
      setTimeout(async () => {
        try {
          if (!preCallCameraEnabled && callInstance.camera) {
            await callInstance.camera.disable();
          }
          if (!preCallMicEnabled && callInstance.microphone) {
            await callInstance.microphone.disable();
          }
        } catch (error) {
          // Silent fail - settings will be applied by UI controls
        }
      }, 1000);

      // Optional: Log to backend for analytics
      if (onCallEvent) {
        onCallEvent(callId, user.id, user.name, userType || "guest", "joined");
      }
    } catch (err) {
      setError("Failed to join call: " + err.message);
      console.error("Join call error:", err);

      // Log failed join attempt
      if (onCallEvent) {
        onCallEvent(
          callId,
          user.id,
          user.name,
          userType || "guest",
          "join_failed"
        );
      }
    } finally {
      setIsJoining(false);
    }
  };

  const leaveCall = async () => {
    if (call) {
      try {
        await call.leave();

        // Log leave event
        if (onCallEvent) {
          onCallEvent(callId, user.id, user.name, userType || "guest", "left");
        }
      } catch (error) {
        console.error("Error leaving call:", error);
      }
    }
    onLeave();
  };

  if (!client) {
    return <div className="loading">Initializing video client...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => setError(null)} className="btn-primary">
          Try Again
        </button>
        <button onClick={onLeave} className="btn-secondary">
          Back to Lobby
        </button>
      </div>
    );
  }

  if (!call) {
    return <div className="loading">Setting up call...</div>;
  }

  const handleJoinFromSetup = () => {
    joinCall();
  };

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        {call.state.callingState === "joined" ? (
          <VideoCallUI
            onLeave={leaveCall}
            onCallEvent={onCallEvent}
            callId={callId}
            call={call}
            initialCameraOff={!preCallCameraEnabled}
            initialMicMuted={!preCallMicEnabled}
          />
        ) : (
          <PreCallSetup
            call={call}
            onJoinCall={handleJoinFromSetup}
            onLeave={onLeave}
            callId={callId}
            isJoining={isJoining}
            isCameraEnabled={preCallCameraEnabled}
            setIsCameraEnabled={setPreCallCameraEnabled}
            isMicEnabled={preCallMicEnabled}
            setIsMicEnabled={setPreCallMicEnabled}
          />
        )}
      </StreamCall>
    </StreamVideo>
  );
};

export default VideoCall;
