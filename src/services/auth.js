import api from "./api";
import { STORAGE_KEYS } from "./localStorage";

export const loginUser = async (phoneNumber, password) => {
    try {
        const response = await api.post("/auth/login", {
            phoneNumber,
            password,
        });
        // console.log("Login API response:", response); // Log the response
        // console.log("Response data structure:", response.data); // Log response.data specifically

        // FIXED: Check for correct response structure matching your backend
        if (response.data && response.data.success && response.data.data) {
            const { user, accessToken, refreshToken } = response.data.data;

            if (accessToken && refreshToken && user) {
                return {
                    success: true,
                    data: {
                        user,
                        accessToken,
                        refreshToken,
                    },
                    message: response.data.message,
                };
            } else {
                console.error("Missing fields in response:", {
                    hasAccessToken: !!accessToken,
                    hasRefreshToken: !!refreshToken,
                    hasUser: !!user,
                });
                throw new Error("Missing required data in response");
            }
        } else {
            console.error("Invalid response structure:", {
                hasData: !!response.data,
                hasSuccess: response.data?.success,
                hasDataField: !!response.data?.data,
            });
            throw new Error("Invalid response format");
        }
    } catch (error) {
        console.error("Login error:", error);

        // More specific error handling
        if (error.code === "ERR_NETWORK") {
            throw new Error(
                "Cannot connect to server. Please check if backend is running."
            );
        } else if (error.response?.status === 401) {
            throw new Error("Invalid phone number or password.");
        } else if (error.response?.status === 404) {
            throw new Error(
                "Login endpoint not found. Check API configuration."
            );
        } else if (
            error.message.includes("Missing required data") ||
            error.message.includes("Invalid response format")
        ) {
            throw new Error(error.message); // Re-throw validation errors as-is
        } else {
            throw new Error(
                error.response?.data?.message ||
                    "Login failed. Please check your credentials."
            );
        }
    }
};

export const checkAuthStatus = async (token) => {
    try {
        // Make a request to validate the token
        const response = await api.get("/auth/profile", {
            // Changed from '/auth/me' to '/auth/profile'
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && response.data.success && response.data.data) {
            return response.data.data.user; // Return user data
        } else {
            throw new Error("Invalid user data format");
        }
    } catch (error) {
        console.error("Auth check error:", error);
        // Clear token from both storages as it's invalid
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
        sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);

        throw new Error("Authentication failed");
    }
};

export const logoutUser = async () => {
    try {
        const token =
            localStorage.getItem(STORAGE_KEYS.TOKEN) ||
            sessionStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
            await api.post(
                "/auth/logout",
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
        }
        return true;
    } catch (error) {
        console.error("Logout error:", error);
        // Even if the API call fails, we still want to clear local storage
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
        throw new Error(
            error.response?.data?.message ||
                "Failed to process forgot password request"
        );
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
        throw new Error(
            error.response?.data?.message || "Failed to reset password"
        );
    }
};

// Refresh token function
export const refreshToken = async () => {
    try {
        const refreshToken =
            localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ||
            sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        const response = await api.post("/auth/refresh-token", {
            refreshToken,
        });

        if (response.data && response.data.success && response.data.data) {
            const {
                user,
                accessToken,
                refreshToken: newRefreshToken,
            } = response.data.data;

            return {
                success: true,
                data: {
                    user,
                    accessToken,
                    refreshToken: newRefreshToken,
                },
                message: response.data.message,
            };
        } else {
            throw new Error("Invalid refresh response format");
        }
    } catch (error) {
        console.error("Refresh token error:", error);
        throw new Error(
            error.response?.data?.message || "Token refresh failed"
        );
    }
};
