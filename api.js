import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/admin",
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token to administrative requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("admin_token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error visibility on Vercel
api.interceptors.response.use(
  (response) => response, // Keep full response for compatibility with response.data.status
  (error) => {
    console.error("🌐 API Connection Error:", {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        console.warn("🔐 Session expired or invalid. Logging out...");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        
        // Only redirect to login if not already there
        if (window.location.pathname !== "/") {
          window.location.href = "/?expired=true";
        }
      }
    }

    return Promise.reject(error);
  }
);
