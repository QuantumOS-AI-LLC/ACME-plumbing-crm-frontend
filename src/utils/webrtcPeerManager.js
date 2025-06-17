/**
 * WebRTC Peer Manager
 * Handles peer-to-peer video connections between participants
 */

class WebRTCPeerManager {
    constructor(videoSocket, localStream) {
        this.videoSocket = videoSocket;
        this.localStream = localStream;
        this.peerConnections = new Map(); // participantId -> RTCPeerConnection
        this.remoteStreams = new Map(); // participantId -> MediaStream
        this.iceCandidateQueue = new Map(); // participantId -> ICE candidates array
        
        // WebRTC configuration with STUN servers
        this.rtcConfiguration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10
        };

        // Bind methods
        this.handleWebRTCOffer = this.handleWebRTCOffer.bind(this);
        this.handleWebRTCAnswer = this.handleWebRTCAnswer.bind(this);
        this.handleWebRTCIceCandidate = this.handleWebRTCIceCandidate.bind(this);
        
        // Set up socket event listeners
        this.setupSocketListeners();
        
        console.log('🔧 WebRTC Peer Manager initialized');
    }

    setupSocketListeners() {
        if (!this.videoSocket) return;

        this.videoSocket.on('webrtc-offer', this.handleWebRTCOffer);
        this.videoSocket.on('webrtc-answer', this.handleWebRTCAnswer);
        this.videoSocket.on('webrtc-ice-candidate', this.handleWebRTCIceCandidate);
        
        // Handle participant events
        this.videoSocket.on('participant-joined', (data) => {
            console.log('👤 New participant joined, creating peer connection:', data.participantId);
            this.createPeerConnection(data.participantId, data.socketId, true); // true = create offer
        });

        this.videoSocket.on('participant-left', (data) => {
            console.log('👋 Participant left, cleaning up connection:', data.participantId);
            this.removePeerConnection(data.participantId);
        });
    }

    async createPeerConnection(participantId, socketId, shouldCreateOffer = false) {
        try {
            console.log(`🔗 Creating peer connection for participant: ${participantId}`);
            
            // Create new RTCPeerConnection
            const peerConnection = new RTCPeerConnection(this.rtcConfiguration);
            
            // Add local stream tracks to peer connection
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, this.localStream);
                    console.log(`📡 Added ${track.kind} track to peer connection`);
                });
            }

            // Handle remote stream
            peerConnection.ontrack = (event) => {
                console.log(`📺 Received remote ${event.track.kind} track from ${participantId}`);
                const [remoteStream] = event.streams;
                this.remoteStreams.set(participantId, remoteStream);
                
                // Notify listeners about new remote stream
                this.onRemoteStreamAdded?.(participantId, remoteStream);
            };

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log(`🧊 Sending ICE candidate to ${participantId}`);
                    this.videoSocket.emit('webrtc-ice-candidate', {
                        targetSocketId: socketId,
                        candidate: event.candidate,
                        participantId: participantId
                    });
                }
            };

            // Handle connection state changes
            peerConnection.onconnectionstatechange = () => {
                console.log(`🔄 Connection state changed for ${participantId}: ${peerConnection.connectionState}`);
                this.onConnectionStateChange?.(participantId, peerConnection.connectionState);
                
                if (peerConnection.connectionState === 'failed') {
                    console.log(`❌ Connection failed for ${participantId}, attempting restart`);
                    this.restartIce(participantId);
                }
            };

            // Handle ICE connection state changes
            peerConnection.oniceconnectionstatechange = () => {
                console.log(`🧊 ICE connection state changed for ${participantId}: ${peerConnection.iceConnectionState}`);
            };

            // Store peer connection
            this.peerConnections.set(participantId, peerConnection);

            // Process any queued ICE candidates
            const queuedCandidates = this.iceCandidateQueue.get(participantId) || [];
            for (const candidate of queuedCandidates) {
                await peerConnection.addIceCandidate(candidate);
            }
            this.iceCandidateQueue.delete(participantId);

            // Create offer if this is the initiating peer
            if (shouldCreateOffer) {
                await this.createOffer(participantId, socketId);
            }

            return peerConnection;
        } catch (error) {
            console.error(`❌ Error creating peer connection for ${participantId}:`, error);
            throw error;
        }
    }

    async createOffer(participantId, socketId) {
        try {
            const peerConnection = this.peerConnections.get(participantId);
            if (!peerConnection) {
                throw new Error(`No peer connection found for ${participantId}`);
            }

            console.log(`📞 Creating offer for ${participantId}`);
            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            await peerConnection.setLocalDescription(offer);

            // Send offer via socket
            this.videoSocket.emit('webrtc-offer', {
                targetSocketId: socketId,
                offer: offer,
                participantId: participantId
            });

            console.log(`📤 Offer sent to ${participantId}`);
        } catch (error) {
            console.error(`❌ Error creating offer for ${participantId}:`, error);
            throw error;
        }
    }

    async handleWebRTCOffer(data) {
        try {
            const { offer, participantId, fromSocketId } = data;
            console.log(`📞 Received offer from ${participantId}`, data);

            // Create peer connection if it doesn't exist
            let peerConnection = this.peerConnections.get(participantId);
            if (!peerConnection) {
                peerConnection = await this.createPeerConnection(participantId, fromSocketId, false);
            }

            // Set remote description
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            // Create and send answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            this.videoSocket.emit('webrtc-answer', {
                targetSocketId: fromSocketId,
                answer: answer,
                participantId: participantId
            });

            console.log(`📤 Answer sent to ${participantId}`);
        } catch (error) {
            console.error('❌ Error handling WebRTC offer:', error);
        }
    }

    async handleWebRTCAnswer(data) {
        try {
            const { answer, participantId, fromSocketId } = data;
            console.log(`📞 Received answer from ${participantId}`, data);

            const peerConnection = this.peerConnections.get(participantId);
            if (!peerConnection) {
                console.error(`❌ No peer connection found for ${participantId}`);
                return;
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log(`✅ Remote description set for ${participantId}`);
        } catch (error) {
            console.error('❌ Error handling WebRTC answer:', error);
        }
    }

    async handleWebRTCIceCandidate(data) {
        try {
            const { candidate, participantId, fromSocketId } = data;
            console.log(`🧊 Received ICE candidate from ${participantId}`, data);

            const peerConnection = this.peerConnections.get(participantId);
            if (!peerConnection) {
                // Queue the candidate if peer connection doesn't exist yet
                if (!this.iceCandidateQueue.has(participantId)) {
                    this.iceCandidateQueue.set(participantId, []);
                }
                this.iceCandidateQueue.get(participantId).push(candidate);
                console.log(`📦 Queued ICE candidate for ${participantId}`);
                return;
            }

            if (peerConnection.remoteDescription) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log(`✅ ICE candidate added for ${participantId}`);
            } else {
                // Queue candidate if remote description not set yet
                if (!this.iceCandidateQueue.has(participantId)) {
                    this.iceCandidateQueue.set(participantId, []);
                }
                this.iceCandidateQueue.get(participantId).push(candidate);
                console.log(`📦 Queued ICE candidate for ${participantId} (no remote description)`);
            }
        } catch (error) {
            console.error('❌ Error handling ICE candidate:', error);
        }
    }

    async restartIce(participantId) {
        try {
            const peerConnection = this.peerConnections.get(participantId);
            if (!peerConnection) return;

            console.log(`🔄 Restarting ICE for ${participantId}`);
            await peerConnection.restartIce();
        } catch (error) {
            console.error(`❌ Error restarting ICE for ${participantId}:`, error);
        }
    }

    removePeerConnection(participantId) {
        const peerConnection = this.peerConnections.get(participantId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(participantId);
            console.log(`🗑️ Removed peer connection for ${participantId}`);
        }

        // Remove remote stream
        if (this.remoteStreams.has(participantId)) {
            this.remoteStreams.delete(participantId);
            this.onRemoteStreamRemoved?.(participantId);
            console.log(`🗑️ Removed remote stream for ${participantId}`);
        }

        // Clear queued ICE candidates
        this.iceCandidateQueue.delete(participantId);
    }

    updateLocalStream(newStream) {
        this.localStream = newStream;
        
        // Update all peer connections with new stream
        this.peerConnections.forEach((peerConnection, participantId) => {
            // Remove old tracks
            const senders = peerConnection.getSenders();
            senders.forEach(sender => {
                if (sender.track) {
                    peerConnection.removeTrack(sender);
                }
            });

            // Add new tracks
            if (newStream) {
                newStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, newStream);
                });
            }

            console.log(`🔄 Updated local stream for ${participantId}`);
        });
    }

    getConnectionStats(participantId) {
        const peerConnection = this.peerConnections.get(participantId);
        if (!peerConnection) return null;

        return {
            connectionState: peerConnection.connectionState,
            iceConnectionState: peerConnection.iceConnectionState,
            iceGatheringState: peerConnection.iceGatheringState
        };
    }

    getAllConnectionStats() {
        const stats = {};
        this.peerConnections.forEach((peerConnection, participantId) => {
            stats[participantId] = this.getConnectionStats(participantId);
        });
        return stats;
    }

    cleanup() {
        console.log('🧹 Cleaning up WebRTC Peer Manager');
        
        // Close all peer connections
        this.peerConnections.forEach((peerConnection, participantId) => {
            peerConnection.close();
        });
        
        // Clear all maps
        this.peerConnections.clear();
        this.remoteStreams.clear();
        this.iceCandidateQueue.clear();
        
        // Remove socket listeners
        if (this.videoSocket) {
            this.videoSocket.off('webrtc-offer', this.handleWebRTCOffer);
            this.videoSocket.off('webrtc-answer', this.handleWebRTCAnswer);
            this.videoSocket.off('webrtc-ice-candidate', this.handleWebRTCIceCandidate);
        }
    }

    // Callback setters
    setOnRemoteStreamAdded(callback) {
        this.onRemoteStreamAdded = callback;
    }

    setOnRemoteStreamRemoved(callback) {
        this.onRemoteStreamRemoved = callback;
    }

    setOnConnectionStateChange(callback) {
        this.onConnectionStateChange = callback;
    }
}

export default WebRTCPeerManager;
