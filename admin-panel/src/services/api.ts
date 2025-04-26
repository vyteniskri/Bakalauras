import axios from "axios";

const API_BASE_URL = "https://coral-app-oyqdq.ondigitalocean.app/api";
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let refreshSubscribers: ((token: string) => void)[] = [];

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});


const getAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
     
        const response = await axios.post(`${API_BASE_URL}/accessToken`, {}, { withCredentials: true });
     

        const { accessToken } = response.data;
        localStorage.setItem("accessToken", accessToken);

        const payload = accessToken.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        const roles = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        const userId = decoded.sub;

       


        if (Array.isArray(roles) ? roles.includes("Admin") || roles.includes("Moderator") : roles === "Admin" || roles === "Moderator") {
          localStorage.setItem("Role", roles);
          localStorage.setItem("userId", userId);
          return accessToken;
        } else {
          alert("Access Denied: You do not have permission to access this application.");
          localStorage.clear(); 
          return null;
        }
      } catch (error: any) {
        
        if (error.response?.status === 422) {
          alert("Session Expired: Please log in again.");
          localStorage.clear(); 
          window.location.href = "/login";
          return null; 
        }

      } finally {
        refreshPromise = null; 
      }
    })();
  }

  return refreshPromise;
};


api.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      const payload = accessToken.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      const currentTime = Math.floor(Date.now() / 1000);


      if (decoded.exp < currentTime) {
       
        const newAccessToken = await getAccessToken();
        if (newAccessToken) {
          config.headers.Authorization = `Bearer ${newAccessToken}`;
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


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const originalRequest = error.config;

      if (isRefreshing) {
     
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
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
        return api(originalRequest);
      } catch (refreshError) {
       

        isRefreshing = false;
        refreshSubscribers = [];
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

export default api;