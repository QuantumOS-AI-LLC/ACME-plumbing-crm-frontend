import React, { useState } from "react";
import { Box, Typography, Chip, Button } from "@mui/material";
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
    switch (status?.toLowerCase()) {
        case "open":
            return "info";
        case "in_progress":
            return "warning";
        case "completed":
            return "success";
        case "cancelled":
            return "error";
        default:
            return "default";
    }
};

const SimpleJobList = ({ jobs = [] }) => {
    const navigate = useNavigate();

    if (jobs.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    No jobs found.
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                width: "100%",
                borderRadius: 1,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
            }}
        >
            {jobs.map((job, index) => (
                <Box
                    key={job.id}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        py: 1,
                        px: 2,
                        borderBottom:
                            index < jobs.length - 1 ? "1px solid" : "none",
                        borderColor: "divider",
                        "&:hover": {
                            bgcolor: "action.hover",
                            cursor: "pointer",
                        },
                        gap: 2,
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: "text.secondary",
                            minWidth: 30,
                        }}
                    >
                        {index + 1}.
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: "text.primary",
                            minWidth: 150,
                        }}
                    >
                        {job.name}
                    </Typography>

                    <Chip
                        label={
                            job.status?.replace("_", " ").toUpperCase() ||
                            "UNKNOWN"
                        }
                        size="small"
                        color={getStatusColor(job.status)}
                        variant="filled"
                        sx={{ fontSize: "0.7rem", height: 20 }}
                    />

                    <Typography
                        variant="body2"
                        sx={{
                            color: "text.secondary",
                            minWidth: 120,
                        }}
                    >
                        {job.client?.name || "N/A"}
                    </Typography>

                    {job.address && (
                        <Typography
                            variant="body2"
                            sx={{
                                color: "text.secondary",
                                minWidth: 120,
                            }}
                        >
                            {job.address}
                        </Typography>
                    )}

                    <Typography
                        variant="body2"
                        sx={{
                            color: "text.secondary",
                            minWidth: 80,
                        }}
                    >
                        {formatDate(job.startDate)}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: "primary.main",
                            textAlign: "right",
                            minWidth: 80,
                            flex: 1,
                        }}
                    >
                        {formatCurrency(job.price || job.bidAmount)}
                    </Typography>

                    <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/jobs/contact/${job.id}`);
                        }}
                        sx={{
                            ml: 2,
                            minWidth: 100,
                            fontSize: "0.75rem",
                            py: 0.5,
                            px: 1.5,
                            borderColor: "primary.main",
                            color: "primary.main",
                            "&:hover": {
                                borderColor: "primary.dark",
                                bgcolor: "primary.light",
                                color: "white",
                            },
                        }}
                    >
                        View Details
                    </Button>
                </Box>
            ))}
        </Box>
    );
};

export default SimpleJobList;
