import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchJobs } from "../services/api";

const JobsContext = createContext();

export const useJobs = () => {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error("useJobs must be used within a JobsProvider");
  }
  return context;
};

export const JobsProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchJobs({
        page: 1,
        limit: 50,
      });

      if (response && response.data) {
        setJobs(response.data);
      } else {
        console.error("Unexpected API response format:", response);
        setJobs([]);
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
      setError("Failed to load jobs. Please try again.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Load jobs on mount
  useEffect(() => {
    loadJobs();
  }, []);

  // Update a specific job in the state
  const updateJobInState = (updatedJob) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === updatedJob.id ? { ...job, ...updatedJob } : job
      )
    );
  };

  // Add a new job to the state
  const addJobToState = (newJob) => {
    setJobs((prevJobs) => [newJob, ...prevJobs]);
  };

  // Remove a job from the state
  const removeJobFromState = (jobId) => {
    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
  };

  // Get filtered jobs by status
  const getJobsByStatus = (status) => {
    return jobs.filter((job) => job.status === status);
  };

  // Get jobs by multiple statuses
  const getJobsByStatuses = (statuses) => {
    return jobs.filter((job) => statuses.includes(job.status));
  };

  const value = {
    jobs,
    loading,
    error,
    loadJobs,
    updateJobInState,
    addJobToState,
    removeJobFromState,
    getJobsByStatus,
    getJobsByStatuses,
  };

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
};
