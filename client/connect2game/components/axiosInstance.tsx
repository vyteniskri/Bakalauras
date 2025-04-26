import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {jwtDecode} from "jwt-decode";
import { Alert } from "react-native";

const API_BASE_URL = "https://coral-app-oyqdq.ondigitalocean.app/api";
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null; 
let refreshSubscribers: ((token: string) => void)[] = [];


  const checkBanStatus = async (userId: any) => {
    try {
      const response = await axiosInstance.get(`/reports/canLogin/${userId}`);
      return true;
    } catch (error) {
      if (error.response?.status === 403) {

        await AsyncStorage.clear(); 
        if (refreshApp) {
          refreshApp(); 
        }
        return false; 
      } 
    }
  };


let refreshApp: (() => void) | null = null;

export const setNavigation = (refresh: () => void) => {
  refreshApp = refresh; 
};


const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const getAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {

    refreshPromise = (async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/accessToken`, {}, { withCredentials: true });

        const accessToken = response.data.accessToken;
        if (accessToken) {
          await AsyncStorage.setItem("accessToken", accessToken);
          const decodedToken: any = jwtDecode(accessToken);
          const userId = decodedToken.sub;
          if (userId) {
            await checkBanStatus(userId);
            await AsyncStorage.setItem("userId", userId);
            return accessToken;
          } else {
            Alert.alert("Error", "Failed to decode token. Please log in again.");
            return null;
          }
        }
        return null;
      } catch (error: any) {
        if (error.response?.status === 422) {
          Alert.alert("Session Expired", "Please log in again.");
          await AsyncStorage.clear(); 
          if (refreshApp) {
            refreshApp(); 
          }
        }
        throw error;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
};


axiosInstance.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem("accessToken");

    if (accessToken) {
      const decodedToken: any = jwtDecode(accessToken);
      const currentTime = Math.floor(Date.now() / 1000);

      if (decodedToken.exp < currentTime) {
        const newAccessToken = await getAccessToken();
        if (newAccessToken) {
          config.headers.Authorization = `Bearer ${newAccessToken}`;
        } else {
          throw new Error("Failed to refresh access token.");
        }
      } else {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const originalRequest = error.config;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const newAccessToken = await getAccessToken();

        isRefreshing = false;

        refreshSubscribers.forEach((callback) => callback(newAccessToken!));
        refreshSubscribers = [];

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {

        isRefreshing = false;
        refreshSubscribers = [];
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;