import { useState, useCallback } from 'react';
import { 
    createRoomWithSync, 
    updateRoomWithSync, 
    deleteRoomWithSync, 
    getRoomsFromSystem, 
    getRoomFromSystem,
    sendVideoRoomWebhook 
} from '../services/api';
import { toast } from 'sonner';

export const useVideoRoom = () => {
    const [loading, setLoading] = useState(false);
    const [videoRoomData, setVideoRoomData] = useState(null);
    const [roomsList, setRoomsList] = useState([]);

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

            // Create video room with dual-API sync (Telnyx + System)
            const roomResponse = await createRoomWithSync(contactId);
            
            if (!roomResponse.success || !roomResponse.data) {
                throw new Error('Failed to create video room');
            }

            const roomData = roomResponse.data;
            setVideoRoomData(roomData);

            toast.success(`Video room created for ${contactName}!`, {
                duration: 4000,
                description: 'Video room is ready to use and stored in system'
            });

            return roomData;

        } catch (error) {
            console.error('Error creating video room:', error);
            
            let errorMessage = 'Failed to create video room';
            if (error.message.includes('credentials not configured')) {
                errorMessage = 'Telnyx API credentials not configured';
            } else if (error.message.includes('User not authenticated')) {
                errorMessage = 'Please log in to create video rooms';
            } else if (error.message.includes('system database')) {
                errorMessage = 'Failed to save room to system database';
            }
            
            toast.error(errorMessage, {
                duration: 4000
            });
            
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const joinRoom = (joinUrl) => {
        if (joinUrl) {
            window.open(joinUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const updateRoom = async (systemId, telnyxRoomId, updateData, contactName) => {
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

            // Update video room with dual-API sync (Telnyx + System)
            const roomResponse = await updateRoomWithSync(systemId, telnyxRoomId, updateData);
            
            if (!roomResponse.success || !roomResponse.data) {
                throw new Error('Failed to update video room');
            }

            const roomData = roomResponse.data;
            setVideoRoomData(roomData);

            toast.success(`Video room updated for ${contactName}!`, {
                duration: 3000,
                description: 'Room settings updated in both systems'
            });

            return roomData;

        } catch (error) {
            console.error('Error updating video room:', error);
            
            let errorMessage = 'Failed to update video room';
            if (error.message.includes('credentials not configured')) {
                errorMessage = 'Telnyx API credentials not configured';
            } else if (error.message.includes('User not authenticated')) {
                errorMessage = 'Please log in to update video rooms';
            } else if (error.message.includes('system database')) {
                errorMessage = 'Failed to update room in system database';
            }
            
            toast.error(errorMessage, {
                duration: 4000
            });
            
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteRoom = async (systemId, telnyxRoomId, contactName) => {
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

            // Delete video room with dual-API sync (Telnyx + System)
            const deleteResponse = await deleteRoomWithSync(systemId, telnyxRoomId);
            
            if (!deleteResponse.success) {
                throw new Error('Failed to delete video room');
            }

            // Clear room data from state
            setVideoRoomData(null);

            toast.success(`Video room deleted for ${contactName}!`, {
                duration: 3000,
                description: 'Room removed from both systems'
            });

            return deleteResponse;

        } catch (error) {
            console.error('Error deleting video room:', error);
            
            let errorMessage = 'Failed to delete video room';
            if (error.message.includes('credentials not configured')) {
                errorMessage = 'Telnyx API credentials not configured';
            } else if (error.message.includes('User not authenticated')) {
                errorMessage = 'Please log in to delete video rooms';
            } else if (error.message.includes('system database')) {
                errorMessage = 'Failed to delete room from system database';
            }
            
            toast.error(errorMessage, {
                duration: 4000
            });
            
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getRoomDetails = async (systemId) => {
        try {
            setLoading(true);
            
            // Get video room details from system database (faster, includes metadata)
            const roomResponse = await getRoomFromSystem(systemId);
            
            if (!roomResponse.success || !roomResponse.data) {
                throw new Error('Failed to get video room details');
            }

            const roomData = roomResponse.data.room;
            setVideoRoomData(roomData);

            return roomData;

        } catch (error) {
            console.error('Error getting video room details:', error);
            
            let errorMessage = 'Failed to get video room details';
            if (error.message.includes('system database')) {
                errorMessage = 'Failed to get room from system database';
            }
            
            toast.error(errorMessage, {
                duration: 4000
            });
            
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getRoomsForContact = useCallback(async (contactId) => {
        try {
            setLoading(true);
            
            // Get all rooms for a specific contact from system database
            const roomsResponse = await getRoomsFromSystem({ createdFor: contactId });
            
            if (!roomsResponse.success) {
                throw new Error('Failed to get rooms for contact');
            }

            const rooms = roomsResponse.data?.rooms || [];
            setRoomsList(rooms);

            return rooms;

        } catch (error) {
            console.error('Error getting rooms for contact:', error);
            
            // Only show error toast for actual API failures, not for empty results
            // Check if this is a real error (network, server error) vs just no rooms found
            if (error.response && error.response.status >= 400) {
                toast.error('Failed to get rooms for contact', {
                    duration: 4000
                });
            }
            
            // For non-critical errors (like no rooms found), return empty array instead of throwing
            if (error.response && error.response.status === 200) {
                return [];
            }
            
            // Only throw for actual errors that need to be handled upstream
            if (!error.response || error.response.status >= 400) {
                throw error;
            }
            
            // For other cases, return empty array silently
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getAllRooms = async () => {
        try {
            setLoading(true);
            
            // Get all rooms for the current user from system database
            const roomsResponse = await getRoomsFromSystem();
            
            if (!roomsResponse.success) {
                throw new Error('Failed to get all rooms');
            }

            const rooms = roomsResponse.data?.rooms || [];
            setRoomsList(rooms);

            return rooms;

        } catch (error) {
            console.error('Error getting all rooms:', error);
            
            toast.error('Failed to get rooms list', {
                duration: 4000
            });
            
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const shareRoomLink = async (joinUrl, contactName, contactId, userId) => {
        try {
            setLoading(true);
            
            // Send webhook notification with join link, contactId, and userId
            await sendVideoRoomWebhook(joinUrl, contactId, userId);
            
            toast.success(`Video room link shared for ${contactName}!`, {
                duration: 3000,
                description: 'Join link has been sent via webhook'
            });

            console.log('Video room link shared successfully');

        } catch (error) {
            console.error('Error sharing video room link:', error);
            
            toast.error('Failed to share video room link', {
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
