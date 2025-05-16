import React, { useState } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Grid
} from "@mui/material";
import { format } from "date-fns";
import CreateEstimateForm from "./CreateEstimateForm"; // Updated form component

const EstimateCard = ({ estimate, onClick, onViewClick, onUpdate }) => {
  const [openEdit, setOpenEdit] = useState(false);
  

  const handleViewClick = (e) => {
    if (onViewClick) {
      e.stopPropagation();
      onViewClick(estimate);
      console.log("estimate_card", estimate)
    }
    
  };

  const handleOpenEdit = () => setOpenEdit(true);
  const handleCloseEdit = () => setOpenEdit(false);

  const handleFormSubmit = (updatedEstimate) => {
    onUpdate(updatedEstimate);
    handleCloseEdit();
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
    <>
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexDirection:'colunm' }}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleViewClick}
              >
                {estimate.status === "pending" ? "See Bid" : "View Job"}
              </Button>
             
            </Box>
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
           <Box sx={{ mt: 2, textAlign: "right" }}>
                    <Button
                          variant="outlined"
                          size="md"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering card click
                            handleOpenEdit();
                          }}
                        >
                          Edit
                    </Button>
            </Box>
        </CardContent>
      </Card>

      <CreateEstimateForm
        open={openEdit}
        handleCloseForm={handleCloseEdit}
        handleFormSubmit={handleFormSubmit}
        formData={{
          leadName: "",
          address: "",
          scope: "",
          bidAmount: "",
          startDate: "",
          notes: "",
          status: "",
          client: { name: "", phoneNumber: "", email: "" },
        }}
        editingEstimate={openEdit ? estimate : null}
      />
    </>
  );
};

export default EstimateCard;