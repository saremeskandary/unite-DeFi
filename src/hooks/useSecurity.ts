import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface SecurityConfig {
  enableCSRF?: boolean;
  enableRateLimit?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

interface CSRFToken {
  token: string;
  hmacToken: string;
}

// API Response interfaces
interface AuthResponse {
  success: boolean;
  user?: any;
  error?: string;
  message?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Type guards
function isAuthResponse(response: unknown): response is AuthResponse {
  return typeof response === 'object' && response !== null && 'success' in response;
}

function isApiResponse<T>(response: unknown): response is ApiResponse<T> {
  return typeof response === 'object' && response !== null && 'success' in response;
}

export function useSecurity(config: SecurityConfig = {}) {
  const [csrfToken, setCsrfToken] = useState<CSRFToken | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    enableCSRF = true,
    enableRateLimit = true,
    retryAttempts = 3,
    retryDelay = 1000
  } = config;

  // Fetch CSRF token on mount
  useEffect(() => {
    if (enableCSRF) {
      fetchCSRFToken();
    }
  }, [enableCSRF]);

  const fetchCSRFToken = useCallback(async () => {
    try {
      const response = await fetch('/api/security/csrf', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const token = response.headers.get('X-CSRF-Token');
        if (token) {
          setCsrfToken({ token, hmacToken: '' }); // HMAC token is in httpOnly cookie
        }
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  }, []);

  const secureFetch = useCallback(async (
    url: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<Response> => {
    try {
      setIsLoading(true);
      setError(null);

      // Add CSRF token to headers if available
      const headers = new Headers(options.headers);
      if (enableCSRF && csrfToken) {
        headers.set('X-CSRF-Token', csrfToken.token);
      }

      // Add security headers
      headers.set('X-Requested-With', 'XMLHttpRequest');
      headers.set('Content-Type', 'application/json');

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });

      // Handle rate limiting
      if (response.status === 429 && enableRateLimit && retryCount < retryAttempts) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : retryDelay;

        await new Promise(resolve => setTimeout(resolve, delay));
        return secureFetch(url, options, retryCount + 1);
      }

      // Handle CSRF token refresh
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.code === 'CSRF_TOKEN_INVALID' || errorData.code === 'CSRF_TOKEN_MISSING') {
          await fetchCSRFToken();
          if (retryCount < retryAttempts) {
            return secureFetch(url, options, retryCount + 1);
          }
        }
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [csrfToken, enableCSRF, enableRateLimit, retryAttempts, retryDelay, fetchCSRFToken]);

  const secureApiCall = useCallback(async <T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const response = await secureFetch(url, options);
    return response.json() as Promise<T>;
  }, [secureFetch]);

  const secureMutation = useCallback(async <T>(
    url: string,
    data: any,
    options: RequestInit = {}
  ): Promise<T> => {
    const response = await secureFetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
    return response.json() as Promise<T>;
  }, [secureFetch]);

  const refreshToken = useCallback(() => {
    if (enableCSRF) {
      fetchCSRFToken();
    }
  }, [enableCSRF, fetchCSRFToken]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    csrfToken,
    isLoading,
    error,
    secureFetch,
    secureApiCall,
    secureMutation,
    refreshToken,
    clearError
  };
}

// Hook for handling form security
export function useFormSecurity(config: SecurityConfig = {}) {
  const security = useSecurity(config);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((data: Record<string, any>, schema?: any) => {
    const errors: Record<string, string> = {};

    // Basic validation
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined || value === '') {
        errors[key] = `${key} is required`;
      }
    }

    // Custom schema validation
    if (schema) {
      try {
        schema.parse(data);
      } catch (error: any) {
        if (error.errors) {
          error.errors.forEach((err: any) => {
            errors[err.path.join('.')] = err.message;
          });
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  const clearFormErrors = useCallback(() => {
    setFormErrors({});
  }, []);

  const setFormError = useCallback((field: string, message: string) => {
    setFormErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  return {
    ...security,
    formErrors,
    validateForm,
    clearFormErrors,
    setFormError
  };
}

// Hook for handling authentication security
export function useAuthSecurity() {
  const security = useSecurity({ enableCSRF: true, enableRateLimit: true });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const response = await security.secureMutation<AuthResponse>('/api/auth/login', credentials);

      if (isAuthResponse(response) && response.success) {
        setIsAuthenticated(true);
        setUser(response.user);
        return response;
      } else {
        const errorMessage = isAuthResponse(response) ? response.error : 'Login failed';
        throw new Error(errorMessage || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  }, [security]);

  const logout = useCallback(async () => {
    try {
      await security.secureApiCall<ApiResponse>('/api/auth/logout');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [security]);

  const checkAuth = useCallback(async () => {
    try {
      const response = await security.secureApiCall<AuthResponse>('/api/auth/me');
      if (isAuthResponse(response) && response.success) {
        setIsAuthenticated(true);
        setUser(response.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [security]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...security,
    isAuthenticated,
    user,
    login,
    logout,
    checkAuth
  };
}

// Hook for handling sensitive operations (like swaps)
export function useSecureOperation() {
  const security = useSecurity({
    enableCSRF: true,
    enableRateLimit: true,
    retryAttempts: 1,
    retryDelay: 2000
  });
  const [operationStatus, setOperationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [operationResult, setOperationResult] = useState<any>(null);

  const executeSecureOperation = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    setOperationStatus('pending');
    setOperationResult(null);

    try {
      const result = await operation();
      setOperationStatus('success');
      setOperationResult(result);
      return result;
    } catch (error) {
      setOperationStatus('error');
      setOperationResult(error);
      throw error;
    }
  }, []);

  const resetOperation = useCallback(() => {
    setOperationStatus('idle');
    setOperationResult(null);
    security.clearError();
  }, [security]);

  return {
    ...security,
    operationStatus,
    operationResult,
    executeSecureOperation,
    resetOperation
  };
} 