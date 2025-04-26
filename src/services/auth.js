import api from './api';
import { STORAGE_KEYS } from './localStorage';

export const loginUser = async (phoneNumber, password) => {
  try {
    const response = await api.post('/auth/login', {
      phoneNumber,
      password
    });
    console.log('Login API response:', response); // Log the response
    
    if (response.data && response.data.data && response.data.data.token) {
      const token = response.data.data.token;
      const userData = response.data.data.user || {};
      
      return { token, userData };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
  }
};

export const checkAuthStatus = async (token) => {
  try {
    // Make a request to validate the token
    const response = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('Invalid user data format');
    }
  } catch (error) {
    console.error('Auth check error:', error);
    // Clear token from both storages as it's invalid
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    
    throw new Error('Authentication failed');
  }
};

export const logoutUser = async () => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      await api.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    // Even if the API call fails, we still want to clear local storage
    return false;
  }
};

export const forgotPassword = async (phoneNumber) => {
  try {
    const response = await api.post('/auth/forgot-password', { phoneNumber });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw new Error(error.response?.data?.message || 'Failed to process forgot password request');
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw new Error(error.response?.data?.message || 'Failed to reset password');
  }
};
