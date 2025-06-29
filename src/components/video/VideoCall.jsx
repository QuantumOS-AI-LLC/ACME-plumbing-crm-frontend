import React, { useState, useEffect } from 'react';
import {
  StreamVideo,
  StreamCall,
  CallControls,
  SpeakerLayout,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useVideoClient } from '../../contexts/VideoContext';
import './VideoCall.css';

const VideoCallUI = ({ onLeave, onCallEvent, callId }) => {
  const { useCallEndedAt, useParticipants } = useCallStateHooks();
  const callEndedAt = useCallEndedAt();
  const participants = useParticipants();
  const { user, userType } = useVideoClient();

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
      </div>
      
      <div className="controls-container">
        <CallControls />
      </div>
    </div>
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
          <VideoCallUI onLeave={leaveCall} onCallEvent={onCallEvent} callId={callId} />
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
