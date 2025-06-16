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
        /* console.log("🔄 Starting token refresh..."); */

        // Get refresh token from storage
        const refreshToken =
            localStorage.getItem("refreshToken") ||
            sessionStorage.getItem("refreshToken");

        if (!refreshToken) {
            /* console.log("❌ No refresh token found in storage"); */
            throw new Error("No refresh token available");
        }

        /* console.log("🔍 Making refresh token API call..."); */
        const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/auth/refresh-token`,
            { refreshToken },
            {
                headers: { "Content-Type": "application/json" },
            }
        );

        /* console.log("✅ Refresh token response:", response.data); */

        if (!response.data.success || !response.data.data) {
            throw new Error("Invalid refresh response format");
        }

        const { accessToken, refreshToken: newRefreshToken } =
            response.data.data;

        if (!accessToken) {
            throw new Error("No access token in refresh response");
        }

        /* console.log("💾 Updating tokens in storage..."); */

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

        /* console.log("✅ Token refresh successful"); */
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
            /* console.log("🔄 Redirecting to login..."); */
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
        /* console.log("=== API INTERCEPTOR ERROR ==="); */
        /* console.log("Error status:", error.response?.status); */
        /* console.log("Error URL:", error.config?.url); */

        const originalRequest = error.config;

        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry
        ) {
            /* console.log("🔄 401 Error detected, attempting refresh..."); */
            originalRequest._retry = true;

            // Check if user should be authenticated
            const isLoggedIn =
                localStorage.getItem("isLoggedIn") ||
                sessionStorage.getItem("isLoggedIn");

            if (!isLoggedIn || isLoggedIn !== "true") {
                // console.log(
                /* "❌ User not logged in, skipping refresh and clearing any stale tokens" */
                // );
                // );
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
                    /* console.log("🔄 Creating new refresh token promise..."); */
                    refreshTokenPromise = refreshTokenAPI().finally(() => {
                        // Clear the promise after completion (success or failure)
                        refreshTokenPromise = null;
                    });
                } else {
                    /* console.log("🔄 Using existing refresh token promise..."); */
                }

                // Wait for the refresh to complete
                const newAccessToken = await refreshTokenPromise;

                /* console.log("🔄 Retrying original request with new token..."); */

                // Update the original request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                /* console.log("❌ Refresh failed, rejecting original request"); */
                // Refresh failed, user will be redirected to login
                return Promise.reject(refreshError);
            }
        }

        // If not a 401 error or refresh failed, handle normally
        if (error.response && error.response.status === 401) {
            /* console.log("❌ 401 error after retry, clearing auth data"); */

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
        /* console.log("🔐 Attempting login..."); */

        const response = await api.post("/auth/login", {
            phoneNumber,
            password,
        });

        /* console.log("✅ Login response:", response.data); */

        if (!response.data.success || !response.data.data) {
            throw new Error("Invalid login response format");
        }

        // Store both access and refresh tokens
        const { accessToken, refreshToken, user } = response.data.data;

        if (!accessToken || !refreshToken) {
            throw new Error("Missing tokens in login response");
        }

        /* console.log("💾 Storing auth data..."); */

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

        /* console.log("✅ Login successful, tokens stored"); */
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
        /* console.log("Job response:", response.data); */
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

export const getConversations = async () => {
    try {
        const response = await api.get("/ai/conversations");
        return response.data;
    } catch (error) {
        console.error("Error fetching AI conversations:", error);
        throw error;
    }
};

export const getConversationMessages = async (contactId) => {
    try {
        const response = await api.get(`/ai/conversation/contact/${contactId}`);
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

// Telnyx Video Room APIs
export const createVideoRoom = async (contactId) => {
    try {
        const telnyxApiKey = import.meta.env.VITE_TELNYX_API_KEY;

        if (!telnyxApiKey) {
            throw new Error("Telnyx API key not configured");
        }

        // Create video room using Telnyx API
        const telnyxResponse = await axios.post(
            "https://api.telnyx.com/v2/rooms",
            {
                unique_name: `room_${contactId}_${Date.now()}`,
                max_participants: 2,
                enable_recording: false,
                webhook_event_url: import.meta.env.VITE_N8N_API_URL,
                webhook_event_failover_url: null,
            },
            {
                headers: {
                    Authorization: `Bearer ${telnyxApiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!telnyxResponse.data || !telnyxResponse.data.data) {
            throw new Error("Invalid response from Telnyx API");
        }

        const roomData = telnyxResponse.data.data;

        // Generate participant token for proper join URL
        let clientToken = null;
        let refreshToken = null;
        let joinUrl = `https://telnyx-meet-demo.vercel.app/rooms/${roomData.id}`;

        try {
            const tokenResponse = await generateClientToken(roomData.id);
            if (tokenResponse.success) {
                clientToken = tokenResponse.data.clientToken;
                refreshToken = tokenResponse.data.refreshToken;
                // Use the correct Telnyx Meet demo URL format with tokens
                joinUrl = `https://telnyx-meet-demo.vercel.app/rooms/${roomData.id}?client_token=${clientToken}&refresh_token=${refreshToken}`;
            }
        } catch (tokenError) {
            console.warn(
                "Participant token generation failed, using basic room URL:",
                tokenError.message
            );
            // Continue with basic URL without tokens
        }

        return {
            success: true,
            data: {
                roomId: roomData.id,
                uniqueName: roomData.unique_name,
                joinUrl: joinUrl,
                maxParticipants: roomData.max_participants,
                enableRecording: roomData.enable_recording,
                createdAt: roomData.created_at,
                clientToken: clientToken,
                refreshToken: refreshToken,
            },
        };
    } catch (error) {
        console.error("Error creating Telnyx video room:", error);
        throw error;
    }
};

export const updateVideoRoom = async (roomId, updateData) => {
    try {
        const telnyxApiKey = import.meta.env.VITE_TELNYX_API_KEY;

        if (!telnyxApiKey) {
            throw new Error("Telnyx API key not configured");
        }

        // Update video room using Telnyx API
        const telnyxResponse = await axios.patch(
            `https://api.telnyx.com/v2/rooms/${roomId}`,
            updateData,
            {
                headers: {
                    Authorization: `Bearer ${telnyxApiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!telnyxResponse.data || !telnyxResponse.data.data) {
            throw new Error("Invalid response from Telnyx API");
        }

        const roomData = telnyxResponse.data.data;

        return {
            success: true,
            data: {
                roomId: roomData.id,
                uniqueName: roomData.unique_name,
                joinUrl:
                    roomData.session_url ||
                    `https://meet.telnyx.com/rooms/${roomData.id}`,
                maxParticipants: roomData.max_participants,
                enableRecording: roomData.enable_recording,
                updatedAt: roomData.updated_at,
            },
        };
    } catch (error) {
        console.error("Error updating Telnyx video room:", error);
        throw error;
    }
};

export const deleteVideoRoom = async (roomId) => {
    try {
        const telnyxApiKey = import.meta.env.VITE_TELNYX_API_KEY;

        if (!telnyxApiKey) {
            throw new Error("Telnyx API key not configured");
        }

        // Delete video room using Telnyx API
        const telnyxResponse = await axios.delete(
            `https://api.telnyx.com/v2/rooms/${roomId}`,
            {
                headers: {
                    Authorization: `Bearer ${telnyxApiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return {
            success: true,
            message: "Video room deleted successfully",
            roomId: roomId,
        };
    } catch (error) {
        console.error("Error deleting Telnyx video room:", error);
        throw error;
    }
};

export const getVideoRoom = async (roomId) => {
    try {
        const telnyxApiKey = import.meta.env.VITE_TELNYX_API_KEY;

        if (!telnyxApiKey) {
            throw new Error("Telnyx API key not configured");
        }

        // Get video room details using Telnyx API
        const telnyxResponse = await axios.get(
            `https://api.telnyx.com/v2/rooms/${roomId}`,
            {
                headers: {
                    Authorization: `Bearer ${telnyxApiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!telnyxResponse.data || !telnyxResponse.data.data) {
            throw new Error("Invalid response from Telnyx API");
        }

        const roomData = telnyxResponse.data.data;

        return {
            success: true,
            data: {
                roomId: roomData.id,
                uniqueName: roomData.unique_name,
                joinUrl:
                    roomData.session_url ||
                    `https://meet.telnyx.com/rooms/${roomData.id}`,
                maxParticipants: roomData.max_participants,
                enableRecording: roomData.enable_recording,
                createdAt: roomData.created_at,
                updatedAt: roomData.updated_at,
                status: roomData.status,
            },
        };
    } catch (error) {
        console.error("Error fetching Telnyx video room:", error);
        throw error;
    }
};

// Generate participant token for Telnyx video room
export const generateClientToken = async (roomId) => {
    try {
        const telnyxApiKey = import.meta.env.VITE_TELNYX_API_KEY;

        if (!telnyxApiKey) {
            throw new Error("Telnyx API key not configured");
        }

        // Generate participant token using correct Telnyx API endpoint
        const tokenResponse = await axios.post(
            `https://api.telnyx.com/v2/rooms/${roomId}/actions/generate_join_client_token`,
            {
                token_ttl_secs: 600, // 10 minutes access token
                refresh_token_ttl_secs: 3600, // 1 hour refresh token
            },
            {
                headers: {
                    Authorization: `Bearer ${telnyxApiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!tokenResponse.data || !tokenResponse.data.data) {
            throw new Error("Invalid response from Telnyx token API");
        }

        const tokenData = tokenResponse.data.data;

        return {
            success: true,
            data: {
                clientToken: tokenData.token,
                refreshToken: tokenData.refresh_token,
            },
        };
    } catch (error) {
        console.error("Error generating Telnyx participant token:", error);
        throw error;
    }
};

// Refresh participant token for Telnyx video room
export const refreshClientToken = async (roomId, refreshToken) => {
    try {
        const telnyxApiKey = import.meta.env.VITE_TELNYX_API_KEY;

        if (!telnyxApiKey) {
            throw new Error("Telnyx API key not configured");
        }

        // Refresh participant token using Telnyx API endpoint
        const tokenResponse = await axios.post(
            `https://api.telnyx.com/v2/rooms/${roomId}/actions/refresh_client_token`,
            {
                token_ttl_secs: 600, // 10 minutes access token
                refresh_token: refreshToken,
            },
            {
                headers: {
                    Authorization: `Bearer ${telnyxApiKey}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );

        if (!tokenResponse.data || !tokenResponse.data.data) {
            throw new Error("Invalid response from Telnyx refresh token API");
        }

        const tokenData = tokenResponse.data.data;

        return {
            success: true,
            data: {
                clientToken: tokenData.token,
                refreshToken: tokenData.refresh_token,
            },
        };
    } catch (error) {
        console.error("Error refreshing Telnyx participant token:", error);
        throw error;
    }
};

export const sendVideoRoomWebhook = async (joinLink, contactId, userId) => {
    try {
        const webhookUrl = import.meta.env.VITE_N8N_API_URL;

        if (!webhookUrl) {
            console.warn("N8N webhook URL not configured");
            return { success: true, message: "Webhook URL not configured" };
        }

        // Enhanced webhook payload with contact and user information
        const webhookData = {
            webhookEvent: "share-room-link",
            joinLink: joinLink,
            contactId: contactId,
            userId: userId,
        };

        const response = await axios.post(webhookUrl, webhookData, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        console.error("Error sending video room webhook:", error);
        throw error;
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

        /* console.log("✅ Room creation response:", normalizedResponse); */
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

// Dual-API Room Management Functions (Telnyx + System Sync)
export const createRoomWithSync = async (contactId) => {
    let telnyxRoomId = null;

    try {
        /* console.log("🎥 Creating video room with dual-API sync..."); */

        // Step 1: Create room in Telnyx
        /* console.log("📡 Creating room in Telnyx..."); */
        const telnyxResponse = await createVideoRoom(contactId);

        if (!telnyxResponse.success || !telnyxResponse.data) {
            throw new Error("Failed to create room in Telnyx");
        }

        const telnyxRoom = telnyxResponse.data;
        telnyxRoomId = telnyxRoom.roomId;

        /* console.log("✅ Telnyx room created:", telnyxRoomId); */

        // Step 2: Store room metadata in our system
        /* console.log("💾 Storing room in system database..."); */
        const systemRoomData = {
            telnyxRoomId: telnyxRoom.roomId,
            uniqueName: telnyxRoom.uniqueName,
            joinUrl: telnyxRoom.joinUrl,
            maxParticipants: telnyxRoom.maxParticipants,
            enableRecording: telnyxRoom.enableRecording,
            clientToken: telnyxRoom.clientToken,
            refreshToken: telnyxRoom.refreshToken,
            telnyxCreatedAt: telnyxRoom.createdAt,
            createdFor: contactId,
        };

        const systemResponse = await createRoomInSystem(systemRoomData);

        if (!systemResponse.success) {
            throw new Error("Failed to store room in system database");
        }

        /* console.log("✅ Room stored in system database"); */

        // Return combined data with system ID
        return {
            success: true,
            data: {
                ...telnyxRoom,
                systemId: systemResponse.data.room.id,
                createdFor: contactId,
                user: systemResponse.data.room.user,
                contact: systemResponse.data.room.contact,
            },
        };
    } catch (error) {
        console.error("❌ Error in createRoomWithSync:", error);

        // Cleanup: If Telnyx room was created but system storage failed, clean up Telnyx room
        if (telnyxRoomId) {
            /* console.log(
                "🧹 Cleaning up Telnyx room due to system storage failure..."
            ); */
            try {
                await deleteVideoRoom(telnyxRoomId);
                /* console.log("✅ Telnyx room cleaned up"); */
            } catch (cleanupError) {
                console.error(
                    "❌ Failed to cleanup Telnyx room:",
                    cleanupError
                );
            }
        }

        throw error;
    }
};

export const updateRoomWithSync = async (
    systemId,
    telnyxRoomId,
    updateData
) => {
    try {
        /* console.log("🎥 Updating video room with dual-API sync..."); */

        // Step 1: Update room in Telnyx
        /* console.log("📡 Updating room in Telnyx..."); */
        const telnyxResponse = await updateVideoRoom(telnyxRoomId, updateData);

        if (!telnyxResponse.success || !telnyxResponse.data) {
            throw new Error("Failed to update room in Telnyx");
        }

        /* console.log("✅ Telnyx room updated"); */

        // Step 2: Update room metadata in our system
        /* console.log("💾 Updating room in system database..."); */

        // Only update the fields that were actually changed - preserve original joinUrl
        const systemUpdateData = {
            // Only include fields that should be updated, don't overwrite joinUrl unless explicitly requested
            ...(updateData.max_participants && {
                maxParticipants: telnyxResponse.data.maxParticipants,
            }),
            ...(updateData.enable_recording !== undefined && {
                enableRecording: telnyxResponse.data.enableRecording,
            }),
            ...(updateData.unique_name && {
                uniqueName: telnyxResponse.data.uniqueName,
            }),
            // Only update joinUrl if it was explicitly requested in updateData
            ...(updateData.joinUrl && { joinUrl: telnyxResponse.data.joinUrl }),
        };

        // console.log(
        //    "📝 System update data (preserving original joinUrl):",
        //   systemUpdateData
        // );

        const systemResponse = await updateRoomInSystem(
            systemId,
            systemUpdateData
        );

        if (!systemResponse.success) {
            console.warn(
                "⚠️ Failed to update room in system database, but Telnyx update succeeded"
            );
        } else {
            /* console.log("✅ Room updated in system database"); */
        }

        // Return combined data - preserve original room data and only update changed fields
        return {
            success: true,
            data: {
                systemId: systemId,
                telnyxRoomId: telnyxRoomId,
                // Only return the fields that were actually updated
                ...(updateData.max_participants && {
                    maxParticipants: telnyxResponse.data.maxParticipants,
                }),
                ...(updateData.enable_recording !== undefined && {
                    enableRecording: telnyxResponse.data.enableRecording,
                }),
                ...(updateData.unique_name && {
                    uniqueName: telnyxResponse.data.uniqueName,
                }),
                // Preserve other room data from system response
                ...systemResponse.data?.room,
            },
        };
    } catch (error) {
        console.error("❌ Error in updateRoomWithSync:", error);
        throw error;
    }
};

export const deleteRoomWithSync = async (systemId, telnyxRoomId) => {
    try {
        /* console.log("🎥 Deleting video room with dual-API sync..."); */

        // Step 1: Delete room from Telnyx
        /* console.log("📡 Deleting room from Telnyx..."); */
        const telnyxResponse = await deleteVideoRoom(telnyxRoomId);

        if (!telnyxResponse.success) {
            throw new Error("Failed to delete room from Telnyx");
        }

        /* console.log("✅ Telnyx room deleted"); */

        // Step 2: Delete room from our system
        /* console.log("💾 Deleting room from system database..."); */
        const systemResponse = await deleteRoomFromSystem(systemId);

        if (!systemResponse.success) {
            console.warn(
                "⚠️ Failed to delete room from system database, but Telnyx deletion succeeded"
            );
        } else {
            /* console.log("✅ Room deleted from system database"); */
        }

        return {
            success: true,
            message: "Room deleted successfully from both systems",
        };
    } catch (error) {
        console.error("❌ Error in deleteRoomWithSync:", error);
        throw error;
    }
};

export default api;
