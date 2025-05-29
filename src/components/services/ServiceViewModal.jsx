import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    Chip,
    List,
    ListItem,
    ListItemText,
    Button,
} from "@mui/material";
import {
    AccessTime as TimeIcon,
    AttachMoney as MoneyIcon,
    Add as AddIcon,
} from "@mui/icons-material";
import { useState } from "react";

export const ServiceViewModal = ({ open, onClose, service }) => {
    const [addedServices, setAddedServices] = useState([]);

    if (!service) return null;

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

    // Parse price range to get minimum value for calculation
    const parsePrice = (price) => {
        const minPrice = parseFloat(price.replace("$", "").split("-")[0]);
        return isNaN(minPrice) ? 0 : minPrice;
    };

    // Handle adding a service to the list
    const handleAddService = () => {
        setAddedServices([
            ...addedServices,
            {
                name: service.name,
                price: parsePrice(service.price),
            },
        ]);
    };

    // Calculate total amount
    const totalAmount = addedServices.reduce((sum, svc) => sum + svc.price, 0);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: "bold", color: "#2c3e50" }}
                    >
                        {service.name}
                    </Typography>
                    <IconButton
                        onClick={handleAddService}
                        sx={{
                            color: "#8A2BE2",
                            "&:hover": {
                                backgroundColor: "rgba(138, 43, 226, 0.1)",
                            },
                        }}
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography
                        variant="body1"
                        sx={{ color: "text.secondary", lineHeight: 1.5 }}
                    >
                        {service.description}
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <MoneyIcon
                            sx={{ fontSize: 16, mr: 0.5, color: "#3498db" }}
                        />
                        <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold", color: "#3498db" }}
                        >
                            {service.price}
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <TimeIcon
                            sx={{ fontSize: 16, mr: 0.5, color: "#3498db" }}
                        />
                        <Typography variant="body2" sx={{ color: "#3498db" }}>
                            {service.duration}
                        </Typography>
                    </Box>
                    <Chip
                        label={service.category}
                        size="small"
                        sx={{
                            backgroundColor: getCategoryColor(service.category),
                            color: "#ffffff",
                            fontWeight: "500",
                            fontSize: "0.7rem",
                        }}
                    />
                </Box>
                {addedServices.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: "bold", mb: 1 }}
                        >
                            Added Services
                        </Typography>
                        <List dense>
                            {addedServices.map((svc, index) => (
                                <ListItem key={index}>
                                    <ListItemText
                                        primary={svc.name}
                                        secondary={`$${svc.price}`}
                                        primaryTypographyProps={{
                                            variant: "body2",
                                            fontWeight: "medium",
                                        }}
                                        secondaryTypographyProps={{
                                            variant: "body2",
                                            color: "#3498db",
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                        <Box sx={{ mt: 2, textAlign: "right" }}>
                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: "bold", color: "#2c3e50" }}
                            >
                                Total: ${totalAmount.toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    sx={{
                        color: "#8A2BE2",
                        textTransform: "none",
                        fontWeight: "bold",
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};
