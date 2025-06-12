import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchJobs } from "../services/api";
import { useDashboardStats } from "./DashboardStatsContext";
import { useAuth } from "../hooks/useAuth";

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

    const loadJobs = async (params = {}) => {
        try {
            setLoading(true);
            setError(null);

            const requestParams = {
                page: params.page || pagination.page,
                limit: params.limit || pagination.limit,
                ...params,
            };

            const response = await fetchJobs(requestParams);

            if (response && response.data) {
                setJobs(response.data);

                // Update pagination info from response or calculate it
                const newPagination = {
                    page: requestParams.page,
                    limit: requestParams.limit,
                    totalPages:
                        response.totalPages ||
                        Math.ceil(
                            (response.total || response.data.length) /
                                requestParams.limit
                        ),
                    totalItems:
                        response.total ||
                        response.totalItems ||
                        response.data.length,
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

    // Load jobs with pagination support
    const loadJobsWithPagination = async (page = 1, status = null) => {
        const params = {
            page,
            limit: pagination.limit,
        };

        if (status) {
            params.status = Array.isArray(status) ? status : [status];
        }

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
