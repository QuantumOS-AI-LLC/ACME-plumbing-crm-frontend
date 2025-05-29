import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import PageHeader from "../components/common/PageHeader";

const MyServicesPage = () => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);

  return (
    <Box>
      <PageHeader
        title="My Services"
        action={true}
        actionText="Add Service"
        onAction={() => console.log("Add Service clicked")}
      />

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
            <CircularProgress />
          </Box>
        ) : services.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <Typography variant="body1">No services available.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {services.map((service) => (
              <Grid item xs={12} md={6} key={service.id}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6">{service.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {service.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default MyServicesPage;
