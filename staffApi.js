import axios from "axios";

const rawBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/admin";
const apiRoot = rawBase.replace(/\/admin\/?$/, "");

export const STAFF_API_URL = `${apiRoot}/staff`;

export const staffApi = axios.create({
  baseURL: STAFF_API_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

staffApi.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("staff_token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

staffApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = String(error.config?.url || "").includes("/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("staff_token");
        localStorage.removeItem("staff_user");
        if (window.location.pathname !== "/staff") {
          window.location.href = "/staff?expired=true";
        }
      }
    }

    const detail = String(error.response?.data?.detail || "");
    if (error.response?.status === 403 && /password change required/i.test(detail)) {
      if (typeof window !== "undefined") {
        localStorage.setItem("staff_must_change", "true");
        if (window.location.pathname !== "/staff/dashboard") {
          window.location.href = "/staff/dashboard";
        }
      }
    }

    return Promise.reject(error);
  }
);

export const STAFF_PERMISSIONS = [
  { key: "estates.manage", label: "Estates", description: "Create and update estate listings" },
  { key: "products.manage", label: "Shop Products", description: "Create and update JardProc products" },
  { key: "settings.support", label: "Support Settings", description: "Update the public support WhatsApp number" },
];
