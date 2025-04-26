/**
 * Format date as Month DD, YYYY
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  /**
   * Format time as HH:MM AM/PM
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted time
   */
  export const formatTime = (date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  
  /**
   * Get initials from name
   * @param {string} name - Full name
   * @returns {string} Initials
   */
  export const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  /**
   * Format currency amount
   * @param {number} amount - Amount to format
   * @returns {string} Formatted amount as currency
   */
  export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `$${amount.toLocaleString()}`;
  };
  
  /**
   * Format a phone number to US format (XXX-XXX-XXXX)
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} Formatted phone number
   */
  export const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Remove all non-numeric characters and trim
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Remove +1 if present at the beginning
    if (cleaned.startsWith('1') && cleaned.length > 10) {
      cleaned = cleaned.substring(1);
    }
    
    // Ensure we have at most 10 digits
    cleaned = cleaned.substring(0, 10);
    
    // Apply formatting based on number length
    if (cleaned.length < 4) {
      return cleaned;
    } else if (cleaned.length < 7) {
      return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
    } else {
      return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }
  };
  
  /**
   * Check if two dates are the same day
   * @param {Date} date1 - First date
   * @param {Date} date2 - Second date
   * @returns {boolean} True if same day
   */
  export const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };
  
  /**
   * Truncate text if it exceeds maxLength
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  export const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };
  
  /**
   * Parse and handle API response to store user profile
   * @param {Object} response - API response
   * @param {string} storageKey - Key to save in localStorage
   * @returns {Object} The processed data
   */
  export const handleProfileResponse = (response, storageKey) => {
    if (response && response.data) {
      const data = response.data;
      localStorage.setItem(storageKey, JSON.stringify(response));
      return data;
    }
    return null;
  };
  