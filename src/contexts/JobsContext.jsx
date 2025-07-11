import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchJobs } from "../services/api";
import { useDashboardStats } from "./DashboardStatsContext";
import { useAuth } from "../hooks/useAuth";
import { useEvents } from "./EventsContext";
import { toast } from "sonner";

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
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalPages: 1,
        totalItems: 0,
    });
    const { updateJobsCount } = useDashboardStats();
    const { isAuthenticated, isInitialized } = useAuth();
    const { addEventToState } = useEvents();

    const loadJobs = async (params = {}) => {
        try {
            setLoading(true);
            setError(null);

            const requestParams = {
                page: params.page || pagination.page,
                limit: params.limit || pagination.limit,
                ...params,
            };

            console.log("API call with params:", requestParams); // Debug log

            const response = await fetchJobs(requestParams);

            if (response && response.data) {
                // Backend should handle filtering, so no need for frontend filtering
                setJobs(response.data);

                // Update pagination info from response
                const newPagination = {
                    page: requestParams.page,
                    limit: requestParams.limit,
                    totalPages: response.pagination?.pages || 1,
                    totalItems:
                        response.pagination?.total || response.data.length,
                };

                setPagination(newPagination);
            } else {
                console.error("Unexpected API response format:", response);
                setJobs([]);
                setPagination((prev) => ({
                    ...prev,
                    totalPages: 1,
                    totalItems: 0,
                }));
            }
        } catch (error) {
            console.error("Error loading jobs:", error);
            setError("Failed to load jobs. Please try again.");
            setJobs([]);
            setPagination((prev) => ({
                ...prev,
                totalPages: 1,
                totalItems: 0,
            }));
        } finally {
            setLoading(false);
        }
    };

    // Load jobs with pagination support - FIXED: Added search parameter
    const loadJobsWithPagination = async (
        page = 1,
        status = null,
        search = null
    ) => {
        const params = {
            page,
            limit: pagination.limit,
        };

        if (status) {
            params.status = Array.isArray(status) ? status : [status];
        }

        // Add search parameter if provided
        if (search && search.trim() !== "") {
            params.search = search.trim(); // Changed from 'name' to 'search' to match backend
        }

        console.log("loadJobsWithPagination called with:", {
            page,
            status,
            search,
            params,
        }); // Debug log

        await loadJobs(params);
    };

    // Load jobs only when authenticated and initialized
    useEffect(() => {
        if (isInitialized && isAuthenticated()) {
            loadJobs();
        } else if (isInitialized && !isAuthenticated()) {
            // Clear jobs when not authenticated
            setJobs([]);
            setLoading(false);
            setError(null);
        }
    }, [isInitialized, isAuthenticated]);

    // Update a specific job in the state
    const updateJobInState = (updatedJob) => {
        const oldJob = jobs.find((job) => job.id === updatedJob.id);
        setJobs((prevJobs) =>
            prevJobs.map((job) =>
                job.id === updatedJob.id ? { ...job, ...updatedJob } : job
            )
        );
        // Update dashboard stats directly without API call
        updateJobsCount("update", oldJob?.status, updatedJob.status);
    };

    // Add a new job to the state
    const addJobToState = (newJob) => {
        setJobs((prevJobs) => [newJob, ...prevJobs]);
        // Update dashboard stats directly without API call
        updateJobsCount("add", null, newJob.status);

        // Create an event for the new job
        const newEvent = {
            title: `Job: ${newJob.title || `Job ID: ${newJob.id}`}`, // Defensive check for title
            start: newJob.scheduledDate || new Date().toISOString(),
            end: newJob.scheduledDate || new Date().toISOString(),
            allDay: true, // Assuming jobs are all-day events for now
            jobId: newJob.id,
            status: newJob.status || "scheduled", // Default status
            description: newJob.description || "No description provided.", // Default description
        };
        addEventToState(newEvent);
        toast.success(`Job "${newJob.title || newJob.id}" and associated event created successfully!`);
    };

    // Remove a job from the state
    const removeJobFromState = (jobId) => {
        const jobToRemove = jobs.find((job) => job.id === jobId);
        setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
        // Update dashboard stats directly without API call
        updateJobsCount("remove", jobToRemove?.status, null);
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
        pagination,
        loadJobs,
        loadJobsWithPagination,
        updateJobInState,
        addJobToState,
        removeJobFromState,
        getJobsByStatus,
        getJobsByStatuses,
    };

    return (
        <JobsContext.Provider value={value}>{children}</JobsContext.Provider>
    );
};
