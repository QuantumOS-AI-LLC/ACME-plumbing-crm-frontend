// Enhanced localStorage service with persistence checks

// Key constants for consistent usage
export const STORAGE_KEYS = {
    TOKEN: "token",
    REFRESH_TOKEN: "refreshToken", // ADD: Refresh token key
    IS_LOGGED_IN: "isLoggedIn",
    USER_PROFILE: "userProfile",
    COMPANY_PROFILE: "companyProfile",
    REMEMBER_ME: "rememberMe",
    JOB_INFO: "jobInfo",
    CONTACT_INFO: "contactInfo",
    ESTIMATE_INFO: "estimateInfo",
};

/**
 * Determines if we should use localStorage or sessionStorage
 * @param {boolean} persist - Whether to persist across sessions
 * @returns {Storage} The storage object to use
 */
export const getStorageType = (persist = true) => {
    return persist ? localStorage : sessionStorage;
};

/**
 * Save data to storage with error handling
 * @param {string} key - Storage key
 * @param {any} data - Data to store (will be stringified)
 * @param {boolean} persist - Whether to use localStorage instead of sessionStorage
 * @returns {boolean} Success status
 */
export const saveToStorage = (key, data, persist = true) => {
    try {
        const storage = getStorageType(persist);
        const serialized =
            typeof data === "string" ? data : JSON.stringify(data);
        storage.setItem(key, serialized);
        return true;
    } catch (error) {
        console.error(`Error saving to storage (${key}):`, error);
        return false;
    }
};

/**
 * Get data from storage with error handling
 * @param {string} key - Storage key
 * @param {boolean} parseJson - Whether to parse as JSON
 * @param {boolean} checkBothStorages - Whether to check both storage types
 * @returns {any} Retrieved data
 */
export const getFromStorage = (
    key,
    parseJson = true,
    checkBothStorages = true
) => {
    try {
        // First check localStorage
        let item = localStorage.getItem(key);

        // Then check sessionStorage if needed
        if (!item && checkBothStorages) {
            item = sessionStorage.getItem(key);
        }

        if (item === null) return null;
        return parseJson ? JSON.parse(item) : item;
    } catch (error) {
        console.error(`Error getting from storage (${key}):`, error);
        return null;
    }
};

/**
 * Remove item from all storages
 * @param {string} key - Storage key
 */
export const removeFromStorage = (key) => {
    try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing from storage (${key}):`, error);
    }
};

/**
 * Check if storage is available and working
 * @returns {boolean} Whether storage is available
 */
export const isStorageAvailable = () => {
    try {
        const testKey = "__storage_test__";
        localStorage.setItem(testKey, testKey);
        const result = localStorage.getItem(testKey) === testKey;
        localStorage.removeItem(testKey);
        return result;
    } catch (e) {
        return false;
    }
};

/**
 * Save user authentication data
 * @param {Object} data - Auth data including accessToken, refreshToken and user info
 * @param {boolean} rememberMe - Whether to remember login between sessions
 */
export const saveAuthData = (data, rememberMe = false) => {
    if (!data) return;

    // Always save remember me preference to localStorage
    saveToStorage(
        STORAGE_KEYS.REMEMBER_ME,
        rememberMe ? "true" : "false",
        true
    );

    // Save auth tokens based on remember me preference
    if (data.accessToken) {
        saveToStorage(STORAGE_KEYS.TOKEN, data.accessToken, rememberMe);
    }

    // UPDATED: Save refresh token
    if (data.refreshToken) {
        saveToStorage(
            STORAGE_KEYS.REFRESH_TOKEN,
            data.refreshToken,
            rememberMe
        );
    }

    saveToStorage(STORAGE_KEYS.IS_LOGGED_IN, "true", rememberMe);

    // Save user profile if available - always to localStorage for persistence
    if (data.userData || data.user) {
        saveToStorage(
            STORAGE_KEYS.USER_PROFILE,
            data.userData || data.user,
            true
        );
    }
};

/**
 * Update tokens in storage (used after refresh)
 * @param {string} accessToken - New access token
 * @param {string} refreshToken - New refresh token (optional)
 */
export const updateTokens = (accessToken, refreshToken = null) => {
    const remembered =
        getFromStorage(STORAGE_KEYS.REMEMBER_ME, false) === "true";

    if (accessToken) {
        saveToStorage(STORAGE_KEYS.TOKEN, accessToken, remembered);
    }

    if (refreshToken) {
        saveToStorage(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, remembered);
    }
};

/**
 * Get refresh token from storage
 * @returns {string|null} Refresh token
 */
export const getRefreshToken = () => {
    return getFromStorage(STORAGE_KEYS.REFRESH_TOKEN, false, true);
};

/**
 * Get access token from storage
 * @returns {string|null} Access token
 */
export const getAccessToken = () => {
    return getFromStorage(STORAGE_KEYS.TOKEN, false, true);
};

/**
 * Clear authentication data but respect remember me for some data
 */
export const clearAuthData = () => {
    const remembered =
        getFromStorage(STORAGE_KEYS.REMEMBER_ME, false) === "true";

    // Always remove tokens and logged in status on explicit logout
    removeFromStorage(STORAGE_KEYS.TOKEN);
    removeFromStorage(STORAGE_KEYS.REFRESH_TOKEN); // UPDATED: Clear refresh token
    removeFromStorage(STORAGE_KEYS.IS_LOGGED_IN);

    // Always clear user/company data on explicit logout
    removeFromStorage(STORAGE_KEYS.USER_PROFILE);
    removeFromStorage(STORAGE_KEYS.COMPANY_PROFILE);

    // If "remember me" was not selected, also clear the remember me preference
    if (!remembered) {
        removeFromStorage(STORAGE_KEYS.REMEMBER_ME);
    }
};

/**
 * Save user profile data
 * @param {Object} profileData - User profile data
 */
export const saveUserProfile = (profileData) => {
    if (!profileData) return;
    saveToStorage(STORAGE_KEYS.USER_PROFILE, profileData, true); // Always save to localStorage
};

/**
 * Save company profile data
 * @param {Object} companyData - Company profile data
 */
export const saveCompanyProfile = (companyData) => {
    if (!companyData) return;
    saveToStorage(STORAGE_KEYS.COMPANY_PROFILE, companyData, true); // Always save to localStorage
};

/**
 * Restore authentication state from storage
 * This should be called on app initialization
 * @returns {Object} Authentication data
 */
export const restoreAuthState = () => {
    const remembered =
        getFromStorage(STORAGE_KEYS.REMEMBER_ME, false) === "true";
    const token = getFromStorage(STORAGE_KEYS.TOKEN, false, true);
    const refreshToken = getFromStorage(
        STORAGE_KEYS.REFRESH_TOKEN,
        false,
        true
    ); // UPDATED: Get refresh token
    const isLoggedIn =
        getFromStorage(STORAGE_KEYS.IS_LOGGED_IN, false, true) === "true";
    const userProfile = getFromStorage(STORAGE_KEYS.USER_PROFILE, true);

    // If rememberMe is true, move tokens from sessionStorage to localStorage if needed
    if (
        remembered &&
        token &&
        localStorage.getItem(STORAGE_KEYS.TOKEN) === null
    ) {
        saveToStorage(STORAGE_KEYS.TOKEN, token, true);
    }

    if (
        remembered &&
        refreshToken &&
        localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) === null
    ) {
        saveToStorage(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, true);
    }

    if (
        remembered &&
        isLoggedIn &&
        localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === null
    ) {
        saveToStorage(STORAGE_KEYS.IS_LOGGED_IN, "true", true);
    }

    return {
        remembered,
        token,
        refreshToken, // UPDATED: Return refresh token
        isLoggedIn,
        userProfile,
    };
};

/**
 * Check if user has valid tokens (both access and refresh)
 * @returns {boolean} Whether user has valid auth state
 */
export const hasValidAuth = () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    const isLoggedIn =
        getFromStorage(STORAGE_KEYS.IS_LOGGED_IN, false, true) === "true";

    return !!(accessToken && refreshToken && isLoggedIn);
};
