import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Grid
} from '@mui/material';

const EstimateCard = ({ estimate, onClick, onViewClick }) => {
  const handleViewClick = (e) => {
    if (onViewClick) {
      e.stopPropagation();
      onViewClick(estimate);
    }
  };

  return (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 3
        } : {}
      }}
      onClick={onClick ? () => onClick(estimate) : undefined}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">{estimate.name}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="small"
            onClick={handleViewClick}
          >
            {estimate.status === 'active' ? 'See Bid' : 'View Job'}
          </Button>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              {estimate.status === 'active' ? 'Lead' : 'Client'}
            </Typography>
            <Typography variant="body1">
              {estimate.status === 'active' ? estimate.leadName : estimate.clientName}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Address</Typography>
            <Typography variant="body1">{estimate.address}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              {estimate.status === 'active' ? 'Proposed Start' : 'Estimate Date'}
            </Typography>
            <Typography variant="body1">
              {estimate.status === 'active' ? estimate.proposedStartDate : estimate.estimateDate}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              {estimate.status === 'active' ? 'Bid Amount' : 'Accepted Amount'}
            </Typography>
            <Typography variant="body1">
              ${(estimate.status === 'active' ? estimate.bidAmount : estimate.acceptedAmount)?.toLocaleString() || 'N/A'}
            </Typography>
          </Grid>
          
          {estimate.status === 'active' && estimate.scope && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Scope</Typography>
              <Typography variant="body1">{estimate.scope}</Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EstimateCard;
