import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

interface RetryRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const axiosInstance = axios.create({
    baseURL: typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SERVER_URI || 'http://127.0.0.1:4000'),
    withCredentials: true,
});

// single in-flight refresh, shared by everyone who hits a 401
let refreshPromise: Promise<void> | null = null;

const handleLogOut = () => {
    if (window.location.pathname !== "/log-in") {
        window.location.href = "/log-in";
    }
};

const refreshAccessToken = async () => {
    await axiosInstance.post("/api/users/auth/refresh_token");
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryRequestConfig;

        if (error.response?.status === 403 && !originalRequest._retry && (error.response.data as any)?.message?.toLowerCase().includes('csrf')) {
            originalRequest._retry = true;
            return axiosInstance(originalRequest);
        }

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            // if nobody's refreshing yet, start; otherwise piggyback on it
            if (!refreshPromise) {
                refreshPromise = refreshAccessToken().finally(() => {
                    refreshPromise = null;
                });
            }

            await refreshPromise;

            return axiosInstance(originalRequest);
        } catch (refreshError) {
            handleLogOut();
            return Promise.reject(refreshError);
        }
    }
);

export default axiosInstance;