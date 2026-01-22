const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const body = options.body && typeof options.body === 'object' && !isFormData
    ? JSON.stringify(options.body)
    : options.body;

  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;

  // Build final fetch options
  const fetchOptions = { ...options, headers };
  if (body) fetchOptions.body = body;

  const response = await fetch(fullUrl, fetchOptions);

  // Handle 401 responses globally, unless disabled
  if (response.status === 401 && !options.disableRedirectOnAuthError) {
    localStorage.removeItem('token'); // Clear invalid token
    window.location.href = '/login'; // Redirect to login page
  }

  return response;
};

export default authFetch;