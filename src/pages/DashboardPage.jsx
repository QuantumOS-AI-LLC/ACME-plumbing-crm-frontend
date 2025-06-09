import React, { useEffect } from "react";
import { Box, Grid } from "@mui/material";
import ComputerIcon from "@mui/icons-material/Computer";
import BuildIcon from "@mui/icons-material/Build";
import DescriptionIcon from "@mui/icons-material/Description";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ContactsIcon from "@mui/icons-material/Contacts";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDashboardStats } from "../hooks/useDashboardStats";
import GradientCard from "../components/common/GradientCard";
import StatsCard from "../components/common/StatsCard";
import PageHeader from "../components/common/PageHeader";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    stats,
    loading: statsLoading,
    loadDashboardStats,
  } = useDashboardStats();

  // Load dashboard stats when component mounts (only if not already loaded)
  useEffect(() => {
    loadDashboardStats();
  }, []); // Empty dependency array to run only once on mount

  const gradients = {
    aiAssistant: "linear-gradient(45deg, #9D4EE9 0%, #8A2BE2 100%)",
    jobs: "linear-gradient(45deg, #FF69B4 0%, #FF1493 100%)",
    estimates: "linear-gradient(45deg, #9D4EE9 0%, #8A2BE2 100%)",
    calendar: "linear-gradient(45deg, #9D4EE9 0%, #8A2BE2 100%)",
    contacts: "linear-gradient(90deg, #8A2BE2 0%, #FF1493 100%)",
  };

  return (
    <Box sx={{ maxWidth: "1200px", margin: "0 auto" }}>
      <PageHeader
        title={`Welcome, ${user?.name || "Guest"}`}
        subtitle="Here's your business at a glance"
      />

      {/* Main cards grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <GradientCard
            icon={<ComputerIcon sx={{ fontSize: 32 }} />}
            title="AI Assistant"
            bgcolor={gradients.aiAssistant}
            onClick={() => navigate("/ai-assistant")}
          />
        </Grid>
        <Grid item xs={6}>
          <GradientCard
            icon={<BuildIcon sx={{ fontSize: 32 }} />}
            title="Jobs"
            bgcolor={gradients.jobs}
            onClick={() => navigate("/jobs")}
          />
        </Grid>
        <Grid item xs={6}>
          <GradientCard
            icon={<DescriptionIcon sx={{ fontSize: 32 }} />}
            title="Estimates"
            bgcolor={gradients.estimates}
            onClick={() => navigate("/estimates")}
          />
        </Grid>
        <Grid item xs={6}>
          <GradientCard
            icon={<CalendarTodayIcon sx={{ fontSize: 32 }} />}
            title="Calendar"
            bgcolor={gradients.calendar}
            onClick={() => navigate("/calendar")}
          />
        </Grid>
        <Grid item xs={12}>
          <GradientCard
            icon={<ContactsIcon />}
            title="Contacts"
            bgcolor={gradients.contacts}
            height="60px"
            orientation="horizontal"
            onClick={() => navigate("/contacts")}
          />
        </Grid>
      </Grid>

      {/* Today's Schedule */}
      {/* <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={500}>
            Today's Schedule
          </Typography>
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: "pointer" }}
            onClick={() => navigate("/calendar")}
          >
            View All
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: 3,
            p: 2,
            boxShadow: 1,
          }}
        >
          {loading ? (
            <Typography variant="body2" align="center" py={2}>
              Loading schedule...
            </Typography>
          ) : todayEvents.length > 0 ? (
            todayEvents.map((event, index) => (
              <ScheduleItem
                key={event.id}
                title={event.title}
                time={formatTime(event.startTime)}
                color={
                  index % 3 === 0
                    ? theme.palette.success.main
                    : index % 3 === 1
                    ? theme.palette.info.main
                    : theme.palette.warning.main
                }
                onClick={() => navigate("/calendar")}
              />
            ))
          ) : (
            <Typography variant="body2" align="center" py={2}>
              No events scheduled for today
            </Typography>
          )}
        </Box>
      </Box> */}

      {/* Statistics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <StatsCard
            title="Today's Schedule"
            value={statsLoading ? "..." : stats.todaysEventsCount}
            change="3"
            changeText="from last week"
            isPositive={true}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatsCard
            title="Open Jobs"
            value={statsLoading ? "..." : stats.openJobsCount}
            change="3"
            changeText="from last week"
            isPositive={true}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatsCard
            title="Pending Estimates"
            value={statsLoading ? "..." : stats.pendingEstimatesCount}
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
