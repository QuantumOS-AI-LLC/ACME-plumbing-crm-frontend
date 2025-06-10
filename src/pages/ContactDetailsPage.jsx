// ... (Previous imports remain unchanged)
import React, { useState, useEffect } from "react";
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
    const { loading: videoRoomLoading, videoRoomData, createRoom, joinRoom, clearRoomData } = useVideoRoom();
    
    // Define pipeline stage options
    const pipelineStageOptions = [
        { value: "new_lead", label: "New Lead" },
        { value: "estimate", label: "Estimate" },
        { value: "appointment_made", label: "Appointment Made" },
        { value: "job_started", label: "Job Started" },
        { value: "job_completed", label: "Job Completed" },
        { value: "won", label: "Won" },
    ];

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
    }, [id]);

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
        } catch (error) {
            console.error('Failed to create video room:', error);
        }
    };

    const handleJoinVideoRoom = () => {
        if (videoRoomData?.joinUrl) {
            joinRoom(videoRoomData.joinUrl);
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

            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: "16px",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 3,
                    }}
                >
                    <Box sx={{ display: "flex" }}>
                        <Avatar
                            sx={{
                                bgcolor: "primary.main",
                                width: 52,
                                height: 52,
                                mr: 2,
                            }}
                        >
                            {getInitials(contact.name)}
                        </Avatar>
                        <Box>
                            <Typography variant="h5">{contact.name}</Typography>
                            <Typography
                                variant="subtitle1"
                                color="text.secondary"
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
                                        gap: 1,
                                        mt: 1,
                                    }}
                                >
                                    {contact.tags.map((tag, index) => (
                                        <Chip
                                            key={index}
                                            label={tag}
                                            size="small"
                                            color="primary"
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box>
                    <Box>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleAIAssistant}
                            sx={{ mr: 1 }}
                        >
                            Text
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<EditIcon />}
                            onClick={handleEdit}
                            sx={{ mr: 1 }}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<PhoneIcon />}
                            onClick={handleCall}
                            sx={{ mr: 1 }}
                            disabled={!contact.phoneNumber}
                        >
                            Call
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<VideoCallIcon />}
                            onClick={handleVideoRoom}
                            sx={{ mr: 1 }}
                            disabled={videoRoomLoading}
                        >
                            {videoRoomLoading ? "Creating..." : "Video Room"}
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<EmailIcon />}
                            onClick={handleEmail}
                            disabled={!contact.email}
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
                            backgroundColor: "success.light",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "success.main",
                        }}
                    >
                        <Typography variant="h6" sx={{ mb: 1, color: "success.dark" }}>
                            Video Room Created
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, color: "success.dark" }}>
                            Video room has been created for {contact.name}. Join link sent via webhook.
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleJoinVideoRoom}
                                startIcon={<VideoCallIcon />}
                            >
                                Join Video Room
                            </Button>
                            <Button
                                variant="outlined"
                                color="success"
                                onClick={clearRoomData}
                                size="small"
                            >
                                Clear
                            </Button>
                        </Box>
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
        </Box>
    );
};

export default ContactDetailsPage;
