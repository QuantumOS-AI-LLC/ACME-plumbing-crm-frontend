import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, useTheme } from '@mui/material';
import ComputerIcon from '@mui/icons-material/Computer';
import BuildIcon from '@mui/icons-material/Build';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ContactsIcon from '@mui/icons-material/Contacts';
import { useNavigate } from 'react-router-dom';

import { fetchJobs, fetchEstimates, fetchEvents } from '../services/api';
import GradientCard from '../components/common/GradientCard';
import ScheduleItem from '../components/common/ScheduleItem';
import StatsCard from '../components/common/StatsCard';
import PageHeader from '../components/common/PageHeader';

const DashboardPage = () => {
  const [jobs, setJobs] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  
  const gradients = {
    aiAssistant: 'linear-gradient(45deg, #9D4EE9 0%, #8A2BE2 100%)',
    jobs: 'linear-gradient(45deg, #FF69B4 0%, #FF1493 100%)',
    estimates: 'linear-gradient(45deg, #9D4EE9 0%, #8A2BE2 100%)',
    calendar: 'linear-gradient(45deg, #9D4EE9 0%, #8A2BE2 100%)',
    contacts: 'linear-gradient(90deg, #8A2BE2 0%, #FF1493 100%)',
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Load data in parallel
        const [jobsResponse, estimatesResponse, eventsResponse] = await Promise.all([
          fetchJobs(),
          fetchEstimates(),
          fetchEvents()
        ]);

        // Process the responses
        setJobs(jobsResponse.data || []);
        setEstimates(estimatesResponse.data || []);
        setEvents(eventsResponse.data || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Filter jobs by status
  const activeJobs = jobs.filter(job => job.status === 'in_progress');
  // Filter pending estimates
  const pendingEstimates = estimates.filter(estimate => estimate.status === 'active');
  // Get today's events
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.start);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === today.getTime();
  }).sort((a, b) => new Date(a.start) - new Date(b.start));

  // Format time from date string
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title={`Welcome, ${localStorage.getItem('user_name') || 'John'}`}
        subtitle="Here's your business at a glance"
      />
      
      {/* Main cards grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <GradientCard
            icon={<ComputerIcon sx={{ fontSize: 32 }} />}
            title="AI Assistant"
            bgcolor={gradients.aiAssistant}
            onClick={() => navigate('/ai-assistant')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <GradientCard
            icon={<BuildIcon sx={{ fontSize: 32 }} />}
            title="Jobs"
            bgcolor={gradients.jobs}
            onClick={() => navigate('/jobs')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <GradientCard
            icon={<DescriptionIcon sx={{ fontSize: 32 }} />}
            title="Estimates"
            bgcolor={gradients.estimates}
            onClick={() => navigate('/estimates')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <GradientCard
            icon={<CalendarTodayIcon sx={{ fontSize: 32 }} />}
            title="Calendar"
            bgcolor={gradients.calendar}
            onClick={() => navigate('/calendar')}
          />
        </Grid>
        <Grid item xs={12}>
          <GradientCard
            icon={<ContactsIcon />}
            title="Contacts"
            bgcolor={gradients.contacts}
            height="60px"
            orientation="horizontal"
            onClick={() => navigate('/contacts')}
          />
        </Grid>
      </Grid>
      
      {/* Today's Schedule */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={500}>Today's Schedule</Typography>
          <Typography 
            variant="body2" 
            color="primary" 
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/calendar')}
          >
            View All
          </Typography>
        </Box>
        
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 2, boxShadow: 1 }}>
          {loading ? (
            <Typography variant="body2" align="center" py={2}>Loading schedule...</Typography>
          ) : todayEvents.length > 0 ? (
            todayEvents.map((event, index) => (
              <ScheduleItem
                key={event.id}
                title={event.title}
                time={formatTime(event.start)}
                color={index % 3 === 0 ? theme.palette.success.main : 
                      index % 3 === 1 ? theme.palette.info.main : 
                      theme.palette.warning.main}
                onClick={() => navigate('/calendar')}
              />
            ))
          ) : (
            <Typography variant="body2" align="center" py={2}>No events scheduled for today</Typography>
          )}
        </Box>
      </Box>
      
      {/* Statistics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <StatsCard
            title="Active Jobs"
            value={loading ? '...' : activeJobs.length}
            change="3"
            changeText="from last week"
            isPositive={true}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatsCard
            title="Pending Estimates"
            value={loading ? '...' : pendingEstimates.length}
            change="2"
            changeText="from last week"
            isPositive={true}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
