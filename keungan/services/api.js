import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('trzToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('trzToken');
      localStorage.removeItem('trzUser');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const savingsAPI = {
  getAll: () => api.get('/savings'),
  create: (data) => api.post('/savings', data),
  update: (id, data) => api.put(`/savings/${id}`, data),
  addDeposit: (id, amount) => api.patch(`/savings/${id}/add`, { amount }),
  delete: (id) => api.delete(`/savings/${id}`)
};

export const reportsAPI = {
  getReport: (params) => api.get('/reports', { params })
};


export default api;
