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

  // Auto-join call if callId or token is in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const callId = urlParams.get('callId');
    const token = urlParams.get('token');
    
    if (token && !client && !isInCall && !currentCallId) {
      console.log('Auto-joining call with secure token');
      autoJoinFromToken(token);
    } else if (callId && client && !isInCall && !currentCallId) {
      console.log('Auto-joining call with ID for staff user:', callId);
      // For staff users, directly set the call as active and skip lobby
      setCurrentCallId(callId);
      setIsInCall(true);
    }
  }, [client, isInCall, currentCallId]);

  // Auto-join function for compressed secure token-based calls
  const autoJoinFromToken = async (token) => {
    try {
      // Restore URL-safe base64 format
      let base64Token = token
        .replace(/-/g, '+')    // Restore + from -
        .replace(/_/g, '/')    // Restore / from _
        .padEnd(token.length + (4 - token.length % 4) % 4, '='); // Restore padding
      
      // Decode the compressed token
      const compressedData = JSON.parse(atob(base64Token));
      
      // Map compressed keys back to full format
      const tokenData = {
        callId: compressedData.c,           // c -> callId
        contactName: compressedData.n,      // n -> contactName
        expiresAt: compressedData.e * 1000  // e -> expiresAt (convert Unix timestamp to milliseconds)
      };
      
      // Check if token is expired
      if (new Date().getTime() > tokenData.expiresAt) {
        alert('This call link has expired. Please request a new link.');
        return;
      }
      
      console.log('Auto-joining call with contact info:', tokenData);
      
      // Initialize guest with contact name from token
      await initializeForGuest(tokenData.contactName, tokenData.callId);
      setCurrentCallId(tokenData.callId);
      setIsInCall(true);
      
      console.log(`Successfully auto-joined call as ${tokenData.contactName}`);
    } catch (err) {
      console.error('Failed to auto-join from token:', err);
      alert('Invalid or expired call link. Please request a new link.');
    }
  };

  // Auto-join function for URL-based calls
  const autoJoinCall = async (callId) => {
    if (!callId || !client) return;

    try {
      // Check if call exists and join directly
      const call = client.call('default', callId);
      
      // Get call info to verify it exists
      await call.get();
      
      setCurrentCallId(callId);
      setIsInCall(true);
      
      console.log('Successfully auto-joined call:', callId);
    } catch (err) {
      console.error('Failed to auto-join call:', err);
      // Set the callId in the join field so user can manually try
      setJoinCallId(callId);
      alert('Call found but unable to auto-join. Please try joining manually.');
    }
  };

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

  // Auto-populate callId from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlCallId = urlParams.get('callId');
    
    if (urlCallId) {
      setCallId(urlCallId);
      console.log('Auto-populated callId for guest:', urlCallId);
    }
  }, []);

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
      <div className="form-container">
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
    </div>
  );
};

export default CallManager;
