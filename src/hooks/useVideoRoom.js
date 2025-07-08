import { useState, useCallback } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../hooks/useAuth";
import { useVideoClient } from "../contexts/VideoContext";
import {
    createRoomInSystem,
    getRoomsFromSystem,
    updateRoomInSystem,
    deleteRoomFromSystem,
    logCallSession,
    generateVideoToken,
} from "../services/api";
import { toast } from "sonner";

// Helper function to generate a secure guest URL
const generateGuestUrl = (callId, contactName, durationMinutes) => {
    // Generate compressed token with minimal essential data
    const compressedTokenData = {
        c: callId, // callId (shortened key)
        n: contactName, // contactName (shortened key)
        e: Date.now() + durationMinutes * 60 * 1000, // expiresAt in milliseconds
    };

    // Create compressed base64 encoded token
    const compressedToken = btoa(JSON.stringify(compressedTokenData))
        .replace(/\+/g, "-") // URL-safe: + to -
        .replace(/\//g, "_") // URL-safe: / to _
        .replace(/=/g, ""); // Remove padding

    // Generate guest-friendly URL with compressed token
    return `${window.location.origin}/join-call?token=${compressedToken}`;
};

export const useVideoRoom = () => {
    const [loading, setLoading] = useState(false);
    const [videoRoomData, setVideoRoomData] = useState(null);
    const [roomsList, setRoomsList] = useState([]);
    const { socket } = useSocket();
    const { user } = useAuth();
    const { client } = useVideoClient();

    // Create a GetStream video call with backend persistence
    const createRoom = async (contactId, contactName, durationMinutes = 30) => {
        try {
            setLoading(true);

            // Get current user data
            const userProfile = JSON.parse(
                localStorage.getItem("userProfile") ||
                    sessionStorage.getItem("userProfile") ||
                    "{}"
            );

            if (!userProfile.id) {
                throw new Error("User not authenticated");
            }

            if (!client) {
                throw new Error("Video client not initialized");
            }

            // Generate unique call ID
            const callId = `contact_${contactId}_${Date.now()}`;

            // Calculate expiration time
            const durationSeconds = durationMinutes * 60;
            const expiresAt = new Date(
                Date.now() + durationMinutes * 60 * 1000
            );

            // Create GetStream call
            const call = client.call("default", callId);

            await call.getOrCreate({
                data: {
                    created_by_id: userProfile.id,
                    members: [{ user_id: userProfile.id }],
                    settings_override: {
                        limits: {
                            max_duration_seconds: durationSeconds,
                        },
                    },
                    custom: {
                        contact_id: contactId,
                        contact_name: contactName,
                        call_type: "customer_support",
                        created_at: new Date().toISOString(),
                        expires_at: expiresAt.toISOString(),
                        duration_minutes: durationMinutes,
                        max_duration_seconds: durationSeconds,
                    },
                },
            });

            // Generate the secure guest URL
            const guestUrl = generateGuestUrl(
                callId,
                contactName,
                durationMinutes
            );

            // Save to backend database for persistence
            const backendResult = await createRoomInSystem({
                streamCallId: callId,
                uniqueName: `Call with ${contactName} - ${new Date().toLocaleString()}`,
                callType: "default",
                maxParticipants: 10,
                enableRecording: false,
                customData: {
                    source: "contact_page",
                    userAgent: navigator.userAgent,
                    getStreamCallData: {
                        type: "default",
                        created_by_id: userProfile.id,
                    },
                },
                createdFor: contactId,
                joinUrl: `${window.location.origin}/video-call?callId=${callId}`,
                guestUrl: guestUrl,
                expiresAt: expiresAt.toISOString(),
                durationMinutes: durationMinutes,
                maxDurationSeconds: durationSeconds,
            });

            if (!backendResult.success) {
                throw new Error(
                    backendResult.message || "Failed to save call to backend"
                );
            }

            const backendRoom = backendResult.data.room;

            // Create room data object with backend data
            const roomData = {
                id: backendRoom.id,
                callId: backendRoom.streamCallId,
                uniqueName: backendRoom.uniqueName,
                joinUrl: backendRoom.joinUrl,
                maxParticipants: backendRoom.maxParticipants,
                enableRecording: backendRoom.enableRecording,
                createdAt: backendRoom.createdAt,
                contactId: contactId,
                contactName: contactName,
                status: backendRoom.status,
                durationMinutes: backendRoom.durationMinutes,
                // Backend provides additional data
                createdBy: backendRoom.createdBy,
                createdByName: backendRoom.user?.name,
                totalDuration: backendRoom.totalDuration || 0,
                participantCount: backendRoom.participantCount || 0,
            };

            setVideoRoomData(roomData);

            // Log the call creation
            await logCallSession(
                callId,
                userProfile.id,
                userProfile.name,
                "staff",
                "created"
            );

            toast.success(`Video call created for ${contactName}!`, {
                duration: 4000,
                description: "Video call is ready to use and saved",
            });

            return roomData;
        } catch (error) {
            console.error("Error creating video call:", error);

            let errorMessage = "Failed to create video call";
            if (error.message.includes("User not authenticated")) {
                errorMessage = "Please log in to create video calls";
            } else if (error.message.includes("Video client not initialized")) {
                errorMessage =
                    "Video system not ready, please refresh the page";
            } else if (
                error.message.includes("Failed to save call to backend")
            ) {
                errorMessage =
                    "Video call created but not saved. Please try again.";
            }

            toast.error(errorMessage, {
                duration: 4000,
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
            if (callIdOrUrl.includes("http")) {
                // Extract callId from URL
                try {
                    const url = new URL(callIdOrUrl);
                    actualCallId = url.searchParams.get("callId");
                } catch (error) {
                    console.error("Error parsing URL:", error);
                    actualCallId = callIdOrUrl;
                }
            } else {
                // It's already a callId
                actualCallId = callIdOrUrl;
            }

            // Open video call in new tab to keep contact page accessible
            const callWindow = window.open(
                `/video-call?callId=${actualCallId}`,
                "_blank"
            );
            if (callWindow) {
                callWindow.focus();
            }
        }
    };

    // Update call settings with backend persistence
    const updateRoom = async (roomId, updateData, contactName) => {
        try {
            setLoading(true);

            // Update in backend database
            const result = await updateRoomInSystem(roomId, updateData);

            if (!result.success) {
                throw new Error(
                    result.message || "Failed to update video call in backend"
                );
            }

            // Update GetStream call if needed
            if (client && result.data.room.streamCallId) {
                try {
                    const call = client.call(
                        "default",
                        result.data.room.streamCallId
                    );
                    await call.update({
                        custom: {
                            ...updateData,
                            updated_at: new Date().toISOString(),
                        },
                    });
                } catch (getStreamError) {
                    console.warn(
                        "Failed to update GetStream call metadata:",
                        getStreamError
                    );
                    // Don't fail the entire operation if GetStream update fails
                }
            }

            toast.success(`Video call updated for ${contactName}!`, {
                duration: 3000,
                description: "Call settings updated successfully",
            });

            return result.data.room;
        } catch (error) {
            console.error("Error updating video call:", error);

            toast.error("Failed to update video call", {
                duration: 4000,
            });

            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Delete/end a call with backend persistence
    const deleteRoom = async (roomId, contactName) => {
        try {
            setLoading(true);

            // Delete from backend database
            const response = await deleteRoomFromSystem(roomId);

            if (!response.success) {
                throw new Error(
                    response.message ||
                        "Failed to delete video call from backend"
                );
            }

            // End GetStream call if client is available
            if (client) {
                try {
                    // We need to find the streamCallId from the room data
                    // For now, we'll try to end the call if we have the callId
                    const call = client.call("default", roomId);
                    await call.endCall();
                } catch (getStreamError) {
                    console.warn(
                        "Failed to end GetStream call:",
                        getStreamError
                    );
                    // Don't fail the entire operation if GetStream end fails
                }
            }

            // Clear room data from state
            setVideoRoomData(null);

            // Log the call deletion
            const userProfile = JSON.parse(
                localStorage.getItem("userProfile") ||
                    sessionStorage.getItem("userProfile") ||
                    "{}"
            );

            if (userProfile.id) {
                await logCallSession(
                    roomId,
                    userProfile.id,
                    userProfile.name,
                    "staff",
                    "deleted"
                );
            }

            toast.success(`Video call deleted for ${contactName}!`, {
                duration: 3000,
                description: "Call has been removed",
            });

            return { success: true };
        } catch (error) {
            console.error("Error deleting video call:", error);

            toast.error("Failed to delete video call", {
                duration: 4000,
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
                throw new Error("Video client not initialized");
            }

            // Get call details from GetStream
            const call = client.call("default", callId);
            const callData = await call.get();

            const roomData = {
                callId: callId,
                uniqueName: callData.call.custom?.contact_name
                    ? `Call with ${callData.call.custom.contact_name}`
                    : `Call ${callId}`,
                joinUrl: `${window.location.origin}/video-call?callId=${callId}`,
                maxParticipants: 10,
                enableRecording: false,
                createdAt: callData.call.created_at,
                contactId: callData.call.custom?.contact_id,
                contactName: callData.call.custom?.contact_name,
            };

            setVideoRoomData(roomData);
            return roomData;
        } catch (error) {
            console.error("Error getting video call details:", error);

            toast.error("Failed to get call details", {
                duration: 4000,
            });

            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Get calls for a specific contact from backend
    const getRoomsForContact = useCallback(async (contactId) => {
        try {
            const result = await getRoomsFromSystem({ createdFor: contactId });

            if (!result.success) {
                throw new Error(
                    result.message || "Failed to fetch video calls"
                );
            }

            const rooms = result.data.rooms || [];

            // Map backend data to frontend format
            const mappedRooms = rooms.map((room) => ({
                id: room.id,
                callId: room.streamCallId,
                uniqueName: room.uniqueName,
                joinUrl: room.joinUrl,
                maxParticipants: room.maxParticipants,
                enableRecording: room.enableRecording,
                createdAt: room.createdAt,
                updatedAt: room.updatedAt,
                startedAt: room.startedAt,
                endedAt: room.endedAt,
                status: room.status,
                durationMinutes: room.durationMinutes,
                totalDuration: room.totalDuration || 0,
                participantCount: room.participantCount || 0,
                recordingUrl: room.recordingUrl,
                contactId: contactId,
                contactName: room.contact?.name,
                createdBy: room.createdBy,
                createdByName: room.user?.name,
            }));

            setRoomsList(mappedRooms);
            return mappedRooms;
        } catch (error) {
            console.error("Error getting calls for contact:", error);
            return [];
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
            console.error("Error getting all calls:", error);

            toast.error("Failed to get calls list", {
                duration: 4000,
            });

            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Share call link with compressed secure token
    const shareRoomLink = async (
        callId,
        contactName,
        contactId,
        userId,
        durationMinutes
    ) => {
        try {
            setLoading(true);

            // Generate the secure guest URL
            const guestJoinUrl = generateGuestUrl(
                callId,
                contactName,
                durationMinutes
            );

            // Copy to clipboard
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(guestJoinUrl);
            }

            // Send direct webhook to n8n
            try {
                const webhookPayload = {
                    event: "video_link_shared",
                    contactId: contactId,
                    contactName: contactName,
                    videoLink: guestJoinUrl,
                    callId: callId,
                    sharedBy: userId,
                    sharedByName: user?.name || "Unknown",
                    timestamp: new Date().toISOString(),
                    message: `Video call link shared for ${contactName}: ${guestJoinUrl}`,
                };

                const webhookResponse = await fetch(
                    import.meta.env.VITE_N8N_UPDATE_URL,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(webhookPayload),
                    }
                );

                // Silent webhook handling - don't log success/failure
            } catch (webhookError) {
                console.error("Error sending webhook to n8n:", webhookError);
                // Don't fail the share operation if webhook fails
            }

            // Optional: Keep socket for real-time UI updates (if needed)
            if (socket && user) {
                socket.emit("user_message", {
                    message: `Video call link shared: ${guestJoinUrl}`,
                    contactId: contactId,
                    estimateId: null,
                    attachments: [],
                });
            }

            // Log the share action
            await logCallSession(
                callId,
                userId,
                user?.name || "Unknown",
                "staff",
                "link_shared"
            );

            toast.success(`Video call link shared for ${contactName}!`, {
                duration: 3000,
                description: "Secure guest link copied to clipboard",
            });
        } catch (error) {
            console.error("Error sharing video call link:", error);

            toast.error("Failed to share video call link", {
                duration: 4000,
            });

            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Update call status (for call lifecycle tracking)
    const updateCallStatus = async (roomId, status, additionalData = {}) => {
        try {
            const result = await updateRoomInSystem(roomId, {
                status,
                ...additionalData,
            });

            if (!result.success) {
                throw new Error(
                    result.message || "Failed to update call status"
                );
            }

            return result.data.room;
        } catch (error) {
            console.error("Error updating call status:", error);
            throw error;
        }
    };

    // End a video call with final statistics
    const endVideoCall = async (streamCallId, callData) => {
        try {
            const result = await updateRoomInSystem(streamCallId, {
                status: "ended",
                endedAt: new Date().toISOString(),
                totalDuration: callData.duration || 0,
                participantCount: callData.maxParticipants || 0,
                recordingUrl: callData.recordingUrl || null,
            });

            if (!result.success) {
                throw new Error(result.message || "Failed to end video call");
            }

            return result.data.room;
        } catch (error) {
            console.error("Error ending video call:", error);
            throw error;
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
        clearRoomData,
        updateCallStatus,
        endVideoCall,
    };
};

export default useVideoRoom;
