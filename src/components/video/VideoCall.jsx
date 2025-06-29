import React, { useState, useEffect } from 'react';
import {
  StreamVideo,
  StreamCall,
  SpeakerLayout,
  ParticipantView,
  useCallStateHooks,
  StreamTheme,
  CallControls,
} from '@stream-io/video-react-sdk';
import { useVideoClient } from '../../contexts/VideoContext';
import './VideoCall.css';

const FloatingLocalParticipant = () => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const { user } = useVideoClient();
  const [isMinimized, setIsMinimized] = useState(false);

  // Find the local participant (current user)
  const localParticipant = participants.find(p => p.userId === user?.id);

  if (!localParticipant) {
    return null;
  }

  return (
    <div className={`floating-local-participant ${isMinimized ? 'minimized' : ''}`}>
      <div className="floating-participant-header">
        <span className="participant-name">You</span>
        <button 
          className="minimize-btn"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? '□' : '−'}
        </button>
      </div>
      {!isMinimized && (
        <div className="floating-participant-video">
          <ParticipantView 
            participant={localParticipant}
            trackType="videoTrack"
          />
        </div>
      )}
    </div>
  );
};

// Custom control buttons using GetStream hooks
const CustomControlButton = ({ onClick, isActive, children, className, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`custom-control-btn ${className} ${isActive ? 'active' : ''}`}
  >
    {children}
  </button>
);

const VideoCallUI = ({ onLeave, onCallEvent, callId, call }) => {
  const { useCallEndedAt, useParticipants } = useCallStateHooks();
  const callEndedAt = useCallEndedAt();
  const participants = useParticipants();
  const { user, userType } = useVideoClient();

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Log participant changes
  useEffect(() => {
    if (participants && onCallEvent) {
      participants.forEach(participant => {
        if (participant.userId !== user.id) {
          onCallEvent(callId, participant.userId, participant.name, 'unknown', 'joined');
        }
      });
    }
  }, [participants, onCallEvent, callId, user.id]);

  const toggleMicrophone = async () => {
    try {
      if (call?.microphone) {
        if (isMicMuted) {
          await call.microphone.enable();
        } else {
          await call.microphone.disable();
        }
        setIsMicMuted(!isMicMuted);
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
    }
  };

  const toggleCamera = async () => {
    try {
      if (call?.camera) {
        if (isCameraOff) {
          await call.camera.enable();
        } else {
          await call.camera.disable();
        }
        setIsCameraOff(!isCameraOff);
      }
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (call?.screenShare) {
        if (isScreenSharing) {
          await call.screenShare.stop();
        } else {
          await call.screenShare.start();
        }
        setIsScreenSharing(!isScreenSharing);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
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
          <div className="call-info">
            <span>Call: {callId}</span>
            <span>Participants: {participants.length}</span>
            {userType && <span className="user-type">{userType}</span>}
          </div>
          <button onClick={onLeave} className="btn-secondary">
            Leave Call
          </button>
        </div>
        
        <div className="video-container">
          <SpeakerLayout />
          <FloatingLocalParticipant />
        </div>
        
        <div className="controls-container">
          <div className="custom-call-controls">
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

            <CustomControlButton
              onClick={toggleScreenShare}
              isActive={isScreenSharing}
              className="screen-share-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
              </svg>
            </CustomControlButton>

            <button onClick={onLeave} className="leave-call-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.68.28-.26 0-.51-.1-.71-.29-.19-.19-.29-.44-.29-.71 0-.27.1-.52.29-.71.44-.44.91-.84 1.4-1.21C2.98 12.44 2 11.78 2 11V4c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v7c0 .78-.98 1.44-2.19 1.93.49.37.96.77 1.4 1.21.19.19.29.44.29.71 0 .27-.1.52-.29.71-.2.19-.45.29-.71.29-.25 0-.5-.1-.68-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
              </svg>
              Leave Call
            </button>
          </div>
        </div>
      </div>
    </StreamTheme>
  );
};

const VideoCall = ({ callId, callType = 'default', onLeave, autoJoin = false, onCallEvent }) => {
  const { client, user, userType } = useVideoClient();
  const [call, setCall] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);

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
              user_type: userType || 'guest',
              created_at: new Date().toISOString()
            }
          }
        });
        
        setCall(callInstance);
        
        // Auto-join for direct link access
        if (autoJoin && userType === 'customer') {
          await joinCall(callInstance);
        }
      } catch (err) {
        setError('Failed to setup call');
        console.error('Call setup error:', err);
      }
    };

    setupCall();
  }, [client, user, callId, callType, autoJoin, userType]);

  const joinCall = async (callInstance = call) => {
    if (!callInstance) return;

    setIsJoining(true);
    setError(null);

    try {
      // For GetStream SDK v1.18.6, try the correct join pattern
      console.log('Attempting to join call with instance:', callInstance);
      
      // Method 1: Direct join (most common)
      if (callInstance && typeof callInstance.join === 'function') {
        await callInstance.join({ create: true });
      } 
      // Method 2: Camera/Microphone enable first
      else if (callInstance && callInstance.camera && callInstance.microphone) {
        await callInstance.camera.enable();
        await callInstance.microphone.enable();
        if (typeof callInstance.join === 'function') {
          await callInstance.join();
        } else {
          throw new Error('Join method not available after enabling camera/mic');
        }
      }
      // Method 3: Alternative join without parameters
      else if (callInstance && typeof callInstance.join === 'function') {
        await callInstance.join();
      }
      else {
        // Debug information
        console.error('Call instance details:', {
          instance: callInstance,
          hasJoin: typeof callInstance?.join,
          methods: callInstance ? Object.getOwnPropertyNames(callInstance) : 'null',
          prototype: callInstance ? Object.getOwnPropertyNames(Object.getPrototypeOf(callInstance)) : 'null'
        });
        throw new Error('No valid join method found on call instance');
      }

      console.log('Successfully joined call');

      // Optional: Log to backend for analytics
      if (onCallEvent) {
        onCallEvent(callId, user.id, user.name, userType || 'guest', 'joined');
      }
    } catch (err) {
      setError('Failed to join call: ' + err.message);
      console.error('Join call error:', err);
      
      // Log failed join attempt
      if (onCallEvent) {
        onCallEvent(callId, user.id, user.name, userType || 'guest', 'join_failed');
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
          onCallEvent(callId, user.id, user.name, userType || 'guest', 'left');
        }
      } catch (error) {
        console.error('Error leaving call:', error);
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

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        {call.state.callingState === 'joined' ? (
          <VideoCallUI onLeave={leaveCall} onCallEvent={onCallEvent} callId={callId} call={call} />
        ) : (
          <div className="call-lobby">
            <h2>Ready to join call: {callId}</h2>
            <div className="join-controls">
              <button 
                onClick={() => joinCall()} 
                disabled={isJoining}
                className="btn-primary"
              >
                {isJoining ? 'Joining...' : 'Join Call'}
              </button>
              <button onClick={onLeave} className="btn-secondary">
                Back to Lobby
              </button>
            </div>
          </div>
        )}
      </StreamCall>
    </StreamVideo>
  );
};

export default VideoCall;
