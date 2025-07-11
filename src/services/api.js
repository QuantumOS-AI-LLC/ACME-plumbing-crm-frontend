import axios from "axios";

// Create an axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Global refresh token promise to prevent race conditions
let refreshTokenPromise = null;

// Token refresh function
const refreshTokenAPI = async () => {
    try {
        console.log("🔄 Starting token refresh...");

        // Get refresh token from storage
        const refreshToken =
            localStorage.getItem("refreshToken") ||
            sessionStorage.getItem("refreshToken");

        if (!refreshToken) {
            console.log("❌ No refresh token found in storage");
            throw new Error("No refresh token available");
        }

        console.log("🔍 Making refresh token API call...");
        const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/auth/refresh-token`,
            { refreshToken },
            {
                headers: { "Content-Type": "application/json" },
            }
        );

        console.log("✅ Refresh token response:", response.data);

        if (!response.data.success || !response.data.data) {
            throw new Error("Invalid refresh response format");
        }

        const { accessToken, refreshToken: newRefreshToken } =
            response.data.data;

        if (!accessToken) {
            throw new Error("No access token in refresh response");
        }

        console.log("💾 Updating tokens in storage...");

        // Update tokens in storage
        const isSessionStorage = sessionStorage.getItem("token");
        if (isSessionStorage) {
            sessionStorage.setItem("token", accessToken);
            if (newRefreshToken) {
                sessionStorage.setItem("refreshToken", newRefreshToken);
            }
        } else {
            localStorage.setItem("token", accessToken);
            if (newRefreshToken) {
                localStorage.setItem("refreshToken", newRefreshToken);
            }
        }

        console.log("✅ Token refresh successful");
        return accessToken;
    } catch (error) {
        console.error("❌ Token refresh failed:", error);

        // Refresh failed, clear all tokens and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("isLoggedIn");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("isLoggedIn");

        if (!window.location.pathname.includes("/login")) {
            console.log("🔄 Redirecting to login...");
            window.location.href = "/login";
        }

        throw error;
    }
};

// Add token to requests
api.interceptors.request.use(
    (config) => {
        // Check both localStorage and sessionStorage for token
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors with automatic token refresh - RACE CONDITION FIXED
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        console.log("=== API INTERCEPTOR ERROR ===");
        console.log("Error status:", error.response?.status);
        console.log("Error URL:", error.config?.url);

        const originalRequest = error.config;

        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry
        ) {
            console.log("🔄 401 Error detected, attempting refresh...");
            originalRequest._retry = true;

            // Check if user should be authenticated
            const isLoggedIn =
                localStorage.getItem("isLoggedIn") ||
                sessionStorage.getItem("isLoggedIn");

            if (!isLoggedIn || isLoggedIn !== "true") {
                console.log(
                    "❌ User not logged in, skipping refresh and clearing any stale tokens"
                );
                // Clear any stale tokens
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("refreshToken");
                return Promise.reject(error);
            }

            try {
                // RACE CONDITION FIX: Use shared promise for multiple simultaneous requests
                if (!refreshTokenPromise) {
                    console.log("🔄 Creating new refresh token promise...");
                    refreshTokenPromise = refreshTokenAPI().finally(() => {
                        // Clear the promise after completion (success or failure)
                        refreshTokenPromise = null;
                    });
                } else {
                    console.log("🔄 Using existing refresh token promise...");
                }

                // Wait for the refresh to complete
                const newAccessToken = await refreshTokenPromise;

                console.log("🔄 Retrying original request with new token...");

                // Update the original request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                console.log("❌ Refresh failed, rejecting original request");
                // Refresh failed, user will be redirected to login
                return Promise.reject(refreshError);
            }
        }

        // If not a 401 error or refresh failed, handle normally
        if (error.response && error.response.status === 401) {
            console.log("❌ 401 error after retry, clearing auth data");

            // Clear token from both storage types
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("isLoggedIn");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("refreshToken");
            sessionStorage.removeItem("isLoggedIn");

            // If not already on the login page, redirect
            if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

// Authentication APIs
export const loginUser = async (phoneNumber, password, rememberMe = false) => {
    try {
        console.log("🔐 Attempting login...");

        const response = await api.post("/auth/login", {
            phoneNumber,
            password,
        });

        console.log("✅ Login response:", response.data);

        if (!response.data.success || !response.data.data) {
            throw new Error("Invalid login response format");
        }

        // Store both access and refresh tokens
        const { accessToken, refreshToken, user } = response.data.data;

        if (!accessToken || !refreshToken) {
            throw new Error("Missing tokens in login response");
        }

        console.log("💾 Storing auth data...");

        // Store tokens based on rememberMe preference
        if (rememberMe) {
            localStorage.setItem("token", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userProfile", JSON.stringify(user));
        } else {
            sessionStorage.setItem("token", accessToken);
            sessionStorage.setItem("refreshToken", refreshToken);
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("userProfile", JSON.stringify(user));
        }

        console.log("✅ Login successful, tokens stored");
        return response.data;
    } catch (error) {
        console.error("❌ Login error:", error);
        throw error;
    }
};

// Manual refresh token function (can be used when needed)
export const refreshUserToken = async () => {
    try {
        return await refreshTokenAPI();
    } catch (error) {
        console.error("Manual refresh token error:", error);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        await api.post("/auth/logout");

        // Clear all tokens
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userProfile");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("isLoggedIn");
        sessionStorage.removeItem("userProfile");

        // Clear the refresh promise if it exists
        refreshTokenPromise = null;

        return true;
    } catch (error) {
        console.error("Logout error:", error);

        // Even if logout fails, clear tokens locally
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userProfile");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("isLoggedIn");
        sessionStorage.removeItem("userProfile");

        // Clear the refresh promise
        refreshTokenPromise = null;

        return false;
    }
};

export const forgotPassword = async (phoneNumber) => {
    try {
        const response = await api.post("/auth/forgot-password", {
            phoneNumber,
        });
        return response.data;
    } catch (error) {
        console.error("Forgot password error:", error);
        throw error;
    }
};

export const resetPassword = async (token, newPassword) => {
    try {
        const response = await api.post("/auth/reset-password", {
            token,
            newPassword,
        });
        return response.data;
    } catch (error) {
        console.error("Reset password error:", error);
        throw error;
    }
};

// Password Change API
export const changePassword = async (passwordData) => {
    try {
        const response = await api.post("/auth/change-password", passwordData);
        return response.data;
    } catch (error) {
        console.error("Error changing password:", error);
        throw error;
    }
};

// User Profile APIs
export const fetchUserProfile = async () => {
    try {
        const response = await api.get("/auth/profile");
        if (response.data && response.data.success) {
            localStorage.setItem(
                "userProfile",
                JSON.stringify(response.data.data.user)
            );
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
};

export const updateUserProfile = async (profileData) => {
    try {
        const response = await api.put("/users/profile", profileData);
        if (response.data && response.data.success) {
            localStorage.setItem(
                "userProfile",
                JSON.stringify(response.data.data)
            );
        }
        return response.data;
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};

// Company APIs
export const fetchCompanySettings = async () => {
    try {
        const response = await api.get("/auth/profile");
        if (response.data && response.data.success) {
            localStorage.setItem(
                "companyProfile",
                JSON.stringify(response.data.data.user.company)
            );
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching company settings:", error);
        throw error;
    }
};

export const updateCompanySettings = async (companyData) => {
    try {
        const response = await api.put("/users/company", companyData);
        if (response.data && response.data.success) {
            localStorage.setItem(
                "companyProfile",
                JSON.stringify(response.data.data)
            );
        }
        return response.data;
    } catch (error) {
        console.error("Error updating company settings:", error);
        throw error;
    }
};

export const fetchCompanyProfile = async () => {
    try {
        const response = await api.get("/companies/my-company");
        if (response.data && response.data.success) {
            localStorage.setItem(
                "companyProfile",
                JSON.stringify(response.data.data)
            );
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching company profile:", error);
        throw error;
    }
};

export const updateCompanyProfile = async (data) => {
    try {
        const response = await api.put("/companies/my-company", data);
        if (response.data && response.data.success) {
            localStorage.setItem(
                "companyProfile",
                JSON.stringify(response.data.data)
            );
        }
        return response.data;
    } catch (error) {
        console.error("Error updating company profile:", error);
        throw error;
    }
};

// Jobs APIs
export const fetchJobs = async (params = {}) => {
    try {
        const newParams = { ...params };
        if (newParams.status && Array.isArray(newParams.status)) {
            newParams.status = newParams.status.join(",");
        }
        const response = await api.get("/jobs", { params: newParams });
        return response.data;
    } catch (error) {
        console.error("Error fetching jobs:", error);
        throw error;
    }
};
export const fetchJob = async (id) => {
    try {
        const response = await api.get(`/jobs/${id}`);
        console.log("Job response:", response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching job ${id}:`, error);
        throw error;
    }
};

export const fetchJobsCount = async () => {
    try {
        const response = await api.get("/jobs/open/count");
        return response.data;
    } catch (error) {
        console.error("Error fetching jobs count:", error);
        throw error;
    }
};

export const createJob = async (jobData) => {
    try {
        const response = await api.post("/jobs", jobData);
        return response.data;
    } catch (error) {
        console.error("Error creating job:", error);
        throw error;
    }
};

export const updateJob = async (id, jobData) => {
    try {
        const response = await api.put(`/jobs/${id}`, jobData);
        return response.data;
    } catch (error) {
        console.error(`Error updating job ${id}:`, error);
        throw error;
    }
};

export const deleteJob = async (id) => {
    try {
        const response = await api.delete(`/jobs/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting job ${id}:`, error);
        throw error;
    }
};

// Estimates APIs
export const fetchEstimates = async (params = {}) => {
    try {
        const newParams = { ...params };
        if (newParams.status && Array.isArray(newParams.status)) {
            newParams.status = newParams.status.join(",");
        }
        const response = await api.get("/estimates", { params: newParams });
        return response.data;
    } catch (error) {
        console.error("Error fetching estimates:", error);
        throw error;
    }
};

export const fetchEstimate = async (id) => {
    try {
        const response = await api.get(`/estimates/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching estimate ${id}:`, error);
        throw error;
    }
};

export const fetchEstimatesCount = async () => {
    try {
        const response = await api.get("/estimates/pending/count");
        return response.data;
    } catch (error) {
        console.error("Error fetching estimates count:", error);
        throw error;
    }
};

export const createEstimate = async (estimateData) => {
    try {
        const response = await api.post("/estimates", estimateData);
        return response.data;
    } catch (error) {
        console.error("Error creating estimate:", error);
        throw error;
    }
};

export const updateEstimate = async (id, estimateData) => {
    try {
        const response = await api.put(`/estimates/${id}`, estimateData);
        return response.data;
    } catch (error) {
        console.error(`Error updating estimate ${id}:`, error);
        throw error;
    }
};

export const deleteEstimate = async (id) => {
    try {
        const response = await api.delete(`/estimates/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting estimate ${id}:`, error);
        throw error;
    }
};

// Contacts APIs
export const fetchContacts = async (params = {}) => {
    try {
        const response = await api.get("/contacts", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching contacts:", error);
        throw error;
    }
};

export const fetchContact = async (id) => {
    try {
        const response = await api.get(`/contacts/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching contact ${id}:`, error);
        throw error;
    }
};

export const createContact = async (contactData) => {
    try {
        const response = await api.post("/contacts", contactData);
        return response.data;
    } catch (error) {
        console.error("Error creating contact:", error);
        throw error;
    }
};

export const updateContact = async (id, contactData) => {
    try {
        const response = await api.put(`/contacts/${id}`, contactData);
        return response.data;
    } catch (error) {
        console.error(`Error updating contact ${id}:`, error);
        throw error;
    }
};

export const deleteContact = async (id) => {
    try {
        const response = await api.delete(`/contacts/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting contact ${id}:`, error);
        throw error;
    }
};
// Fetch jobs for a specific contact with pagination and filtering
export const fetchJobsByContact = async (contactId, params = {}) => {
    try {
        // Normalize status parameter if it's an array
        const newParams = { ...params };
        if (newParams.status && Array.isArray(newParams.status)) {
            newParams.status = newParams.status.join(",");
        }
        const response = await api.get(`/jobs/contact/${contactId}`, {
            params: newParams,
        });
        console.log("Jobs by contact response:", response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching jobs for contact ${contactId}:`, error);
        throw error;
    }
};

// Calendar/Events APIs
export const fetchEvents = async (params = {}) => {
    try {
        const response = await api.get("/calendar/events", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching events:", error);
        throw error;
    }
};

export const fetchEvent = async (id) => {
    try {
        const response = await api.get(`/calendar/events/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching event ${id}:`, error);
        throw error;
    }
};

export const fetchEventsCount = async () => {
    try {
        const response = await api.get("/calendar/events/today/count");
        return response.data;
    } catch (error) {
        console.error("Error fetching events count:", error);
        throw error;
    }
};

export const createEvent = async (eventData) => {
    try {
        const response = await api.post("/calendar/events", eventData);
        return response.data;
    } catch (error) {
        console.error("Error creating event:", error);
        throw error;
    }
};

export const updateEvent = async (id, eventData) => {
    try {
        const response = await api.put(`/calendar/events/${id}`, eventData);
        return response.data;
    } catch (error) {
        console.error(`Error updating event ${id}:`, error);
        throw error;
    }
};

export const deleteEvent = async (id) => {
    try {
        const response = await api.delete(`/calendar/events/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting event ${id}:`, error);
        throw error;
    }
};

// Time Zone API
export const fetchTimeZone = async () => {
    try {
        const response = await api.get("/users/timezone");
        return response.data;
    } catch (error) {
        console.error("Error fetching time zone:", error);
        throw error;
    }
};

export const updateTimeZone = async (timeZoneData) => {
    try {
        const response = await api.put("/users/timezone", timeZoneData);
        return response.data;
    } catch (error) {
        console.error("Error updating time zone:", error);
        throw error;
    }
};

// Notification Settings API
export const fetchNotificationSettings = async () => {
    try {
        const response = await api.get("/notifications/settings");
        return response.data;
    } catch (error) {
        console.error("Error fetching notification settings:", error);
        throw error;
    }
};

export const updateNotificationSettings = async (settingsData) => {
    try {
        const response = await api.put("/notifications/settings", {
            settings: settingsData,
        });
        return response.data;
    } catch (error) {
        console.error("Error updating notification settings:", error);
        throw error;
    }
};

// Notifications APIs
export const fetchNotifications = async (page = 1, limit = 10, isRead) => {
    try {
        let url = `/notifications?page=${page}&limit=${limit}`;
        if (isRead !== undefined) {
            url += `&isRead=${isRead}`;
        }
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        throw error;
    }
};

export const markNotificationAsRead = async (id) => {
    try {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    } catch (error) {
        console.error(`Error marking notification ${id} as read:`, error);
        throw error;
    }
};

export const markAllNotificationsAsRead = async () => {
    try {
        const response = await api.put("/notifications/read-all");
        return response.data;
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        throw error;
    }
};

export const deleteNotification = async (id) => {
    try {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting notification ${id}:`, error);
        throw error;
    }
};

// AI Conversations APIs - FIXED VERSION
export const getConversations = async (params = {}) => {
    try {
        // Log the parameters being sent
        console.log('📡 getConversations API called with params:', params);

        // Build query parameters properly
        const queryParams = {};
        
        // Always include page and limit
        if (params.page !== undefined) queryParams.page = params.page;
        if (params.limit !== undefined) queryParams.limit = params.limit;
        
        // Add search parameter only if it exists and is not empty
        if (params.search !== undefined && params.search !== null && params.search.trim() !== "") {
            queryParams.search = params.search.trim();
        }

        console.log('📡 Final query params being sent:', queryParams);

        const response = await api.get("/ai/conversations", {
            params: queryParams,
        });

        console.log('📥 getConversations API response:', response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching AI conversations:", error);
        throw error;
    }
};

// Alternative version if your React component is calling with individual parameters
export const getConversationsLegacy = async (page = 1, limit = 10, search = "") => {
    try {
        console.log('📡 getConversationsLegacy called with:', { page, limit, search });

        const params = { page, limit };
        
        // Only add search parameter if it exists and is not empty
        if (search && search.trim() !== "") {
            params.search = search.trim();
        }

        console.log('📡 Final params for legacy call:', params);

        const response = await api.get("/ai/conversations", { params });
        
        console.log('📥 getConversationsLegacy response:', response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching AI conversations (legacy):", error);
        throw error;
    }
};

export const getConversationMessages = async (
    contactId,
    page = 1,
    limit = 15
) => {
    try {
        const response = await api.get(
            `/ai/conversation/contact/${contactId}`,
            {
                params: { page, limit },
            }
        );
        return response.data;
    } catch (error) {
        console.error(
            `Error fetching messages for conversation ${contactId}:`,
            error
        );
        throw error;
    }
};

export const sendMessageToAI = async (
    message,
    contactId,
    estimateId,
    userId
) => {
    try {
        const response = await api.post("/ai/reply", {
            message,
            contactId,
            estimateId,
            userId,
        });
        return response.data;
    } catch (error) {
        console.error("Error sending message via /ai/reply:", error);
        throw error;
    }
};

// Services APIs
export const fetchServices = async (params = {}) => {
    try {
        const response = await api.get("/services", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching services:", error);
        throw error;
    }
};

export const fetchService = async (id) => {
    try {
        const response = await api.get(`/services/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching service ${id}:`, error);
        throw error;
    }
};

export const createService = async (serviceData) => {
    try {
        const response = await api.post("/services", serviceData);
        return response.data;
    } catch (error) {
        console.error("Error creating service:", error);
        throw error;
    }
};

export const updateService = async (id, serviceData) => {
    try {
        const response = await api.put(`/services/${id}`, serviceData);
        return response.data;
    } catch (error) {
        console.error(`Error updating service ${id}:`, error);
        throw error;
    }
};

export const deleteService = async (id) => {
    try {
        const response = await api.delete(`/services/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting service ${id}:`, error);
        throw error;
    }
};

export const fetchServiceMetrics = async (params = {}) => {
    try {
        const response = await api.get("/services/metrics", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching service metrics:", error);
        throw error;
    }
};

export const fetchServiceCategories = async () => {
    try {
        const response = await api.get("/services/categories");
        return response.data;
    } catch (error) {
        console.error("Error fetching service categories:", error);
        throw error;
    }
};

export const fetchPopularTags = async () => {
    try {
        const response = await api.get("/services/tags");
        return response.data;
    } catch (error) {
        console.error("Error fetching popular tags:", error);
        throw error;
    }
};

// GPS Tracking APIs
export const toggleLiveTracking = async (isLiveTrackingEnabled) => {
    try {
        const response = await api.put("/users/toggle-tracking", {
            isLiveTrackingEnabled,
        });
        return response.data;
    } catch (error) {
        console.error("Error toggling live tracking:", error);
        throw error;
    }
};

export const updateLocation = async (latitude, longitude) => {
    try {
        const response = await api.put("/users/location", {
            latitude,
            longitude,
        });
        return response.data;
    } catch (error) {
        console.error("Error updating location:", error);
        throw error;
    }
};

// Google Calendar OAuth APIs
export const initiateGoogleCalendarAuth = async () => {
    try {
        const response = await api.get("/auth/google/calendar");
        return response.data;
    } catch (error) {
        console.error("Error initiating Google Calendar auth:", error);
        throw error;
    }
};

export const getGoogleCalendarStatus = async () => {
    try {
        const response = await api.get("/auth/google/status");
        return response.data;
    } catch (error) {
        console.error("Error fetching Google Calendar status:", error);
        throw error;
    }
};

export const disconnectGoogleCalendar = async () => {
    try {
        const response = await api.delete("/auth/google/disconnect");
        return response.data;
    } catch (error) {
        console.error("Error disconnecting Google Calendar:", error);
        throw error;
    }
};

// GetStream Video APIs (replacing Telnyx)
export const generateVideoToken = async (userId, userName) => {
    try {
        const response = await api.post("/video/generate-token", {
            userId,
            userName,
        });
        return response.data;
    } catch (error) {
        console.error("Error generating video token:", error);
        throw error;
    }
};

export const logCallSession = async (
    callId,
    participantId,
    participantName,
    userType,
    action
) => {
    try {
        const response = await api.post("/video/call-session", {
            callId,
            participantId,
            participantName,
            userType,
            action,
            timestamp: new Date().toISOString(),
        });
        return response.data;
    } catch (error) {
        console.error("Error logging call session:", error);
        // Don't throw error for logging failures
        return { success: false, error: error.message };
    }
};

// Backend Room Management APIs (System Database)
export const createRoomInSystem = async (roomData) => {
    try {
        const response = await api.post("/rooms", roomData);

        // Normalize response format: backend returns { status: "success" } but frontend expects { success: true }
        const normalizedResponse = {
            success: response.data.status === "success",
            data: response.data.data,
            message: response.data.message,
        };

        console.log("✅ Room creation response:", normalizedResponse);
        return normalizedResponse;
    } catch (error) {
        console.error("Error creating room in system:", error);
        throw error;
    }
};

export const getRoomsFromSystem = async (params = {}) => {
    try {
        const response = await api.get("/rooms", { params });

        // Normalize response format
        const normalizedResponse = {
            success: response.data.status === "success",
            data: response.data.data,
            results: response.data.results,
        };

        return normalizedResponse;
    } catch (error) {
        console.error("Error fetching rooms from system:", error);
        throw error;
    }
};

export const getRoomFromSystem = async (id) => {
    try {
        const response = await api.get(`/rooms/${id}`);

        // Normalize response format
        const normalizedResponse = {
            success: response.data.status === "success",
            data: response.data.data,
        };

        return normalizedResponse;
    } catch (error) {
        console.error(`Error fetching room ${id} from system:`, error);
        throw error;
    }
};

export const updateRoomInSystem = async (id, roomData) => {
    try {
        const response = await api.put(`/rooms/${id}`, roomData);

        // Normalize response format
        const normalizedResponse = {
            success: response.data.status === "success",
            data: response.data.data,
        };

        return normalizedResponse;
    } catch (error) {
        console.error(`Error updating room ${id} in system:`, error);
        throw error;
    }
};

export const deleteRoomFromSystem = async (id) => {
    try {
        const response = await api.delete(`/rooms/${id}`);

        // Normalize response format - DELETE typically returns 204 with no content
        const normalizedResponse = {
            success:
                response.status === 204 ||
                (response.data && response.data.status === "success"),
            message: "Room deleted successfully",
        };

        return normalizedResponse;
    } catch (error) {
        console.error(`Error deleting room ${id} from system:`, error);
        throw error;
    }
};

export default api;