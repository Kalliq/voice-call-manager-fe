import api from "../utils/axiosInstance";
import { useSnackbar } from "../hooks/useSnackbar";

interface UseMoveContactsOptions {
  onMoved?: (moved: number, skipped: number, skippedIds: string[]) => void;
}

export function useMoveContacts({ onMoved }: UseMoveContactsOptions = {}) {
  const { enqueue } = useSnackbar();

  const moveContacts = async (
    sourceListId: string,
    targetListId: string,
    contactIds: string[]
  ) => {
    try {
      const res = await api.post("/contacts/move", {
        sourceListId,
        targetListId,
        contactIds,
      });

      if (onMoved) {
        onMoved(res.data.moved, res.data.skipped, res.data.skippedIds);
      }

      return res.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || "Move failed.";
      enqueue(message, { variant: "error" });
      throw error;
    }
  };

  return { moveContacts };
}
