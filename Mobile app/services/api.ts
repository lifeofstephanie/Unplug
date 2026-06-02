import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Base URL ─────────────────────────────────────────
// Change this to your deployed backend URL when you go live
export const BASE_URL = "https://unplug-awa8.onrender.com/api";
// For Android emulator use: http://10.0.2.2:5000/api
// For iOS simulator use:    http://localhost:5000/api

// ── Axios instance ────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach access token ─────────
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("@access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — auto refresh on 401 ────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("@refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefresh } = res.data;

        // Save new tokens
        await AsyncStorage.setItem("@access_token", accessToken);
        await AsyncStorage.setItem("@refresh_token", newRefresh);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — clear tokens and force re-login
        await AsyncStorage.multiRemove(["@access_token", "@refresh_token"]);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),

  me: () => api.get("/auth/me"),

  setPin: (pin: string) => api.post("/auth/set-pin", { pin }),

  logout: (refreshToken?: string) => api.post("/auth/logout", { refreshToken }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/change-password", data),
};

// ── Courses ───────────────────────────────────────────
export const coursesApi = {
  list: (params?: { subject?: string; level?: string; language?: string }) =>
    api.get("/courses", { params }),

  get: (id: string) => api.get(`/courses/${id}`),

  download: (id: string) => api.get(`/courses/${id}/download`),
};

// ── Progress ──────────────────────────────────────────
export const progressApi = {
  sync: (events: object[]) => api.post("/progress/sync", { events }),

  myProgress: () => api.get("/progress/me"),
};

export default api;
