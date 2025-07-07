import {
    Visibility as ViewIcon,
    AccessTime as TimeIcon,
    AttachMoney as MoneyIcon,
    Delete as DeleteIcon,
} from "@mui/icons-material";
import {
    Box,
    Button,
    Chip,
    Divider,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Typography,
} from "@mui/material";

export const ServiceListItem = ({ service, isLast, onView, onDelete }) => {
    const getCategoryColor = (category) => {
        switch (category) {
            case "Emergency":
            case "Installation":
                return "#8A2BE2";
            case "Repair":
            case "Maintenance":
                return "#3498db";
            default:
                return "#8A2BE2";
        }
    };

    // Format price for display
    const formatPrice = (price) => {
        if (typeof price === "number") {
            return `$${price.toFixed(2)}`;
        }
        return price || "N/A";
    };

    // Get tags/skills for display (handle both old and new data structure)
    const getDisplayTags = () => {
        if (service.tags && service.tags.length > 0) {
            return service.tags;
        }
        if (service.skills && service.skills.length > 0) {
            return service.skills;
        }
        return [];
    };

    const displayTags = getDisplayTags();

    return (
        <>
            <ListItem
                sx={{
                    py: 3,
                    px: 0,
                    alignItems: "flex-start",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        backgroundColor: "rgba(138, 43, 226, 0.02)",
                        transform: "translateX(8px)",
                    },
                }}
            >
                <ListItemText
                    sx={{ pr: 2 }}
                    primary={
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1,
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: "bold",
                                    color: "#2c3e50",
                                }}
                            >
                                {service.name}
                            </Typography>
                            {service.status && (
                                <Chip
                                    label={service.status}
                                    size="small"
                                    sx={{
                                        backgroundColor:
                                            service.status === "active"
                                                ? "#e8f5e9"
                                                : "#ffebee",
                                        color:
                                            service.status === "active"
                                                ? "#4caf50"
                                                : "#f44336",
                                        fontWeight: 500,
                                        fontSize: "0.7rem",
                                        textTransform: "capitalize",
                                    }}
                                />
                            )}
                        </Box>
                    }
                    secondary={
                        <Box>
                            <Typography
                                component="span"
                                variant="body2"
                                sx={{
                                    color: "text.secondary",
                                    mb: 2,
                                    lineHeight: 1.5,
                                    display: "block",
                                }}
                            >
                                {service.description ||
                                    "No description available"}
                            </Typography>

                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 2,
                                    mb: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <MoneyIcon
                                        sx={{
                                            fontSize: 16,
                                            mr: 0.5,
                                            color: "#3498db",
                                        }}
                                    />
                                    <Typography
                                        component="span"
                                        variant="body2"
                                        sx={{
                                            fontWeight: "bold",
                                            color: "#3498db",
                                        }}
                                    >
                                        {formatPrice(service.price)}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <TimeIcon
                                        sx={{
                                            fontSize: 16,
                                            mr: 0.5,
                                            color: "#3498db",
                                        }}
                                    />
                                    <Typography
                                        component="span"
                                        variant="body2"
                                        sx={{ color: "#3498db" }}
                                    >
                                        {service.duration || "Not specified"}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={service.category}
                                    size="small"
                                    sx={{
                                        backgroundColor: getCategoryColor(
                                            service.category
                                        ),
                                        color: "#ffffff",
                                        fontWeight: "500",
                                        fontSize: "0.7rem",
                                    }}
                                />
                            </Box>

                            {displayTags.length > 0 && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 1,
                                        mt: 2,
                                    }}
                                >
                                    {displayTags
                                        .slice(0, 3)
                                        .map((tag, index) => (
                                            <Chip
                                                key={index}
                                                label={tag}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontSize: "0.7rem",
                                                    height: 24,
                                                    borderColor: "#8A2BE2",
                                                    color: "#8A2BE2",
                                                }}
                                            />
                                        ))}
                                    {displayTags.length > 3 && (
                                        <Chip
                                            label={`+${
                                                displayTags.length - 3
                                            } more`}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                fontSize: "0.7rem",
                                                height: 24,
                                                borderColor: "#8A2BE2",
                                                color: "#8A2BE2",
                                                opacity: 0.7,
                                            }}
                                        />
                                    )}
                                </Box>
                            )}

                            {service.includedServices &&
                                service.includedServices.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography
                                            component="span"
                                            variant="caption"
                                            sx={{
                                                color: "text.secondary",
                                                fontWeight: 500,
                                                display: "block",
                                                mb: 0.5,
                                            }}
                                        >
                                            Includes:{" "}
                                            {service.includedServices
                                                .slice(0, 2)
                                                .join(", ")}
                                            {service.includedServices.length >
                                                2 &&
                                                ` +${
                                                    service.includedServices
                                                        .length - 2
                                                } more`}
                                        </Typography>
                                    </Box>
                                )}
                        </Box>
                    }
                    secondaryTypographyProps={{
                        component: "div",
                    }}
                />

                <ListItemSecondaryAction>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => onView(service)}
                            sx={{
                                backgroundColor: "#8A2BE2",
                                borderRadius: "8px",
                                textTransform: "none",
                                fontWeight: "bold",
                                px: 2,
                                color: "#ffffff",
                                "&:hover": {
                                    backgroundColor: "#6a1bb5",
                                },
                            }}
                        >
                            View
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => onDelete && onDelete(service)}
                            sx={{
                                borderColor: "#f44336",
                                color: "#f44336",
                                borderRadius: "8px",
                                textTransform: "none",
                                fontWeight: "bold",
                                px: 2,
                                "&:hover": {
                                    backgroundColor: "#f44336",
                                    color: "#ffffff",
                                    borderColor: "#f44336",
                                },
                            }}
                        >
                            Delete
                        </Button>
                    </Box>
                </ListItemSecondaryAction>
            </ListItem>
            {!isLast && (
                <Divider
                    sx={{ my: 1, backgroundColor: "rgba(138, 43, 226, 0.1)" }}
                />
            )}
        </>
    );
};
