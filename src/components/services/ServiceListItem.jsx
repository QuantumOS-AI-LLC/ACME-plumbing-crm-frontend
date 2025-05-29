import {
    Visibility as ViewIcon,
    AccessTime as TimeIcon,
    AttachMoney as MoneyIcon,
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

export const ServiceListItem = ({ service, isLast, onView }) => {
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
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: "bold",
                                color: "#2c3e50",
                                mr: 2,
                            }}
                        >
                            {service.name}
                        </Typography>
                    }
                    secondary={
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "text.secondary",
                                    mb: 2,
                                    lineHeight: 1.5,
                                }}
                            >
                                {service.description}
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
                                        variant="body2"
                                        sx={{
                                            fontWeight: "bold",
                                            color: "#3498db",
                                        }}
                                    >
                                        {service.price}
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
                                        variant="body2"
                                        sx={{ color: "#3498db" }}
                                    >
                                        {service.duration}
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

                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 1,
                                    mt: 2,
                                }}
                            >
                                {service.skills
                                    .slice(0, 3)
                                    .map((skill, index) => (
                                        <Chip
                                            key={index}
                                            label={skill}
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
                            </Box>
                        </Box>
                    }
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
