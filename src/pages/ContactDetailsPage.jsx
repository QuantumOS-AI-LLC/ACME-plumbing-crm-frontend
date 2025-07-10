// ... (Previous imports remain unchanged)
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
    CircularProgress,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import EditIcon from "@mui/icons-material/Edit";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuidv4 } from "uuid";
import {
    fetchContact,
    updateContact,
    fetchJobsByContact,
} from "../services/api";
import PageHeader from "../components/common/PageHeader";
import { toast } from "sonner";
import { useWebhook } from "../hooks/webHook";
import { useVideoRoom } from "../hooks/useVideoRoom";
import CallDurationSelector from "../components/video/CallDurationSelector";
import SimpleJobList from "../components/jobs/SimpleJobList";

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
        navigate(
            `/ai-assistant?contactId=${id}&contactName=${contact.name}&conversationId=${conversationId}`
        );
    };
    const { sendWebhook } = useWebhook();
    const {
        loading: videoRoomLoading,
        videoRoomData,

        createRoom,
        updateRoom,
        deleteRoom,
        getRoomsForContact,
        joinRoom,
        shareRoomLink,
        clearRoomData,
    } = useVideoRoom();
    const [openVideoRoomDialog, setOpenVideoRoomDialog] = useState(false);
    const [videoRoomSettings, setVideoRoomSettings] = useState({
        maxParticipants: 10,
        enableRecording: false,
    });
    const [existingRooms, setExistingRooms] = useState([]);
    const [selectedRoomForUpdate, setSelectedRoomForUpdate] = useState(null);
    const [openDurationSelector, setOpenDurationSelector] = useState(false);

    // Job history state
    const [jobs, setJobs] = useState([]);
    const [activeJobTab, setActiveJobTab] = useState("open");
    const [jobsLoading, setJobsLoading] = useState(false);
    const [jobsError, setJobsError] = useState(null);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 5,
        pages: 1,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const [contactInfo, setContactInfo] = useState(null);
    const [allJobCounts, setAllJobCounts] = useState({
        total: 0,
        open: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
    });

    // Define pipeline stage options
    const pipelineStageOptions = [
        { value: "new_lead", label: "New Lead" },
        { value: "estimate", label: "Estimate" },
        { value: "appointment_made", label: "Appointment Made" },
        { value: "job_started", label: "Job Started" },
        { value: "job_completed", label: "Job Completed" },
        { value: "won", label: "Won" },
    ];

    // Helper functions for job filtering and counting
    const filterJobsByStatus = (jobs, status) => {
        if (!jobs || jobs.length === 0) return [];

        switch (status) {
            case "open":
                return jobs.filter((job) => job.status === "open");
            case "in_progress":
                return jobs.filter((job) => job.status === "in_progress");
            case "completed":
                return jobs.filter((job) => job.status === "completed");
            case "cancelled":
                return jobs.filter((job) => job.status === "cancelled");
            default:
                return jobs;
        }
    };

    // Job-related computed values
    const filteredJobs = useMemo(() => {
        return filterJobsByStatus(jobs, activeJobTab);
    }, [jobs, activeJobTab]);

    // Show only 5 jobs initially
    const displayedJobs = filteredJobs.slice(0, 5);
    const hasMoreJobs = filteredJobs.length > 5;

    // Job handlers
    const handleJobTabChange = (event, newValue) => {
        setActiveJobTab(newValue);
        // Don't auto-reload jobs, just filter existing jobs
    };

    const handleViewAllJobs = () => {
        navigate(`/jobs/contact/${id}`);
    };

    // Load all job counts for tabs
    const loadAllJobCounts = useCallback(async () => {
        try {
            const statuses = ["open", "in_progress", "completed", "cancelled"];
            const counts = {
                total: 0,
                open: 0,
                in_progress: 0,
                completed: 0,
                cancelled: 0,
            };

            let apiWorked = false;

            // Try to load counts from API first
            for (const status of statuses) {
                try {
                    const response = await fetchJobsByContact(id, {
                        page: 1,
                        limit: 1, // We only need the count, not the actual jobs
                        status: status,
                    });

                    if (response && response.success && response.pagination) {
                        counts[status] = response.pagination.total || 0;
                        counts.total += counts[status];
                        apiWorked = true;
                    }
                    console.log("response ", response);
                } catch (error) {
                    console.warn(`Failed to load ${status} job count:`, error);
                    counts[status] = 0;
                }
            }

            // If API didn't work, use fake data counts
            if (!apiWorked) {
                console.log("API failed, using fake data for job counts");
                const fakeJobs = generateFakeJobsForContact(
                    id,
                    contact?.name || "Contact",
                    contact?.address || null
                );

                counts.total = fakeJobs.length;
                counts.open = fakeJobs.filter(
                    (job) => job.status === "open"
                ).length;
                counts.in_progress = fakeJobs.filter(
                    (job) => job.status === "in_progress"
                ).length;
                counts.completed = fakeJobs.filter(
                    (job) => job.status === "completed"
                ).length;
                counts.cancelled = fakeJobs.filter(
                    (job) => job.status === "cancelled"
                ).length;
            }

            setAllJobCounts(counts);
            console.log("All job counts loaded:", counts);
        } catch (error) {
            console.error("Error loading all job counts:", error);
        }
    }, [id]); // Remove contact dependency to prevent auto-reload

    // Load jobs for the contact
    const loadJobsForContact = useCallback(
        async (status = null) => {
            try {
                setJobsLoading(true);
                setJobsError(null);

                const params = {
                    page: 1,
                    limit: 50, // Load more jobs to show proper counts
                    sortBy: "updatedAt",
                    order: "desc",
                };

                // Only add status filter if a specific status is requested
                if (status && status !== "all") {
                    params.status = status;
                }

                try {
                    const response = await fetchJobsByContact(id, params);

                    if (response && response.success && response.data) {
                        console.log("Jobs loaded successfully:", response.data);
                        setJobs(response.data);
                        setPagination(response.pagination || {});
                        setContactInfo(response.contactInfo || null);
                        return; // Exit early if API call succeeds
                    }
                } catch (apiError) {
                    console.warn("API call failed, using fake data:", apiError);
                }

                // Fallback to fake data if API fails or returns no data
                console.log("Using fake job data for demonstration");
                const fakeJobs = generateFakeJobsForContact(
                    id,
                    contact?.name || "Contact",
                    contact?.address || null
                );

                // Filter fake jobs by status if specified
                let filteredFakeJobs = fakeJobs;
                if (status && status !== "all") {
                    filteredFakeJobs = fakeJobs.filter(
                        (job) => job.status === status
                    );
                }

                setJobs(filteredFakeJobs);
                setPagination({
                    total: filteredFakeJobs.length,
                    page: 1,
                    limit: 50,
                    pages: 1,
                    hasNextPage: false,
                    hasPrevPage: false,
                });
                setContactInfo({
                    id: id,
                    name: contact?.name || "Contact",
                });
            } catch (error) {
                console.error("Error loading jobs for contact:", error);
                setJobsError("Failed to load jobs. Please try again.");
                setJobs([]);
                setPagination({
                    total: 0,
                    page: 1,
                    limit: 5,
                    pages: 1,
                    hasNextPage: false,
                    hasPrevPage: false,
                });
            } finally {
                setJobsLoading(false);
            }
        },
        [id] // Remove contact dependency to prevent auto-reload
    );

    const loadExistingRooms = useCallback(async () => {
        try {
            const rooms = await getRoomsForContact(id);
            setExistingRooms(rooms);
            console.log("Existing rooms for contact:", rooms);
        } catch (error) {
            console.error("Error loading existing rooms:", error);
            // Don't show error toast for this, as it's not critical
        }
    }, [id, getRoomsForContact]); // Add dependencies

    useEffect(() => {
        const loadContactDetails = async () => {
            try {
                setLoading(true);
                const response = await fetchContact(id);
                if (response && response.data) {
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
    }, [id]); // Only depend on ID to prevent auto-reload

    // Separate effect for loading jobs and counts after contact is loaded
    useEffect(() => {
        if (contact) {
            const loadJobsAndCounts = async () => {
                await Promise.all([loadJobsForContact(), loadAllJobCounts()]);
            };
            loadJobsAndCounts();
        }
    }, [contact?.id]); // Only depend on contact ID

    // Separate effect for loading existing rooms
    useEffect(() => {
        if (id) {
            loadExistingRooms();
        }
    }, [id]); // Only depend on ID

    // Auto-refresh effect to check for expired rooms every minute
    useEffect(() => {
        const checkForExpiredRooms = () => {
            // Force re-render by updating existing rooms
            setExistingRooms((prevRooms) => [...prevRooms]);
            console.log("Checking for expired rooms...");
        };

        // Check every 30 seconds for expired rooms
        const intervalId = setInterval(checkForExpiredRooms, 30000);

        // Cleanup interval on component unmount
        return () => {
            clearInterval(intervalId);
        };
    }, []);

    // Auto-reload rooms when any room expires
    useEffect(() => {
        const checkAndReloadExpiredRooms = async () => {
            if (existingRooms.length > 0) {
                const hasExpiredRooms = existingRooms.some((room) =>
                    isRoomExpired(room)
                );
                if (hasExpiredRooms) {
                    console.log("Found expired rooms, reloading...");
                    await loadExistingRooms();
                }
            }
        };

        // Check every minute for expired rooms and reload if needed
        const reloadIntervalId = setInterval(checkAndReloadExpiredRooms, 60000);

        return () => {
            clearInterval(reloadIntervalId);
        };
    }, [existingRooms, loadExistingRooms]);

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

    const handleVideoRoom = () => {
        setOpenDurationSelector(true);
    };

    const handleCreateCallWithDuration = async (durationMinutes) => {
        try {
            setOpenDurationSelector(false);
            const roomData = await createRoom(
                id,
                contact.name,
                durationMinutes
            );
            console.log(
                "Video room created with duration:",
                durationMinutes,
                "minutes:",
                roomData
            );
            // Refresh the list of existing rooms after a new one is created
            await loadExistingRooms();
        } catch (error) {
            console.error("Failed to create video room:", error);
        }
    };

    const handleCloseDurationSelector = () => {
        setOpenDurationSelector(false);
    };

    const handleJoinVideoRoom = () => {
        if (videoRoomData?.callId) {
            joinRoom(videoRoomData.callId);
        }
    };

    const handleDeleteVideoRoom = async (roomIdToDelete) => {
        // Use the passed ID, or fallback to videoRoomData if not provided (e.g., for the "current" room)
        const targetRoomId = roomIdToDelete || videoRoomData?.id;

        if (!targetRoomId) {
            console.error("Missing required room ID for deletion");
            return;
        }

        try {
            await deleteRoom(targetRoomId, contact.name);
            console.log("Video room deleted successfully");
            // Reload existing rooms after deletion
            await loadExistingRooms(); // Call the helper function
        } catch (error) {
            console.error("Failed to delete video room:", error);
        }
    };

    const handleUpdateVideoRoom = async () => {
        // Handle both newly created rooms and existing rooms
        const roomToUpdate = selectedRoomForUpdate || videoRoomData;

        // Use the room ID for backend updates
        const roomId = roomToUpdate?.id;

        if (!roomId) {
            console.error("Missing required room ID for update");
            return;
        }

        try {
            const updateData = {
                maxParticipants: videoRoomSettings.maxParticipants,
                enableRecording: videoRoomSettings.enableRecording,
            };

            await updateRoom(roomId, updateData, contact.name);
            setOpenVideoRoomDialog(false);
            setSelectedRoomForUpdate(null);

            // Reload existing rooms to show updated data
            await loadExistingRooms();
        } catch (error) {
            console.error("Failed to update video room:", error);
        }
    };

    const handleOpenVideoRoomSettings = (room = null) => {
        if (room) {
            // Opening settings for an existing room
            setSelectedRoomForUpdate(room);
            setVideoRoomSettings({
                maxParticipants: room.maxParticipants || 2,
                enableRecording: room.enableRecording || false,
            });
        } else if (videoRoomData) {
            // Opening settings for newly created room
            setSelectedRoomForUpdate(null);
            setVideoRoomSettings({
                maxParticipants: videoRoomData.maxParticipants || 2,
                enableRecording: videoRoomData.enableRecording || false,
            });
        } else {
            console.error("No room data available for settings");
            return;
        }
        setOpenVideoRoomDialog(true);
    };

    const handleCloseVideoRoomDialog = () => {
        setOpenVideoRoomDialog(false);
    };

    const handleVideoRoomSettingsChange = (e) => {
        const { name, value, type, checked } = e.target;
        setVideoRoomSettings((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleShareVideoRoomLink = async (callIdOrUrl, durationMinutes) => {
        // Extract callId from URL if needed
        let callId;
        if (callIdOrUrl) {
            if (callIdOrUrl.includes("http")) {
                try {
                    const url = new URL(callIdOrUrl);
                    callId = url.searchParams.get("callId");
                } catch (error) {
                    console.error("Error parsing URL:", error);
                    callId = callIdOrUrl;
                }
            } else {
                callId = callIdOrUrl;
            }
        } else {
            // Fallback to videoRoomData
            callId = videoRoomData?.callId;
        }

        if (!callId) {
            toast.error("No video room available to share.", {
                duration: 3000,
            });
            return;
        }

        try {
            // Get current user data
            const userProfile = JSON.parse(
                localStorage.getItem("userProfile") ||
                    sessionStorage.getItem("userProfile") ||
                    "{}"
            );

            // Call shareRoomLink with correct parameters: callId, contactName, contactId, userId
            await shareRoomLink(
                callId,
                contact.name,
                contact.id,
                userProfile.id,
                durationMinutes
            );
            console.log("Video room link shared successfully");
        } catch (error) {
            console.error("Failed to share video room link:", error);
            toast.error("Failed to share video room link. Please try again.", {
                duration: 3000,
            });
        }
    };

    // Helper function to check if a video room has expired
    const isRoomExpired = (room) => {
        if (!room.createdAt || !room.durationMinutes) {
            console.log("Room missing data:", {
                roomId: room.id,
                createdAt: room.createdAt,
                durationMinutes: room.durationMinutes,
                roomObject: room,
            });
            // If missing data, assume expired for safety
            return true;
        }

        const createdTime = new Date(room.createdAt).getTime();
        const expirationTime = createdTime + room.durationMinutes * 60 * 1000;
        const currentTime = new Date().getTime();

        const isExpired = currentTime > expirationTime;

        return isExpired;
    };

    // Helper function to get room status
    const getRoomStatus = (room) => {
        if (isRoomExpired(room)) {
            return { status: "expired", label: "Expired", color: "error" };
        }
        return { status: "active", label: "Active", color: "success" };
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
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: { xs: "row", sm: "row" },
                            alignItems: { xs: "flex-start", sm: "flex-start" },
                            textAlign: { xs: "left", sm: "left" },
                            width: { xs: "100%", sm: "auto" },
                            gap: { xs: 2, sm: 2 },
                        }}
                    >
                        <Avatar
                            sx={{
                                bgcolor: "primary.main",
                                width: { xs: 56, sm: 52 },
                                height: { xs: 56, sm: 52 },
                                fontSize: { xs: "1.4rem", sm: "1.25rem" },
                                flexShrink: 0,
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
                                    lineHeight: 1.2,
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
                                    fontWeight: 500,
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
                                        justifyContent: {
                                            xs: "flex-start",
                                            sm: "flex-start",
                                        },
                                    }}
                                >
                                    {contact.tags.map((tag, index) => (
                                        <Chip
                                            key={index}
                                            label={tag}
                                            size="small"
                                            color="primary"
                                            sx={{
                                                fontSize: {
                                                    xs: "0.7rem",
                                                    sm: "0.75rem",
                                                },
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: { xs: "row", sm: "row" },
                            flexWrap: { xs: "wrap", sm: "nowrap" },
                            gap: { xs: 1, sm: 1 },
                            width: { xs: "100%", sm: "auto" },
                            mt: { xs: 1, sm: 0 },
                            "& > *": {
                                flex: {
                                    xs: "1 1 calc(50% - 4px)",
                                    sm: "0 0 auto",
                                },
                            },
                        }}
                    >
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleAIAssistant}
                            size="medium"
                            sx={{
                                minWidth: { sm: "auto" },
                                fontSize: { xs: "0.875rem", sm: "0.875rem" },
                                width: { xs: "100%", sm: "auto" },
                            }}
                        >
                            Text
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
                                width: { xs: "100%", sm: "auto" },
                            }}
                        >
                            Call
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
                                width: { xs: "100%", sm: "auto" },
                            }}
                        >
                            Email
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
                                width: { xs: "100%", sm: "auto" },
                            }}
                        >
                            {videoRoomLoading ? "Creating..." : "Video Room"}
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
                                width: { xs: "100%", sm: "auto" },
                            }}
                        >
                            Edit
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
                            borderColor: "success.main",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1.5,
                            }}
                        >
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
                                    height: 28,
                                }}
                            >
                                <VideoCallIcon sx={{ fontSize: 16 }} />
                            </Box>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    color: "success.dark",
                                    fontWeight: 600,
                                }}
                            >
                                Video Room Created Successfully!
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1,
                            }}
                        >
                            <Typography
                                variant="body1"
                                sx={{
                                    fontWeight: 600,
                                    color: "text.primary",
                                }}
                            >
                                {videoRoomData.uniqueName}
                            </Typography>

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
                            Ready for {contact.name}. Join now or share the
                            link.
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
                                gap: { xs: 0.5, sm: 1 },
                                alignItems: "center",
                                flexWrap: "wrap",
                                flexDirection: { xs: "column", sm: "row" },
                                width: { xs: "100%", sm: "auto" },
                            }}
                        >
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
                                    width: { xs: "100%", sm: "auto" },
                                    border: "1px solid",
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
                            borderColor: "grey.200",
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
                                fontSize: "1.1rem",
                            }}
                        >
                            <VideoCallIcon
                                color="primary"
                                sx={{ fontSize: 22 }}
                            />
                            Video Rooms ({existingRooms.length})
                        </Typography>

                        {existingRooms.map((room, index) => (
                            <Paper
                                key={room.id}
                                elevation={1}
                                sx={{
                                    p: 2,
                                    mb:
                                        index < existingRooms.length - 1
                                            ? 1.5
                                            : 0,
                                    borderRadius: 2,
                                    border: "1px solid",
                                    borderColor: "grey.200",
                                    backgroundColor: "white",
                                    transition: "all 0.2s ease-in-out",
                                    "&:hover": {
                                        elevation: 2,
                                        borderColor: "primary.light",
                                        transform: "translateY(-1px)",
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: {
                                            xs: "column",
                                            sm: "row",
                                        },
                                        justifyContent: "space-between",
                                        alignItems: {
                                            xs: "stretch",
                                            sm: "flex-start",
                                        },
                                        gap: { xs: 2, sm: 0 },
                                    }}
                                >
                                    <Box sx={{ flex: 1, mr: { xs: 0, sm: 2 } }}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: { xs: 1, sm: 1.5 },
                                                mb: 1,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    p: 0.5,
                                                    borderRadius: "50%",
                                                    backgroundColor:
                                                        "primary.main",
                                                    color: "white",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: 24,
                                                    height: 24,
                                                }}
                                            >
                                                <VideoCallIcon
                                                    sx={{ fontSize: 14 }}
                                                />
                                            </Box>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: "text.primary",
                                                    fontSize: {
                                                        xs: "1rem",
                                                        sm: "1.1rem",
                                                    },
                                                }}
                                            >
                                                {room.uniqueName}
                                            </Typography>

                                            <Chip
                                                label={`${room.durationMinutes} min`}
                                                size="small"
                                                color="secondary"
                                                variant="filled"
                                                sx={{
                                                    fontSize: {
                                                        xs: "0.7rem",
                                                        sm: "0.75rem",
                                                    },
                                                    height: { xs: 20, sm: 22 },
                                                    fontWeight: 500,
                                                }}
                                            />
                                            <Chip
                                                label={
                                                    getRoomStatus(room).label
                                                }
                                                size="small"
                                                color={
                                                    getRoomStatus(room).color
                                                }
                                                variant={
                                                    isRoomExpired(room)
                                                        ? "filled"
                                                        : "outlined"
                                                }
                                                sx={{
                                                    fontSize: {
                                                        xs: "0.7rem",
                                                        sm: "0.75rem",
                                                    },
                                                    height: { xs: 20, sm: 22 },
                                                    fontWeight: 500,
                                                }}
                                            />
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                fontSize: {
                                                    xs: "0.8rem",
                                                    sm: "0.875rem",
                                                },
                                                fontWeight: 500,
                                                ml: { xs: 0, sm: 4 },
                                            }}
                                        >
                                            Created{" "}
                                            {new Date(
                                                room.createdAt
                                            ).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}{" "}
                                            at{" "}
                                            {new Date(
                                                room.createdAt
                                            ).toLocaleTimeString("en-US", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Typography>
                                    </Box>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: { xs: 0.5, sm: 1 },
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                            flexDirection: {
                                                xs: "column",
                                                sm: "row",
                                            },
                                            width: { xs: "100%", sm: "auto" },
                                        }}
                                    >
                                        {!isRoomExpired(room) && (
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                onClick={() =>
                                                    joinRoom(
                                                        room.callId ||
                                                            room.joinUrl
                                                    )
                                                }
                                                startIcon={<VideoCallIcon />}
                                                sx={{
                                                    px: { xs: 2, sm: 2 },
                                                    py: 0.75,
                                                    fontSize: {
                                                        xs: "0.8rem",
                                                        sm: "0.8rem",
                                                    },
                                                    fontWeight: 600,
                                                    borderRadius: 1.5,
                                                    boxShadow:
                                                        "0 2px 8px rgba(25, 118, 210, 0.3)",
                                                    width: {
                                                        xs: "100%",
                                                        sm: "auto",
                                                    },
                                                }}
                                            >
                                                Join
                                            </Button>
                                        )}
                                        {!isRoomExpired(room) && (
                                            <Button
                                                variant="outlined"
                                                color="info"
                                                size="small"
                                                onClick={() =>
                                                    handleShareVideoRoomLink(
                                                        room.joinUrl,
                                                        room.durationMinutes ||
                                                            30
                                                    )
                                                }
                                                disabled={videoRoomLoading}
                                                sx={{
                                                    px: { xs: 2, sm: 1.5 },
                                                    py: 0.75,
                                                    fontSize: {
                                                        xs: "0.8rem",
                                                        sm: "0.8rem",
                                                    },
                                                    fontWeight: 500,
                                                    borderRadius: 1.5,
                                                    width: {
                                                        xs: "100%",
                                                        sm: "auto",
                                                    },
                                                }}
                                            >
                                                Share
                                            </Button>
                                        )}

                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            onClick={() =>
                                                handleDeleteVideoRoom(room.id)
                                            }
                                            startIcon={<DeleteIcon />}
                                            disabled={videoRoomLoading}
                                            sx={{
                                                px: { xs: 2, sm: 1.5 },
                                                py: 0.75,
                                                fontSize: {
                                                    xs: "0.8rem",
                                                    sm: "0.8rem",
                                                },
                                                fontWeight: 500,
                                                borderRadius: 1.5,
                                                width: {
                                                    xs: "100%",
                                                    sm: "auto",
                                                },
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
                                            Cell Phone Number
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
                </Grid>
            </Paper>

            {/* Enhanced Job History Section */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0,
                    }}
                >
                    <Typography variant="h6">Recent Jobs</Typography>
                </Box>

                {/* Job Status Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 0 }}>
                    <Tabs
                        value={activeJobTab}
                        onChange={handleJobTabChange}
                        aria-label="job status tabs"
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            "& .MuiTabs-flexContainer": {
                                gap: { xs: 0, sm: 1 },
                            },
                            "& .MuiTab-root": {
                                minWidth: { xs: "auto", sm: 120 },
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                fontWeight: 600,
                                textTransform: "none",
                                px: { xs: 1, sm: 2 },
                                py: { xs: 1.5, sm: 2 },
                                "&.Mui-selected": {
                                    color: "primary.main",
                                    fontWeight: 700,
                                },
                            },
                            "& .MuiTabs-indicator": {
                                height: 3,
                                borderRadius: "3px 3px 0 0",
                            },
                            "& .MuiTabs-scrollButtons": {
                                "&.Mui-disabled": {
                                    opacity: 0.3,
                                },
                            },
                        }}
                    >
                        <Tab
                            label="Open Jobs"
                            value="open"
                            sx={{
                                "& .MuiTab-wrapper": {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                },
                            }}
                        />
                        <Tab
                            label="In Progress"
                            value="in_progress"
                            sx={{
                                "& .MuiTab-wrapper": {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                },
                            }}
                        />
                        <Tab
                            label="Completed"
                            value="completed"
                            sx={{
                                "& .MuiTab-wrapper": {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                },
                            }}
                        />
                        <Tab
                            label="Cancelled"
                            value="cancelled"
                            sx={{
                                "& .MuiTab-wrapper": {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                },
                            }}
                        />
                    </Tabs>
                </Box>

                {/* Simple Job List */}
                {jobsLoading ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <CircularProgress size={40} />
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 2 }}
                        >
                            Loading jobs...
                        </Typography>
                    </Box>
                ) : jobsError ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography
                            variant="body1"
                            color="error"
                            sx={{ mb: 2 }}
                        >
                            {jobsError}
                        </Typography>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => loadJobsForContact()}
                            size="small"
                        >
                            Retry
                        </Button>
                    </Box>
                ) : displayedJobs.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            No {activeJobTab.replace("_", " ")} jobs found for{" "}
                            {contact.name}.
                        </Typography>
                    </Box>
                ) : (
                    <SimpleJobList jobs={displayedJobs} />
                )}

                {/* View All Button at bottom if there are more jobs */}
                {hasMoreJobs && (
                    <Box sx={{ textAlign: "center", mt: 3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleViewAllJobs}
                            sx={{
                                textTransform: "none",
                                fontWeight: 400,
                                px: 2,
                                py: 1,
                                width: "100%",
                            }}
                        >
                            View All
                        </Button>
                    </Box>
                )}
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
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mt: 2,
                                }}
                            >
                                <input
                                    type="checkbox"
                                    id="enableRecording"
                                    name="enableRecording"
                                    checked={videoRoomSettings.enableRecording}
                                    onChange={handleVideoRoomSettingsChange}
                                    style={{ marginRight: "8px" }}
                                />
                                <label htmlFor="enableRecording">
                                    <Typography variant="body1">
                                        Enable Recording
                                    </Typography>
                                </label>
                            </Box>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
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

            {/* Call Duration Selector Dialog */}
            <CallDurationSelector
                open={openDurationSelector}
                onClose={handleCloseDurationSelector}
                onCreateCall={handleCreateCallWithDuration}
                contactName={contact?.name}
                loading={videoRoomLoading}
            />
        </Box>
    );
};

export default ContactDetailsPage;
