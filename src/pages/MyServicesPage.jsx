import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Grid,
    Paper,
    Button,
    CircularProgress,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Rating,
    IconButton,
    Divider,
} from "@mui/material";
import {
    Edit as EditIcon,
    Visibility as ViewIcon,
    Star as StarIcon,
    AccessTime as TimeIcon,
    AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import PageHeader from "../components/common/PageHeader";

// Static JSON plumbing service data (unchanged)
const staticServices = [
    {
        id: 1,
        name: "Emergency Plumbing Repair",
        description:
            "24/7 emergency plumbing services for urgent repairs, leaks, burst pipes, and clogs",
        category: "Emergency",
        price: "$150-300",
        duration: "Same day",
        rating: 4.9,
        reviews: 127,
        status: "active",
        featured: true,
        icon: "🚨",
        color: "#8A2BE2", // Updated to primary color
        skills: ["Emergency Response", "Leak Detection", "Pipe Repair"],
        completedProjects: 243,
    },
    {
        id: 2,
        name: "Drain Cleaning & Unclogging",
        description:
            "Professional drain cleaning services using advanced equipment and techniques",
        category: "Maintenance",
        price: "$120-250",
        duration: "2-4 hours",
        rating: 4.8,
        reviews: 89,
        status: "active",
        featured: false,
        icon: "🌊",
        color: "#3498db", // Updated to secondary color
        skills: ["Hydro Jetting", "Snake Cleaning", "Camera Inspection"],
        completedProjects: 156,
    },
    {
        id: 3,
        name: "Toilet Installation & Repair",
        description:
            "Complete toilet services including installation, repair, and replacement of all types",
        category: "Installation",
        price: "$200-450",
        duration: "2-3 hours",
        rating: 4.7,
        reviews: 67,
        status: "active",
        featured: true,
        icon: "🚽",
        color: "#8A2BE2", // Updated to primary color
        skills: [
            "Toilet Installation",
            "Wax Ring Replacement",
            "Flush Mechanism",
        ],
        completedProjects: 98,
    },
    {
        id: 4,
        name: "Water Heater Services",
        description:
            "Installation, repair, and maintenance of gas, electric, and tankless water heaters",
        category: "Installation",
        price: "$300-1200",
        duration: "4-6 hours",
        rating: 4.8,
        reviews: 54,
        status: "active",
        featured: false,
        icon: "🔥",
        color: "#3498db", // Updated to secondary color
        skills: ["Gas Fitting", "Electric Wiring", "Tankless Systems"],
        completedProjects: 76,
    },
    {
        id: 5,
        name: "Faucet & Fixture Installation",
        description:
            "Professional installation and repair of kitchen and bathroom faucets and fixtures",
        category: "Installation",
        price: "$100-350",
        duration: "1-2 hours",
        rating: 4.9,
        reviews: 91,
        status: "active",
        featured: true,
        icon: "🚿",
        color: "#8A2BE2", // Updated to primary color
        skills: ["Fixture Installation", "Valve Replacement", "Water Pressure"],
        completedProjects: 134,
    },
    {
        id: 6,
        name: "Pipe Repair & Replacement",
        description:
            "Comprehensive pipe services including leak repair, repiping, and pipe replacement",
        category: "Repair",
        price: "$180-800",
        duration: "3-8 hours",
        rating: 4.6,
        reviews: 72,
        status: "active",
        featured: false,
        icon: "🔧",
        color: "#3498db", // Updated to secondary color
        skills: ["Pipe Repair", "Repiping", "Leak Detection"],
        completedProjects: 89,
    },
    {
        id: 7,
        name: "Bathroom Plumbing",
        description:
            "Complete bathroom plumbing installations and renovations for all fixtures",
        category: "Installation",
        price: "$500-2000",
        duration: "1-3 days",
        rating: 4.8,
        reviews: 43,
        status: "active",
        featured: true,
        icon: "🛁",
        color: "#8A2BE2", // Updated to primary color
        skills: ["Bathroom Renovation", "Fixture Installation", "Tile Work"],
        completedProjects: 67,
    },
    {
        id: 8,
        name: "Kitchen Plumbing",
        description:
            "Kitchen plumbing services including sink installation, garbage disposal, and dishwasher connections",
        category: "Installation",
        price: "$250-750",
        duration: "2-4 hours",
        rating: 4.7,
        reviews: 58,
        status: "active",
        featured: false,
        icon: "🍽️",
        color: "#3498db", // Updated to secondary color
        skills: ["Sink Installation", "Garbage Disposal", "Dishwasher Hookup"],
        completedProjects: 84,
    },
    {
        id: 9,
        name: "Sewer Line Services",
        description:
            "Sewer line cleaning, repair, and replacement using modern trenchless technology",
        category: "Repair",
        price: "$400-3000",
        duration: "4-12 hours",
        rating: 4.5,
        reviews: 31,
        status: "active",
        featured: false,
        icon: "🕳️",
        color: "#3498db", // Updated to secondary color
        skills: ["Sewer Cleaning", "Trenchless Repair", "Line Replacement"],
        completedProjects: 45,
    },
    {
        id: 10,
        name: "Water Line Installation",
        description:
            "New water line installation and repair for residential and commercial properties",
        category: "Installation",
        price: "$600-2500",
        duration: "1-2 days",
        rating: 4.6,
        reviews: 38,
        status: "active",
        featured: false,
        icon: "💧",
        color: "#3498db", // Updated to secondary color
        skills: ["Water Line Installation", "Pressure Testing", "Excavation"],
        completedProjects: 52,
    },
];

const ServiceListItem = ({ service, isLast }) => {
    // Simplified category color mapping using only primary and secondary colors
    const getCategoryColor = (category) => {
        switch (category) {
            case "Emergency":
            case "Installation":
                return "#8A2BE2"; // Primary color
            case "Repair":
            case "Maintenance":
                return "#3498db"; // Secondary color
            default:
                return "#8A2BE2"; // Default to primary
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
                        backgroundColor: "rgba(138, 43, 226, 0.02)", // Light purple tint on hover
                        transform: "translateX(8px)",
                    },
                }}
            >
                <ListItemIcon sx={{ minWidth: 60, mt: 1 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: "12px",
                            background: service.color, // Uses updated service color
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.5rem",
                            boxShadow: "0 4px 12px rgba(138, 43, 226, 0.15)",
                        }}
                    >
                        {service.icon}
                    </Box>
                </ListItemIcon>

                <ListItemText
                    sx={{ pr: 2 }}
                    primary={
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1,
                            }}
                        >
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
                            {service.featured && (
                                <Chip
                                    icon={
                                        <StarIcon
                                            sx={{
                                                fontSize: 14,
                                                color: "#ffffff",
                                            }}
                                        />
                                    }
                                    label="Featured"
                                    size="small"
                                    sx={{
                                        backgroundColor: "#8A2BE2", // Primary color
                                        color: "#ffffff", // Neutral white
                                        fontWeight: "bold",
                                        fontSize: "0.7rem",
                                        height: 24,
                                    }}
                                />
                            )}
                        </Box>
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
                                    />{" "}
                                    {/* Secondary color */}
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
                                    />{" "}
                                    {/* Secondary color */}
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
                                        color: "#ffffff", // Neutral white
                                        fontWeight: "500",
                                        fontSize: "0.7rem",
                                    }}
                                />
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <Rating
                                        value={service.rating}
                                        readOnly
                                        size="small"
                                        sx={{ mr: 1 }}
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "text.secondary" }}
                                    >
                                        {service.rating} ({service.reviews}{" "}
                                        reviews)
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary" }}
                                >
                                    {service.completedProjects} projects
                                    completed
                                </Typography>
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
                                                borderColor: "#8A2BE2", // Primary color
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
                            sx={{
                                backgroundColor: "#8A2BE2", // Primary color
                                borderRadius: "8px",
                                textTransform: "none",
                                fontWeight: "bold",
                                px: 2,
                                color: "#ffffff", // Neutral white
                                "&:hover": {
                                    backgroundColor: "#6a1bb5", // Darker shade of primary
                                },
                            }}
                        >
                            View
                        </Button>
                        <IconButton
                            size="small"
                            sx={{
                                backgroundColor: "rgba(138, 43, 226, 0.1)", // Light primary tint
                                color: "#8A2BE2", // Primary color
                                borderRadius: "8px",
                                "&:hover": {
                                    backgroundColor: "rgba(138, 43, 226, 0.2)",
                                },
                            }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
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

const MyServicesPage = () => {
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setServices(staticServices);
            setLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const totalProjects = services.reduce(
        (sum, service) => sum + service.completedProjects,
        0
    );
    const avgRating =
        services.length > 0
            ? (
                  services.reduce((sum, service) => sum + service.rating, 0) /
                  services.length
              ).toFixed(1)
            : 0;

    return (
        <Box>
            <PageHeader
                title="My Plumbing Services"
                action={true}
                actionText="Add Service"
                onAction={() => console.log("Add Service clicked")}
            />

            {/* Stats Overview */}
            <Box sx={{ mb: 4, mt: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            sx={{
                                p: 3,
                                textAlign: "center",
                                backgroundColor: "#8A2BE2", // Primary color
                                color: "#ffffff", // Neutral white
                                borderRadius: "16px",
                            }}
                        >
                            <Typography
                                variant="h4"
                                sx={{ fontWeight: "bold", mb: 1 }}
                            >
                                {services.length}
                            </Typography>
                            <Typography variant="body2">
                                Total Services
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            sx={{
                                p: 3,
                                textAlign: "center",
                                backgroundColor: "#3498db", // Secondary color
                                color: "#ffffff", // Neutral white
                                borderRadius: "16px",
                            }}
                        >
                            <Typography
                                variant="h4"
                                sx={{ fontWeight: "bold", mb: 1 }}
                            >
                                {services.filter((s) => s.featured).length}
                            </Typography>
                            <Typography variant="body2">Featured</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            sx={{
                                p: 3,
                                textAlign: "center",
                                backgroundColor: "#8A2BE2", // Primary color
                                color: "#ffffff", // Neutral white
                                borderRadius: "16px",
                            }}
                        >
                            <Typography
                                variant="h4"
                                sx={{ fontWeight: "bold", mb: 1 }}
                            >
                                {avgRating}
                            </Typography>
                            <Typography variant="body2">Avg Rating</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            sx={{
                                p: 3,
                                textAlign: "center",
                                backgroundColor: "#3498db", // Secondary color
                                color: "#ffffff", // Neutral white
                                borderRadius: "16px",
                            }}
                        >
                            <Typography
                                variant="h4"
                                sx={{ fontWeight: "bold", mb: 1 }}
                            >
                                {totalProjects}+
                            </Typography>
                            <Typography variant="body2">Projects</Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ mt: 3 }}>
                {loading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: 200,
                        }}
                    >
                        <CircularProgress sx={{ color: "#8A2BE2" }} />{" "}
                        {/* Primary color */}
                    </Box>
                ) : services.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 5 }}>
                        <Typography variant="body1">
                            No services available.
                        </Typography>
                    </Box>
                ) : (
                    <Paper
                        sx={{
                            borderRadius: "16px",
                            overflow: "hidden",
                            boxShadow: "0 10px 30px rgba(138, 43, 226, 0.1)",
                            border: "1px solid rgba(138, 43, 226, 0.1)",
                            backgroundColor: "#ffffff", // Neutral white
                        }}
                    >
                        <List sx={{ p: 3 }}>
                            {services.map((service, index) => (
                                <ServiceListItem
                                    key={service.id}
                                    service={service}
                                    isLast={index === services.length - 1}
                                />
                            ))}
                        </List>
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default MyServicesPage;
