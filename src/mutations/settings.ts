import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SETTINGS_UPDATE_KEY } from "./constants";
import { GET_SETTINGS_KEY } from "../queries/constants";
import { updateSettings } from "../api/settings";

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: SETTINGS_UPDATE_KEY,
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_SETTINGS_KEY });
    },
  });
};
