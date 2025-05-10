import axios from "axios";

// Create an axios instance
const isDev = window.location.hostname === "localhost";

const api = axios.create({
  baseURL: isDev
    ? "http://localhost:5001/api"
    : "https://get-connected-backend.dev.quantumos.ai/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// In your api.js file - update the interceptor

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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token from both storage types
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("token");
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
export const loginUser = async (phoneNumber, password) => {
  try {
    const response = await api.post("/auth/login", {
      phoneNumber,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await api.post("/auth/logout");
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};

export const forgotPassword = async (phoneNumber) => {
  try {
    const response = await api.post("/auth/forgot-password", { phoneNumber });
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

// User Profile APIs
export const fetchUserProfile = async () => {
  try {
    const response = await api.get("/users/me");
    if (response.data && response.data.success) {
      // Save the full response to localStorage
      localStorage.setItem("userProfile", JSON.stringify(response.data));
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
      // Save the full response to localStorage
      localStorage.setItem("userProfile", JSON.stringify(response.data));
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
    const response = await api.get("/users/me");
    if (response.data && response.data.success) {
      // Save the full response to localStorage
      localStorage.setItem("companyProfile", JSON.stringify(response.data));
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
      // Save the full response to localStorage
      localStorage.setItem("companyProfile", JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    console.error("Error updating company settings:", error);
    throw error;
  }
};

// Jobs APIs
export const fetchJobs = async (params = {}) => {
  try {
    const response = await api.get("/jobs", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
};

export const fetchJob = async (id) => {
  try {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching job ${id}:`, error);
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
    const response = await api.get("/estimates", { params });
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
    const response = await api.get("/users/notifications/settings");
    return response.data;
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    throw error;
  }
};

export const updateNotificationSettings = async (settingsData) => {
  try {
    const response = await api.put(
      "/users/notifications/settings",
      settingsData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating notification settings:", error);
    throw error;
  }
};

// AI Assistant
export const createConversation = async (message, estimateId, contactId) => {
  try {
    const response = await api.post("/ai/reply", {
      message,
      contactId,
      estimateId,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending message to AI:", error);
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

// export const sendMessageToAI = async (
//   message,
//   contactId,
//   estimateId,
//   userId
// ) => {
//   try {
//     const response = await api.post("/ai/webhook/message", {
//       message,
//       contactId,
//       estimateId,
//       userId,
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error creating conversation:", error);
//     throw error;
//   }
// };
export const sendMessageToAI = async (
  message,
  contactId,
  estimateId,
  userId
) => {
  try {
    // Only call /ai/reply to send the user's message
    const response = await api.post("/ai/reply", {
      message,
      contactId,
      estimateId,
      userId,
    });
    // Return the response from /ai/reply (or handle as needed, maybe just return success/failure)
    // The actual AI response will come via WebSocket
    return response.data;
  } catch (error) {
    console.error("Error sending message via /ai/reply:", error);
    throw error;
  }
};

// AlliBot APIs
export const sendAlliBotMessage = async (message, userId) => {
  try {
    const response = await api.post("/alli-bot/message", { message, userId });
    return response.data;
  } catch (error) {
    console.error("Error sending message to AlliBot:", error);
    throw error;
  }
};

export const getAlliBotHistory = async (userId) => {
  try {
    const response = await api.get(`/alli-bot/history/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching AlliBot history for user ${userId}:`, error);
    throw error;
  }
};

export default api;
