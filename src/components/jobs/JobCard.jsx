import React, { useState } from "react";
import {
    Card,
    CardContent,
    Box,
    Typography,
    Chip,
    LinearProgress,
    Grid,
    Button,
    FormControl,
    Select,
    MenuItem,
    Divider,
    IconButton,
    Tooltip,
} from "@mui/material";
import {
    Edit as EditIcon,
    Visibility as ViewIcon,
    AttachMoney as MoneyIcon,
    Schedule as ScheduleIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
} from "@mui/icons-material";
import JobDetailsModal from "./JobDetailsModal";
import JobEditModal from "./JobEditModal";
import { toast } from "sonner";
import { updateJob } from "../../services/api";

const JOB_STATUS = {
    OPEN: "open",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
};

const LEAD_STATUS = {
    ON_THE_WAY: "on_the_way",
    HAS_ARRIVED: "has_arrived",
    JOB_STARTED: "job_started",
    JOB_COMPLETED: "job_completed",
    INVOICE_SENT: "invoice_sent",
    INVOICE_PAID: "invoice_paid",
    REQUEST_REVIEW: "request_review",
};

const ACTIVITY_OPTIONS = [
    { value: "", label: "-- Select Activity --" },
    { value: "on_the_way", label: "On the Way" },
    { value: "has_arrived", label: "Has Arrived" },
    { value: "job_started", label: "Job Started" },
    { value: "job_completed", label: "Job Completed" },
    { value: "invoice_sent", label: "Invoice Sent" },
    { value: "invoice_paid", label: "Invoice Paid" },
    { value: "request_review", label: "Request Review" },
];

const getStatusChip = (status) => {
    switch (status) {
        case JOB_STATUS.OPEN:
            return { label: "Open", color: "info", bgColor: "#e3f2fd" };
        case JOB_STATUS.IN_PROGRESS:
            return {
                label: "In Progress",
                color: "warning",
                bgColor: "#fff3e0",
            };
        case JOB_STATUS.COMPLETED:
            return { label: "Completed", color: "success", bgColor: "#e8f5e8" };
        case JOB_STATUS.CANCELLED:
            return { label: "Cancelled", color: "error", bgColor: "#ffebee" };
        default:
            return { label: "Unknown", color: "default", bgColor: "#f5f5f5" };
    }
};

const getLeadStatusLabel = (status) => {
    const activity = ACTIVITY_OPTIONS.find((option) => option.value === status);
    return activity ? activity.label : "Unknown";
};

const getLeadStatusValue = (label) => {
    const activity = ACTIVITY_OPTIONS.find((option) => option.label === label);
    return activity ? activity.value : "";
};

const formatDate = (dateStr) => {
    return dateStr ? new Date(dateStr).toLocaleDateString() : "N/A";
};

const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const JobCard = ({ job, onClick, onStatusChange }) => {
    const [openDetails, setOpenDetails] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [isUpdatingActivity, setIsUpdatingActivity] = useState(false);
    // Add local state to track current activity
    const [currentActivity, setCurrentActivity] = useState(
        job.leadStatus || getLeadStatusValue(job.activity) || ""
    );

    // Transform job data to match JobDetailsModal expectations
    const transformedJob = {
        ...job,
        name: job.name,
        price: job.bidAmount || job.price || 0,
        progress: job.progress || null,
        dueDate: job.dueDate || null,
        completedDate: job.endDate || job.completedDate || null,
        startDate: job.startDate || null,
        address: job.address || "N/A",
        client: job.client || { name: "N/A" },
        status: job.status || "unknown",
        leadStatus: currentActivity, // Use local state instead
        activity: getLeadStatusLabel(currentActivity), // Use local state
    };

    const {
        label: statusLabel,
        color: statusColor,
        bgColor,
    } = getStatusChip(transformedJob.status);

    const handleOpenDetails = () => setOpenDetails(true);
    const handleCloseDetails = () => setOpenDetails(false);
    const handleOpenEdit = () => setOpenEdit(true);
    const handleCloseEdit = () => setOpenEdit(false);

    const handleCardClick = () => {
        if (onClick) onClick();
        handleOpenDetails();
    };

    const handleStatusChange = (event) => {
        event.stopPropagation();
        const newStatus = event.target.value;
        if (onStatusChange) {
            onStatusChange(transformedJob.id, newStatus);
        }
    };

    const handleActivityChange = async (event) => {
        event.stopPropagation();
        const newActivityValue = event.target.value;
        const activityLabel = getLeadStatusLabel(newActivityValue);

        // Store previous value for rollback
        const previousValue = currentActivity;

        setIsUpdatingActivity(true);

        const activityData = {
            activity: activityLabel,
            jobId: job.id || transformedJob.id || "N/A",
            clientId: job.clientId || job.client?.id || "N/A",
            createdBy: job.createdBy || job.createdById || "N/A",
        };

        try {
            // 1. Update job in database
            const result = await updateJob(job.id, {
                activity: activityLabel,
            });

            console.log(result.data.activity);
            const updatedAction = result.data.activity;

            // 2. Update local state with the response from API
            const updatedActivityValue = getLeadStatusValue(updatedAction);
            setCurrentActivity(updatedActivityValue || newActivityValue);

            // 4. Send to N8N webhook (if URL is configured..............)
            if (import.meta.env.VITE_N8N_API_URL) {
                try {
                    const response = await fetch(
                        import.meta.env.VITE_N8N_API_URL,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                ...activityData,
                                activity: updatedAction, // Use the updated action from API
                            }),
                        }
                    );

                    if (!response.ok) {
                        console.warn(
                            "N8N webhook failed:",
                            response.status,
                            response.statusText
                        );
                    }
                } catch (webhookError) {
                    console.warn(
                        "N8N webhook error (non-critical):",
                        webhookError
                    );
                }
            }

            // Show success message with the actual updated action
            toast.success(`Activity updated to "${updatedAction}"`);
        } catch (error) {
            console.error("Error updating activity:", error);

            // Show user-friendly error message
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Failed to update activity. Please try again.";
            toast.error(errorMessage);

            // Reset to previous value since update failed
            setCurrentActivity(previousValue);
        } finally {
            setIsUpdatingActivity(false);
        }
    };

    return (
        <>
            <Card
                sx={{
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    borderRadius: 4,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    backgroundColor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                        borderColor: "primary.light",
                    },
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: `linear-gradient(90deg, ${bgColor}, transparent)`,
                    },
                }}
                onClick={handleCardClick}
            >
                <CardContent sx={{ padding: 3, paddingTop: 4 }}>
                    {/* Card Header */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 3,
                            gap: 2,
                        }}
                    >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    color: "text.primary",
                                    letterSpacing: "-0.5px",
                                    lineHeight: 1.2,
                                    mb: 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {transformedJob.name}
                            </Typography>
                        </Box>
                        <Chip
                            label={statusLabel}
                            color={statusColor}
                            size="medium"
                            sx={{
                                fontWeight: 600,
                                borderRadius: 2,
                                padding: "8px 12px",
                                height: "auto",
                                "& .MuiChip-label": {
                                    fontSize: "0.875rem",
                                },
                            }}
                        />
                    </Box>

                    {/* Main Content Grid */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 1,
                                }}
                            >
                                <PersonIcon
                                    sx={{
                                        fontSize: 18,
                                        color: "text.secondary",
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                    }}
                                >
                                    Client
                                </Typography>
                            </Box>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: "text.primary",
                                    fontWeight: 500,
                                    pl: 3,
                                }}
                            >
                                {transformedJob.client?.name || "N/A"}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 1,
                                }}
                            >
                                <LocationIcon
                                    sx={{
                                        fontSize: 18,
                                        color: "text.secondary",
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                    }}
                                >
                                    Address
                                </Typography>
                            </Box>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: "text.primary",
                                    pl: 3,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {transformedJob.address}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 1,
                                }}
                            >
                                <ScheduleIcon
                                    sx={{
                                        fontSize: 18,
                                        color: "text.secondary",
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                    }}
                                >
                                    {transformedJob.status ===
                                    JOB_STATUS.COMPLETED
                                        ? "End Date"
                                        : "Start Date"}
                                </Typography>
                            </Box>
                            <Typography
                                variant="body1"
                                sx={{ color: "text.primary", pl: 3 }}
                            >
                                {formatDate(
                                    transformedJob.status ===
                                        JOB_STATUS.COMPLETED
                                        ? transformedJob.completedDate
                                        : transformedJob.startDate
                                )}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 1,
                                }}
                            >
                                <MoneyIcon
                                    sx={{ fontSize: 18, color: "primary.main" }}
                                />
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                    }}
                                >
                                    Price
                                </Typography>
                            </Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: "primary.main",
                                    pl: 3,
                                }}
                            >
                                {formatCurrency(transformedJob.price)}
                            </Typography>
                        </Grid>
                    </Grid>

                    {/* Progress Bar */}
                    {transformedJob.status === JOB_STATUS.IN_PROGRESS &&
                        typeof transformedJob.progress === "number" && (
                            <Box sx={{ mb: 3 }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mb: 1,
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            color: "primary.main",
                                        }}
                                    >
                                        Progress: {transformedJob.progress}%
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ fontWeight: 500 }}
                                    >
                                        Due:{" "}
                                        {formatDate(transformedJob.dueDate)}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={transformedJob.progress}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: "grey.200",
                                        "& .MuiLinearProgress-bar": {
                                            borderRadius: 4,
                                            background:
                                                "linear-gradient(90deg, #4caf50, #66bb6a)",
                                        },
                                    }}
                                />
                            </Box>
                        )}

                    <Divider sx={{ mb: 3, backgroundColor: "divider" }} />

                    {/* Actions Footer */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 2,
                            flexWrap: "wrap",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                gap: 2,
                                flexWrap: "wrap",
                                flex: 1,
                            }}
                        >
                            <FormControl
                                size="small"
                                onClick={(e) => e.stopPropagation()}
                                sx={{ minWidth: 140 }}
                            >
                                <Select
                                    value={transformedJob.status}
                                    onChange={handleStatusChange}
                                    size="small"
                                    displayEmpty
                                    sx={{
                                        borderRadius: 2,
                                        backgroundColor: "background.default",
                                        "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "grey.300",
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline":
                                            {
                                                borderColor: "primary.main",
                                            },
                                        "& .MuiSelect-select": {
                                            fontWeight: 500,
                                        },
                                    }}
                                >
                                    <MenuItem value="open">Open</MenuItem>
                                    <MenuItem value="in_progress">
                                        In Progress
                                    </MenuItem>
                                    <MenuItem value="completed">
                                        Completed
                                    </MenuItem>
                                    <MenuItem value="cancelled">
                                        Cancelled
                                    </MenuItem>
                                </Select>
                            </FormControl>
                            {/* Activity Dropdown Section */}
                            <Box
                                sx={{
                                    mb: 3,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 600,
                                        color: "text.primary",
                                        minWidth: 60,
                                    }}
                                >
                                    Activity
                                </Typography>
                                <FormControl
                                    size="small"
                                    onClick={(e) => e.stopPropagation()}
                                    sx={{ minWidth: 180, flex: 1 }}
                                >
                                    <Select
                                        value={currentActivity} // Use local state directly
                                        onChange={handleActivityChange}
                                        size="small"
                                        displayEmpty
                                        disabled={isUpdatingActivity}
                                        renderValue={(selected) => {
                                            if (isUpdatingActivity) {
                                                return (
                                                    <em
                                                        style={{
                                                            color: "#666",
                                                            fontStyle: "normal",
                                                            fontSize:
                                                                "0.875rem",
                                                        }}
                                                    >
                                                        Updating...
                                                    </em>
                                                );
                                            }
                                            if (!selected) {
                                                return (
                                                    <em
                                                        style={{
                                                            color: "#999",
                                                            fontStyle: "normal",
                                                            fontSize:
                                                                "0.875rem",
                                                        }}
                                                    >
                                                        -- Select Activity --
                                                    </em>
                                                );
                                            }
                                            return getLeadStatusLabel(selected);
                                        }}
                                        sx={{
                                            borderRadius: 2,
                                            backgroundColor: isUpdatingActivity
                                                ? "grey.50"
                                                : "background.default",
                                            opacity: isUpdatingActivity
                                                ? 0.7
                                                : 1,
                                            "& .MuiOutlinedInput-notchedOutline":
                                                {
                                                    borderColor: "grey.300",
                                                },
                                            "&:hover .MuiOutlinedInput-notchedOutline":
                                                {
                                                    borderColor:
                                                        isUpdatingActivity
                                                            ? "grey.300"
                                                            : "primary.main",
                                                },
                                            "& .MuiSelect-select": {
                                                fontWeight: 500,
                                            },
                                        }}
                                    >
                                        {ACTIVITY_OPTIONS.map((activity) => (
                                            <MenuItem
                                                key={activity.value}
                                                value={activity.value}
                                                disabled={activity.value === ""}
                                                sx={{
                                                    fontStyle:
                                                        activity.value === ""
                                                            ? "italic"
                                                            : "normal",
                                                    color:
                                                        activity.value === ""
                                                            ? "text.secondary"
                                                            : "text.primary",
                                                    fontSize: "0.875rem",
                                                }}
                                            >
                                                {activity.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>

                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="View Details">
                                <IconButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDetails();
                                    }}
                                    sx={{
                                        backgroundColor: "grey.100",
                                        "&:hover": {
                                            backgroundColor: "grey.200",
                                        },
                                    }}
                                >
                                    <ViewIcon />
                                </IconButton>
                            </Tooltip>
                            {/* Conditionally render Edit button only when job is not completed or cancelled */}
                            {transformedJob.status !== JOB_STATUS.COMPLETED &&
                                transformedJob.status !==
                                    JOB_STATUS.CANCELLED && (
                                    <Button
                                        variant="contained"
                                        size="medium"
                                        startIcon={<EditIcon />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenEdit();
                                        }}
                                        sx={{
                                            minWidth: 100,
                                            borderRadius: 2,
                                            textTransform: "none",
                                            fontWeight: 600,
                                            boxShadow:
                                                "0 2px 8px rgba(25, 118, 210, 0.15)",
                                            background:
                                                "linear-gradient(135deg, #1976d2, #1565c0)",
                                            "&:hover": {
                                                boxShadow:
                                                    "0 4px 16px rgba(25, 118, 210, 0.25)",
                                                background:
                                                    "linear-gradient(135deg, #1565c0, #0d47a1)",
                                            },
                                        }}
                                    >
                                        Edit
                                    </Button>
                                )}
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <JobDetailsModal
                job={transformedJob}
                open={openDetails}
                handleClose={handleCloseDetails}
            />
            <JobEditModal
                job={transformedJob}
                open={openEdit}
                onClose={handleCloseEdit}
            />
        </>
    );
};

export default JobCard;
