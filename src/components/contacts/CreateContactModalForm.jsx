import React, { useState } from "react";
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    Chip,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { createContact } from "../../services/api";
import { toast } from "sonner";
import { useWebhook } from "../../hooks/webHook";

const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { xs: "90%", sm: 640 },
    maxHeight: "90vh",
    overflowY: "auto",
    bgcolor: "background.paper",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
    p: { xs: 3, sm: 4 },
    borderRadius: "12px", // Increased from 8px to 12px for more rounded corners
    transition: "transform 0.2s ease-out",
};

const CreateContactModalForm = ({ open, onClose, onContactCreated }) => {
    const [formData, setFormData] = useState({
        name: "",
        phoneNumber: "",
        email: "",
        address: "",
        tags: [],
        notes: "",
        status: "",
        pipelineStage: "",
    });
    const [newTag, setNewTag] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({
        name: "",
        phoneNumber: "",
        email: "",
    });
    const { sendWebhook } = useWebhook();
    const validateForm = () => {
        const errors = {
            name: "",
            phoneNumber: "",
            email: "",
        };
        let isValid = true;

        // Name validation (required, min 2 characters)
        if (!formData.name.trim()) {
            errors.name = "Name is required";
            isValid = false;
        } else if (formData.name.trim().length < 2) {
            errors.name = "Name must be at least 2 characters";
            isValid = false;
        }

        // Phone number validation (optional, but must match format if provided)
        if (formData.phoneNumber) {
            const phoneRegex = /^\+?[\d\s-]{7,15}$/;
            if (!phoneRegex.test(formData.phoneNumber)) {
                errors.phoneNumber = "Invalid phone number format";
                isValid = false;
            }
        }

        // Email validation (optional, but must be valid if provided)
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                errors.email = "Invalid email format";
                isValid = false;
            }
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear validation error for the field being edited
        setValidationErrors((prev) => ({ ...prev, [name]: "" }));
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

    const handleRemoveTag = (tagToRemove) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((tag) => tag !== tagToRemove),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await createContact(formData);

            const webHookData = {
                webhookEvent: "ContactAdded",
                createdBy: response.data.createdBy,
                ...formData,
            };
            await sendWebhook({ payload: webHookData });
            if (response && response.data) {
                onContactCreated(response.data);
                onClose();
                setFormData({
                    name: "",
                    phoneNumber: "",
                    email: "",
                    address: "",
                    tags: [],
                    notes: "",
                    status: "",
                    pipelineStage: "",
                });
                setValidationErrors({ name: "", phoneNumber: "", email: "" });
            }
            toast.success("New contact added successfully");
        } catch (err) {
            setError("Failed to create contact. Please try again.");
            console.error("Error creating contact:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 3,
                    }}
                >
                    <Typography
                        variant="h6"
                        fontWeight="600"
                        color="primary.main"
                    >
                        Add New Contact
                    </Typography>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            p: 0.5,
                            color: "text.secondary",
                            "&:hover": {
                                color: "primary.main",
                                backgroundColor: "grey.100",
                            },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                <form onSubmit={handleSubmit}>
                    {/* Personal Information Section */}
                    <Typography
                        variant="subtitle1"
                        fontWeight="500"
                        color="text.primary"
                        sx={{ mb: 2 }}
                    >
                        Personal Information
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                variant="outlined"
                                size="small"
                                error={!!validationErrors.name}
                                helperText={validationErrors.name}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "6px",
                                        "&:hover fieldset": {
                                            borderColor: "primary.main",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "primary.main",
                                            boxShadow:
                                                "0 0 0 2px rgba(25, 118, 210, 0.1)",
                                        },
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                error={!!validationErrors.phoneNumber}
                                helperText={validationErrors.phoneNumber}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "6px",
                                        "&:hover fieldset": {
                                            borderColor: "primary.main",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "primary.main",
                                            boxShadow:
                                                "0 0 0 2px rgba(25, 118, 210, 0.1)",
                                        },
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                error={!!validationErrors.email}
                                helperText={validationErrors.email}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "6px",
                                        "&:hover fieldset": {
                                            borderColor: "primary.main",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "primary.main",
                                            boxShadow:
                                                "0 0 0 2px rgba(25, 118, 210, 0.1)",
                                        },
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "6px",
                                        "&:hover fieldset": {
                                            borderColor: "primary.main",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "primary.main",
                                            boxShadow:
                                                "0 0 0 2px rgba(25, 118, 210, 0.1)",
                                        },
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>

                    {/* Tags Section */}
                    <Divider sx={{ my: 3, borderColor: "grey.200" }} />
                    <Typography
                        variant="subtitle1"
                        fontWeight="500"
                        color="text.primary"
                        sx={{ mb: 2 }}
                    >
                        Tags
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                            mb: 2,
                        }}
                    >
                        {formData.tags.map((tag) => (
                            <Chip
                                key={tag}
                                label={tag}
                                onDelete={() => handleRemoveTag(tag)}
                                sx={{
                                    backgroundColor: "primary.light",
                                    color: "primary.contrastText",
                                    "& .MuiChip-deleteIcon": {
                                        color: "primary.contrastText",
                                        "&:hover": { color: "grey.200" },
                                    },
                                }}
                            />
                        ))}
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                            fullWidth
                            label="Add new Blockquote tag"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "6px",
                                    "&:hover fieldset": {
                                        borderColor: "primary.main",
                                    },
                                    "&.Mui-focused fieldset": {
                                        borderColor: "primary.main",
                                        boxShadow:
                                            "0 0 0 2px rgba(25, 118, 210, 0.1)",
                                    },
                                },
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleAddTag}
                            disabled={!newTag.trim()}
                            sx={{
                                borderRadius: "6px",
                                textTransform: "none",
                                fontWeight: "500",
                                px: 2,
                                py: 0.5,
                                minWidth: "100px",
                                color: "common.white", // This uses the theme's white color
                                "&:hover": {
                                    backgroundColor: "primary.dark", // Darker shade on hover
                                    color: "common.white", // Ensure text stays white on hover
                                },
                                "&.Mui-disabled": {
                                    color: "grey.300", // Lighter color when disabled
                                },
                            }}
                        >
                            Add
                        </Button>
                    </Box>

                    {/* Additional Details Section */}
                    <Divider sx={{ my: 3, borderColor: "grey.200" }} />
                    <Typography
                        variant="subtitle1"
                        fontWeight="500"
                        color="text.primary"
                        sx={{ mb: 2 }}
                    >
                        Additional Details
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <FormControl
                                fullWidth
                                variant="outlined"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "6px",
                                        "&:hover fieldset": {
                                            borderColor: "primary.main",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "primary.main",
                                            boxShadow:
                                                "0 0 0 2px rgba(25, 118, 210, 0.1)",
                                        },
                                    },
                                }}
                            >
                                <InputLabel>Status</InputLabel>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    label="Status"
                                    size="small"
                                >
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Inactive">
                                        Inactive
                                    </MenuItem>
                                    <MenuItem value="Pending">Pending</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl
                                fullWidth
                                variant="outlined"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "6px",
                                        "&:hover fieldset": {
                                            borderColor: "primary.main",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "primary.main",
                                            boxShadow:
                                                "0 0 0 2px rgba(25, 118, 210, 0.1)",
                                        },
                                    },
                                }}
                            >
                                {/* pipeline section */}
                                <InputLabel>Pipeline Stage</InputLabel>
                                <Select
                                    name="pipelineStage"
                                    value={formData.pipelineStage}
                                    onChange={handleInputChange}
                                    label="Pipeline Stage"
                                    size="small"
                                >
                                    <MenuItem value="new_lead">
                                        New Lead
                                    </MenuItem>
                                    <MenuItem value="estimate">
                                        Estimate
                                    </MenuItem>
                                    <MenuItem value="appointment_made">
                                        Appointment Made
                                    </MenuItem>
                                    <MenuItem value="job_started">
                                        Job Started
                                    </MenuItem>
                                    <MenuItem value="job_completed">
                                        Job Completed
                                    </MenuItem>
                                    <MenuItem value="won">Won</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                multiline
                                rows={4}
                                variant="outlined"
                                size="small"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "6px",
                                        "&:hover fieldset": {
                                            borderColor: "primary.main",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "primary.main",
                                            boxShadow:
                                                "0 0 0 2px rgba(25, 118, 210, 0.1)",
                                        },
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>

                    {/* Error Message */}
                    {error && (
                        <Typography
                            color="error.main"
                            variant="body2"
                            sx={{
                                mt: 2,
                                fontWeight: "500",
                                backgroundColor: "error.50",
                                p: 1,
                                borderRadius: "4px",
                            }}
                        >
                            {error}
                        </Typography>
                    )}

                    {/* Action Buttons */}
                    <Box
                        sx={{
                            mt: 4,
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 2,
                        }}
                    >
                        <Button
                            onClick={onClose}
                            disabled={loading}
                            variant="outlined"
                            sx={{
                                borderColor: "grey.300",
                                color: "text.primary",
                                borderRadius: "6px",
                                textTransform: "none",
                                fontWeight: "500",
                                px: 2,
                                py: 0.5,
                                "&:hover": {
                                    borderColor: "grey.400",
                                    backgroundColor: "grey.50",
                                },
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading || !!validationErrors.name}
                            sx={{
                                borderRadius: "6px",
                                textTransform: "none",
                                fontWeight: "500",
                                px: 2,
                                py: 0.5,
                                "&:hover": {
                                    backgroundColor: "primary.dark",
                                    color: "white",
                                },
                                "&:disabled": {
                                    backgroundColor: "grey.300",
                                    color: "grey.600",
                                },
                            }}
                        >
                            {loading ? "Creating..." : "Create Contact"}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Modal>
    );
};

export default CreateContactModalForm;
