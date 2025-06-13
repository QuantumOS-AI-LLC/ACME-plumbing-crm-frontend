// ... (Previous imports remain unchanged)
import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    Avatar,
    Chip,
    List,
    ListItem,
    ListItemText,
    Divider,
    Button,
    IconButton,
    CircularProgress,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import EditIcon from "@mui/icons-material/Edit";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import { v4 as uuidv4 } from 'uuid';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { fetchContact, updateContact } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import { toast } from "sonner";
import { useWebhook } from "../hooks/webHook";
import { useVideoRoom } from "../hooks/useVideoRoom";

const ContactDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contact, setContact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        status: "",
        tags: [],
    });
    const [updating, setUpdating] = useState(false);
    const handleAIAssistant = () => {
        const conversationId = uuidv4();
        navigate(`/ai-assistant?contactId=${id}&contactName=${contact.name}&conversationId=${conversationId}`);
    };
    const { sendWebhook } = useWebhook();
    const { 
        loading: videoRoomLoading, 
        videoRoomData, 
        roomsList,
        createRoom, 
        updateRoom, 
        deleteRoom, 
        getRoomsForContact,
        joinRoom, 
        shareRoomLink, 
        clearRoomData 
    } = useVideoRoom();
    const [openVideoRoomDialog, setOpenVideoRoomDialog] = useState(false);
    const [videoRoomSettings, setVideoRoomSettings] = useState({
        maxParticipants: 10,
        enableRecording: false
    });
    const [existingRooms, setExistingRooms] = useState([]);
    const [selectedRoomForUpdate, setSelectedRoomForUpdate] = useState(null);
    
    // Define pipeline stage options
    const pipelineStageOptions = [
        { value: "new_lead", label: "New Lead" },
        { value: "estimate", label: "Estimate" },
        { value: "appointment_made", label: "Appointment Made" },
        { value: "job_started", label: "Job Started" },
        { value: "job_completed", label: "Job Completed" },
        { value: "won", label: "Won" },
    ];

    const loadExistingRooms = useCallback(async () => {
        try {
            const rooms = await getRoomsForContact(id);
            setExistingRooms(rooms);
            console.log('Existing rooms for contact:', rooms);
        } catch (error) {
            console.error('Error loading existing rooms:', error);
            // Don't show error toast for this, as it's not critical
        }
    }, [id, getRoomsForContact]); // Add dependencies


    useEffect(() => {
        const loadContactDetails = async () => {
            try {
                setLoading(true);
                const response = await fetchContact(id);
                if (response && response.data) {
                    console.log(
                        "ContactDetailsPage: Loaded contact",
                        response.data
                    );
                    setContact(response.data);
                    setEditFormData({
                        name: response.data.name || "",
                        email: response.data.email || "",
                        phone: response.data.phoneNumber || "",
                        address: response.data.address || "",
                        status: response.data.status || "client",
                        tags: response.data.tags || [],
                    });
                }
            } catch (error) {
                console.error(`Error loading contact ${id}:`, error);
                setError("Failed to load contact details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        loadContactDetails();
        loadExistingRooms();
    }, [id, loadExistingRooms]); // Add loadExistingRooms as a dependency

    const getInitials = (name) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    const handleEdit = () => {
        setOpenEditDialog(true);
    };

    const handleCloseEdit = () => {
        setOpenEditDialog(false);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleTagInput = (e) => {
        if (e.key === "Enter" && e.target.value.trim() !== "") {
            const newTag = e.target.value.trim();
            if (!editFormData.tags.includes(newTag)) {
                setEditFormData((prev) => ({
                    ...prev,
                    tags: [...prev.tags, newTag],
                }));
            }
            e.target.value = "";
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setEditFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((tag) => tag !== tagToRemove),
        }));
    };

    const handleSaveContact = async () => {
        try {
            setUpdating(true);
            const contactDataToSubmit = {
                name: editFormData.name.trim(),
                email: editFormData.email.trim() || null,
                phoneNumber: editFormData.phone.trim() || null,
                address: editFormData.address.trim() || null,
                status: editFormData.status || "client",
                tags: editFormData.tags,
            };
            console.log(
                "ContactDetailsPage: Submitting contact data",
                contactDataToSubmit
            );
            const response = await updateContact(id, contactDataToSubmit);
            const webHookData = {
                webhookEvent: "ContactUpdated",
                createdBy: contact.createdBy,
                ...contactDataToSubmit,
                contactId: response.data.id,
            };
            await sendWebhook({ payload: webHookData });
            if (response && response.data) {
                console.log(
                    "ContactDetailsPage: Updated contact",
                    response.data
                );
                setContact(response.data);
                setOpenEditDialog(false);
                toast.success("Contact updated successfully!", {
                    duration: 2000,
                });
            }
        } catch (error) {
            console.error("Error updating contact:", error);
            toast.error("Failed to update contact. Please try again.", {
                duration: 2000,
            });
        } finally {
            setUpdating(false);
        }
    };

    const handlePipelineStageChange = async (event) => {
        const newStage = event.target.value;
        try {
            setUpdating(true);
            const response = await updateContact(id, {
                pipelineStage: newStage,
            });
            if (response && response.data) {
                console.log(
                    "ContactDetailsPage: Updated pipeline stage",
                    response.data
                );
                setContact(response.data);
                toast.success("Pipeline stage updated successfully!", {
                    duration: 2000,
                });
            }
        } catch (error) {
            console.error("Error updating pipeline stage:", error);
            toast.error("Failed to update pipeline stage. Please try again.", {
                duration: 2000,
            });
        } finally {
            setUpdating(false);
        }
    };

    const handleCall = () => {
        if (contact?.phoneNumber) {
            window.location.href = `tel:${contact.phoneNumber}`;
        }
    };

    const handleEmail = () => {
        if (contact?.email) {
            window.location.href = `mailto:${contact.email}`;
        }
    };

    const handleBack = () => {
        navigate("/contacts");
    };

    const handleVideoRoom = async () => {
        try {
            const roomData = await createRoom(id, contact.name);
            console.log('Video room created:', roomData);
            // Refresh the list of existing rooms after a new one is created
            await loadExistingRooms();
        } catch (error) {
            console.error('Failed to create video room:', error);
        }
    };

    const handleJoinVideoRoom = () => {
        if (videoRoomData?.joinUrl) {
            joinRoom(videoRoomData.joinUrl);
        }
    };

    const handleDeleteVideoRoom = async (systemIdToDelete, telnyxRoomIdToDelete) => {
        // Use the passed IDs, or fallback to videoRoomData if not provided (e.g., for the "current" room)
        const targetSystemId = systemIdToDelete || videoRoomData?.systemId;
        const targetTelnyxRoomId = telnyxRoomIdToDelete || videoRoomData?.roomId;

        if (!targetSystemId || !targetTelnyxRoomId) {
            console.error('Missing required room IDs for deletion');
            return;
        }
        
        try {
            await deleteRoom(targetSystemId, targetTelnyxRoomId, contact.name);
            console.log('Video room deleted successfully');
            // Reload existing rooms after deletion
            await loadExistingRooms(); // Call the helper function
        } catch (error) {
            console.error('Failed to delete video room:', error);
        }
    };

    const handleUpdateVideoRoom = async () => {
        // Handle both newly created rooms and existing rooms
        const roomToUpdate = selectedRoomForUpdate || videoRoomData;
        
        // Check for the correct property names based on room source
        const systemId = roomToUpdate?.id || roomToUpdate?.systemId;
        const telnyxRoomId = roomToUpdate?.telnyxRoomId || roomToUpdate?.roomId;
        
        if (!systemId || !telnyxRoomId) {
            console.error('Missing required room IDs for update');
            return;
        }
        
        try {
            const updateData = {
                max_participants: videoRoomSettings.maxParticipants,
                enable_recording: videoRoomSettings.enableRecording
            };
            
            await updateRoom(systemId, telnyxRoomId, updateData, contact.name);
            setOpenVideoRoomDialog(false);
            setSelectedRoomForUpdate(null);
            
            // Reload existing rooms to show updated data
            const rooms = await getRoomsForContact(id);
            setExistingRooms(rooms);
        } catch (error) {
            console.error('Failed to update video room:', error);
        }
    };

    const handleOpenVideoRoomSettings = (room = null) => {
        if (room) {
            // Opening settings for an existing room
            setSelectedRoomForUpdate(room);
            setVideoRoomSettings({
                maxParticipants: room.maxParticipants || 2,
                enableRecording: room.enableRecording || false
            });
        } else if (videoRoomData) {
            // Opening settings for newly created room
            setSelectedRoomForUpdate(null);
            setVideoRoomSettings({
                maxParticipants: videoRoomData.maxParticipants || 2,
                enableRecording: videoRoomData.enableRecording || false
            });
        } else {
            console.error('No room data available for settings');
            return;
        }
        setOpenVideoRoomDialog(true);
    };

    const handleCloseVideoRoomDialog = () => {
        setOpenVideoRoomDialog(false);
    };

    const handleVideoRoomSettingsChange = (e) => {
        const { name, value, type, checked } = e.target;
        setVideoRoomSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleShareVideoRoomLink = async () => {
        if (!videoRoomData?.joinUrl) return;
        
        try {
            // Get current user data
            const userProfile = JSON.parse(
                localStorage.getItem('userProfile') || 
                sessionStorage.getItem('userProfile') || 
                '{}'
            );
            
            await shareRoomLink(videoRoomData.joinUrl, contact.name, contact.id, userProfile.id);
            console.log('Video room link shared successfully');
        } catch (error) {
            console.error('Failed to share video room link:', error);
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 400,
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error || !contact) {
        return (
            <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography color="error">
                    {error || "Contact not found"}
                </Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={handleBack}
                >
                    Back to Contacts
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader title="Contact Details" showBackButton={true} />

            <Paper sx={{ p: { xs: 1.5, sm: 3 }, mb: 3 }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: { xs: 3, sm: 3 },
                        justifyContent: "space-between",
                        alignItems: { xs: "stretch", sm: "flex-start" },
                        mb: 3,
                    }}
                >
                    <Box sx={{ 
                        display: "flex", 
                        flexDirection: { xs: "row", sm: "row" },
                        alignItems: { xs: "flex-start", sm: "flex-start" },
                        textAlign: { xs: "left", sm: "left" },
                        width: { xs: "100%", sm: "auto" },
                        gap: { xs: 2, sm: 2 }
                    }}>
                        <Avatar
                            sx={{
                                bgcolor: "primary.main",
                                width: { xs: 56, sm: 52 },
                                height: { xs: 56, sm: 52 },
                                fontSize: { xs: "1.4rem", sm: "1.25rem" },
                                flexShrink: 0
                            }}
                        >
                            {getInitials(contact.name)}
                        </Avatar>
                        <Box sx={{ width: "100%", minWidth: 0 }}>
                            <Typography 
                                variant="h5" 
                                sx={{ 
                                    fontSize: { xs: "1.4rem", sm: "2rem" },
                                    mb: { xs: 0.5, sm: 0 },
                                    fontWeight: 600,
                                    lineHeight: 1.2
                                }}
                            >
                                {contact.name}
                            </Typography>
                            <Typography
                                variant="subtitle1"
                                color="text.secondary"
                                sx={{ 
                                    fontSize: { xs: "0.875rem", sm: "1rem" },
                                    mb: { xs: 1.5, sm: 0 },
                                    fontWeight: 500
                                }}
                            >
                                {contact.status === "client"
                                    ? "Client"
                                    : contact.status === "lead"
                                        ? "Lead"
                                        : contact.status === "former_client"
                                            ? "Former Client"
                                            : "Contact"}
                            </Typography>
                            {contact.tags && contact.tags.length > 0 && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 0.5,
                                        mt: { xs: 0, sm: 1 },
                                        justifyContent: { xs: "flex-start", sm: "flex-start" }
                                    }}
                                >
                                    {contact.tags.map((tag, index) => (
                                        <Chip
                                            key={index}
                                            label={tag}
                                            size="small"
                                            color="primary"
                                            sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box>
                    <Box sx={{
                        display: "flex",
                        flexDirection: { xs: "row", sm: "row" },
                        flexWrap: { xs: "wrap", sm: "nowrap" },
                        gap: { xs: 1, sm: 1 },
                        width: { xs: "100%", sm: "auto" },
                        mt: { xs: 1, sm: 0 },
                        "& > *": {
                            flex: { xs: "1 1 calc(50% - 4px)", sm: "0 0 auto" }
                        }
                    }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleAIAssistant}
                            size="medium"
                            sx={{ 
                                minWidth: { sm: "auto" },
                                fontSize: { xs: "0.875rem", sm: "0.875rem" },
                                width: { xs: "100%", sm: "auto" }
                            }}
                        >
                            Text
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<EditIcon />}
                            onClick={handleEdit}
                            size="medium"
                            sx={{ 
                                minWidth: { sm: "auto" },
                                fontSize: { xs: "0.875rem", sm: "0.875rem" },
                                width: { xs: "100%", sm: "auto" }
                            }}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<PhoneIcon />}
                            onClick={handleCall}
                            disabled={!contact.phoneNumber}
                            size="medium"
                            sx={{ 
                                minWidth: { sm: "auto" },
                                fontSize: { xs: "0.875rem", sm: "0.875rem" },
                                width: { xs: "100%", sm: "auto" }
                            }}
                        >
                            Call
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<VideoCallIcon />}
                            onClick={handleVideoRoom}
                            disabled={videoRoomLoading}
                            size="medium"
                            sx={{ 
                                minWidth: { sm: "auto" },
                                fontSize: { xs: "0.875rem", sm: "0.875rem" },
                                width: { xs: "100%", sm: "auto" }
                            }}
                        >
                            {videoRoomLoading ? "Creating..." : "Video Room"}
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<EmailIcon />}
                            onClick={handleEmail}
                            disabled={!contact.email}
                            size="medium"
                            sx={{ 
                                minWidth: { sm: "auto" },
                                fontSize: { xs: "0.875rem", sm: "0.875rem" },
                                width: { xs: "100%", sm: "auto" }
                            }}
                        >
                            Email
                        </Button>
                    </Box>
                </Box>

                {/* Video Room Section */}
                {videoRoomData && (
                    <Box
                        sx={{
                            mb: 3,
                            p: 2,
                            backgroundColor: "success.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "success.main"
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                            <Box
                                sx={{
                                    p: 0.5,
                                    borderRadius: "50%",
                                    backgroundColor: "success.main",
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 28,
                                    height: 28
                                }}
                            >
                                <VideoCallIcon sx={{ fontSize: 16 }} />
                            </Box>
                            <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                    color: "success.dark",
                                    fontWeight: 600
                                }}
                            >
                                Video Room Created Successfully!
                            </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    fontWeight: 600,
                                    color: "text.primary"
                                }}
                            >
                                {videoRoomData.uniqueName}
                            </Typography>
                            <Chip 
                                label={`${videoRoomData.maxParticipants || 10} max`} 
                                size="small" 
                                color="success" 
                                variant="filled"
                                sx={{ fontSize: "0.7rem", height: 20 }}
                            />
                            <Chip 
                                label="New" 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                                sx={{ fontSize: "0.7rem", height: 20 }}
                            />
                        </Box>
                        
                        <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ mb: 1.5, fontSize: "0.875rem" }}
                        >
                            Ready for {contact.name}. Join now or share the link.
                        </Typography>

                        <Box sx={{ 
                            display: "flex", 
                            gap: { xs: 0.5, sm: 1 }, 
                            alignItems: "center", 
                            flexWrap: "wrap",
                            flexDirection: { xs: "column", sm: "row" },
                            width: { xs: "100%", sm: "auto" }
                        }}>
                            <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={handleJoinVideoRoom}
                                startIcon={<VideoCallIcon />}
                                sx={{
                                    fontWeight: 600,
                                    px: { xs: 2, sm: 2 },
                                    borderRadius: 1.5,
                                    fontSize: { xs: "0.8rem", sm: "0.75rem" },
                                    width: { xs: "100%", sm: "auto" }
                                }}
                            >
                                Join Now
                            </Button>
                            <Button
                                variant="contained"
                                color="info"
                                size="small"
                                onClick={handleShareVideoRoomLink}
                                disabled={videoRoomLoading}
                                sx={{
                                    fontWeight: 500,
                                    px: { xs: 2, sm: 1.5 },
                                    borderRadius: 1.5,
                                    fontSize: { xs: "0.8rem", sm: "0.75rem" },
                                    width: { xs: "100%", sm: "auto" }
                                }}
                            >
                                Share
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={() => handleOpenVideoRoomSettings()}
                                startIcon={<SettingsIcon />}
                                disabled={videoRoomLoading}
                                sx={{
                                    fontWeight: 500,
                                    px: { xs: 2, sm: 1.5 },
                                    borderRadius: 1.5,
                                    fontSize: { xs: "0.8rem", sm: "0.75rem" },
                                    width: { xs: "100%", sm: "auto" }
                                }}
                            >
                                Settings
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={handleDeleteVideoRoom}
                                startIcon={<DeleteIcon />}
                                disabled={videoRoomLoading}
                                sx={{
                                    fontWeight: 500,
                                    px: { xs: 2, sm: 1.5 },
                                    borderRadius: 1.5,
                                    fontSize: { xs: "0.8rem", sm: "0.75rem" },
                                    width: { xs: "100%", sm: "auto" }
                                }}
                            >
                                Delete
                            </Button>
                            <Button
                                variant="text"
                                color="success"
                                size="small"
                                onClick={clearRoomData}
                                sx={{
                                    fontWeight: 500,
                                    px: { xs: 2, sm: 1.5 },
                                    borderRadius: 1.5,
                                    fontSize: { xs: "0.8rem", sm: "0.75rem" },
                                    width: { xs: "100%", sm: "auto" }
                                }}
                            >
                                Dismiss
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* Existing Video Rooms Section */}
                {existingRooms && existingRooms.length > 0 && (
                    <Box
                        sx={{
                            mb: 3,
                            p: 2,
                            backgroundColor: "grey.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.200"
                        }}
                    >
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                mb: 2, 
                                color: "text.primary",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                fontSize: "1.1rem"
                            }}
                        >
                            <VideoCallIcon color="primary" sx={{ fontSize: 22 }} />
                            Video Rooms ({existingRooms.length})
                        </Typography>
                        
                        {existingRooms.map((room, index) => (
                            <Paper
                                key={room.id}
                                elevation={1}
                                sx={{
                                    p: 2,
                                    mb: index < existingRooms.length - 1 ? 1.5 : 0,
                                    borderRadius: 2,
                                    border: "1px solid",
                                    borderColor: "grey.200",
                                    backgroundColor: "white",
                                    transition: "all 0.2s ease-in-out",
                                    "&:hover": {
                                        elevation: 2,
                                        borderColor: "primary.light",
                                        transform: "translateY(-1px)"
                                    }
                                }}
                            >
                                <Box sx={{ 
                                    display: "flex", 
                                    flexDirection: { xs: "column", sm: "row" },
                                    justifyContent: "space-between", 
                                    alignItems: { xs: "stretch", sm: "flex-start" },
                                    gap: { xs: 2, sm: 0 }
                                }}>
                                    <Box sx={{ flex: 1, mr: { xs: 0, sm: 2 } }}>
                                        <Box sx={{ 
                                            display: "flex", 
                                            alignItems: "center", 
                                            gap: { xs: 1, sm: 1.5 }, 
                                            mb: 1,
                                            flexWrap: "wrap"
                                        }}>
                                            <Box
                                                sx={{
                                                    p: 0.5,
                                                    borderRadius: "50%",
                                                    backgroundColor: "primary.main",
                                                    color: "white",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: 24,
                                                    height: 24
                                                }}
                                            >
                                                <VideoCallIcon sx={{ fontSize: 14 }} />
                                            </Box>
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    fontWeight: 600,
                                                    color: "text.primary",
                                                    fontSize: { xs: "1rem", sm: "1.1rem" }
                                                }}
                                            >
                                                {room.uniqueName}
                                            </Typography>
                                            <Chip 
                                                label={`${room.maxParticipants} participants`} 
                                                size="small" 
                                                color="primary" 
                                                variant="filled"
                                                sx={{ 
                                                    fontSize: { xs: "0.7rem", sm: "0.75rem" }, 
                                                    height: { xs: 20, sm: 22 },
                                                    fontWeight: 500
                                                }}
                                            />
                                        </Box>
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary"
                                            sx={{ 
                                                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                                fontWeight: 500,
                                                ml: { xs: 0, sm: 4 }
                                            }}
                                        >
                                            Created {new Date(room.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })} at {new Date(room.createdAt).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ 
                                        display: "flex", 
                                        gap: { xs: 0.5, sm: 1 }, 
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        flexDirection: { xs: "column", sm: "row" },
                                        width: { xs: "100%", sm: "auto" }
                                    }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            onClick={() => joinRoom(room.joinUrl)}
                                            startIcon={<VideoCallIcon />}
                                            sx={{ 
                                                px: { xs: 2, sm: 2 }, 
                                                py: 0.75,
                                                fontSize: { xs: "0.8rem", sm: "0.8rem" },
                                                fontWeight: 600,
                                                borderRadius: 1.5,
                                                boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
                                                width: { xs: "100%", sm: "auto" }
                                            }}
                                        >
                                            Join
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="info"
                                            size="small"
                                            onClick={() => handleShareVideoRoomLink()}
                                            disabled={videoRoomLoading}
                                            sx={{ 
                                                px: { xs: 2, sm: 1.5 }, 
                                                py: 0.75,
                                                fontSize: { xs: "0.8rem", sm: "0.8rem" },
                                                fontWeight: 500,
                                                borderRadius: 1.5,
                                                width: { xs: "100%", sm: "auto" }
                                            }}
                                        >
                                            Share
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            size="small"
                                            onClick={() => handleOpenVideoRoomSettings(room)}
                                            startIcon={<SettingsIcon />}
                                            disabled={videoRoomLoading}
                                            sx={{ 
                                                px: { xs: 2, sm: 1.5 }, 
                                                py: 0.75,
                                                fontSize: { xs: "0.8rem", sm: "0.8rem" },
                                                fontWeight: 500,
                                                borderRadius: 1.5,
                                                width: { xs: "100%", sm: "auto" }
                                            }}
                                        >
                                            Settings
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            onClick={async () => {
                                                if (room.id && room.telnyxRoomId) {
                                                    await deleteRoom(room.id, room.telnyxRoomId, contact.name);
                                                    await loadExistingRooms(); // Refresh the list after deletion
                                                }
                                            }}
                                            startIcon={<DeleteIcon />}
                                            disabled={videoRoomLoading}
                                            sx={{ 
                                                px: { xs: 2, sm: 1.5 }, 
                                                py: 0.75,
                                                fontSize: { xs: "0.8rem", sm: "0.8rem" },
                                                fontWeight: 500,
                                                borderRadius: 1.5,
                                                width: { xs: "100%", sm: "auto" }
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </Box>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            Contact Information
                        </Typography>
                        <Box sx={{ mb: 3 }}>
                            <Grid container spacing={2}>
                                {contact.phoneNumber && (
                                    <Grid item xs={12}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Phone Number
                                        </Typography>
                                        <Typography variant="body1">
                                            {contact.phoneNumber}
                                        </Typography>
                                    </Grid>
                                )}
                                {contact.email && (
                                    <Grid item xs={12}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Email
                                        </Typography>
                                        <Typography variant="body1">
                                            {contact.email}
                                        </Typography>
                                    </Grid>
                                )}
                                {contact.address && (
                                    <Grid item xs={12}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Address
                                        </Typography>
                                        <Typography variant="body1">
                                            {contact.address}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Box
                            sx={{
                                mb: 3,
                                p: 2.5,
                                borderRadius: 2,
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{ mb: 1.5, textTransform: "uppercase" }}
                            >
                                Pipeline Stage
                            </Typography>
                            <TextField
                                select
                                SelectProps={{ native: true }}
                                value={contact.pipelineStage || "new_lead"}
                                onChange={handlePipelineStageChange}
                                fullWidth
                                size="medium"
                                disabled={updating}
                                sx={{
                                    mb: 1,
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        backgroundColor: "white",
                                        "&:hover .MuiOutlinedInput-notchedOutline":
                                        {
                                            borderColor: "primary.dark",
                                        },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                        {
                                            borderColor: "primary.main",
                                            borderWidth: 3,
                                        },
                                        "&.Mui-disabled": {
                                            backgroundColor: "grey.200",
                                        },
                                    },
                                }}
                            >
                                {pipelineStageOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </TextField>
                        </Box>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Recent Jobs List
                        </Typography>
                        <Box sx={{ mb: 3 }}>
                            {contact.jobs && contact.jobs.length > 0 ? (
                                <List disablePadding>
                                    {contact.jobs.map((job, index) => (
                                        <React.Fragment key={job.id}>
                                            <ListItem sx={{ px: 0 }}>
                                                <ListItemText
                                                    primary={job.name}
                                                    secondary={`Status: ${job.status
                                                        } • Amount: $${job.amount?.toLocaleString() ||
                                                        "N/A"
                                                        }`}
                                                />
                                            </ListItem>
                                            {index <
                                                contact.jobs.length - 1 && (
                                                    <Divider />
                                                )}
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No recent jobs found.
                                </Typography>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Communication History
                </Typography>
                {contact.communications && contact.communications.length > 0 ? (
                    <List disablePadding>
                        {contact.communications.map((comm, index) => (
                            <React.Fragment key={index}>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemText
                                        primary={comm.type}
                                        secondary={
                                            <React.Fragment>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {comm.date}
                                                </Typography>
                                                <Typography
                                                    component="div"
                                                    variant="body2"
                                                >
                                                    {comm.description}
                                                </Typography>
                                            </React.Fragment>
                                        }
                                    />
                                </ListItem>
                                {index < contact.communications.length - 1 && (
                                    <Divider />
                                )}
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No communication history found.
                    </Typography>
                )}
            </Paper>

            {/* Edit Contact Dialog */}
            <Dialog
                open={openEditDialog}
                onClose={handleCloseEdit}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Edit Contact</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Full Name"
                                name="name"
                                value={editFormData.name}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Status"
                                name="status"
                                select
                                SelectProps={{
                                    native: true,
                                }}
                                value={editFormData.status}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                            >
                                <option value="lead">Lead</option>
                                <option value="client">Client</option>
                                <option value="former_client">
                                    Former Client
                                </option>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Email"
                                name="email"
                                type="email"
                                value={editFormData.email}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Phone"
                                name="phone"
                                value={editFormData.phone}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Address"
                                name="address"
                                value={editFormData.address}
                                onChange={handleFormChange}
                                fullWidth
                                multiline
                                rows={2}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Tags
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 1,
                                    mb: 1,
                                }}
                            >
                                {editFormData.tags.map((tag, index) => (
                                    <Chip
                                        key={index}
                                        label={tag}
                                        onDelete={() => handleRemoveTag(tag)}
                                        size="small"
                                        color="primary"
                                    />
                                ))}
                            </Box>
                            <TextField
                                placeholder="Type and press Enter to add tags"
                                onKeyPress={handleTagInput}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEdit}>Cancel</Button>
                    <Button
                        onClick={handleSaveContact}
                        color="primary"
                        variant="contained"
                        disabled={updating}
                    >
                        {updating ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Video Room Settings Dialog */}
            <Dialog
                open={openVideoRoomDialog}
                onClose={handleCloseVideoRoomDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Video Room Settings</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                label="Max Participants"
                                name="maxParticipants"
                                type="number"
                                value={videoRoomSettings.maxParticipants}
                                onChange={handleVideoRoomSettingsChange}
                                fullWidth
                                margin="normal"
                                inputProps={{ min: 2, max: 50 }}
                                helperText="Maximum number of participants (2-50)"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                <input
                                    type="checkbox"
                                    id="enableRecording"
                                    name="enableRecording"
                                    checked={videoRoomSettings.enableRecording}
                                    onChange={handleVideoRoomSettingsChange}
                                    style={{ marginRight: '8px' }}
                                />
                                <label htmlFor="enableRecording">
                                    <Typography variant="body1">
                                        Enable Recording
                                    </Typography>
                                </label>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Allow recording of the video room session
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseVideoRoomDialog}>Cancel</Button>
                    <Button
                        onClick={() => handleUpdateVideoRoom()}
                        color="primary"
                        variant="contained"
                        disabled={videoRoomLoading}
                    >
                        {videoRoomLoading ? "Updating..." : "Update Room"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ContactDetailsPage;
