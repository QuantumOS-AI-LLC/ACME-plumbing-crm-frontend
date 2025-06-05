import React from "react";
import { Paper, Typography, Box } from "@mui/material";

const StatsCard = ({ title, value, change, changeText, isPositive = true }) => {
  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Typography variant="body2" color="text.secondary" mb={1}>
        {title}
      </Typography>
      <Typography variant="h4" color="primary" fontWeight="bold">
        {value}
      </Typography>
      {change && (
        <Typography
          variant="body2"
          color={isPositive ? "success.main" : "error.main"}
          mt={0.5}
        >
          {/* {isPositive ? '+' : '-'}{change} {changeText || 'from last period'} */}
        </Typography>
      )}
    </Paper>
  );
};

export default StatsCard;
