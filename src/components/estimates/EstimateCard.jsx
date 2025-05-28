import React, { useState } from "react";
import {
    Card,
    CardContent,
    Box,
    Typography,
    Chip,
    Grid,
    Button,
    FormControl,
    Select,
    MenuItem,
    Divider,
    IconButton,
    Tooltip,
    CircularProgress,
} from "@mui/material";
import {
    Edit as EditIcon,
    Visibility as ViewIcon,
    AttachMoney as MoneyIcon,
    Schedule as ScheduleIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { updateEstimate } from "../../services/api";
import CreateEstimateForm from "./CreateEstimateForm";
import { useNotifications } from "../../contexts/NotificationContext"; // Add this import
import { toast } from "sonner";

const ESTIMATE_STATUS = {
    PENDING: "pending",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
};

const getStatusChip = (status) => {
    switch (status) {
        case ESTIMATE_STATUS.PENDING:
            return { label: "Pending", color: "warning", bgColor: "#fff3e0" };
        case ESTIMATE_STATUS.ACCEPTED:
            return { label: "Accepted", color: "success", bgColor: "#e8f5e8" };
        case ESTIMATE_STATUS.REJECTED:
            return { label: "Rejected", color: "error", bgColor: "#ffebee" };
        default:
            return { label: "Unknown", color: "default", bgColor: "#f5f5f5" };
    }
};

const formatDate = (dateStr) => {
    return dateStr ? format(new Date(dateStr), "MMM dd, yyyy") : "N/A";
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

const EstimateCard = ({ estimate, onClick, onViewClick, onUpdate }) => {
    const [openEdit, setOpenEdit] = useState(false);
    const [loading, setLoading] = useState(false);
    const { addNotification } = useNotifications(); // Add this line

    const transformedEstimate = {
        ...estimate,
        name:
            estimate?.leadName || estimate?.client?.name || "Untitled Estimate",
        price: estimate?.bidAmount || 0,
        address: estimate?.address || "N/A",
        client: estimate?.client || {
            id: "",
            name: estimate?.leadName || "N/A",
            phoneNumber: "",
            email: "",
        },
        status: estimate?.status || ESTIMATE_STATUS.PENDING,
    };

    const {
        label: statusLabel,
        color: statusColor,
        bgColor,
    } = getStatusChip(transformedEstimate.status);

    const handleOpenEdit = () => setOpenEdit(true);
    const handleCloseEdit = () => setOpenEdit(false);

    const handleCardClick = () => {
        if (onClick) {
            onClick(transformedEstimate);
        }
    };

    const handleViewClick = (e) => {
        if (onViewClick) {
            e.stopPropagation();
            onViewClick(transformedEstimate);
        }
    };

    const handleStatusChange = async (event) => {
        event.stopPropagation();
        const newStatus = event.target.value;
        const previousStatus = transformedEstimate.status;

        setLoading(true);

        try {
            const updatedEstimate = { status: newStatus };
            const result = await updateEstimate(
                transformedEstimate.id,
                updatedEstimate
            );

            // Create notification ONLY when status changes to ACCEPTED
            if (newStatus === ESTIMATE_STATUS.ACCEPTED) {
                const acceptedNotification = {
                    id: `estimate-accepted-${
                        transformedEstimate.id
                    }-${Date.now()}`,
                    title: "Estimate Accepted! 🎉",
                    message: `Estimate "${
                        transformedEstimate.name
                    }" has been accepted by the client. Amount: ${formatCurrency(
                        transformedEstimate.price
                    )}`,
                    createdAt: new Date().toISOString(),
                    isRead: false,
                    relatedId: transformedEstimate.id,
                };

                // Add notification to context (this will trigger toast)
                addNotification(acceptedNotification);
            }

            onUpdate(result.data);
            toast.success(
                `Status updated to "${getStatusChip(newStatus).label}"`
            );
        } catch (error) {
            console.error("Error updating estimate status:", error.message);
            toast.error(`Failed to update status: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = (updatedEstimate) => {
        onUpdate(updatedEstimate);
        handleCloseEdit();
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
                                {transformedEstimate.name}
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
                                {transformedEstimate.client?.name || "N/A"}
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
                                {transformedEstimate.address}
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
                                    Start Date
                                </Typography>
                            </Box>
                            <Typography
                                variant="body1"
                                sx={{ color: "text.primary", pl: 3 }}
                            >
                                {formatDate(transformedEstimate.startDate)}
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
                                    Bid Amount
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
                                {formatCurrency(transformedEstimate.price)}
                            </Typography>
                        </Grid>

                        {transformedEstimate.scope && (
                            <Grid item xs={12}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        mb: 1,
                                    }}
                                >
                                    <AssignmentIcon
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
                                        Scope
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: "text.primary",
                                        pl: 3,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                    }}
                                >
                                    {transformedEstimate.scope}
                                </Typography>
                            </Grid>
                        )}
                    </Grid>

                    <Divider sx={{ mb: 3, backgroundColor: "divider" }} />

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 2,
                            flexWrap: "wrap",
                        }}
                    >
                        <FormControl
                            size="small"
                            onClick={(e) => e.stopPropagation()}
                            sx={{ minWidth: 140 }}
                        >
                            <Select
                                value={transformedEstimate.status}
                                onChange={handleStatusChange}
                                size="small"
                                disabled={loading}
                                displayEmpty
                                renderValue={(selected) => {
                                    if (loading) {
                                        return (
                                            <em
                                                style={{
                                                    color: "#666",
                                                    fontStyle: "normal",
                                                }}
                                            >
                                                Updating...
                                            </em>
                                        );
                                    }
                                    return getStatusChip(selected).label;
                                }}
                                sx={{
                                    borderRadius: 2,
                                    backgroundColor: loading
                                        ? "grey.50"
                                        : "background.default",
                                    opacity: loading ? 0.7 : 1,
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "grey.300",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline":
                                        {
                                            borderColor: loading
                                                ? "grey.300"
                                                : "primary.main",
                                        },
                                    "& .MuiSelect-select": {
                                        fontWeight: 500,
                                    },
                                }}
                                startAdornment={
                                    loading ? (
                                        <CircularProgress
                                            size={16}
                                            sx={{ mr: 1 }}
                                            color="inherit"
                                        />
                                    ) : null
                                }
                            >
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="accepted">Accepted</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                            </Select>
                        </FormControl>

                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="View Details">
                                <IconButton
                                    onClick={handleViewClick}
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
                            {transformedEstimate.status ===
                                ESTIMATE_STATUS.PENDING && (
                                <Button
                                    variant="contained"
                                    size="medium"
                                    startIcon={<EditIcon />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEdit();
                                    }}
                                    disabled={loading}
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
                                    {loading ? (
                                        <CircularProgress
                                            size={20}
                                            color="inherit"
                                        />
                                    ) : (
                                        "Edit"
                                    )}
                                </Button>
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {openEdit && (
                <CreateEstimateForm
                    open={true}
                    handleCloseForm={handleCloseEdit}
                    handleFormSubmit={handleFormSubmit}
                    estimate={estimate}
                />
            )}
        </>
    );
};

export default EstimateCard;
