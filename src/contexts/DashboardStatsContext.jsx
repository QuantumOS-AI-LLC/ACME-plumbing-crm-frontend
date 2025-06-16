import React, { createContext, useContext, useState, useCallback } from "react";
import {
  fetchJobsCount,
  fetchEstimatesCount,
  fetchEventsCount,
} from "../services/api";
import { useAuth } from "../hooks/useAuth";

const DashboardStatsContext = createContext();

export const useDashboardStats = () => {
  const context = useContext(DashboardStatsContext);
  if (!context) {
    throw new Error(
      "useDashboardStats must be used within a DashboardStatsProvider"
    );
  }
  return context;
};

export const DashboardStatsProvider = ({ children }) => {
  const [stats, setStats] = useState({
    openJobsCount: 0,
    pendingEstimatesCount: 0,
    todaysEventsCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { isAuthenticated } = useAuth();

  const loadDashboardStats = useCallback(
    async (force = false) => {
      // Check authentication first
      if (!isAuthenticated()) {
        // console.log("Not authenticated, skipping dashboard stats load");
        setStats({
          openJobsCount: 0,
          pendingEstimatesCount: 0,
          todaysEventsCount: 0,
        });
        setHasLoaded(false);
        setLoading(false);
        setError(null);
        return;
      }

      // Prevent multiple loads unless forced
      if (hasLoaded && !force) {
        // console.log("Dashboard stats already loaded, skipping...");
        return;
      }

      // Prevent concurrent loads
      if (loading) {
        // console.log("Dashboard stats already loading, skipping...");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Call all three count APIs in parallel
        const [jobsResponse, estimatesResponse, eventsResponse] =
          await Promise.all([
            fetchJobsCount(),
            fetchEstimatesCount(),
            fetchEventsCount(),
          ]);

        // Update stats with the counts from API responses
        setStats({
          openJobsCount: jobsResponse?.data?.openJobsCount || 0,
          pendingEstimatesCount:
            estimatesResponse?.data?.pendingEstimatesCount || 0,
          todaysEventsCount: eventsResponse?.data?.todaysEventsCount || 0,
        });

        // console.log("Dashboard stats loaded:", {
        //   openJobs: jobsResponse?.data?.openJobsCount || 0,
        //   pendingEstimates: estimatesResponse?.data?.pendingEstimatesCount || 0,
        //   todaysEvents: eventsResponse?.data?.todaysEventsCount || 0,
        // });

        setHasLoaded(true);
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
        setError("Failed to load dashboard statistics");

        // Set default values on error
        setStats({
          openJobsCount: 0,
          pendingEstimatesCount: 0,
          todaysEventsCount: 0,
        });
      } finally {
        setLoading(false);
      }
    },
    [hasLoaded, loading, isAuthenticated]
  );

  // Smart count update functions to avoid unnecessary API calls
  const updateJobsCount = useCallback(
    (operation, oldStatus = null, newStatus = null) => {
      setStats((prevStats) => {
        let newOpenJobsCount = prevStats.openJobsCount;

        if (operation === "add" && newStatus === "open") {
          newOpenJobsCount += 1;
        } else if (operation === "remove" && oldStatus === "open") {
          newOpenJobsCount -= 1;
        } else if (operation === "update") {
          // Handle status changes
          if (oldStatus === "open" && newStatus !== "open") {
            newOpenJobsCount -= 1; // Job moved out of open status
          } else if (oldStatus !== "open" && newStatus === "open") {
            newOpenJobsCount += 1; // Job moved to open status
          }
        }

        // console.log(
        //   `Jobs count updated: ${prevStats.openJobsCount} → ${newOpenJobsCount} (${operation})`
        // );
        return { ...prevStats, openJobsCount: Math.max(0, newOpenJobsCount) };
      });
    },
    []
  );

  const updateEstimatesCount = useCallback(
    (operation, oldStatus = null, newStatus = null) => {
      setStats((prevStats) => {
        let newPendingEstimatesCount = prevStats.pendingEstimatesCount;

        if (operation === "add" && newStatus === "pending") {
          newPendingEstimatesCount += 1;
        } else if (operation === "remove" && oldStatus === "pending") {
          newPendingEstimatesCount -= 1;
        } else if (operation === "update") {
          // Handle status changes
          if (oldStatus === "pending" && newStatus !== "pending") {
            newPendingEstimatesCount -= 1; // Estimate moved out of pending status
          } else if (oldStatus !== "pending" && newStatus === "pending") {
            newPendingEstimatesCount += 1; // Estimate moved to pending status
          }
        }

        // console.log(
        //   `Estimates count updated: ${prevStats.pendingEstimatesCount} → ${newPendingEstimatesCount} (${operation})`
        // );
        return {
          ...prevStats,
          pendingEstimatesCount: Math.max(0, newPendingEstimatesCount),
        };
      });
    },
    []
  );

  const updateEventsCount = useCallback(
    (operation, oldDate = null, newDate = null) => {
      const today = new Date().toDateString();

      // console.log("updateEventsCount called:", {
      //   operation,
      //   oldDate,
      //   newDate,
      //   today,
      // });

      setStats((prevStats) => {
        let newTodaysEventsCount = prevStats.todaysEventsCount;

        if (operation === "add") {
          const eventDate = new Date(newDate).toDateString();
          // console.log("Add operation - Event date vs Today:", {
          //   eventDate,
          //   today,
          //   isToday: eventDate === today,
          // });
          if (eventDate === today) {
            newTodaysEventsCount += 1;
          }
        } else if (operation === "remove") {
          const eventDate = new Date(oldDate).toDateString();
          // console.log("Remove operation - Event date vs Today:", {
          //   eventDate,
          //   today,
          //   isToday: eventDate === today,
          // });
          if (eventDate === today) {
            newTodaysEventsCount -= 1;
          }
        } else if (operation === "update") {
          const oldEventDate = oldDate
            ? new Date(oldDate).toDateString()
            : null;
          const newEventDate = newDate
            ? new Date(newDate).toDateString()
            : null;

          // console.log("Update operation - Date comparison:", {
          //   oldEventDate,
          //   newEventDate,
          //   today,
          //   oldIsToday: oldEventDate === today,
          //   newIsToday: newEventDate === today,
          // });

          // Handle date changes
          if (oldEventDate === today && newEventDate !== today) {
            newTodaysEventsCount -= 1; // Event moved out of today
          } else if (oldEventDate !== today && newEventDate === today) {
            newTodaysEventsCount += 1; // Event moved to today
          }
        }

        // console.log(
        //   `Events count updated: ${prevStats.todaysEventsCount} → ${newTodaysEventsCount} (${operation})`
        // );
        return {
          ...prevStats,
          todaysEventsCount: Math.max(0, newTodaysEventsCount),
        };
      });
    },
    []
  );

  const value = {
    stats,
    loading,
    error,
    loadDashboardStats,
    updateJobsCount,
    updateEstimatesCount,
    updateEventsCount,
  };

  return (
    <DashboardStatsContext.Provider value={value}>
      {children}
    </DashboardStatsContext.Provider>
  );
};
