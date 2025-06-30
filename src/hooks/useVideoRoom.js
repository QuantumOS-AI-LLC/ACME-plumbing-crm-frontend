import { useState, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../hooks/useAuth';
import { useVideoClient } from '../contexts/VideoContext';
import {
    getRoomsFromSystem,
    getRoomFromSystem,
    logCallSession
} from '../services/api';
import { toast } from 'sonner';

export const useVideoRoom = () => {
    const [loading, setLoading] = useState(false);
    const [videoRoomData, setVideoRoomData] = useState(null);
    const [roomsList, setRoomsList] = useState([]);
    const { socket } = useSocket();
    const { user } = useAuth();
    const { client } = useVideoClient();

    // Create a GetStream video call (replacing Telnyx room creation)
    const createRoom = async (contactId, contactName) => {
        try {
            setLoading(true);
            
            // Get current user data
            const userProfile = JSON.parse(
                localStorage.getItem('userProfile') || 
                sessionStorage.getItem('userProfile') || 
                '{}'
            );
            
            if (!userProfile.id) {
                throw new Error('User not authenticated');
            }

            if (!client) {
                throw new Error('Video client not initialized');
            }

            // Generate unique call ID
            const callId = `contact_${contactId}_${Date.now()}`;
            
            // Create GetStream call
            const call = client.call('default', callId);
            
            await call.getOrCreate({
                data: {
                    created_by_id: userProfile.id,
                    members: [{ user_id: userProfile.id }],
                    custom: {
                        contact_id: contactId,
                        contact_name: contactName,
                        call_type: 'customer_support',
                        created_at: new Date().toISOString()
                    }
                },
            });

            // Create room data object
            const roomData = {
                callId: callId,
                uniqueName: `Call with ${contactName}`,
                joinUrl: `${window.location.origin}/video-call?callId=${callId}`,
                maxParticipants: 10,
                enableRecording: false,
                createdAt: new Date().toISOString(),
                contactId: contactId,
                contactName: contactName
            };

            setVideoRoomData(roomData);

            // Log the call creation
            await logCallSession(callId, userProfile.id, userProfile.name, 'staff', 'created');

            toast.success(`Video call created for ${contactName}!`, {
                duration: 4000,
                description: 'Video call is ready to use'
            });

            return roomData;

        } catch (error) {
            console.error('Error creating video call:', error);
            
            let errorMessage = 'Failed to create video call';
            if (error.message.includes('User not authenticated')) {
                errorMessage = 'Please log in to create video calls';
            } else if (error.message.includes('Video client not initialized')) {
                errorMessage = 'Video system not ready, please refresh the page';
            }
            
            toast.error(errorMessage, {
                duration: 4000
            });
            
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Join a video call (replacing Telnyx room join)
    const joinRoom = (callIdOrUrl) => {
        if (callIdOrUrl) {
            let actualCallId;
            
            // Check if it's a full URL or just a callId
            if (callIdOrUrl.includes('http')) {
                // Extract callId from URL
                try {
                    const url = new URL(callIdOrUrl);
                    actualCallId = url.searchParams.get('callId');
                } catch (error) {
                    console.error('Error parsing URL:', error);
                    actualCallId = callIdOrUrl;
                }
            } else {
                // It's already a callId
                actualCallId = callIdOrUrl;
            }
            
            // Open video call in new tab to keep contact page accessible
            const callWindow = window.open(`/video-call?callId=${actualCallId}`, '_blank');
            if (callWindow) {
                callWindow.focus();
            }
        }
    };

    // Update call settings (simplified for GetStream)
    const updateRoom = async (callId, updateData, contactName) => {
        try {
            setLoading(true);
            
            if (!client) {
                throw new Error('Video client not initialized');
            }

            // Get the call instance
            const call = client.call('default', callId);
            
            // Update call metadata
            await call.update({
                custom: {
                    ...updateData,
                    updated_at: new Date().toISOString()
                }
            });

            toast.success(`Video call updated for ${contactName}!`, {
                duration: 3000,
                description: 'Call settings updated successfully'
            });

            return { success: true };

        } catch (error) {
            console.error('Error updating video call:', error);
            
            toast.error('Failed to update video call', {
                duration: 4000
            });
            
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Delete/end a call (simplified for GetStream)
    const deleteRoom = async (callId, contactName) => {
        try {
            setLoading(true);
            
            if (!client) {
                throw new Error('Video client not initialized');
            }

            // Get the call instance and end it
            const call = client.call('default', callId);
            await call.endCall();

            // Clear room data from state
            setVideoRoomData(null);

            // Log the call deletion
            const userProfile = JSON.parse(
                localStorage.getItem('userProfile') || 
                sessionStorage.getItem('userProfile') || 
                '{}'
            );
            
            if (userProfile.id) {
                await logCallSession(callId, userProfile.id, userProfile.name, 'staff', 'ended');
            }

            toast.success(`Video call ended for ${contactName}!`, {
                duration: 3000,
                description: 'Call has been terminated'
            });

            return { success: true };

        } catch (error) {
            console.error('Error ending video call:', error);
            
            toast.error('Failed to end video call', {
                duration: 4000
            });
            
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Get call details (simplified)
    const getRoomDetails = async (callId) => {
        try {
            setLoading(true);
            
            if (!client) {
                throw new Error('Video client not initialized');
            }

            // Get call details from GetStream
            const call = client.call('default', callId);
            const callData = await call.get();

            const roomData = {
                callId: callId,
                uniqueName: callData.call.custom?.contact_name ? 
                    `Call with ${callData.call.custom.contact_name}` : 
                    `Call ${callId}`,
                joinUrl: `${window.location.origin}/video-call?callId=${callId}`,
                maxParticipants: 10,
                enableRecording: false,
                createdAt: callData.call.created_at,
                contactId: callData.call.custom?.contact_id,
                contactName: callData.call.custom?.contact_name
            };

            setVideoRoomData(roomData);
            return roomData;

        } catch (error) {
            console.error('Error getting video call details:', error);
            
            toast.error('Failed to get call details', {
                duration: 4000
            });
            
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Get calls for a specific contact (simplified)
    const getRoomsForContact = useCallback(async (contactId) => {
        try {
            setLoading(true);
            
            // For now, return empty array as GetStream doesn't have built-in contact filtering
            // You could implement this by storing call metadata in your backend
            const rooms = [];
            setRoomsList(rooms);
            return rooms;

        } catch (error) {
            console.error('Error getting calls for contact:', error);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Get all calls (simplified)
    const getAllRooms = async () => {
        try {
            setLoading(true);
            
            // For now, return empty array
            // You could implement this by querying GetStream calls or your backend
            const rooms = [];
            setRoomsList(rooms);
            return rooms;

        } catch (error) {
            console.error('Error getting all calls:', error);
            
            toast.error('Failed to get calls list', {
                duration: 4000
            });
            
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Share call link with compressed secure token
    const shareRoomLink = async (callId, contactName, contactId, userId) => {
        try {
            setLoading(true);
            
            // Generate compressed token with minimal essential data
            const compressedTokenData = {
                c: callId,                                                    // callId (shortened key)
                n: contactName,                                               // contactName (shortened key)
                e: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000)    // expiresAt as Unix timestamp
            };
            
            // Create compressed base64 encoded token
            const compressedToken = btoa(JSON.stringify(compressedTokenData))
                .replace(/\+/g, '-')    // URL-safe: + to -
                .replace(/\//g, '_')    // URL-safe: / to _
                .replace(/=/g, '');     // Remove padding
            
            // Generate guest-friendly URL with compressed token
            const guestJoinUrl = `${window.location.origin}/join-call?token=${compressedToken}`;
            
            // Copy to clipboard
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(guestJoinUrl);
            }
            
            // Send direct webhook to n8n
            try {
                const webhookPayload = {
                    event: 'video_link_shared',
                    contactId: contactId,
                    contactName: contactName,
                    videoLink: guestJoinUrl,
                    callId: callId,
                    sharedBy: userId,
                    sharedByName: user?.name || 'Unknown',
                    timestamp: new Date().toISOString(),
                    message: `Video call link shared for ${contactName}: ${guestJoinUrl}`
                };

                console.log('Sending direct webhook to n8n:', webhookPayload);

                const webhookResponse = await fetch(import.meta.env.VITE_N8N_UPDATE_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(webhookPayload)
                });

                if (webhookResponse.ok) {
                    console.log('Webhook sent successfully to n8n');
                } else {
                    console.error('Webhook failed:', webhookResponse.status, webhookResponse.statusText);
                }
            } catch (webhookError) {
                console.error('Error sending webhook to n8n:', webhookError);
                // Don't fail the share operation if webhook fails
            }

            // Optional: Keep socket for real-time UI updates (if needed)
            if (socket && user) {
                socket.emit('user_message', {
                    message: `Video call link shared: ${guestJoinUrl}`,
                    contactId: contactId,
                    estimateId: null,
                    attachments: []
                });
            }

            // Log the share action
            await logCallSession(callId, userId, user?.name || 'Unknown', 'staff', 'link_shared');

            toast.success(`Video call link shared for ${contactName}!`, {
                duration: 3000,
                description: 'Secure guest link copied to clipboard'
            });

        } catch (error) {
            console.error('Error sharing video call link:', error);
            
            toast.error('Failed to share video call link', {
                duration: 4000
            });
            
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const clearRoomData = () => {
        setVideoRoomData(null);
    };

    return {
        loading,
        videoRoomData,
        roomsList,
        createRoom,
        updateRoom,
        deleteRoom,
        getRoomDetails,
        getRoomsForContact,
        getAllRooms,
        joinRoom,
        shareRoomLink,
        clearRoomData
    };
};

export default useVideoRoom;
