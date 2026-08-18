import axios from "axios";

// Backend runs on localhost:5000 during local dev (see server/.env PORT)
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically attach the JWT token (if present) to every request.
// This means individual components never have to manually set headers.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("spliteasy_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
