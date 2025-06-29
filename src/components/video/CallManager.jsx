import React, { useState, useEffect } from 'react';
import { useVideoClient } from '../../contexts/VideoContext';
import { useAuth } from '../../hooks/useAuth';
import VideoCall from './VideoCall';
import './CallManager.css';

const CallManager = () => {
  const { 
    client, 
    user, 
    userType,
    initializeForCRMUser,
    initializeForGuest,
    isConnecting, 
    error 
  } = useVideoClient();
  const { user: currentUser } = useAuth(); // Your existing CRM auth context
  
  const [currentCallId, setCurrentCallId] = useState('');
  const [joinCallId, setJoinCallId] = useState('');
  const [isInCall, setIsInCall] = useState(false);

  // Auto-initialize for authenticated CRM users
  useEffect(() => {
    if (currentUser && !client) {
      initializeForCRMUser(currentUser).catch(console.error);
    }
  }, [currentUser, client, initializeForCRMUser]);

  const handleGuestJoin = async (guestName, callId) => {
    try {
      await initializeForGuest(guestName, callId);
      setCurrentCallId(callId);
      setIsInCall(true);
    } catch (err) {
      console.error('Guest join failed:', err);
      alert('Failed to join call: ' + err.message);
    }
  };

  // Frontend call creation - no backend call management needed
  const createCall = async () => {
    if (!currentCallId.trim() || !client) return;

    // Ensure we have user data
    const userId = user?.id || currentUser?.id;
    const userName = user?.name || currentUser?.name;
    
    if (!userId) {
      alert('User not properly authenticated. Please refresh the page.');
      return;
    }

    try {
      // Create call directly using GetStream client
      const call = client.call('default', currentCallId.trim());
      
      await call.getOrCreate({
        data: {
          created_by_id: userId,
          members: [{ user_id: userId }],
          custom: {
            call_type: userType === 'staff' ? 'internal' : 'customer_support',
            created_at: new Date().toISOString()
          }
        },
      });

      // Optional: Log to backend for analytics
      logCallSession(currentCallId.trim(), userId, userName, userType, 'created');

      setIsInCall(true);
    } catch (err) {
      console.error('Failed to create call:', err);
      alert('Failed to create call: ' + err.message);
    }
  };

  const joinExistingCall = async () => {
    if (!joinCallId.trim() || !client) return;

    try {
      // Check if call exists and join directly
      const call = client.call('default', joinCallId.trim());
      
      // Get call info to verify it exists
      await call.get();
      
      setCurrentCallId(joinCallId.trim());
      setIsInCall(true);
    } catch (err) {
      console.error('Failed to join call:', err);
      alert('Call not found or unable to join');
    }
  };

  const leaveCall = () => {
    setIsInCall(false);
    setCurrentCallId('');
    setJoinCallId('');
  };

  // Helper function to log call sessions to backend (optional)
  const logCallSession = async (callId, participantId, participantName, userType, action) => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/video/call-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId,
          participantId,
          participantName,
          userType,
          action,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Failed to log call session:', error);
      // Don't fail the call for logging errors
    }
  };

  // For guests without CRM login
  if (!currentUser && !client) {
    return (
      <div className="call-manager">
        <GuestLoginForm onGuestJoin={handleGuestJoin} />
      </div>
    );
  }

  // Loading state for CRM users
  if (currentUser && !client && isConnecting) {
    return (
      <div className="call-manager">
        <div className="loading">
          Initializing video calling for {currentUser.name}...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="call-manager">
        <div className="error">
          <h3>Connection Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Video call interface
  if (isInCall && currentCallId) {
    return (
      <div className="call-manager">
        <VideoCall 
          callId={currentCallId} 
          onLeave={leaveCall}
          onCallEvent={logCallSession}
        />
      </div>
    );
  }

  // Call lobby for authenticated users
  return (
    <div className="call-manager">
      <div className="call-lobby">
        <h2>
          Welcome, {user?.name || currentUser?.name || 'User'}!
          {userType === 'staff' && <span className="user-badge">Staff</span>}
          {userType === 'customer' && <span className="user-badge customer">Customer</span>}
        </h2>
        
        <div className="call-actions">
          <div className="create-call">
            <h3>Create New Call</h3>
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter call ID"
                value={currentCallId}
                onChange={(e) => setCurrentCallId(e.target.value)}
              />
              <button onClick={createCall} disabled={!currentCallId.trim()}>
                Create & Join Call
              </button>
            </div>
          </div>

          <div className="join-call">
            <h3>Join Existing Call</h3>
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter call ID to join"
                value={joinCallId}
                onChange={(e) => setJoinCallId(e.target.value)}
              />
              <button onClick={joinExistingCall} disabled={!joinCallId.trim()}>
                Join Call
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Guest login component for customers
const GuestLoginForm = ({ onGuestJoin }) => {
  const [guestName, setGuestName] = useState('');
  const [callId, setCallId] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim() || !callId.trim()) {
      alert('Please enter your name and call ID');
      return;
    }
    
    setIsJoining(true);
    try {
      await onGuestJoin(guestName.trim(), callId.trim());
    } catch (error) {
      console.error('Failed to join call:', error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="guest-login-form">
      <h2>ACME Plumbing</h2>
      <div className="company-subtitle">Video Call Service</div>
      <p>Enter your name and the call ID provided by our team to join the video consultation</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="guestName">Your Name</label>
          <input
            id="guestName"
            type="text"
            placeholder="Enter your full name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
            disabled={isJoining}
          />
        </div>
        <div className="form-group">
          <label htmlFor="callId">Call ID</label>
          <input
            id="callId"
            type="text"
            placeholder="Enter the call ID provided"
            value={callId}
            onChange={(e) => setCallId(e.target.value)}
            required
            disabled={isJoining}
          />
        </div>
        <button type="submit" disabled={isJoining}>
          {isJoining ? 'Joining Call...' : '🎥 Join Video Call'}
        </button>
      </form>
    </div>
  );
};

export default CallManager;
