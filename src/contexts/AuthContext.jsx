import React, { createContext, useState, useEffect } from "react";
import { loginUser, checkAuthStatus } from "../services/auth";
import {
    saveAuthData,
    clearAuthData,
    getFromStorage,
    saveUserProfile,
    saveCompanyProfile,
    restoreAuthState,
    STORAGE_KEYS,
} from "../services/localStorage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rememberMe, setRememberMe] = useState(false);

    // First load check - this will run when the app starts
    useEffect(() => {
        const initAuth = async () => {
            try {
                setLoading(true);

                // Restore auth state from storage
                const {
                    remembered,
                    token,
                    refreshToken,
                    isLoggedIn: storedIsLoggedIn,
                    userProfile,
                } = restoreAuthState();

                console.log("auth-context", userProfile);

                setRememberMe(remembered);

                console.log("Auth state restored:", {
                    remembered,
                    hasToken: !!token,
                    hasRefreshToken: !!refreshToken,
                    storedIsLoggedIn,
                    hasProfile: !!userProfile,
                });

                if (token && refreshToken && storedIsLoggedIn) {
                    // No backend validation, just trust the token in storage
                    setIsLoggedIn(true);
                    if (userProfile) {
                        setUser(userProfile);
                    }
                } else {
                    // No token found, but respect remember me for user data
                    if (remembered && userProfile) {
                        setUser(userProfile);
                    } else {
                        setUser(null);
                    }
                    setIsLoggedIn(false);
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                setIsLoggedIn(false);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (phoneNumber, password, rememberedValue = false) => {
        setError(null);
        try {
            const response = await loginUser(phoneNumber, password);

            console.log("Login response in AuthContext:", response);

            // Check response structure
            if (!response.success || !response.data) {
                throw new Error("Invalid response format from server");
            }

            const { user: userData, accessToken, refreshToken } = response.data;

            if (!accessToken || !refreshToken || !userData) {
                throw new Error("Missing required data in server response");
            }

            // Update remember me state
            setRememberMe(rememberedValue);

            // FIXED: Transform response to match storage service format
            const authData = {
                accessToken,
                refreshToken,
                user: userData,
            };

            // Save auth data with remember me preference
            saveAuthData(authData, rememberedValue);

            // Set state
            setUser(userData);
            setIsLoggedIn(true);

            return { success: true, data: response.data };
        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || "Login failed");
            return { success: false, error: err.message || "Login failed" };
        }
    };

    const logout = () => {
        clearAuthData();
        setIsLoggedIn(false);
        setUser(null);
        setError(null);
    };

    const updateUserData = (userData) => {
        setUser(userData);
        saveUserProfile(userData);
    };

    const updateCompanyData = (companyData) => {
        saveCompanyProfile(companyData);
    };

    // Helper function to check if user is authenticated
    const isAuthenticated = () => {
        return (
            isLoggedIn &&
            user &&
            (localStorage.getItem(STORAGE_KEYS.TOKEN) ||
                sessionStorage.getItem(STORAGE_KEYS.TOKEN))
        );
    };

    return (
        <AuthContext.Provider
            value={{
                isLoggedIn,
                user,
                loading,
                error,
                login,
                logout,
                rememberMe,
                updateUserData,
                updateCompanyData,
                isAuthenticated,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
