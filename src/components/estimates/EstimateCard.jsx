import React, { useState } from "react";
import {
    Card,
    CardContent,
    Box,
    Typography,
    Grid,
    Button,
    FormControl,
    Select,
    MenuItem,
    Divider,
    CircularProgress,
} from "@mui/material";
import { format } from "date-fns";
import axios from "axios";
import CreateEstimateForm from "./CreateEstimateForm";

// Status values aligned with Prisma schema
const ESTIMATE_STATUS = {
    PENDING: "pending",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
};

// Function to get user-friendly labels for statuses
const getStatusLabel = (status) => {
    switch (status) {
        case ESTIMATE_STATUS.PENDING:
            return "Pending";
        case ESTIMATE_STATUS.ACCEPTED:
            return "Accepted";
        case ESTIMATE_STATUS.REJECTED:
            return "Rejected";
        default:
            return "Unknown";
    }
};

// Define the updateEstimate function with Prisma-compatible data structure
export const updateEstimate = async (id, estimateData) => {
    try {
        // Validate input ID
        if (!id) {
            throw new Error("Estimate ID is required");
        }

        // Filter out fields that are not in the Prisma schema
        const {
            client, // Remove nested client object
            clientId,
            createdAt,
            createdBy,
            price, // Not in schema
            name, // Not in schema
            ...validFields
        } = estimateData;

        // Create a proper Prisma-compatible update object
        const updateData = {
            ...validFields,
            updatedAt: new Date().toISOString(), // Add updatedAt timestamp
            bidAmount:
                estimateData.bidAmount !== undefined
                    ? Number(estimateData.bidAmount)
                    : undefined, // Ensure bidAmount is a number
            status: estimateData.status || ESTIMATE_STATUS.PENDING, // Default to pending
        };

        // Remove undefined fields to prevent Prisma errors
        Object.keys(updateData).forEach((key) => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        // Log the data being sent to the API for debugging
        console.log(`Updating estimate ${id} with data:`, updateData);

        // Make the API call
        const response = await axios.put(
            `http://localhost:5000/api/estimates/${id}`,
            updateData,
            {
                headers: {
                    "Content-Type": "application/json",
                    // Uncomment and modify if authentication is required
                    // "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
                },
            }
        );

        console.log(`Update successful for estimate ${id}:`, response.data);
        return response.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Failed to update estimate";
        console.error(`Error updating estimate ${id}:`, {
            message: errorMessage,
            status: error.response?.status,
            data: error.response?.data,
        });
        throw new Error(errorMessage);
    }
};

const formatDate = (dateStr) => {
    return dateStr ? format(new Date(dateStr), "MMM dd, yyyy") : "N/A";
};

const EstimateCard = ({ estimate, onClick, onViewClick, onUpdate }) => {
    const [openEdit, setOpenEdit] = useState(false);
    const [loading, setLoading] = useState(false);

    // Transform estimate data for consistency with Prisma schema
    const transformedEstimate = {
        ...estimate,
        name: estimate.client?.name || estimate.leadName || "Untitled Estimate",
        price: estimate.bidAmount || 0, // Map to bidAmount for display
        address: estimate.address || "N/A",
        client: estimate.client || { name: "N/A", phoneNumber: "", email: "" },
        status: estimate.status || ESTIMATE_STATUS.PENDING, // Align with schema
    };

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
        setLoading(true);

        try {
            const newStatus = event.target.value;

            // Create minimal update object with only necessary fields
            const updatedEstimate = {
                status: newStatus,
            };

            // Call the API to update the estimate
            const result = await updateEstimate(
                transformedEstimate.id,
                updatedEstimate
            );

            // Call the onUpdate function to update UI
            if (onUpdate) {
                onUpdate(result);
            }
        } catch (error) {
            console.error("Error updating estimate status:", error.message);
            // Show error notification to user
            alert(`Failed to update estimate status: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (updatedEstimate) => {
        setLoading(true);
        try {
            // Create minimal update object with only necessary fields
            const fieldUpdates = {
                leadName: updatedEstimate.leadName || undefined,
                address: updatedEstimate.address || undefined,
                scope: updatedEstimate.scope || undefined,
                bidAmount: updatedEstimate.bidAmount
                    ? Number(updatedEstimate.bidAmount)
                    : undefined,
                startDate: updatedEstimate.startDate || undefined,
                notes: updatedEstimate.notes || undefined,
                status: updatedEstimate.status || ESTIMATE_STATUS.PENDING,
            };

            // Call the API to update the estimate
            const result = await updateEstimate(
                transformedEstimate.id,
                fieldUpdates
            );

            // Update UI
            if (onUpdate) {
                onUpdate(result);
            }

            handleCloseEdit();
        } catch (error) {
            console.error("Error updating estimate:", error.message);
            // Show error notification to user
            alert(`Failed to update estimate: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const displayName = transformedEstimate.name;
    const displayAmount = transformedEstimate.price?.toLocaleString() || "N/A";

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
                            {displayName}
                        </Typography>
                        <Button
                            variant="outlined"
                            size="medium"
                            onClick={handleViewClick}
                            sx={{
                                minWidth: 120,
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 500,
                            }}
                        >
                            See Bid
                        </Button>
                    </Box>

                    {/* Main Content Grid */}
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontWeight: 500,
                                    mb: 0.5,
                                    display: "block",
                                }}
                            >
                                Client
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ color: "text.primary", fontWeight: 500 }}
                            >
                                {transformedEstimate.client?.name || "N/A"}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontWeight: 500,
                                    mb: 0.5,
                                    display: "block",
                                }}
                            >
                                Address
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ color: "text.primary" }}
                            >
                                {transformedEstimate.address}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontWeight: 500,
                                    mb: 0.5,
                                    display: "block",
                                }}
                            >
                                Start Date
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ color: "text.primary" }}
                            >
                                {formatDate(transformedEstimate.startDate)}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontWeight: 500,
                                    mb: 0.5,
                                    display: "block",
                                }}
                            >
                                Amount
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    fontWeight: 600,
                                    color: "primary.main",
                                }}
                            >
                                ${displayAmount}
                            </Typography>
                        </Grid>

                        {transformedEstimate.scope && (
                            <Grid item xs={12}>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        fontWeight: 500,
                                        mb: 0.5,
                                        display: "block",
                                    }}
                                >
                                    Scope
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ color: "text.primary" }}
                                >
                                    {transformedEstimate.scope}
                                </Typography>
                            </Grid>
                        )}
                    </Grid>

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
                                value={transformedEstimate.status}
                                onChange={handleStatusChange}
                                size="small"
                                disabled={loading}
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

                        <Box sx={{ display: "flex", gap: 2 }}>
                            <Button
                                variant="contained"
                                size="medium"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEdit();
                                }}
                                disabled={loading}
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
                                {loading ? (
                                    <CircularProgress
                                        size={20}
                                        color="inherit"
                                    />
                                ) : (
                                    "Edit Estimate"
                                )}
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <CreateEstimateForm
                open={openEdit}
                handleCloseForm={handleCloseEdit}
                handleFormSubmit={handleFormSubmit}
                formData={{
                    leadName: transformedEstimate.leadName || "",
                    address: transformedEstimate.address || "",
                    scope: transformedEstimate.scope || "",
                    bidAmount: transformedEstimate.bidAmount || "",
                    startDate: transformedEstimate.startDate || "",
                    notes: transformedEstimate.notes || "",
                    status:
                        transformedEstimate.status || ESTIMATE_STATUS.PENDING,
                    client: transformedEstimate.client || {
                        name: "",
                        phoneNumber: "",
                        email: "",
                    },
                }}
                editingEstimate={openEdit ? transformedEstimate : null}
                isLoading={loading}
            />
        </>
    );
};

export default EstimateCard;
