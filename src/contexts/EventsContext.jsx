import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchEvents } from "../services/api";
import { useDashboardStats } from "./DashboardStatsContext";
import { useAuth } from "../hooks/useAuth";

const EventsContext = createContext();

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
};

export const EventsProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { updateEventsCount } = useDashboardStats();
  const { isAuthenticated, isInitialized } = useAuth();

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchEvents({
        page: 1,
        limit: 50,
      });

      if (response && response.data) {
        setEvents(response.data);
      } else {
        console.error("Unexpected API response format:", response);
        setEvents([]);
      }
    } catch (error) {
      console.error("Error loading events:", error);
      setError("Failed to load events. Please try again.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Load events only when authenticated and initialized
  useEffect(() => {
    if (isInitialized && isAuthenticated()) {
      loadEvents();
    } else if (isInitialized && !isAuthenticated()) {
      // Clear events when not authenticated
      setEvents([]);
      setLoading(false);
      setError(null);
    }
  }, [isInitialized, isAuthenticated]);

  // Update a specific event in the state
  const updateEventInState = (updatedEvent) => {
    // console.log("Searching for event with id:", updatedEvent.id);
    // console.log("Events in state:", events);
    const oldEvent = events.find((event) => event.id === updatedEvent.id);
    // console.log("EventsContext - updateEventInState called:", {
    //   oldEvent,
    //   updatedEvent,
    //   oldStartTime: oldEvent?.startTime,
    //   newStartTime: updatedEvent.startTime,
    // });
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event
      )
    );
    // Update dashboard stats directly without API call
    updateEventsCount("update", oldEvent?.startTime, updatedEvent.startTime);
  };

  // Add a new event to the state
  const addEventToState = (newEvent) => {
    // console.log("EventsContext - addEventToState called:", {
    //   newEvent,
    //   startTime: newEvent.startTime,
    // });
    setEvents((prevEvents) => [newEvent, ...prevEvents]);
    // Update dashboard stats directly without API call
    updateEventsCount("add", null, newEvent.startTime);
  };

  // Remove an event from the state
  const removeEventFromState = (eventId) => {
    const eventToRemove = events.find((event) => event.id === eventId);
    // console.log("EventsContext - removeEventFromState called:", {
    //   eventId,
    //   eventToRemove,
    //   startTime: eventToRemove?.startTime,
    // });
    setEvents((prevEvents) =>
      prevEvents.filter((event) => event.id !== eventId)
    );
    // Update dashboard stats directly without API call
    updateEventsCount("remove", eventToRemove?.startTime, null);
  };

  // Get events by specific date
  const getEventsByDate = (date) => {
    const targetDateString = date.toDateString();
    return events
      .filter((event) => {
        const startField = event.startTime;
        if (!startField) {
          return false;
        }
        const eventDate = new Date(startField);
        if (isNaN(eventDate.getTime())) {
          return false;
        }
        const eventDateString = eventDate.toDateString();
        return eventDateString === targetDateString;
      })
      .sort((a, b) => {
        const aStart = a.startTime;
        const bStart = b.startTime;
        return new Date(aStart) - new Date(bStart);
      });
  };

  // Get today's events (commonly used helper)
  const getTodayEvents = () => {
    const today = new Date();
    return getEventsByDate(today);
  };

  // Get events by multiple dates
  const getEventsByDateRange = (startDate, endDate) => {
    return events.filter((event) => {
      const startField = event.startTime;
      if (!startField) {
        return false;
      }
      const eventDate = new Date(startField);
      if (isNaN(eventDate.getTime())) {
        return false;
      }
      return eventDate >= startDate && eventDate <= endDate;
    });
  };

  const value = {
    events,
    setEvents,
    loading,
    error,
    loadEvents,
    updateEventInState,
    addEventToState,
    removeEventFromState,
    getEventsByDate,
    getTodayEvents,
    getEventsByDateRange,
  };

  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  );
};
