import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchEstimates } from "../services/api";
import { useDashboardStats } from "./DashboardStatsContext";
import { useAuth } from "../hooks/useAuth";

const EstimatesContext = createContext();

export const useEstimates = () => {
    const context = useContext(EstimatesContext);
    if (!context) {
        throw new Error(
            "useEstimates must be used within an EstimatesProvider"
        );
    }
    return context;
};

export const EstimatesProvider = ({ children }) => {
    const [estimates, setEstimates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalPages: 1,
        totalItems: 0,
    });
    const { updateEstimatesCount } = useDashboardStats();
    const { isAuthenticated, isInitialized } = useAuth();

    const loadEstimates = async (params = {}) => {
        try {
            setLoading(true);
            setError(null);

            const requestParams = {
                page: params.page || pagination.page,
                limit: params.limit || pagination.limit,
                ...params,
            };

            console.log("Estimates API call with params:", requestParams); // Debug log

            const response = await fetchEstimates(requestParams);

            if (response && response.data) {
                // Backend should handle filtering, so no need for frontend filtering
                setEstimates(response.data);

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
                setEstimates([]);
                setPagination((prev) => ({
                    ...prev,
                    totalPages: 1,
                    totalItems: 0,
                }));
            }
        } catch (error) {
            console.error("Error loading estimates:", error);
            setError("Failed to load estimates. Please try again.");
            setEstimates([]);
            setPagination((prev) => ({
                ...prev,
                totalPages: 1,
                totalItems: 0,
            }));
        } finally {
            setLoading(false);
        }
    };

    // Load estimates with pagination support - UPDATED: Added search parameter
    const loadEstimatesWithPagination = async (
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
            params.search = search.trim(); // Backend expects 'search' parameter for leadName search
        }

        console.log("loadEstimatesWithPagination called with:", {
            page,
            status,
            search,
            params,
        }); // Debug log

        await loadEstimates(params);
    };

    // Load estimates only when authenticated and initialized
    useEffect(() => {
        if (isInitialized && isAuthenticated()) {
            loadEstimates();
        } else if (isInitialized && !isAuthenticated()) {
            // Clear estimates when not authenticated
            setEstimates([]);
            setLoading(false);
            setError(null);
        }
    }, [isInitialized, isAuthenticated]);

    // Update a specific estimate in the state
    const updateEstimateInState = (updatedEstimate) => {
        const oldEstimate = estimates.find(
            (estimate) => estimate.id === updatedEstimate.id
        );
        setEstimates((prevEstimates) =>
            prevEstimates.map((estimate) =>
                estimate.id === updatedEstimate.id
                    ? { ...estimate, ...updatedEstimate }
                    : estimate
            )
        );
        // Update dashboard stats directly without API call
        updateEstimatesCount(
            "update",
            oldEstimate?.status,
            updatedEstimate.status
        );
    };

    // Add a new estimate to the state
    const addEstimateToState = (newEstimate) => {
        setEstimates((prevEstimates) => [newEstimate, ...prevEstimates]);
        // Update dashboard stats directly without API call
        updateEstimatesCount("add", null, newEstimate.status);
    };

    // Remove an estimate from the state
    const removeEstimateFromState = (estimateId) => {
        const estimateToRemove = estimates.find(
            (estimate) => estimate.id === estimateId
        );
        setEstimates((prevEstimates) =>
            prevEstimates.filter((estimate) => estimate.id !== estimateId)
        );
        // Update dashboard stats directly without API call
        updateEstimatesCount("remove", estimateToRemove?.status, null);
    };

    // Get filtered estimates by status
    const getEstimatesByStatus = (status) => {
        return estimates.filter((estimate) => estimate.status === status);
    };

    // Get estimates by multiple statuses
    const getEstimatesByStatuses = (statuses) => {
        return estimates.filter((estimate) =>
            statuses.includes(estimate.status)
        );
    };

    const value = {
        estimates,
        loading,
        error,
        pagination,
        loadEstimates,
        loadEstimatesWithPagination,
        updateEstimateInState,
        addEstimateToState,
        removeEstimateFromState,
        getEstimatesByStatus,
        getEstimatesByStatuses,
    };

    return (
        <EstimatesContext.Provider value={value}>
            {children}
        </EstimatesContext.Provider>
    );
};
