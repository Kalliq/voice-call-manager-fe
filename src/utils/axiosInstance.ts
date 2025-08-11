import axios from "axios";

import { history } from "./history";

import cfg from "../config";

const api = axios.create({
  baseURL: `${cfg.backendUrl}/api`,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const url = error?.config?.url || "";
      if (error.response.status === 401) {
        if (!url.includes("/auth/me")) {
          console.error("Unathorized! Logging out...");

          if (!cfg.isDevMode) history.push("/");
        }
      } else if (error.response.status === 500) {
        console.error("Server error! Try again later!");
      }
    } else {
      console.error("Network error or no response from the server.");
    }

    return Promise.reject(error);
  }
);

export default api;
