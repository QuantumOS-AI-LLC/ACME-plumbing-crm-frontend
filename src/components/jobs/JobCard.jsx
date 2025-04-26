import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Grid
} from '@mui/material';

const JobCard = ({ job, onClick }) => {
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
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">{job.name}</Typography>
          <Chip 
            label={job.status === 'in_progress' ? 'In Progress' : 'Completed'} 
            color={job.status === 'in_progress' ? 'primary' : 'success'}
            size="small"
          />
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Client</Typography>
            <Typography variant="body1">{job.client?.name || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Address</Typography>
            <Typography variant="body1">{job.address || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              {job.status === 'in_progress' ? 'Start Date' : 'Completed Date'}
            </Typography>
            <Typography variant="body1">
              {job.status === 'in_progress' ? job.startDate : job.completedDate}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              {job.status === 'in_progress' ? 'Price' : 'Final Price'}
            </Typography>
            <Typography variant="body1">${job.price?.toLocaleString() || 'N/A'}</Typography>
          </Grid>
        </Grid>

        {job.status === 'in_progress' && job.progress && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Progress: {job.progress}%</Typography>
              <Typography variant="body2">Due: {job.dueDate || 'N/A'}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={job.progress} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default JobCard;
