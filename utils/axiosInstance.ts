import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { BASE_URL } from '@/constants/api';
import { SessionData } from '@/types/auth';

const UNAUTHORIZED = 401;

export function getAxiosInstance(session: SessionData, logout: () => void): AxiosInstance {
    const axiosInstance = axios.create();

    axiosInstance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
        config.baseURL = BASE_URL;
        config.timeout = 10000;
        config.headers['Content-Type'] = 'application/json';
        config.headers['Authorization'] = `Bearer ${session}`;
        return config;
    });

    axiosInstance.interceptors.response.use(
        (response) => {
            return response;
        },
        (error: AxiosError) => {
            if (error.response?.status === UNAUTHORIZED) {
                logout();
            }
            return Promise.reject(error);
        },
    );

    return axiosInstance;
}
