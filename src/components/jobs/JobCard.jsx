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
} from "@mui/material";
import JobDetailsModal from "./JobDetailsModal";
import JobEditModal from "./JobEditModal";

const JOB_STATUS = {
    OPEN: "open",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
};

const getStatusChip = (status) => {
    switch (status) {
        case JOB_STATUS.OPEN:
            return { label: "Open", color: "info" };
        case JOB_STATUS.COMPLETED:
            return { label: "Completed", color: "success" };
        case JOB_STATUS.CANCELLED:
            return { label: "Cancelled", color: "default" };
        default:
            return { label: "Unknown", color: "default" };
    }
};

const formatDate = (dateStr) => {
    return dateStr ? new Date(dateStr).toLocaleDateString() : "N/A";
};

const JobCard = ({ job, onClick, onUpdate, onStatusChange }) => {
    const [openDetails, setOpenDetails] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);

    // Transform job data to match JobDetailsModal expectations
    const transformedJob = {
        ...job,
        name: job.leadName || job.client?.name || job.name || "Untitled Job",
        price: job.bidAmount || job.price || 0,
        progress: job.progress || null,
        dueDate: job.dueDate || null,
        completedDate: job.endDate || job.completedDate || null,
        startDate: job.startDate || null,
        address: job.address || "N/A",
        client: job.client || { name: "N/A" },
        status: job.status || "unknown",
    };

    const { label: statusLabel, color: statusColor } = getStatusChip(
        transformedJob.status
    );

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

    return (
        <>
            <Card
                sx={{
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    borderRadius: 3,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    backgroundColor: "background.paper",
                    "&:hover": {
                        transform: "translateY(-8px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    },
                    margin: 2,
                    overflow: "visible",
                }}
                onClick={handleCardClick}
            >
                <CardContent sx={{ padding: 3 }}>
                    {/* Card Header */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 3,
                        }}
                    >
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 600,
                                color: "text.primary",
                                letterSpacing: "-0.5px",
                            }}
                        >
                            {transformedJob.name}
                        </Typography>
                        <Chip
                            label={statusLabel}
                            color={statusColor}
                            size="medium"
                            sx={{
                                fontWeight: 500,
                                borderRadius: 2,
                                padding: "4px 8px",
                            }}
                        />
                    </Box>

                    {/* Main Content Grid */}
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontWeight: 500, mb: 0.5 }}
                            >
                                Client
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ color: "text.primary", fontWeight: 500 }}
                            >
                                {transformedJob.client?.name || "N/A"}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontWeight: 500, mb: 0.5 }}
                            >
                                Address
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ color: "text.primary" }}
                            >
                                {transformedJob.address}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontWeight: 500, mb: 0.5 }}
                            >
                                {transformedJob.status === JOB_STATUS.COMPLETED
                                    ? "End Date"
                                    : "Start Date"}
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ color: "text.primary" }}
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
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontWeight: 500, mb: 0.5 }}
                            >
                                Price
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    fontWeight: 600,
                                    color: "primary.main",
                                }}
                            >
                                $
                                {transformedJob.price?.toLocaleString() ||
                                    "N/A"}
                            </Typography>
                        </Grid>
                    </Grid>

                    {/* Progress Bar */}
                    {transformedJob.status === JOB_STATUS.IN_PROGRESS &&
                        typeof transformedJob.progress === "number" && (
                            <Box sx={{ my: 3 }}>
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
                                        sx={{ fontWeight: 500 }}
                                    >
                                        Progress: {transformedJob.progress}%
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Due:{" "}
                                        {formatDate(transformedJob.dueDate)}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={transformedJob.progress}
                                    sx={{
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: "grey.200",
                                        "& .MuiLinearProgress-bar": {
                                            borderRadius: 5,
                                            backgroundColor: "primary.main",
                                        },
                                    }}
                                />
                            </Box>
                        )}

                    <Divider sx={{ my: 3, backgroundColor: "grey.200" }} />

                    {/* Actions Footer */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <FormControl
                            size="small"
                            onClick={(e) => e.stopPropagation()}
                            sx={{ minWidth: 180 }}
                        >
                            <Select
                                value={transformedJob.status}
                                onChange={handleStatusChange}
                                size="small"
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
                                }}
                            >
                                <MenuItem value="open">Set as Open</MenuItem>

                                <MenuItem value="completed">
                                    Set as Completed
                                </MenuItem>
                                <MenuItem value="cancelled">
                                    Set as Cancelled
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            size="medium"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit();
                            }}
                            sx={{
                                minWidth: 120,
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 500,
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                "&:hover": {
                                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                                },
                            }}
                        >
                            Edit Job
                        </Button>
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
                onUpdate={onUpdate}
            />
        </>
    );
};

export default JobCard;
