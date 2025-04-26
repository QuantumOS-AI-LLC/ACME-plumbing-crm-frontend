import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Paper,
  Button,
  CircularProgress
} from '@mui/material';
import { fetchEstimates } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import EstimateCard from '../components/estimates/EstimateCard';

// Constants matching backend
const ESTIMATE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

const EstimatesPage = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEstimates = async () => {
      try {
        setLoading(true);
        // Add pagination and any necessary filters
        const response = await fetchEstimates({
          page: 1,
          limit: 50, // Get a decent number of estimates
        });
        
        console.log('Estimates API response:', response); // For debugging
        
        if (response && response.data) {
          setEstimates(response.data);
        } else {
          console.error('Unexpected API response format:', response);
          setEstimates([]);
        }
      } catch (error) {
        console.error('Error loading estimates:', error);
        setError('Failed to load estimates. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadEstimates();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Map status values for filtering
  const getStatusFilters = () => {
    switch(activeTab) {
      case 'active':
        return [ESTIMATE_STATUS.PENDING];
      case 'accepted':
        return [ESTIMATE_STATUS.ACCEPTED];
      case 'rejected':
        return [ESTIMATE_STATUS.REJECTED];
      default:
        return [];
    }
  };

  // Filter estimates based on active tab
  const filteredEstimates = estimates.filter(estimate => {
    if (activeTab === 'reports') return true;
    
    const statusFilters = getStatusFilters();
    return statusFilters.includes(estimate.status);
  });

  const handleViewEstimate = (estimate) => {
    console.log('View estimate:', estimate.id);
  };

  return (
    <Box>
      <PageHeader
        title="Estimates"
        action={true}
        actionText="Add Estimate"
        onAction={() => console.log('Add estimate clicked')}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="estimate tabs">
          <Tab label="Active Estimates" value="active" />
          <Tab label="Accepted" value="accepted" />
          <Tab label="Rejected" value="rejected" />
          <Tab label="Reports" value="reports" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography color="error">{error}</Typography>
          <Button variant="outlined" color="primary" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      ) : activeTab !== 'reports' ? (
        <>
          {/* For debugging */}
          {/* <pre>{JSON.stringify(filteredEstimates, null, 2)}</pre> */}
          
          <Grid container spacing={3}>
            {filteredEstimates.length === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1">
                    No {activeTab === 'active' ? 'active' : 
                       activeTab === 'accepted' ? 'accepted' : 'rejected'} estimates found.
                  </Typography>
                </Box>
              </Grid>
            ) : (
              filteredEstimates.map((estimate) => (
                <Grid item xs={12} key={estimate.id}>
                  <EstimateCard 
                    estimate={estimate} 
                    onClick={() => console.log('View estimate details:', estimate.id)}
                    onViewClick={handleViewEstimate}
                  />
                </Grid>
              ))
            )}
          </Grid>
        </>
      ) : (
        <Box>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>Total Estimates</Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {estimates.length}
                </Typography>
                <Typography variant="body2" color="success.main" mt={0.5}>
                  All time
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>Pending Estimates</Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {estimates.filter(e => e.status === ESTIMATE_STATUS.PENDING).length}
                </Typography>
                <Typography variant="body2" color="success.main" mt={0.5}>
                  Awaiting response
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>Acceptance Rate</Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {estimates.length > 0 ? Math.round((estimates.filter(e => e.status === ESTIMATE_STATUS.ACCEPTED).length / estimates.length) * 100) : 0}%
                </Typography>
                <Typography variant="body2" color="success.main" mt={0.5}>
                  Overall rate
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>Total Value (Accepted)</Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  ${estimates
                    .filter(e => e.status === ESTIMATE_STATUS.ACCEPTED)
                    .reduce((sum, e) => sum + (e.amount || 0), 0)
                    .toLocaleString()}
                </Typography>
                <Typography variant="body2" color="success.main" mt={0.5}>
                  Converted to jobs
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Estimate Performance</Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography>Conversion Rate Chart</Typography>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default EstimatesPage;
