import React from "react";
import { Box, Typography, List, ListItem } from "@mui/material";

const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const SimpleJobList = ({ jobs = [] }) => {
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
                        px: 1,
                        borderBottom:
                            index < jobs.length - 1 ? "1px solid" : "none",
                        borderColor: "divider",
                        "&:hover": {
                            bgcolor: "action.hover",
                            cursor: "pointer",
                        },
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: "text.secondary",
                            minWidth: 30,
                            mr: 2,
                        }}
                    >
                        {index + 1}.
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 500,
                            flex: 1,
                            mr: 2,
                        }}
                    >
                        {job.name}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            flex: 1,
                            mr: 2,
                        }}
                    >
                        {job.client?.name || "N/A"}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: "primary.main",
                            textAlign: "right",
                            minWidth: 80,
                        }}
                    >
                        {formatCurrency(job.price || job.bidAmount)}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

export default SimpleJobList;
