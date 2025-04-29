import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Grid,
} from "@mui/material";

const getStatusChip = (status) => {
  switch (status) {
    case "open":
      return { label: "Open", color: "info" };
    case "in_progress":
      return { label: "In Progress", color: "primary" };
    case "completed":
      return { label: "Completed", color: "success" };
    case "cancelled":
      return { label: "Cancelled", color: "default" };
    default:
      return { label: "Unknown", color: "default" };
  }
};

const formatDate = (dateStr) => {
  return dateStr ? new Date(dateStr).toLocaleDateString() : "N/A";
};

const JobCard = ({ job, onClick }) => {
  const { label: statusLabel, color: statusColor } = getStatusChip(job.status);

  return (
    <Card
      sx={{
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": onClick
          ? {
              transform: "translateY(-4px)",
              boxShadow: 3,
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">{job.name}</Typography>
          <Chip label={statusLabel} color={statusColor} size="small" />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Client
            </Typography>
            <Typography variant="body1">{job.client?.name || "N/A"}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Address
            </Typography>
            <Typography variant="body1">{job.address || "N/A"}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              {job.status === "completed" ? "Completed Date" : "Start Date"}
            </Typography>
            <Typography variant="body1">
              {formatDate(
                job.status === "completed" ? job.completedDate : job.startDate
              )}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Price
            </Typography>
            <Typography variant="body1">
              ${job.price?.toLocaleString() || "N/A"}
            </Typography>
          </Grid>
        </Grid>

        {job.status === "in_progress" && typeof job.progress === "number" && (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2">Progress: {job.progress}%</Typography>
              <Typography variant="body2">
                Due: {formatDate(job.dueDate)}
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={job.progress} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default JobCard;
