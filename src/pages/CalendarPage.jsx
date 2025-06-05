import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Pagination,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardIos";
import EditIcon from "@mui/icons-material/Edit";
import { fetchEvents, createEvent, updateEvent } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import EventCard from "../components/calendar/EventCard";
import CalendarEventModal from "../components/calendar/CalendarEventModal";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useWebhook } from "../hooks/webHook";
import { useEvents } from "../contexts/EventsContext";

// Constants matching backend
const EVENT_TYPE = {
  JOB: "job",
  ESTIMATE: "estimate",
  MEETING: "meeting",
  OTHER: "other",
};

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  //   const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { events, setEvents, addEventToState, updateEventInState } =
    useEvents();

  const { sendWebhook } = useWebhook();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Notification states
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const eventsPerPage = 20;

  // Fetch events with filters & pagination whenever selectedDate or page changes
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Set start and end of the selected date for API filtering
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth(); // 0-indexed
        const day = selectedDate.getDate();

        const startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

        // Call API with date range, page, and limit
        const response = await fetchEvents({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          page: currentPage,
          limit: eventsPerPage,
        });

        console.log("event response", response);

        if (response && response.data) {
          // Map event times to Date objects
          const processedEvents = response.data.map((event) => ({
            ...event,
            start: new Date(event.startTime || event.start),
            end: new Date(event.endTime || event.end),
          }));
          setEvents(processedEvents);

          // Set total from pagination info if available
          if (response.pagination && response.pagination.total) {
            setTotalEvents(response.pagination.total);
          } else {
            setTotalEvents(processedEvents.length);
          }
        } else {
          setEvents([]);
          setTotalEvents(0);
        }
      } catch (err) {
        console.error("Error loading events:", err);
        setError("Failed to load events. Please try again.");
        setEvents([]);
        setTotalEvents(0);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [selectedDate, currentPage]);

  // Reset to page 1 if selected date changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  // Month navigation
  const goToPreviousMonth = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const formatMonthYear = (date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  // Pagination info
  const totalPages = Math.ceil(totalEvents / eventsPerPage);

  const handlePageChange = (_, value) => {
    setCurrentPage(value);
  };

  // Modal handlers
  const handleAddEvent = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingEvent(null);
  };

  const handleSubmitEvent = async (eventData) => {
    try {
      let response;

      if (editingEvent) {
        response = await updateEvent(editingEvent.id, eventData);
        const updatedEvent = {
          ...response.data,
          start: new Date(response.data.startTime),
          end: new Date(response.data.endTime),
        };

        const webHookData = {
          ...updatedEvent,
          webhookEvent: "EventEdited",
          createdBy: response.data.createdBy,
        };
        await sendWebhook({ payload: webHookData });

        updateEventInState(updatedEvent); // context call

        showNotification("Event updated successfully!", "success");
      } else {
        response = await createEvent(eventData);
        const newEvent = {
          ...response.data,
          start: new Date(response.data.startTime),
          end: new Date(response.data.endTime),
        };

        const webHookData = {
          ...newEvent,
          webhookEvent: "EventAdded",
          createdBy: response.data.createdBy,
        };
        await sendWebhook({ payload: webHookData });

        addEventToState(newEvent); // context call

        showNotification("Event created successfully!", "success");

        setSelectedDate(newEvent.start);
        setCurrentDate(newEvent.start);
      }
    } catch (err) {
      console.error("Error saving event:", err);
      showNotification("Failed to save event. Please try again.", "error");
      throw err;
    }
  };

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Generate calendar days to display (for UI only)
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const daysFromPrevMonth = firstDayOfWeek;
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const calendarDays = [];

    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      calendarDays.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        hasEvents: hasEventsOnDay(date),
      });
    }

    const today = new Date();
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      calendarDays.push({
        date,
        day: i,
        isCurrentMonth: true,
        isToday:
          i === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear(),
        hasEvents: hasEventsOnDay(date),
      });
    }

    const remainingDays = 42 - calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      calendarDays.push({
        date,
        day: i,
        isCurrentMonth: false,
        isToday: false,
        hasEvents: hasEventsOnDay(date),
      });
    }

    return calendarDays;
  };

  const hasEventsOnDay = (date) => {
    return events.some((event) => event.start && isSameDay(event.start, date));
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Box>
      <PageHeader
        title="Calendar"
        action={true}
        actionText="Add Event"
        onAction={handleAddEvent}
      />

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
      ) : error ? (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography color="error">{error}</Typography>
          <Button
            variant="outlined"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <IconButton onClick={goToPreviousMonth}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" fontWeight={500}>
                  {formatMonthYear(currentDate)}
                </Typography>
                <IconButton onClick={goToNextMonth}>
                  <ArrowForwardIcon />
                </IconButton>
              </Box>

              <Grid container>
                {weekDays.map((day, index) => (
                  <Grid item xs={12 / 7} key={index}>
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 1,
                        fontWeight: 500,
                        color: "text.secondary",
                      }}
                    >
                      {day}
                    </Box>
                  </Grid>
                ))}

                {calendarDays.map((day, index) => (
                  <Grid item xs={12 / 7} key={index}>
                    <Box
                      sx={{
                        height: 50,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        borderRadius: 1,
                        bgcolor: isSameDay(day.date, selectedDate)
                          ? "primary.main"
                          : day.isToday
                          ? "grey.300"
                          : "transparent",
                        color: isSameDay(day.date, selectedDate)
                          ? "white"
                          : day.isToday
                          ? "black"
                          : !day.isCurrentMonth
                          ? "text.disabled"
                          : "text.primary",
                        "&:hover": {
                          bgcolor: day.isCurrentMonth
                            ? isSameDay(day.date, selectedDate)
                              ? "primary.main"
                              : "action.hover"
                            : "transparent",
                        },
                      }}
                      onClick={() => handleDateClick(day.date)}
                    >
                      <Typography variant="body2">{day.day}</Typography>
                      {day.hasEvents && (
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: isSameDay(day.date, selectedDate)
                              ? "white"
                              : "primary.main",
                            mt: 0.5,
                          }}
                        />
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={500} gutterBottom>
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Typography>

              {events.length > 0 ? (
                <>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                        lg: "repeat(4, 1fr)",
                        xl: "repeat(5, 1fr)",
                      },
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    {events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEdit={handleEditEvent}
                      />
                    ))}
                  </Box>

                  {totalPages > 1 && (
                    <Box sx={{ textAlign: "center", mt: 3 }}>
                      <Button
                        variant="outlined"
                        onClick={() => handlePageChange(null, currentPage - 1)}
                        disabled={currentPage === 1}
                        sx={{
                          px: 1,
                          mr: 0.5,
                          minWidth: "32px",
                        }}
                      >
                        <ChevronLeftIcon />
                      </Button>

                      {Array.from({ length: totalPages }, (_, i) => (
                        <Button
                          key={i}
                          variant={
                            currentPage === i + 1 ? "contained" : "outlined"
                          }
                          onClick={() => handlePageChange(null, i + 1)}
                          sx={{
                            px: 1,
                            mx: 0.5,
                            minWidth: "32px",
                          }}
                        >
                          {i + 1}
                        </Button>
                      ))}

                      <Button
                        variant="outlined"
                        onClick={() => handlePageChange(null, currentPage + 1)}
                        disabled={currentPage === totalPages}
                        sx={{
                          px: 1,
                          ml: 0.5,
                          minWidth: "32px",
                        }}
                      >
                        <ChevronRightIcon />
                      </Button>
                    </Box>
                  )}

                  {/* <Box sx={{ mt: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Showing {events.length} of {totalEvents} events
                    </Typography>
                  </Box> */}
                </>
              ) : (
                <Typography>No events scheduled for this day.</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      <CalendarEventModal
        open={modalOpen}
        onClose={handleCloseModal}
        event={editingEvent}
        initialData={editingEvent}
        onSubmit={handleSubmitEvent}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CalendarPage;
