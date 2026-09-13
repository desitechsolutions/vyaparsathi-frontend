/**
 * useDataLoading — Unified error/loading state for API calls
 *
 * Provides:
 * - Error detection (connection, server, etc)
 * - Loading state management
 * - Automatic error messages
 * - Retry capability
 *
 * Usage:
 *   const { loading, error, setError, clearError, executeLoad } = useDataLoading();
 *
 *   const handleLoad = async () => {
 *     await executeLoad(async () => {
 *       const data = await fetchSomeData();
 *       setData(data);
 *     });
 *   };
 *
 *   if (error) return <ErrorState error={error} onRetry={handleLoad} />;
 */

import { useState, useCallback } from 'react';

export function useDataLoading() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const executeLoad = useCallback(async (callback, options = {}) => {
    const {
      onSuccess = null,
      onError = null,
      showError = true,
    } = options;

    setLoading(true);
    clearError();

    try {
      await callback();
      if (onSuccess) onSuccess();
    } catch (err) {
      const errorObj = getErrorMessage(err);
      if (showError) setError(errorObj);
      if (onError) onError(errorObj);
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  return {
    loading,
    error,
    setError,
    clearError,
    executeLoad,
  };
}

/**
 * Convert API error to user-friendly message
 */
function getErrorMessage(err) {
  // Network error (no response status)
  if (!err.response) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      icon: '📡',
      canRetry: true,
    };
  }

  const status = err.response.status;

  // Server error (5xx)
  if (status >= 500) {
    return {
      title: 'Server Error',
      message: 'The server is experiencing issues. Please try again in a moment.',
      icon: '⚙️',
      canRetry: true,
    };
  }

  // Unauthorized (401)
  if (status === 401) {
    return {
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again.',
      icon: '🔐',
      canRetry: false,
    };
  }

  // Forbidden (403)
  if (status === 403) {
    return {
      title: 'Access Denied',
      message: 'You do not have permission to access this resource.',
      icon: '🚫',
      canRetry: false,
    };
  }

  // Not found (404)
  if (status === 404) {
    return {
      title: 'Not Found',
      message: 'The requested resource was not found.',
      icon: '🔍',
      canRetry: false,
    };
  }

  // Validation error (4xx)
  if (status >= 400) {
    return {
      title: 'Invalid Request',
      message: err.response.data?.message || 'Please check your input and try again.',
      icon: '⚠️',
      canRetry: true,
    };
  }

  // Fallback
  return {
    title: 'Something Went Wrong',
    message: err.message || 'An unexpected error occurred. Please try again.',
    icon: '⚠️',
    canRetry: true,
  };
}

export default useDataLoading;
