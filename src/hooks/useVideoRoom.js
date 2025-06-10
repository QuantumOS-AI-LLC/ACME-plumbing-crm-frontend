import { useState } from 'react';
import { createVideoRoom, sendVideoRoomWebhook } from '../services/api';
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

    const clearRoomData = () => {
        setVideoRoomData(null);
    };

    return {
        loading,
        videoRoomData,
        createRoom,
        joinRoom,
        clearRoomData
    };
};

export default useVideoRoom;
