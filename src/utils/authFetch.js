const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || ''; // Get base URL from env
  const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url; // Prepend base URL if relative

  const response = await fetch(fullUrl, { ...options, headers });
  
  // Handle 401/403 responses globally, unless disabled
  if ((response.status === 401 || response.status === 403) && !options.disableRedirectOnAuthError) {
    localStorage.removeItem('token'); // Clear invalid token
    window.location.href = '/login'; // Redirect to login page
  }

  return response;
};

export default authFetch;