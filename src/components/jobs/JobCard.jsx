import React, { useState } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Grid,
  Button,
} from "@mui/material";
import JobDetailsModal from "./JobDetailsModal"; // Same JobDetailsModal as EstimateCard
import JobEditModal from "./JobEditModal";

const JOB_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const getStatusChip = (status) => {
  switch (status) {
    case JOB_STATUS.OPEN:
      return { label: "Open", color: "info" };
    case JOB_STATUS.IN_PROGRESS:
      return { label: "In Progress", color: "primary" };
    case JOB_STATUS.COMPLETED:
      return { label: "Completed", color: "success" };
    case JOB_STATUS.CANCELLED:
      return { label: "Cancelled", color: "default" };
    default:
      return { label: "Unknown", color: "default" };
  }
};

const formatDate = (dateStr) => {
  return dateStr ? new Date(dateStr).toLocaleDateString() : "N/A";
};

const JobCard = ({ job, onClick, onUpdate }) => {
  const [openDetails, setOpenDetails] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  // Transform job data to match JobDetailsModal expectations
  const transformedJob = {
    ...job,
    name: job.leadName || job.client?.name || job.name || "Untitled Job",
    price: job.bidAmount || job.price || 0, 
    progress: job.progress || null, 
    dueDate: job.dueDate || null, 
    completedDate: job.endDate || job.completedDate || null, 
    startDate: job.startDate || null, 
    address: job.address || "N/A",
    client: job.client || { name: "N/A" },
    status: job.status || "unknown",
  };

  const { label: statusLabel, color: statusColor } = getStatusChip(transformedJob.status);

  const handleOpenDetails = () => setOpenDetails(true);
  const handleCloseDetails = () => setOpenDetails(false);
  const handleOpenEdit = () => setOpenEdit(true);
  const handleCloseEdit = () => setOpenEdit(false);

  const handleCardClick = () => {
    if (onClick) onClick();
    handleOpenDetails();
  };

  return (
    <>
      <Card
        sx={{
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: 3,
          },
        }}
        onClick={handleCardClick}
      >
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">{transformedJob.name}</Typography>
            <Chip label={statusLabel} color={statusColor} size="small" />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Client
              </Typography>
              <Typography variant="body1">{transformedJob.client?.name || "N/A"}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Address
              </Typography>
              <Typography variant="body1">{transformedJob.address}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                {transformedJob.status === JOB_STATUS.COMPLETED ? "End Date" : "Start Date"}
              </Typography>
              <Typography variant="body1">
                {formatDate(
                  transformedJob.status === JOB_STATUS.COMPLETED
                    ? transformedJob.completedDate
                    : transformedJob.startDate
                )}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Price
              </Typography>
              <Typography variant="body1">
                ${transformedJob.price?.toLocaleString() || "N/A"}
              </Typography>
            </Grid>
          </Grid>

          {transformedJob.status === JOB_STATUS.IN_PROGRESS &&
            typeof transformedJob.progress === "number" && (
              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2">
                    Progress: {transformedJob.progress}%
                  </Typography>
                  <Typography variant="body2">
                    Due: {formatDate(transformedJob.dueDate)}
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={transformedJob.progress} />
              </Box>
            )}

          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button
              variant="outlined"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit();
              }}
            >
              Edit
            </Button>
          </Box>
        </CardContent>
      </Card>

      <JobDetailsModal
        job={transformedJob} // Use transformed data
        open={openDetails}
        handleClose={handleCloseDetails}
      />
      <JobEditModal
        job={transformedJob} // Use transformed data
        open={openEdit}
        onClose={handleCloseEdit}
        onUpdate={onUpdate}
      />
    </>
  );
};

export default JobCard;