import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Grid,
} from "@mui/material";
import { format } from "date-fns";

const EstimateCard = ({ estimate, onClick, onViewClick }) => {
  const handleViewClick = (e) => {
    if (onViewClick) {
      e.stopPropagation();
      onViewClick(estimate);
    }
  };

  const displayName = estimate.client?.name || estimate.leadName || "Unknown";
  const displayAmount = estimate.bidAmount?.toLocaleString() || "N/A";

  const formattedStartDate = estimate.startDate
    ? format(new Date(estimate.startDate), "MMM dd, yyyy")
    : "N/A";
  const formattedCreatedDate = estimate.createdAt
    ? format(new Date(estimate.createdAt), "MMM dd, yyyy")
    : "N/A";

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
      onClick={onClick ? () => onClick(estimate) : undefined}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">{displayName}</Typography>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleViewClick}
          >
            {estimate.status === "pending" ? "See Bid" : "View Job"}
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Client
            </Typography>
            <Typography variant="body1">{displayName}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Address
            </Typography>
            <Typography variant="body1">{estimate.address || "N/A"}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Start Date
            </Typography>
            <Typography variant="body1">{formattedStartDate}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Bid Amount
            </Typography>
            <Typography variant="body1">${displayAmount}</Typography>
          </Grid>
          {estimate.scope && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Scope
              </Typography>
              <Typography variant="body1">{estimate.scope}</Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EstimateCard;
