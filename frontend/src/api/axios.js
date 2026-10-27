import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT and Django CSRF tokens to outgoing requests.
api.interceptors.request.use(async (config) => {
  const accessToken = localStorage.getItem("access_token");

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  const method = (config.method || "get").toLowerCase();
  const unsafeMethods = ["post", "put", "patch", "delete"];

  if (unsafeMethods.includes(method)) {
    let csrfToken = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("csrftoken="))
      ?.substring("csrftoken=".length);

    // Obtain a token from Django if the CSRF cookie is missing.
    if (!csrfToken) {
      const response = await api.get("/api/csrf/");
      csrfToken = response.data.csrfToken;
    }

    if (csrfToken) {
      config.headers["X-CSRFToken"] = decodeURIComponent(csrfToken);
    }
  }

  return config;
});

// Refresh an expired access token and retry the failed request.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/api/auth/login/") ||
      originalRequest.url?.includes("/api/auth/register/")
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // Use plain Axios so the refresh request doesn't trigger
      // this same response interceptor.
      const response = await axios.post(
        `${baseURL}/api/auth/login/refresh/`,
        { refresh: refreshToken },
        { withCredentials: true },
      );

      const newAccessToken = response.data.access;

      localStorage.setItem("access_token", newAccessToken);

      // Support SimpleJWT configurations that rotate refresh tokens.
      if (response.data.refresh) {
        localStorage.setItem("refresh_token", response.data.refresh);
      }

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      window.dispatchEvent(new Event("auth:logout"));

      return Promise.reject(refreshError);
    }
  },
);

export default api;
