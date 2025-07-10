import React, { useState } from "react";
import {
    Box,
    Typography,
    Chip,
    Button,
    useMediaQuery,
    useTheme,
    Card,
    CardContent,
    Stack,
    IconButton,
    Collapse,
    Grid,
    Divider,
    Avatar,
    CardActions,
    Tooltip,
} from "@mui/material";
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    LocationOn as LocationIcon,
    CalendarToday as CalendarIcon,
    AttachMoney as MoneyIcon,
    Work as WorkIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch (error) {
        return "N/A";
    }
};

const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase().trim();
    switch (normalizedStatus) {
        case "open":
            return "info";
        case "in_progress":
        case "in progress":
        case "inprogress":
            return "warning";
        case "completed":
        case "complete":
            return "success";
        case "cancelled":
        case "canceled":
        case "cancel":
            return "error";
        default:
            return "default";
    }
};

const formatStatus = (status) => {
    if (!status) return "UNKNOWN";

    const normalizedStatus = status.toLowerCase().trim();
    switch (normalizedStatus) {
        case "open":
            return "OPEN";
        case "in_progress":
        case "in progress":
        case "inprogress":
            return "IN PROGRESS";
        case "completed":
        case "complete":
            return "COMPLETED";
        case "cancelled":
        case "canceled":
        case "cancel":
            return "CANCELLED";
        default:
            return status.replace(/_/g, " ").toUpperCase();
    }
};

const SimpleJobList = ({ jobs = [] }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [expandedCards, setExpandedCards] = useState(new Set());

    // Enhanced breakpoints for better responsive design
    const isXSmall = useMediaQuery(theme.breakpoints.down("sm")); // < 600px
    const isSmall = useMediaQuery(theme.breakpoints.down("md")); // < 900px
    const isMedium = useMediaQuery(theme.breakpoints.down("lg")); // < 1200px
    const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg")); // 600px - 1200px

    const toggleCardExpansion = (jobId) => {
        const newExpanded = new Set(expandedCards);
        if (newExpanded.has(jobId)) {
            newExpanded.delete(jobId);
        } else {
            newExpanded.add(jobId);
        }
        setExpandedCards(newExpanded);
    };

    if (jobs.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 4 }}>
                <WorkIcon
                    sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    No jobs found
                </Typography>
                <Typography variant="body2" color="text.disabled">
                    Jobs will appear here when they are created
                </Typography>
            </Box>
        );
    }

    // Enhanced Mobile Card Layout (< 600px)
    if (isXSmall) {
        return (
            <Stack spacing={1.5}>
                {jobs.map((job, index) => (
                    <Card
                        key={job.id}
                        elevation={1}
                        sx={{
                            borderRadius: 2,
                            overflow: "hidden",
                            "&:active": {
                                transform: "scale(0.98)",
                            },
                            transition: "all 0.15s ease-in-out",
                        }}
                    >
                        {/* Compact Header */}
                        <Box
                            sx={{
                                p: 2,
                                pb: 1,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    mb: 1,
                                }}
                            >
                                <Box sx={{ flex: 1, mr: 1 }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: "0.9rem",
                                            lineHeight: 1.2,
                                            mb: 0.5,
                                        }}
                                    >
                                        #{index + 1}. {job.name}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <MoneyIcon
                                            sx={{
                                                fontSize: 16,
                                                color: "primary.main",
                                            }}
                                        />
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                fontWeight: 700,
                                                color: "primary.main",
                                                fontSize: "1rem",
                                            }}
                                        >
                                            {formatCurrency(
                                                job.price || job.bidAmount
                                            )}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Chip
                                    label={formatStatus(job.status)}
                                    size="small"
                                    color={getStatusColor(job.status)}
                                    variant="filled"
                                    sx={{
                                        fontSize: "0.65rem",
                                        height: 24,
                                        fontWeight: 600,
                                    }}
                                />
                            </Box>

                            {/* Quick Info Row */}
                            <Grid container spacing={1} sx={{ mt: 1 }}>
                                <Grid item xs={6}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                        }}
                                    >
                                        <LocationIcon
                                            sx={{
                                                fontSize: 14,
                                                color: "text.secondary",
                                            }}
                                        />
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "text.secondary",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {job.address || "No address"}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                        }}
                                    >
                                        <CalendarIcon
                                            sx={{
                                                fontSize: 14,
                                                color: "text.secondary",
                                            }}
                                        />
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {formatDate(job.startDate)}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Expandable Details */}
                        <Box>
                            <IconButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCardExpansion(job.id);
                                }}
                                sx={{
                                    width: "100%",
                                    borderRadius: 0,
                                    py: 1,
                                    borderTop: "1px solid",
                                    borderColor: "divider",
                                }}
                            >
                                <Typography variant="caption" sx={{ mr: 1 }}>
                                    {expandedCards.has(job.id)
                                        ? "Less Details"
                                        : "More Details"}
                                </Typography>
                                {expandedCards.has(job.id) ? (
                                    <ExpandLessIcon />
                                ) : (
                                    <ExpandMoreIcon />
                                )}
                            </IconButton>

                            <Collapse in={expandedCards.has(job.id)}>
                                <Box sx={{ p: 2, pt: 1, bgcolor: "grey.50" }}>
                                    <Stack spacing={1.5}>
                                        {job.client && (
                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ fontWeight: 600 }}
                                                >
                                                    CLIENT INFORMATION
                                                </Typography>
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ fontWeight: 500 }}
                                                    >
                                                        {job.client.name ||
                                                            "Unknown Client"}
                                                    </Typography>
                                                    {job.client.phone && (
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 0.5,
                                                                mt: 0.5,
                                                            }}
                                                        >
                                                            <PhoneIcon
                                                                sx={{
                                                                    fontSize: 14,
                                                                    color: "text.secondary",
                                                                }}
                                                            />
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                {
                                                                    job.client
                                                                        .phone
                                                                }
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {job.client.email && (
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 0.5,
                                                                mt: 0.5,
                                                            }}
                                                        >
                                                            <EmailIcon
                                                                sx={{
                                                                    fontSize: 14,
                                                                    color: "text.secondary",
                                                                }}
                                                            />
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                {
                                                                    job.client
                                                                        .email
                                                                }
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        )}

                                        {job.description && (
                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ fontWeight: 600 }}
                                                >
                                                    DESCRIPTION
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        mt: 0.5,
                                                        lineHeight: 1.4,
                                                    }}
                                                >
                                                    {job.description}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Button
                                            variant="contained"
                                            fullWidth
                                            size="medium"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(
                                                    `/jobs/contact/${job.client?.id}`
                                                );
                                            }}
                                            sx={{
                                                mt: 1,
                                                py: 1.5,
                                                fontWeight: 600,
                                                borderRadius: 2,
                                            }}
                                        >
                                            View Full Details
                                        </Button>
                                    </Stack>
                                </Box>
                            </Collapse>
                        </Box>
                    </Card>
                ))}
            </Stack>
        );
    }

    // Enhanced Tablet Card Layout (600px - 900px)
    if (isSmall) {
        return (
            <Grid container spacing={2}>
                {jobs.map((job, index) => (
                    <Grid item xs={12} sm={6} key={job.id}>
                        <Card
                            elevation={2}
                            sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                cursor: "pointer",
                                borderRadius: 2,
                                "&:hover": {
                                    boxShadow: 4,
                                    transform: "translateY(-2px)",
                                },
                                transition: "all 0.2s ease-in-out",
                            }}
                            onClick={() =>
                                navigate(`/jobs/contact/${job.client?.id}`)
                            }
                        >
                            <CardContent sx={{ flex: 1, p: 2.5 }}>
                                {/* Header with Avatar */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        mb: 2,
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            bgcolor: "primary.main",
                                            width: 40,
                                            height: 40,
                                            mr: 2,
                                            fontSize: "0.9rem",
                                            fontWeight: 600,
                                        }}
                                    >
                                        #{index + 1}
                                    </Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 600,
                                                fontSize: "1.1rem",
                                                lineHeight: 1.2,
                                                mb: 0.5,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {job.name}
                                        </Typography>
                                        <Chip
                                            label={formatStatus(job.status)}
                                            size="small"
                                            color={getStatusColor(job.status)}
                                            variant="filled"
                                            sx={{ fontSize: "0.7rem" }}
                                        />
                                    </Box>
                                </Box>

                                {/* Info Grid */}
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                            }}
                                        >
                                            <LocationIcon
                                                sx={{
                                                    fontSize: 18,
                                                    color: "text.secondary",
                                                }}
                                            />
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {job.address ||
                                                    "No address provided"}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                            }}
                                        >
                                            <CalendarIcon
                                                sx={{
                                                    fontSize: 18,
                                                    color: "text.secondary",
                                                }}
                                            />
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {formatDate(job.startDate)}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                            }}
                                        >
                                            <MoneyIcon
                                                sx={{
                                                    fontSize: 18,
                                                    color: "primary.main",
                                                }}
                                            />
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: "primary.main",
                                                }}
                                            >
                                                {formatCurrency(
                                                    job.price || job.bidAmount
                                                )}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>

                            <CardActions sx={{ p: 2, pt: 0 }}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(
                                            `/jobs/contact/${job.client?.id}`
                                        );
                                    }}
                                    sx={{
                                        py: 1,
                                        fontWeight: 600,
                                        borderRadius: 1.5,
                                    }}
                                >
                                    View Details
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    }

    // Enhanced Desktop/Large Tablet Table Layout
    return (
        <Box
            sx={{
                width: "100%",
                borderRadius: 0,
                bgcolor: "background.paper",
                boxShadow: 1,
                overflow: "hidden",
            }}
        >
            <Box
                sx={{
                    overflowX: "auto",
                    minWidth: isMedium ? "900px" : "auto",
                }}
            >
                {/* Enhanced Table Header */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        py: 1,
                        px: 3,
                        borderBottom: "2px solid",
                        borderColor: "divider",
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`,
                        gap: 2,
                        minWidth: isMedium ? "900px" : "auto",
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 700,
                            color: "text.primary",
                            minWidth: 40,
                            fontSize: "0.85rem",
                        }}
                    >
                        #
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 700,
                            color: "text.primary",
                            minWidth: isMedium ? 140 : 180,
                            fontSize: "0.85rem",
                        }}
                    >
                        JOB NAME
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 700,
                            color: "text.primary",
                            minWidth: 100,
                            fontSize: "0.85rem",
                        }}
                    >
                        STATUS
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 700,
                            color: "text.primary",
                            minWidth: isMedium ? 120 : 160,
                            fontSize: "0.85rem",
                        }}
                    >
                        ADDRESS
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 700,
                            color: "text.primary",
                            minWidth: 100,
                            fontSize: "0.85rem",
                        }}
                    >
                        DATE
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 700,
                            color: "text.primary",
                            textAlign: "right",
                            minWidth: 100,
                            flex: 1,
                            fontSize: "0.85rem",
                        }}
                    >
                        PRICE
                    </Typography>
                    <Box sx={{ minWidth: isMedium ? 100 : 120, ml: 2 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 700,
                                color: "text.primary",
                                fontSize: "0.85rem",
                                textAlign: "center",
                            }}
                        >
                            ACTIONS
                        </Typography>
                    </Box>
                </Box>

                {/* Enhanced Table Rows */}
                {jobs.map((job, index) => (
                    <Box
                        key={job.id}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            py: 1,
                            px: 3,
                            borderBottom:
                                index < jobs.length - 1 ? "1px solid" : "none",
                            borderColor: "divider",
                            "&:hover": {
                                bgcolor: "action.hover",
                                cursor: "pointer",
                            },
                            gap: 2,
                            minWidth: isMedium ? "900px" : "auto",
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                color: "text.secondary",
                                minWidth: 40,
                            }}
                        >
                            {index + 1}.
                        </Typography>

                        <Tooltip title={job.name} placement="top">
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 600,
                                    color: "text.primary",
                                    minWidth: isMedium ? 140 : 180,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {job.name}
                            </Typography>
                        </Tooltip>

                        <Box sx={{ minWidth: 100 }}>
                            <Chip
                                label={formatStatus(job.status)}
                                size="small"
                                color={getStatusColor(job.status)}
                                variant="filled"
                                sx={{
                                    fontSize: "0.7rem",
                                    height: 24,
                                    fontWeight: 600,
                                }}
                            />
                        </Box>

                        <Tooltip
                            title={job.address || "No address"}
                            placement="top"
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "text.secondary",
                                    minWidth: isMedium ? 120 : 160,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {job.address || "No address"}
                            </Typography>
                        </Tooltip>

                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", minWidth: 100 }}
                        >
                            {formatDate(job.startDate)}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                color: "primary.main",
                                textAlign: "right",
                                minWidth: 100,
                                flex: 1,
                                fontSize: "0.9rem",
                            }}
                        >
                            {formatCurrency(job.price || job.bidAmount)}
                        </Typography>

                        <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/jobs/contact/${job.client?.id}`);
                            }}
                            sx={{
                                ml: 2,
                                minWidth: isMedium ? 100 : 120,
                                fontSize: "0.75rem",
                                py: 0.75,
                                px: isMedium ? 1.5 : 2,
                                borderColor: "primary.main",
                                color: "primary.main",
                                fontWeight: 600,
                                borderRadius: 1.5,
                                "&:hover": {
                                    borderColor: "primary.dark",
                                    bgcolor: "primary.light",
                                    color: "white",
                                },
                            }}
                        >
                            {isMedium ? "View" : "View Details"}
                        </Button>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default SimpleJobList;
