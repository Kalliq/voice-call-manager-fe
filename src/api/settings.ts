import api from "../utils/axiosInstance";

export const fetchSettings = async () => {
  const { data } = await api.get("/settings");
  return data;
};

export const updateSettings = async (payload: Record<string, any>) => {
  const { data } = await api.patch("/settings", payload);
  return data;
};
