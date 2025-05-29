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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardIos";
import EditIcon from "@mui/icons-material/Edit";
import { fetchEvents, createEvent, updateEvent } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import EventCard from "../components/calendar/EventCard";
import CalendarGrid from "../components/calendar/CalendarGrid";
import CalendarEventModal from "../components/calendar/CalendarEventModal";

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
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true); // Renamed from loading
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    // Notification states
    const [notification, setNotification] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const loadEventsForDate = async (date, page) => {
        try {
            setEventsLoading(true);
            setError(null);

            const year = date.getFullYear();
            const month = date.getMonth(); // 0-indexed
            const day = date.getDate();

            // Construct startDate and endDate in UTC
            const startDateUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
            const endDateUTC = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

            const params = {
                startDate: startDateUTC.toISOString(),
                endDate: endDateUTC.toISOString(),
                page: page,
                limit: 20,
            };
            const response = await fetchEvents(params);

            console.log("Events API response for date:", date, "page:", page, response);

            if (response && response.data && response.pagination) {
                const processedEvents = response.data.map((event) => ({
                    ...event,
                    start: new Date(event.startTime || event.start),
                    end: new Date(event.endTime || event.end),
                }));
                setEvents(processedEvents);
                setTotalPages(response.pagination.pages || 1);
                setCurrentPage(response.pagination.page || 1);
            } else {
                console.error("Unexpected API response format:", response);
                setEvents([]);
                setTotalPages(1);
            }
        } catch (err) {
            console.error("Error loading events:", err);
            setError("Failed to load events. Please try again.");
            setEvents([]);
            setTotalPages(1);
        } finally {
            setEventsLoading(false);
        }
    };

    useEffect(() => {
        console.log("CalendarPage useEffect triggered. Fetching events for date:", selectedDate, "page:", currentPage);
        loadEventsForDate(selectedDate, currentPage);
    }, [selectedDate, currentPage]);

    const goToPreviousMonth = () => {
        setCurrentDate((prevDate) => {
            const newDate = new Date(prevDate);
            newDate.setMonth(prevDate.getMonth() - 1);
            return newDate;
        });
    };

    const goToNextMonth = () => {
        setCurrentDate((prevDate) => {
            const newDate = new Date(prevDate);
            newDate.setMonth(prevDate.getMonth() + 1);
            return newDate;
        });
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
        setCurrentPage(1); // Reset to first page when a new date is selected
    };

    // Helper function to format date as Month YYYY
    const formatMonthYear = (date) => {
        return date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
    };

    // Helper function to check if two dates are on the same day
    const isSameDay = (date1, date2) => {
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    };

    // Events for the selected date are now directly in the 'events' state from the API
    // So, filteredEvents will just be 'events'
    const filteredEvents = events;

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

    const handleSubmitEvent = async (formData) => {
        try {
            let response;
            // Ensure startTime and endTime are ISO strings
            const apiPayload = {
                ...formData,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
            };

            if (editingEvent) {
                // Update existing event
                response = await updateEvent(editingEvent.id, apiPayload);

                // Update events in state, expecting event object directly in response.data
                if (response && response.data) { // Check for response.data directly
                    const updatedEventData = response.data; // Event object is in response.data
                    setEvents((prevEvents) =>
                        prevEvents.map((event) =>
                            event.id === editingEvent.id
                                ? {
                                      ...updatedEventData,
                                      start: new Date(updatedEventData.startTime),
                                      end: new Date(updatedEventData.endTime),
                                  }
                                : event
                        )
                    );
                    const message = response.message || "Event updated successfully!";
                    showNotification(message, "success");
                } else {
                    console.error("Unexpected update event response format:", response);
                    showNotification("Failed to update event due to unexpected response.", "error");
                }

            } else {
                // Create new event
                console.log("Creating new event with payload:", apiPayload);
                response = await createEvent(apiPayload);
                console.log("API response from createEvent:", response);

                // Add new event to state, expecting event object directly in response.data
                if (response && response.data) { // Check for response.data directly
                    const newEventData = response.data; // Event object is in response.data
                    const newEvent = {
                        ...newEventData,
                        start: new Date(newEventData.startTime),
                        end: new Date(newEventData.endTime),
                    };
                    setEvents((prevEvents) => [...prevEvents, newEvent]);
                    const message = response.message || "Event created successfully!";
                    showNotification(message, "success");
                } else {
                    // This log was being hit, as per user feedback
                    console.error("Unexpected create event response format:", response);
                    showNotification("Failed to create event due to unexpected response.", "error");
                }
            }
        } catch (error) {
            console.error("Error saving event:", error);
            showNotification(
                "Failed to save event. Please try again.",
                "error"
            );
            throw error; // Re-throw to let modal handle it
        }
    };

    const showNotification = (message, severity = "success") => {
        setNotification({
            open: true,
            message,
            severity,
        });
    };

    const handleCloseNotification = () => {
        setNotification((prev) => ({ ...prev, open: false }));
    };

    // Generate calendar days
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

        // Add days from previous month
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

        // Add days of current month
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

        // Add days from next month to complete the grid
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

    // Check if a day has events
    const hasEventsOnDay = (date) => {
        if (!events || !events.length) return false;

        return events.some(
            (event) => event.start && isSameDay(event.start, date)
        );
    };

    const calendarDays = generateCalendarDays();
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Format time from date
    const formatTime = (date) => {
        if (!date) return "";
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Box>
            <PageHeader
                title="Calendar"
                action={true}
                actionText="Add Event"
                onAction={handleAddEvent}
            />

            {eventsLoading ? (
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
                        onClick={() => loadEventsForDate(selectedDate, currentPage)} // Retry current fetch
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
                                {/* Week days */}
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

                                {/* Calendar days */}
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
                                                bgcolor: day.isToday
                                                    ? "primary.light"
                                                    : isSameDay(
                                                          day.date,
                                                          selectedDate
                                                      )
                                                    ? "primary.main"
                                                    : "transparent",
                                                color:
                                                    day.isToday ||
                                                    isSameDay(
                                                        day.date,
                                                        selectedDate
                                                    )
                                                        ? "white"
                                                        : !day.isCurrentMonth
                                                        ? "text.disabled"
                                                        : "text.primary",
                                                "&:hover": {
                                                    bgcolor: day.isCurrentMonth
                                                        ? isSameDay(
                                                              day.date,
                                                              selectedDate
                                                          )
                                                            ? "primary.main"
                                                            : "action.hover"
                                                        : "transparent",
                                                },
                                            }}
                                            onClick={() =>
                                                handleDateClick(day.date)
                                            }
                                        >
                                            <Typography variant="body2">
                                                {day.day}
                                            </Typography>
                                            {day.hasEvents && (
                                                <Box
                                                    sx={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: "50%",
                                                        bgcolor: isSameDay(
                                                            day.date,
                                                            selectedDate
                                                        )
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
                            <Typography
                                variant="h6"
                                fontWeight={500}
                                gutterBottom
                            >
                                {selectedDate.toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </Typography>

                            {filteredEvents.length > 0 ? (
                                filteredEvents.map((event) => (
                                    <Box
                                        key={event.id}
                                        sx={{
                                            p: 2,
                                            mb: 2,
                                            borderLeft: "4px solid",
                                            borderColor: "primary.main",
                                            borderRadius: 1,
                                            bgcolor: "background.default",
                                            position: "relative",
                                            "&:hover .edit-button": {
                                                opacity: 1,
                                            },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                            }}
                                        >
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6">
                                                    {event.title}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {formatTime(event.start)} -{" "}
                                                    {formatTime(event.end)}
                                                </Typography>
                                                {event.location && (
                                                    <Typography
                                                        variant="body2"
                                                        mt={1}
                                                    >
                                                        Location:{" "}
                                                        {event.location}
                                                    </Typography>
                                                )}
                                                {event.description && (
                                                    <Typography
                                                        variant="body2"
                                                        mt={1}
                                                    >
                                                        {event.description}
                                                    </Typography>
                                                )}
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{
                                                        textTransform:
                                                            "capitalize",
                                                    }}
                                                >
                                                    {event.eventType}
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                className="edit-button"
                                                size="small"
                                                onClick={() =>
                                                    handleEditEvent(event)
                                                }
                                                sx={{
                                                    opacity: 0, // Hidden by default
                                                    transition:
                                                        "opacity 0.2s ease, color 0.2s ease, background-color 0.2s ease", // Smooth transitions
                                                    color: "#9d4ee9", // Match specified color
                                                    ml: 1, // Maintain original margin-left
                                                    border: 1,

                                                    padding: (theme) =>
                                                        theme.spacing(0.5), // Tight padding for small size
                                                    "&:hover": {
                                                        color: (theme) =>
                                                            theme.palette
                                                                .primary.dark, // Slightly darker on hover
                                                        bgcolor: (theme) =>
                                                            theme.palette.action
                                                                .selected, // Subtle background on hover
                                                        opacity: 1, // Ensure full opacity on hover
                                                    },
                                                    "& .MuiSvgIcon-root": {
                                                        fontSize: (theme) =>
                                                            theme.typography
                                                                .body2.fontSize, // Consistent icon size
                                                    },
                                                }}
                                                aria-label="Edit event" // Added for accessibility
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                ))
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No events scheduled for this day.
                                </Typography>
                            )}

                            {/* Pagination Controls */}
                            {filteredEvents.length > 0 && totalPages > 1 && (
                                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2 }}>
                                    <Button
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        sx={{ mr: 1 }}
                                    >
                                        Previous
                                    </Button>
                                    <Typography variant="body2" sx={{ mx: 1 }}>
                                        Page {currentPage} of {totalPages}
                                    </Typography>
                                    <Button
                                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        sx={{ ml: 1 }}
                                    >
                                        Next
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Event Modal */}
            <CalendarEventModal
                open={modalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitEvent}
                initialData={editingEvent}
                selectedDate={selectedDate}
            />

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                sx={{
                    "& .MuiSnackbarContent-root": {
                        backgroundColor: "transparent", // Let Alert handle the background
                        padding: 0, // Remove default padding to let Alert control it
                        boxShadow: (theme) => theme.shadows[4], // Use theme shadow for elevation
                    },
                }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{
                        backgroundColor: "#9d4ee9", // Custom background color
                        color: (theme) => theme.palette.common.white, // Ensure text is readable
                        borderRadius: (theme) => theme.shape.borderRadius, // Match theme border radius
                        padding: (theme) => theme.spacing(1, 2), // Consistent padding from theme
                        fontWeight: (theme) =>
                            theme.typography.fontWeightMedium, // Readable font weight
                        "& .MuiAlert-icon": {
                            color: "inherit", // Ensure icons match the text color
                        },
                        "& .MuiAlert-action": {
                            paddingLeft: (theme) => theme.spacing(1), // Tighten action spacing
                        },
                    }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CalendarPage;
