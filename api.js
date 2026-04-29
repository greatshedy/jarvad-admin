import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/admin",
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

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
    return Promise.reject(error);
  }
);
