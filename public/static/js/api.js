// API utility for making requests to the backend
// Handles standard response format and errors

import { state } from './state.js';
import { showToast } from './utils.js';

const API_BASE = '/api';
let csrfRetryCount = 0;
const MAX_CSRF_RETRIES = 1;

/**
 * Refresh CSRF token from server
 */
export async function refreshCsrfToken() {
    try {
        const response = await fetch(`${API_BASE}/auth/csrf-token`, {
            method: 'GET',
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            return data.data?.csrf_token || null;
        }
    } catch (e) {
        console.error('Failed to refresh CSRF token:', e);
    }
    return null;
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', status = 500) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
    }
}

/**
 * Get CSRF token from cookie
 */
export function getCsrfToken() {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrf_token') {
            return value;
        }
    }
    return null;
}

/**
 * Standard API request wrapper
 * Handles authentication, CSRF, and error responses
 */
export async function api(path, options = {}) {
    const url = path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/${path}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
    };

    // Add CSRF token for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            defaultOptions.headers['X-CSRF-Token'] = csrfToken;
        }
    }

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    // If body is FormData, remove Content-Type to let browser set boundary
    if (mergedOptions.body instanceof FormData) {
        delete mergedOptions.headers['Content-Type'];
    }
    // If body is an object (and not FormData), stringify it
    else if (mergedOptions.body && typeof mergedOptions.body === 'object') {
        mergedOptions.body = JSON.stringify(mergedOptions.body);
    }

    try {
        const response = await fetch(url, mergedOptions);

        // Handle rate limiting
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || '60';
            let message = `Terlalu banyak permintaan. Coba lagi dalam ${retryAfter} detik.`;
            try {
                const errorData = await response.json();
                if (errorData.error?.message) message = errorData.error.message;
            } catch (e) { }

            throw new ApiError(message, 'RATE_LIMITED', 429);
        }

        // Parse JSON response
        const data = await response.json();

        // Handle CSRF errors - retry once with fresh token
        if (response.status === 403 && (data.error?.code === 'CSRF_MISSING' || data.error?.code === 'CSRF_INVALID')) {
            if (csrfRetryCount < MAX_CSRF_RETRIES) {
                csrfRetryCount++;
                console.log('CSRF token invalid, refreshing...');
                await refreshCsrfToken();
                csrfRetryCount = 0;
                // Retry the request with fresh token
                return api(path, options);
            }
            csrfRetryCount = 0;
        }

        // Handle standardized error responses
        if (!response.ok || data.success === false) {
            const errorMessage = data.error?.message || data.message || 'Terjadi kesalahan';
            const errorCode = data.error?.code || 'UNKNOWN_ERROR';

            // Handle specific error codes
            // if (errorCode === 'UNAUTHORIZED' || response.status === 401) {
            //     // Clear user state and redirect to login
            //     // DISABLED: Causing redirect loops or unexpected logouts
            //     if (state.user) {
            //         state.user = null;
            //         showToast('Sesi Anda telah berakhir. Silakan login kembali.', 'warning');
            //     }
            // }

            throw new ApiError(errorMessage, errorCode, response.status);
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        // Network or parsing errors
        console.error('API Error:', error);
        throw new ApiError(
            'Gagal menghubungi server. Periksa koneksi internet Anda.',
            'NETWORK_ERROR',
            0
        );
    }
}


/**
 * Shorthand methods for common HTTP verbs
 */
export const apiGet = (path) => api(path, { method: 'GET' });

export const apiPost = (path, body) => api(path, {
    method: 'POST',
    body
});

export const apiPut = (path, body) => api(path, {
    method: 'PUT',
    body
});

export const apiDelete = (path) => api(path, { method: 'DELETE' });

/**
 * Validation helpers for forms
 */
export const validators = {
    required: (value, fieldName = 'Field') => {
        if (!value || (typeof value === 'string' && !value.trim())) {
            return `${fieldName} harus diisi`;
        }
        return null;
    },

    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return 'Format email tidak valid';
        }
        return null;
    },

    minLength: (value, min, fieldName = 'Field') => {
        if (value && value.length < min) {
            return `${fieldName} minimal ${min} karakter`;
        }
        return null;
    },

    password: (value) => {
        if (!value || value.length < 8) {
            return 'Password minimal 8 karakter';
        }
        if (!/[a-zA-Z]/.test(value)) {
            return 'Password harus mengandung huruf';
        }
        if (!/[0-9]/.test(value)) {
            return 'Password harus mengandung angka';
        }
        return null;
    },

    match: (value1, value2, message = 'Nilai tidak cocok') => {
        if (value1 !== value2) {
            return message;
        }
        return null;
    },

    date: (value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return 'Format tanggal tidak valid (gunakan YYYY-MM-DD)';
        }
        return null;
    }
};

/**
 * Validate form data against rules
 * @param {Object} data - Form data object
 * @param {Object} rules - Validation rules { fieldName: [validatorFn, validatorFn, ...] }
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateForm(data, rules) {
    const errors = {};
    let valid = true;

    for (const [field, fieldRules] of Object.entries(rules)) {
        // Ensure field exists in data, defaults to empty string if undefined
        const value = data[field] !== undefined ? data[field] : '';

        // Handle single validator or array of validators
        const rulesArray = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

        for (const rule of rulesArray) {
            if (typeof rule !== 'function') continue;

            const error = rule(value);
            if (error) {
                errors[field] = error;
                valid = false;
                break; // Only show first error per field
            }
        }
    }

    return { valid, errors };
}

/**
 * Display form errors
 */
export function showFormErrors(errors, formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    // Clear previous errors
    form.querySelectorAll(`.error-message`).forEach(el => el.remove());
    form.querySelectorAll(`.input-error`).forEach(el => el.classList.remove('input-error'));
    form.querySelectorAll(`.border-red-500`).forEach(el => el.classList.remove('border-red-500'));

    for (const [field, message] of Object.entries(errors)) {
        const input = form.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.add('border-red-500', 'focus:ring-red-200', 'focus:border-red-500');

            const errorEl = document.createElement('p');
            errorEl.className = 'error-message text-red-500 text-xs mt-1';
            errorEl.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i>${message}`;

            // Insert after input but handle input groups
            if (input.parentNode.classList.contains('relative')) {
                input.parentNode.parentNode.appendChild(errorEl);
            } else {
                input.parentNode.appendChild(errorEl);
            }
        }
    }
}

/**
 * Clear form errors
 */
export function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.querySelectorAll(`.error-message`).forEach(el => el.remove());
    form.querySelectorAll(`.border-red-500`).forEach(el => el.classList.remove('border-red-500', 'focus:ring-red-200', 'focus:border-red-500'));
}
