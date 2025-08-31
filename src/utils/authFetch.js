const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(url, { ...options, headers });
  
  // Handle 401/403 responses globally
  if (response.status === 401) { // Only redirect on 401 (Unauthorized)
    localStorage.removeItem('token'); // Clear invalid token
    window.location.href = '/login'; // Redirect to login page
  }

  return response;
};

export default authFetch;