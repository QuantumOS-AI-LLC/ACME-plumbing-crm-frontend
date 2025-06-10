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

            // Prepare webhook data
            const webhookData = {
                contactId: contactId,
                userId: userProfile.id,
                joinLink: roomData.joinUrl,
                roomId: roomData.roomId,
                contactName: contactName,
                userName: userProfile.name || userProfile.firstName || 'Unknown User',
                timestamp: new Date().toISOString(),
                event: 'video_room_created'
            };

            // Send webhook notification
            try {
                await sendVideoRoomWebhook(webhookData);
                console.log('Video room webhook sent successfully');
            } catch (webhookError) {
                console.warn('Failed to send webhook, but room was created:', webhookError);
                // Don't fail the entire operation if webhook fails
            }

            toast.success(`Video room created for ${contactName}!`, {
                duration: 4000,
                description: 'Join link has been sent via webhook'
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

            // Prepare webhook data
            const webhookData = {
                userId: userProfile.id,
                joinLink: roomData.joinUrl,
                roomId: roomData.roomId,
                contactName: contactName,
                userName: userProfile.name || userProfile.firstName || 'Unknown User',
                timestamp: new Date().toISOString(),
                event: 'video_room_updated',
                updateData: updateData
            };

            // Send webhook notification
            try {
                await sendVideoRoomWebhook(webhookData);
                console.log('Video room update webhook sent successfully');
            } catch (webhookError) {
                console.warn('Failed to send webhook, but room was updated:', webhookError);
            }

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

            // Prepare webhook data
            const webhookData = {
                userId: userProfile.id,
                roomId: roomId,
                contactName: contactName,
                userName: userProfile.name || userProfile.firstName || 'Unknown User',
                timestamp: new Date().toISOString(),
                event: 'video_room_deleted'
            };

            // Send webhook notification
            try {
                await sendVideoRoomWebhook(webhookData);
                console.log('Video room deletion webhook sent successfully');
            } catch (webhookError) {
                console.warn('Failed to send webhook, but room was deleted:', webhookError);
            }

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
        clearRoomData
    };
};

export default useVideoRoom;
