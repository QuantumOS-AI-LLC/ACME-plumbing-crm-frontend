import React, { createContext, useState, useEffect, useContext } from "react";
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
          isLoggedIn: storedIsLoggedIn,
          userProfile,
        } = restoreAuthState();

        console.log("auth-context", userProfile);

        setRememberMe(remembered);

        console.log("Auth state restored:", {
          remembered,
          hasToken: !!token,
          storedIsLoggedIn,
          hasProfile: !!userProfile,
        });

        if (token && storedIsLoggedIn) {
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

      // Update remember me state
      setRememberMe(rememberedValue);

      // Save auth data with remember me preference
      saveAuthData(response, rememberedValue);

      setUser(response.userData);
      setIsLoggedIn(true);

      return { success: true };
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
  };

  const updateUserData = (userData) => {
    setUser(userData);
    saveUserProfile(userData);
  };

  const updateCompanyData = (companyData) => {
    saveCompanyProfile(companyData);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
