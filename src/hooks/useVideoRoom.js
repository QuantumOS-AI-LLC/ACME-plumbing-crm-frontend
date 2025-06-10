import { useState } from 'react';
import { createVideoRoom, updateVideoRoom, deleteVideoRoom, getVideoRoom, refreshClientToken, sendVideoRoomWebhook } from '../services/api';
import { toast } from 'sonner';

export const useVideoRoom = () => {
    const [loading, setLoading] = useState(false);
    const [videoRoomData, setVideoRoomData] = useState(null);

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

            // Create video room via Telnyx API
            const roomResponse = await createVideoRoom(contactId);
            
            if (!roomResponse.success || !roomResponse.data) {
                throw new Error('Failed to create video room');
            }

            const roomData = roomResponse.data;
            setVideoRoomData(roomData);

            toast.success(`Video room created for ${contactName}!`, {
                duration: 4000,
                description: 'Video room is ready to use'
            });

            return roomData;

        } catch (error) {
            console.error('Error creating video room:', error);
            
            let errorMessage = 'Failed to create video room';
            if (error.message.includes('credentials not configured')) {
                errorMessage = 'Telnyx API credentials not configured';
            } else if (error.message.includes('User not authenticated')) {
                errorMessage = 'Please log in to create video rooms';
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

    const updateRoom = async (roomId, updateData, contactName) => {
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

            // Update video room via Telnyx API
            const roomResponse = await updateVideoRoom(roomId, updateData);
            
            if (!roomResponse.success || !roomResponse.data) {
                throw new Error('Failed to update video room');
            }

            const roomData = roomResponse.data;
            setVideoRoomData(roomData);

            toast.success(`Video room updated for ${contactName}!`, {
                duration: 3000,
                description: 'Room settings have been updated'
            });

            return roomData;

        } catch (error) {
            console.error('Error updating video room:', error);
            
            let errorMessage = 'Failed to update video room';
            if (error.message.includes('credentials not configured')) {
                errorMessage = 'Telnyx API credentials not configured';
            } else if (error.message.includes('User not authenticated')) {
                errorMessage = 'Please log in to update video rooms';
            }
            
            toast.error(errorMessage, {
                duration: 4000
            });
            
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteRoom = async (roomId, contactName) => {
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

            // Delete video room via Telnyx API
            const deleteResponse = await deleteVideoRoom(roomId);
            
            if (!deleteResponse.success) {
                throw new Error('Failed to delete video room');
            }

            // Clear room data from state
            setVideoRoomData(null);

            toast.success(`Video room deleted for ${contactName}!`, {
                duration: 3000,
                description: 'Room has been permanently removed'
            });

            return deleteResponse;

        } catch (error) {
            console.error('Error deleting video room:', error);
            
            let errorMessage = 'Failed to delete video room';
            if (error.message.includes('credentials not configured')) {
                errorMessage = 'Telnyx API credentials not configured';
            } else if (error.message.includes('User not authenticated')) {
                errorMessage = 'Please log in to delete video rooms';
            }
            
            toast.error(errorMessage, {
                duration: 4000
            });
            
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getRoomDetails = async (roomId) => {
        try {
            setLoading(true);
            
            // Get video room details via Telnyx API
            const roomResponse = await getVideoRoom(roomId);
            
            if (!roomResponse.success || !roomResponse.data) {
                throw new Error('Failed to get video room details');
            }

            const roomData = roomResponse.data;
            setVideoRoomData(roomData);

            return roomData;

        } catch (error) {
            console.error('Error getting video room details:', error);
            
            let errorMessage = 'Failed to get video room details';
            if (error.message.includes('credentials not configured')) {
                errorMessage = 'Telnyx API credentials not configured';
            }
            
            toast.error(errorMessage, {
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
        createRoom,
        updateRoom,
        deleteRoom,
        getRoomDetails,
        joinRoom,
        shareRoomLink,
        clearRoomData
    };
};

export default useVideoRoom;
