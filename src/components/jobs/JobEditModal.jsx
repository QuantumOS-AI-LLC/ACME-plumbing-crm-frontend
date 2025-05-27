import React, { useState, useEffect } from "react";
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    MenuItem,
    CircularProgress,
    Tabs,
    Tab,
    Grid,
} from "@mui/material";
import { updateJob } from "../../services/api";
import { toast } from "sonner";

const JOB_STATUS = {
    OPEN: "open",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
};

const statusOptions = [
    { value: JOB_STATUS.OPEN, label: "Open" },
    { value: JOB_STATUS.IN_PROGRESS, label: "In Progress" },
    { value: JOB_STATUS.COMPLETED, label: "Completed" },
    { value: JOB_STATUS.CANCELLED, label: "Cancelled" },
];

const defaultClient = {
    name: "",
    email: "",
    phoneNumber: "",
};

const JobEditModal = ({ open, onClose, job, onUpdate, onRefreshJobs }) => {
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        address: "",
        price: "",
        status: JOB_STATUS.OPEN,
        startDate: "",
        endDate: "",
        invoiceUrl: "",
        clientId: "",
        createdBy: "",
        createdAt: "",
        updatedAt: "",
        client: defaultClient,
        user: null,
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (job) {
            setFormData({
                id: job.id || "",
                name: job.name || "",
                address: job.address || "",
                price: job.price?.toString() || "",
                status: job.status || JOB_STATUS.OPEN,
                startDate: job.startDate
                    ? new Date(job.startDate).toISOString().slice(0, 16)
                    : "",
                endDate: job.endDate
                    ? new Date(job.endDate).toISOString().slice(0, 16)
                    : "",
                invoiceUrl: job.invoiceUrl || "",
                clientId: job.clientId || "",
                createdBy: job.createdBy || "",
                createdAt: job.createdAt || "",
                updatedAt: job.updatedAt || "",
                client: {
                    ...defaultClient,
                    ...(job.client || {}),
                },
                user: job.user || null,
            });
        }
        setErrors({});
    }, [job]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Job Name is required";
        }
        if (!formData.address.trim()) {
            newErrors.address = "Address is required";
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            newErrors.price = "Valid price is required";
        }
        if (!formData.status) {
            newErrors.status = "Status is required";
        }
        if (!formData.clientId) {
            newErrors.clientId = "Client is required";
        }

        if (formData.invoiceUrl && formData.invoiceUrl.trim()) {
            try {
                new URL(formData.invoiceUrl);
            } catch {
                newErrors.invoiceUrl = "Please enter a valid URL";
            }
        }

        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (start >= end) {
                newErrors.endDate = "End date must be after start date";
            }
        }

        return newErrors;
    };

    const handleSubmit = async () => {
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setLoading(true);
            setErrors({});

            const jobDataToSubmit = {
                name: formData.name.trim(),
                address: formData.address.trim(),
                price: parseFloat(formData.price),
                status: formData.status,
                startDate: formData.startDate
                    ? new Date(formData.startDate).toISOString()
                    : null,
                endDate: formData.endDate
                    ? new Date(formData.endDate).toISOString()
                    : null,
                invoiceUrl: formData.invoiceUrl.trim() || null,
                clientId: formData.clientId,
            };

            // ✅ Make API call and get updated job
            const updatedJob = await updateJob(job.id, jobDataToSubmit);

            // ✅ Create complete job object with preserved client data
            const completeUpdatedJob = {
                ...job, // Keep original data (especially relations)
                ...updatedJob, // Override with updated data
                client: job.client, // Preserve client data
            };

            console.log(
                "JobEditModal: Job updated successfully",
                completeUpdatedJob
            );

            // ✅ Immediately notify parent to update state
            if (onUpdate) {
                onUpdate(completeUpdatedJob);
            }

            onClose();
            window.location.reload();
        } catch (err) {
            console.error("Error updating job:", err);
            setErrors({ general: "Failed to update job. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const getClientFieldValue = (
        field,
        defaultText = "No information provided"
    ) => {
        const value = formData.client?.[field];
        if (!value || value.trim() === "") {
            return defaultText;
        }
        return value;
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
            }}
        >
            <Box
                sx={{
                    width: { xs: "95%", sm: 500 },
                    maxWidth: 600,
                    bgcolor: "#ffffff",
                    borderRadius: "20px",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
                    border: "2px solid transparent",
                    p: { xs: 2.5, sm: 3.5 },
                    position: "relative",
                    animation: "slideInBounce 0.5s ease-out",
                    "@keyframes slideInBounce": {
                        "0%": { transform: "translateY(100%)", opacity: 0 },
                        "80%": { transform: "translateY(-10px)", opacity: 1 },
                        "100%": { transform: "translateY(0)", opacity: 1 },
                    },
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        mb: 2,
                        fontWeight: 800,
                        color: "#6d28d9",
                        textAlign: "center",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                    }}
                >
                    Edit Job
                </Typography>

                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    centered
                    sx={{
                        mb: 3,
                        "& .MuiTab-root": {
                            color: "#4b5563",
                            fontWeight: 600,
                            textTransform: "none",
                            fontSize: "0.85rem",
                            minWidth: "auto",
                            "&:hover": {
                                color: "#6d28d9",
                            },
                        },
                        "& .Mui-selected": {
                            color: "#6d28d9 !important",
                        },
                        "& .MuiTabs-indicator": {
                            background: "#6d28d9",
                            height: "3px",
                        },
                    }}
                >
                    <Tab label="Job Details" />
                    <Tab label="Client Info" />
                </Tabs>

                {/* Tab 0: Job Details */}
                {activeTab === 0 && (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="Job Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={!!errors.name}
                                helperText={errors.name}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "12px",
                                        bgcolor: "#f8fafc",
                                        "& fieldset": {
                                            borderColor: "#d1d5db",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "#6d28d9",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "#6d28d9",
                                            boxShadow:
                                                "0 0 8px rgba(109, 40, 217, 0.3)",
                                        },
                                    },
                                    "& .MuiInputLabel-root": {
                                        color: "#4b5563",
                                        "&.Mui-focused": {
                                            color: "#6d28d9",
                                        },
                                    },
                                    "& .MuiFormHelperText-root": {
                                        color: "#dc2626",
                                        fontSize: "0.8rem",
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={!!errors.address}
                                helperText={errors.address}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "12px",
                                        bgcolor: "#f8fafc",
                                        "& fieldset": {
                                            borderColor: "#d1d5db",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "#6d28d9",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "#6d28d9",
                                            boxShadow:
                                                "0 0 8px rgba(109, 40, 217, 0.3)",
                                        },
                                    },
                                    "& .MuiInputLabel-root": {
                                        color: "#4b5563",
                                        "&.Mui-focused": {
                                            color: "#6d28d9",
                                        },
                                    },
                                    "& .MuiFormHelperText-root": {
                                        color: "#dc2626",
                                        fontSize: "0.8rem",
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Price"
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={!!errors.price}
                                helperText={errors.price}
                                inputProps={{ step: "0.01", min: "0" }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "12px",
                                        bgcolor: "#f8fafc",
                                        "& fieldset": {
                                            borderColor: "#d1d5db",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "#6d28d9",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "#6d28d9",
                                            boxShadow:
                                                "0 0 8px rgba(109, 40, 217, 0.3)",
                                        },
                                    },
                                    "& .MuiInputLabel-root": {
                                        color: "#4b5563",
                                        "&.Mui-focused": {
                                            color: "#6d28d9",
                                        },
                                    },
                                    "& .MuiFormHelperText-root": {
                                        color: "#dc2626",
                                        fontSize: "0.8rem",
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Status"
                                name="status"
                                select
                                value={formData.status}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={!!errors.status}
                                helperText={errors.status}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "12px",
                                        bgcolor: "#f8fafc",
                                        "& fieldset": {
                                            borderColor: "#d1d5db",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "#6d28d9",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "#6d28d9",
                                            boxShadow:
                                                "0 0 8px rgba(109, 40, 217, 0.3)",
                                        },
                                    },
                                    "& .MuiInputLabel-root": {
                                        color: "#4b5563",
                                        "&.Mui-focused": {
                                            color: "#6d28d9",
                                        },
                                    },
                                    "& .MuiFormHelperText-root": {
                                        color: "#dc2626",
                                        fontSize: "0.8rem",
                                    },
                                }}
                            >
                                {statusOptions.map((option) => (
                                    <MenuItem
                                        key={option.value}
                                        value={option.value}
                                        sx={{
                                            "&:hover": {
                                                bgcolor: "#f3e8ff",
                                                color: "#6d28d9",
                                            },
                                        }}
                                    >
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Start Date"
                                name="startDate"
                                type="datetime-local"
                                value={formData.startDate}
                                onChange={handleChange}
                                fullWidth
                                error={!!errors.startDate}
                                helperText={errors.startDate}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "12px",
                                        bgcolor: "#f8fafc",
                                        "& fieldset": {
                                            borderColor: "#d1d5db",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "#6d28d9",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "#6d28d9",
                                            boxShadow:
                                                "0 0 8px rgba(109, 40, 217, 0.3)",
                                        },
                                    },
                                    "& .MuiInputLabel-root": {
                                        color: "#4b5563",
                                        "&.Mui-focused": {
                                            color: "#6d28d9",
                                        },
                                    },
                                    "& .MuiFormHelperText-root": {
                                        color: "#dc2626",
                                        fontSize: "0.8rem",
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="End Date"
                                name="endDate"
                                type="datetime-local"
                                value={formData.endDate}
                                onChange={handleChange}
                                fullWidth
                                error={!!errors.endDate}
                                helperText={errors.endDate}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "12px",
                                        bgcolor: "#f8fafc",
                                        "& fieldset": {
                                            borderColor: "#d1d5db",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "#6d28d9",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "#6d28d9",
                                            boxShadow:
                                                "0 0 8px rgba(109, 40, 217, 0.3)",
                                        },
                                    },
                                    "& .MuiInputLabel-root": {
                                        color: "#4b5563",
                                        "&.Mui-focused": {
                                            color: "#6d28d9",
                                        },
                                    },
                                    "& .MuiFormHelperText-root": {
                                        color: "#dc2626",
                                        fontSize: "0.8rem",
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Invoice URL"
                                name="invoiceUrl"
                                value={formData.invoiceUrl}
                                onChange={handleChange}
                                fullWidth
                                error={!!errors.invoiceUrl}
                                helperText={
                                    errors.invoiceUrl ||
                                    "Optional: URL to invoice document"
                                }
                                placeholder="https://example.com/invoice.pdf"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "12px",
                                        bgcolor: "#f8fafc",
                                        "& fieldset": {
                                            borderColor: "#d1d5db",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "#6d28d9",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "#6d28d9",
                                            boxShadow:
                                                "0 0 8px rgba(109, 40, 217, 0.3)",
                                        },
                                    },
                                    "& .MuiInputLabel-root": {
                                        color: "#4b5563",
                                        "&.Mui-focused": {
                                            color: "#6d28d9",
                                        },
                                    },
                                    "& .MuiFormHelperText-root": {
                                        color: errors.invoiceUrl
                                            ? "#dc2626"
                                            : "#6b7280",
                                        fontSize: "0.8rem",
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>
                )}

                {/* Tab 1: Client Info */}
                {activeTab === 1 && (
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: "#f1f5f9",
                            borderRadius: "12px",
                            boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                mb: 2,
                                color: "#6b7280",
                                fontStyle: "italic",
                            }}
                        >
                            Client information is read-only. To change the
                            client, create a new job.
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Client Name"
                                    value={getClientFieldValue(
                                        "name",
                                        "No client name provided"
                                    )}
                                    disabled
                                    fullWidth
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "12px",
                                            bgcolor: "#e5e7eb",
                                            "& fieldset": {
                                                borderColor: "#d1d5db",
                                            },
                                        },
                                        "& .MuiInputLabel-root": {
                                            color: "#4b5563",
                                        },
                                        "& .MuiInputBase-input.Mui-disabled": {
                                            color: formData.client?.name
                                                ? "#374151"
                                                : "#9ca3af",
                                            WebkitTextFillColor: formData.client
                                                ?.name
                                                ? "#374151"
                                                : "#9ca3af",
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Client Email"
                                    value={getClientFieldValue(
                                        "email",
                                        "No email address provided"
                                    )}
                                    disabled
                                    fullWidth
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "12px",
                                            bgcolor: "#e5e7eb",
                                            "& fieldset": {
                                                borderColor: "#d1d5db",
                                            },
                                        },
                                        "& .MuiInputLabel-root": {
                                            color: "#4b5563",
                                        },
                                        "& .MuiInputBase-input.Mui-disabled": {
                                            color: formData.client?.email
                                                ? "#374151"
                                                : "#9ca3af",
                                            WebkitTextFillColor: formData.client
                                                ?.email
                                                ? "#374151"
                                                : "#9ca3af",
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Client Phone"
                                    value={getClientFieldValue(
                                        "phoneNumber",
                                        "No phone number provided"
                                    )}
                                    disabled
                                    fullWidth
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "12px",
                                            bgcolor: "#e5e7eb",
                                            "& fieldset": {
                                                borderColor: "#d1d5db",
                                            },
                                        },
                                        "& .MuiInputLabel-root": {
                                            color: "#4b5563",
                                        },
                                        "& .MuiInputBase-input.Mui-disabled": {
                                            color: formData.client?.phoneNumber
                                                ? "#374151"
                                                : "#9ca3af",
                                            WebkitTextFillColor: formData.client
                                                ?.phoneNumber
                                                ? "#374151"
                                                : "#9ca3af",
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {errors.general && (
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 2,
                            p: 1.5,
                            bgcolor: "#fee2e2",
                            color: "#dc2626",
                            borderRadius: "8px",
                            textAlign: "center",
                            fontWeight: 500,
                        }}
                    >
                        {errors.general}
                    </Typography>
                )}

                <Box
                    sx={{
                        mt: 3,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Button
                        onClick={onClose}
                        disabled={loading}
                        sx={{
                            flex: 1,
                            py: 1.5,
                            borderRadius: "12px",
                            color: "#ffffff",
                            bgcolor: "#6b7280",
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": {
                                bgcolor: "#4b5563",
                                transform: "scale(1.05)",
                            },
                            "&:disabled": {
                                bgcolor: "#d1d5db",
                                color: "#9ca3af",
                            },
                            transition: "all 0.2s",
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading}
                        startIcon={loading && <CircularProgress size={20} />}
                        sx={{
                            flex: 1,
                            py: 1.5,
                            borderRadius: "12px",
                            background: "#6d28d9",
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": {
                                background: "#6d28d9",
                                transform: "scale(1.05)",
                            },
                            "&:disabled": {
                                background: "#d1d5db",
                                color: "#9ca3af",
                            },
                            transition: "all 0.2s",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        }}
                    >
                        {loading ? "Saving..." : "Save"}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default JobEditModal;
