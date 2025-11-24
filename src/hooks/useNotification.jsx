import React, { useState, useEffect, useCallback } from 'react';

const useNotification = (timeout = 3000) => {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const clearMessages = useCallback(() => {
    setMessage(null);
    setError(null);
  }, []);

  const showMessage = useCallback((msg) => {
    setMessage(msg);
    setError(null); // Clear any existing error
  }, []);

  const showError = useCallback((err) => {
    setError(err);
    setMessage(null); // Clear any existing message
  }, []);

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        clearMessages();
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [message, error, timeout, clearMessages]);

  return { message, error, showMessage, showError, clearMessages };
};

export default useNotification;
