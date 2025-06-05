import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { SocketProvider } from "./contexts/SocketContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { JobsProvider } from "./contexts/JobsContext";
import { EstimatesProvider } from "./contexts/EstimatesContext";
import CssBaseline from "@mui/material/CssBaseline";

import theme from "./theme";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/common/Layout";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import JobsPage from "./pages/JobsPage";
import EstimatesPage from "./pages/EstimatesPage";
import CalendarPage from "./pages/CalendarPage";
import ContactsPage from "./pages/ContactsPage";
import ContactDetailsPage from "./pages/ContactDetailsPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import ProfilePage from "./pages/ProfilePage";
import CompanySettingsPage from "./pages/CompanySettingsPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import SetTimeZonePage from "./pages/SetTimeZonePage";
import NotificationsPage from "./pages/NotificationsPage";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import MyServicesPage from "./pages/MyServicesPage";

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    // You could add a loading spinner here
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SocketProvider>
        <NotificationProvider>
          <JobsProvider>
            <EstimatesProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />

                  {/* Protected routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <DashboardPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/jobs"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <JobsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/estimates"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <EstimatesPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/calendar"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <CalendarPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/contacts"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <ContactsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/contacts/:id"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <ContactDetailsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/ai-assistant"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <AIAssistantPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/my-services"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <MyServicesPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <ProfilePage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/company-settings"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <CompanySettingsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/change-password"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <ChangePasswordPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/set-time-zone"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <SetTimeZonePage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <NotificationsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/notification-settings"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <NotificationSettingsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Redirect any unknown routes to dashboard */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </EstimatesProvider>
          </JobsProvider>
        </NotificationProvider>
      </SocketProvider>
    </ThemeProvider>
  );
};

export default App;
