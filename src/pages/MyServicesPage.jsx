import { useState, useEffect } from "react";
import { Box, Typography, Paper, CircularProgress, List } from "@mui/material";

import { ServiceViewModal } from "../components/services/ServiceViewModal";
import { ServiceListItem } from "../components/services/ServiceListItem";

// Static JSON data (unchanged from provided code)
const staticServices = [
    {
        id: 1,
        name: "Emergency Plumbing Repair",
        description:
            "24/7 emergency plumbing services for urgent repairs, leaks, burst pipes, and clogs",
        category: "Emergency",
        price: "$150-300",
        duration: "Same day",
        status: "active",
        color: "#8A2BE2",
        skills: ["Emergency Response", "Leak Detection", "Pipe Repair"],
    },
    {
        id: 2,
        name: "Drain Cleaning & Unclogging",
        description:
            "Professional drain cleaning services using advanced equipment and techniques",
        category: "Maintenance",
        price: "$120-250",
        duration: "2-4 hours",
        status: "active",
        color: "#3498db",
        skills: ["Hydro Jetting", "Snake Cleaning", "Camera Inspection"],
    },
    {
        id: 3,
        name: "Toilet Installation & Repair",
        description:
            "Complete toilet services including installation, repair, and replacement of all types",
        category: "Installation",
        price: "$200-450",
        duration: "2-3 hours",
        status: "active",
        color: "#8A2BE2",
        skills: [
            "Toilet Installation",
            "Wax Ring Replacement",
            "Flush Mechanism",
        ],
    },
    {
        id: 4,
        name: "Water Heater Services",
        description:
            "Installation, repair, and maintenance of gas, electric, and tankless water heaters",
        category: "Installation",
        price: "$300-1200",
        duration: "4-6 hours",
        status: "active",
        color: "#3498db",
        skills: ["Gas Fitting", "Electric Wiring", "Tankless Systems"],
    },
    {
        id: 5,
        name: "Faucet & Fixture Installation",
        description:
            "Professional installation and repair of kitchen and bathroom faucets and fixtures",
        category: "Installation",
        price: "$100-350",
        duration: "1-2 hours",
        status: "active",
        color: "#8A2BE2",
        skills: ["Fixture Installation", "Valve Replacement", "Water Pressure"],
    },
    {
        id: 6,
        name: "Pipe Repair & Replacement",
        description:
            "Comprehensive pipe services including leak repair, repiping, and pipe replacement",
        category: "Repair",
        price: "$180-800",
        duration: "3-8 hours",
        status: "active",
        color: "#3498db",
        skills: ["Pipe Repair", "Repiping", "Leak Detection"],
    },
    {
        id: 7,
        name: "Bathroom Plumbing",
        description:
            "Complete bathroom plumbing installations and renovations for all fixtures",
        category: "Installation",
        price: "$500-2000",
        duration: "1-3 days",
        status: "active",
        color: "#8A2BE2",
        skills: ["Bathroom Renovation", "Fixture Installation", "Tile Work"],
    },
    {
        id: 8,
        name: "Kitchen Plumbing",
        description:
            "Kitchen plumbing services including sink installation, garbage disposal, and dishwasher connections",
        category: "Installation",
        price: "$250-750",
        duration: "2-4 hours",
        status: "active",
        color: "#3498db",
        skills: ["Sink Installation", "Garbage Disposal", "Dishwasher Hookup"],
    },
    {
        id: 9,
        name: "Sewer Line Services",
        description:
            "Sewer line cleaning, repair, and replacement using modern trenchless technology",
        category: "Repair",
        price: "$400-3000",
        duration: "4-12 hours",
        status: "active",
        color: "#3498db",
        skills: ["Sewer Cleaning", "Trenchless Repair", "Line Replacement"],
    },
    {
        id: 10,
        name: "Water Line Installation",
        description:
            "New water line installation and repair for residential and commercial properties",
        category: "Installation",
        price: "$600-2500",
        duration: "1-2 days",
        status: "active",
        color: "#3498db",
        skills: ["Water Line Installation", "Pressure Testing", "Excavation"],
    },
];

const MyServicesPage = () => {
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setServices(staticServices);
            setLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const handleView = (service) => {
        setSelectedService(service);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedService(null);
    };

    return (
        <Box>
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
                        <CircularProgress sx={{ color: "#8A2BE2" }} />
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
                            backgroundColor: "#ffffff",
                        }}
                    >
                        <List sx={{ p: 3 }}>
                            {services.map((service, index) => (
                                <ServiceListItem
                                    key={service.id}
                                    service={service}
                                    isLast={index === services.length - 1}
                                    onView={handleView}
                                />
                            ))}
                        </List>
                    </Paper>
                )}
            </Box>
            <ServiceViewModal
                open={modalOpen}
                onClose={handleCloseModal}
                service={selectedService}
            />
        </Box>
    );
};

export default MyServicesPage;
