import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchEvents } from "../services/api";

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

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, []);

  // Update a specific event in the state
  const updateEventInState = (updatedEvent) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event
      )
    );
  };

  // Add a new event to the state
  const addEventToState = (newEvent) => {
    setEvents((prevEvents) => [newEvent, ...prevEvents]);
  };

  // Remove an event from the state
  const removeEventFromState = (eventId) => {
    setEvents((prevEvents) =>
      prevEvents.filter((event) => event.id !== eventId)
    );
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
