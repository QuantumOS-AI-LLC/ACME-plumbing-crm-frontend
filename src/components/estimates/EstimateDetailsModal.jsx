import React from "react";
import {
    Dialog,
    Box,
    Typography,
    IconButton,
    Button,
    Chip,
    Divider,
    Avatar,
    Grid,
    Fade,
} from "@mui/material";
import {
    Close as CloseIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    AttachMoney as MoneyIcon,
    Schedule as ScheduleIcon,
    Description as DocIcon,
    Notes as NotesIcon,
} from "@mui/icons-material";
import { format } from "date-fns";

const EstimateDetailsModal = ({ open, onClose, estimate }) => {
    if (!estimate) return null;

    // Status configuration
    const getStatusConfig = (status) => {
        switch (status) {
            case "accepted":
                return {
                    color: "#4caf50",
                    bgColor: "#e8f5e9",
                    icon: "✓",
                };
            case "rejected":
                return {
                    color: "#f44336",
                    bgColor: "#ffebee",
                    icon: "✕",
                };
            default:
                return {
                    color: "#ff9800",
                    bgColor: "#fff3e0",
                    icon: "…",
                };
        }
    };

    const statusConfig = getStatusConfig(estimate.status);

    // Formatting helpers
    const formatDate = (dateStr) => {
        if (!dateStr) return "Not specified";
        return format(new Date(dateStr), "PPp");
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "Not specified";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    // Detail item component
    const DetailItem = ({ icon, label, value }) => (
        <Box
            sx={{
                display: "flex",
                alignItems: "flex-start",
                mb: 2,
                p: 1.5,
                borderRadius: "8px",
                backgroundColor: "rgba(0,0,0,0.02)",
                transition: "all 0.2s ease",
                "&:hover": {
                    backgroundColor: "rgba(0,0,0,0.05)",
                    transform: "translateY(-1px)",
                },
            }}
        >
            <Box
                sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    backgroundColor: "rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                    flexShrink: 0,
                }}
            >
                {icon}
            </Box>
            <Box>
                <Typography
                    variant="caption"
                    sx={{
                        color: "text.secondary",
                        display: "block",
                        fontWeight: 500,
                        letterSpacing: "0.5px",
                    }}
                >
                    {label}
                </Typography>
                <Typography
                    variant="body1"
                    sx={{
                        fontWeight: 500,
                        color: "text.primary",
                    }}
                >
                    {value || "Not specified"}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    maxHeight: "90vh",
                },
            }}
            TransitionComponent={Fade}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 3,
                    backgroundColor: "#f8f9fa",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        color: "text.primary",
                    }}
                >
                    Estimate Details
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Chip
                        label={
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <span style={{ marginRight: 6 }}>
                                    {statusConfig.icon}
                                </span>
                                {estimate.status || "pending"}
                            </Box>
                        }
                        sx={{
                            backgroundColor: statusConfig.bgColor,
                            color: statusConfig.color,
                            fontWeight: 600,
                            borderRadius: "6px",
                            mr: 2,
                            textTransform: "capitalize",
                        }}
                    />
                    <IconButton
                        onClick={onClose}
                        sx={{
                            backgroundColor: "rgba(0,0,0,0.05)",
                            "&:hover": {
                                backgroundColor: "rgba(0,0,0,0.1)",
                            },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3, overflowY: "auto" }}>
                <Grid container spacing={3}>
                    {/* Left Column */}
                    <Grid item xs={12} md={6}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 600,
                                mb: 2,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <DocIcon sx={{ mr: 1, color: "primary.main" }} />
                            Estimate Summary
                        </Typography>

                        <DetailItem
                            icon={<DocIcon sx={{ color: "primary.main" }} />}
                            label="Estimate Name"
                            value={estimate.leadName || "Untitled Estimate"}
                        />

                        <DetailItem
                            icon={<MoneyIcon sx={{ color: "primary.main" }} />}
                            label="Bid Amount"
                            value={formatCurrency(estimate.bidAmount)}
                        />

                        <DetailItem
                            icon={
                                <LocationIcon sx={{ color: "primary.main" }} />
                            }
                            label="Service Address"
                            value={estimate.address}
                        />

                        <DetailItem
                            icon={
                                <ScheduleIcon sx={{ color: "primary.main" }} />
                            }
                            label="Start Date"
                            value={formatDate(estimate.startDate)}
                        />
                    </Grid>

                    {/* Right Column */}
                    <Grid item xs={12} md={6}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 600,
                                mb: 2,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <PersonIcon sx={{ mr: 1, color: "primary.main" }} />
                            Client Information
                        </Typography>

                        {estimate.client ? (
                            <>
                                <DetailItem
                                    icon={
                                        <PersonIcon
                                            sx={{ color: "primary.main" }}
                                        />
                                    }
                                    label="Client Name"
                                    value={estimate.client.name}
                                />

                                <DetailItem
                                    icon={
                                        <EmailIcon
                                            sx={{ color: "primary.main" }}
                                        />
                                    }
                                    label="Email Address"
                                    value={estimate.client.email}
                                />

                                <DetailItem
                                    icon={
                                        <PhoneIcon
                                            sx={{ color: "primary.main" }}
                                        />
                                    }
                                    label="Phone Number"
                                    value={estimate.client.phoneNumber}
                                />
                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No client information available
                            </Typography>
                        )}
                    </Grid>
                </Grid>

                {/* Additional Info Section */}
                {(estimate.scope || estimate.notes) && (
                    <Box sx={{ mt: 4 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 600,
                                mb: 2,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <NotesIcon sx={{ mr: 1, color: "primary.main" }} />
                            Additional Details
                        </Typography>

                        <Grid container spacing={3}>
                            {estimate.scope && (
                                <Grid item xs={12} md={6}>
                                    <DetailItem
                                        icon={
                                            <DocIcon
                                                sx={{ color: "primary.main" }}
                                            />
                                        }
                                        label="Scope of Work"
                                        value={estimate.scope}
                                    />
                                </Grid>
                            )}
                            {estimate.notes && (
                                <Grid item xs={12} md={6}>
                                    <DetailItem
                                        icon={
                                            <NotesIcon
                                                sx={{ color: "primary.main" }}
                                            />
                                        }
                                        label="Internal Notes"
                                        value={estimate.notes}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                )}
            </Box>

            {/* Footer */}
            <Divider />
            <Box
                sx={{
                    p: 2,
                    display: "flex",
                    justifyContent: "flex-end",
                    backgroundColor: "#f8f9fa",
                }}
            >
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        minWidth: "120px",
                        borderRadius: "6px",
                        textTransform: "none",
                        fontWeight: 500,
                        boxShadow: "none",
                        "&:hover": {
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        },
                    }}
                >
                    Close
                </Button>
            </Box>
        </Dialog>
    );
};

export default EstimateDetailsModal;
