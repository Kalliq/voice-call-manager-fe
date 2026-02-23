import { useQuery } from "@tanstack/react-query";
import { GET_SETTINGS_KEY } from "./constants";
import { fetchSettings } from "../api/settings";

export const useGetSettings = () => {
  return useQuery({
    queryKey: GET_SETTINGS_KEY,
    queryFn: fetchSettings,
  });
};
