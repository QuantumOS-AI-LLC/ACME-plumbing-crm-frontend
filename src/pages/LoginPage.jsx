import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Paper,
  Container,
  useMediaQuery,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { formatPhoneNumber } from "../utils/helpers";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  borderRadius: 12,
  width: "100%",
  boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.08)",
  maxWidth: "400px",
  "@media (max-width: 600px)": {
    padding: theme.spacing(3),
    maxWidth: "90%",
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    "& fieldset": {
      borderColor: theme.palette.divider,
    },
    "&:hover fieldset": {
      borderColor: theme.palette.primary.light,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
    },
  },
  "& .MuiInputBase-input": {
    padding: "14px 16px",
    fontSize: "14px",
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(90deg, #8A2BE2 0%, #FF1493 100%)",
  borderRadius: 8,
  color: "white",
  fontWeight: 500,
  padding: "12px 0",
  "&:hover": {
    background: "linear-gradient(90deg, #7B27CD 0%, #E6138A 100%)",
    boxShadow: "0 6px 12px rgba(138, 43, 226, 0.2)",
  },
  "&:active": {
    transform: "scale(0.98)",
  },
  "@media (max-width: 600px)": {
    padding: "10px 0",
  },
}));

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { loadDashboardStats } = useDashboardStats();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  // Handle phone number input with formatting
  const handlePhoneNumberChange = (e) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setPhoneNumber(formattedNumber);
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phoneNumber || !password) {
      setError("Please enter both phone number and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await login(phoneNumber, password, rememberMe);
      if (result.success) {
        // Load dashboard stats after successful login
        try {
          await loadDashboardStats();
          console.log("Dashboard stats loaded after login");
        } catch (statsError) {
          console.error("Failed to load dashboard stats:", statsError);
          // Don't block navigation if stats loading fails
        }
        navigate("/");
      } else {
        setError(
          result.error || "Login failed. Please check your credentials."
        );
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8F9FA",
        padding: isMobile ? 2 : 3,
        // iOS specific styles to prevent scrolling issues
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "none",
      }}
    >
      <Container component="main" maxWidth="xs" disableGutters={isMobile}>
        <StyledPaper elevation={3} sx={{ mx: "auto" }}>
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography
              component="h1"
              variant="h5"
              color="primary"
              fontWeight={600}
              sx={{ mb: 1 }}
            >
              ACME PLUMBING SOLUTION
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your business management solution
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Phone Number
              </Typography>
              <StyledTextField
                fullWidth
                id="phone"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="Enter your phone number"
                variant="outlined"
                inputProps={{
                  autoComplete: "tel",
                  inputMode: "tel", // Better for iOS numeric keyboard
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Password
              </Typography>
              <StyledTextField
                fullWidth
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                variant="outlined"
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        size="small"
                        sx={{
                          color: "text.secondary",
                          "&:hover": {
                            color: "primary.main",
                          },
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                flexWrap: isMobile ? "wrap" : "nowrap",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    color="primary"
                    size="small"
                    sx={{
                      color: "#8A2BE2",
                      "&.Mui-checked": {
                        color: "#8A2BE2",
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                    Remember me
                  </Typography>
                }
              />
              {/* <Link
                                href="#"
                                variant="body2"
                                color="primary"
                                underline="hover"
                                sx={{
                                    fontSize: "0.875rem",
                                    ml: isMobile ? 0 : 2,
                                }}
                            >
                                Forgot password?
                            </Link> */}
            </Box>

            {error && (
              <Typography
                color="error"
                variant="body2"
                sx={{ mb: 2, textAlign: "center" }}
              >
                {error}
              </Typography>
            )}

            <GradientButton
              type="submit"
              fullWidth
              variant="contained"
              disableElevation
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </GradientButton>
          </Box>
        </StyledPaper>
      </Container>
    </Box>
  );
};

export default LoginPage;
