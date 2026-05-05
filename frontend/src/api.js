import axios from 'axios';

// Create an instance of axios with the base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Export the Axios instance
export default api;