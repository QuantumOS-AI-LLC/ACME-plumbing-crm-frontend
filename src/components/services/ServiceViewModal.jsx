import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Chip,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    IconButton,
    Paper,
    Divider,
    CircularProgress,
} from "@mui/material";
import {
    Close as CloseIcon,
    Save as SaveIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
} from "@mui/icons-material";
import { toast } from "sonner";

const ServiceViewModal = ({
    open,
    onClose,
    service,
    onServiceUpdate,
    onServiceDelete,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        duration: "",
        category: "",
        tags: [],
        includedServices: [],
        status: "active",
    });
    const [newTag, setNewTag] = useState("");
    const [newService, setNewService] = useState("");

    useEffect(() => {
        if (service && open) {
            console.log("Service data received in modal:", service); // Debug log
            setFormData({
                name: service.name || "",
                description: service.description || "",
                price:
                    service.price !== null && service.price !== undefined
                        ? service.price.toString()
                        : "",
                duration: service.duration || "",
                category: service.category || "",
                tags: service.tags || [],
                includedServices: service.includedServices || [],
                status: service.status || "active",
            });
        }
    }, [service, open]);

    useEffect(() => {
        if (!open) {
            setError(null);
            setNewTag("");
            setNewService("");
        }
    }, [open]);

    if (!open || !service) return null;

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()],
            }));
            setNewTag("");
        }
    };

    const handleRemoveTag = (tag) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((t) => t !== tag),
        }));
    };

    const handleAddService = () => {
        if (
            newService.trim() &&
            !formData.includedServices.includes(newService.trim())
        ) {
            setFormData((prev) => ({
                ...prev,
                includedServices: [...prev.includedServices, newService.trim()],
            }));
            setNewService("");
        }
    };

    const handleRemoveService = (service) => {
        setFormData((prev) => ({
            ...prev,
            includedServices: prev.includedServices.filter(
                (s) => s !== service
            ),
        }));
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setError("Service name is required");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const updateData = {
                id: service.id,
                name: formData.name.trim(),
                description: formData.description.trim(),
                price: formData.price ? parseFloat(formData.price) : null,
                duration: formData.duration.trim(),
                category: formData.category,
                tags: formData.tags,
                includedServices: formData.includedServices,
                status: formData.status,
            };

            if (onServiceUpdate) {
                await onServiceUpdate(updateData);
                onClose();
            }
        } catch (err) {
            setError(err.message || "Failed to save changes");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        // Show confirmation toast with action buttons
        toast(`Delete "${service.name}"?`, {
            description: "This action cannot be undone.",
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        if (onServiceDelete) {
                            await onServiceDelete(service);
                            onClose();
                        }
                    } catch (err) {
                        setError(err.message || "Failed to delete service");
                    }
                },
            },
            cancel: {
                label: "Cancel",
                onClick: () => {
                    toast.dismiss();
                },
            },
            duration: 5000,
        });
    };

    const getCategoryColor = (category) => {
        const colors = {
            Emergency: "#ef4444",
            Installation: "#8b5cf6",
            Repair: "#3b82f6",
            Maintenance: "#10b981",
        };
        return colors[category] || "#6b7280";
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    maxHeight: "90vh",
                },
            }}
        >
            <DialogTitle>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="h6" component="h2">
                            Edit Service
                        </Typography>
                        <Chip
                            label={formData.status}
                            color={
                                formData.status === "active"
                                    ? "success"
                                    : "error"
                            }
                            size="small"
                        />
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Basic Information */}
                <Paper sx={{ p: 3, mb: 3, bgcolor: "grey.50" }}>
                    <Typography variant="h6" gutterBottom>
                        Basic Information
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Service Name"
                                value={formData.name}
                                onChange={(e) =>
                                    handleInputChange("name", e.target.value)
                                }
                                required
                                placeholder="Enter service name"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                value={formData.description}
                                onChange={(e) =>
                                    handleInputChange(
                                        "description",
                                        e.target.value
                                    )
                                }
                                multiline
                                rows={3}
                                placeholder="Describe the service..."
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Price ($)"
                                value={formData.price}
                                onChange={(e) => {
                                    if (
                                        e.target.value === "" ||
                                        /^\d*\.?\d*$/.test(e.target.value)
                                    ) {
                                        handleInputChange(
                                            "price",
                                            e.target.value
                                        );
                                    }
                                }}
                                placeholder="0.00"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Duration"
                                value={formData.duration}
                                onChange={(e) =>
                                    handleInputChange(
                                        "duration",
                                        e.target.value
                                    )
                                }
                                placeholder="e.g., 2 hours"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={formData.category}
                                    label="Category"
                                    onChange={(e) =>
                                        handleInputChange(
                                            "category",
                                            e.target.value
                                        )
                                    }
                                >
                                    <MenuItem value="">
                                        Select category
                                    </MenuItem>
                                    <MenuItem value="Emergency">
                                        Emergency
                                    </MenuItem>
                                    <MenuItem value="Installation">
                                        Installation
                                    </MenuItem>
                                    <MenuItem value="Repair">Repair</MenuItem>
                                    <MenuItem value="Maintenance">
                                        Maintenance
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={formData.status}
                                    label="Status"
                                    onChange={(e) =>
                                        handleInputChange(
                                            "status",
                                            e.target.value
                                        )
                                    }
                                >
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">
                                        Inactive
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Tags */}
                <Paper sx={{ p: 3, mb: 3, bgcolor: "grey.50" }}>
                    <Typography variant="h6" gutterBottom>
                        Tags
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddTag();
                                }
                            }}
                            placeholder="Add tag"
                        />
                        <Button
                            variant="outlined"
                            onClick={handleAddTag}
                            disabled={!newTag.trim()}
                            startIcon={<AddIcon />}
                        >
                            Add
                        </Button>
                    </Box>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {formData.tags.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag}
                                onDelete={() => handleRemoveTag(tag)}
                                color="primary"
                                variant="outlined"
                            />
                        ))}
                    </Box>
                </Paper>

                {/* Included Services */}
                <Paper sx={{ p: 3, mb: 3, bgcolor: "grey.50" }}>
                    <Typography variant="h6" gutterBottom>
                        Included Services
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            value={newService}
                            onChange={(e) => setNewService(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddService();
                                }
                            }}
                            placeholder="Add included service"
                        />
                        <Button
                            variant="outlined"
                            onClick={handleAddService}
                            disabled={!newService.trim()}
                            startIcon={<AddIcon />}
                        >
                            Add
                        </Button>
                    </Box>
                    {formData.includedServices.length > 0 ? (
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                            }}
                        >
                            {formData.includedServices.map((service, index) => (
                                <Paper
                                    key={index}
                                    sx={{
                                        p: 2,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        bgcolor: "white",
                                    }}
                                >
                                    <Typography variant="body2">
                                        {service}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() =>
                                            handleRemoveService(service)
                                        }
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Paper>
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No services added yet
                        </Typography>
                    )}
                </Paper>
            </DialogContent>

            <DialogActions
                sx={{
                    p: 3,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Button
                    onClick={handleDelete}
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    sx={{
                        borderColor: "#f44336",
                        color: "#f44336",
                        borderRadius: "12px",
                        textTransform: "none",
                        fontWeight: "bold",
                        px: 3,
                        py: 1,
                        border: "2px solid #f44336",
                        background:
                            "linear-gradient(45deg, rgba(244, 67, 54, 0.05), rgba(244, 67, 54, 0.1))",
                        backdropFilter: "blur(10px)",
                        boxShadow: "0 4px 20px rgba(244, 67, 54, 0.2)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                            backgroundColor: "#f44336",
                            color: "#ffffff",
                            borderColor: "#f44336",
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 30px rgba(244, 67, 54, 0.4)",
                        },
                        "&:active": {
                            transform: "translateY(0px)",
                        },
                    }}
                >
                    Delete Service
                </Button>

                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading || !formData.name.trim()}
                    startIcon={
                        loading ? <CircularProgress size={18} /> : <SaveIcon />
                    }
                    sx={{
                        bgcolor: "#8A2BE2",
                        borderRadius: "12px",
                        textTransform: "none",
                        fontWeight: "bold",
                        px: 3,
                        py: 1,
                        background: "linear-gradient(45deg, #8A2BE2, #9C27B0)",
                        boxShadow: "0 4px 20px rgba(138, 43, 226, 0.3)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                            bgcolor: "#7B1FA2",
                            background:
                                "linear-gradient(45deg, #7B1FA2, #8E24AA)",
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 30px rgba(138, 43, 226, 0.4)",
                        },
                        "&:active": {
                            transform: "translateY(0px)",
                        },
                        "&:disabled": {
                            background: "rgba(138, 43, 226, 0.3)",
                            color: "rgba(255, 255, 255, 0.5)",
                        },
                    }}
                >
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ServiceViewModal;
