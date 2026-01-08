import { useState } from "react";
import api from "../../../utils/axiosInstance";
import useAppStore from "../../../store/useAppStore";
import { Contact } from "../../../types/contact";
import { Step } from "../../../interfaces/list-dialing-step";

const useListManager = () => {
  const deleteList = useAppStore((state) => state.deleteList);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuListId, setMenuListId] = useState<string | null>(null);
  const [selectedCalls, setSelectedCalls] = useState<Record<string, string>>(
    {}
  );
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [eligibleContacts, setEligibleContacts] = useState<{
    [listId: string]: { [stepIndex: number]: Contact[] };
  }>({});
  const [eligibleCounts, setEligibleCounts] = useState<Record<string, number>>({});

  const fetchEligibleContacts = async (listId: string, steps: Step[]) => {
    const results: { [stepIndex: number]: Contact[] } = {};

    for (let i = 0; i < steps.length; i++) {
      try {
        const res = await api.post(`/lists/${listId}/step/${i + 1}/contacts`);
        results[i] = res.data;
      } catch {
        results[i] = [];
      }
    }

    setEligibleContacts((prev) => ({ ...prev, [listId]: results }));
    return results;
  };

  const fetchEligibleCounts = async (listId: string, steps: Step[]): Promise<number | undefined> => {
    if (!steps?.length) return undefined;
    
    try {
      let totalCount = 0;
      for (let i = 0; i < steps.length; i++) {
        try {
          const res = await api.post(`/lists/${listId}/step/${i + 1}/contacts`);
          totalCount += Array.isArray(res.data) ? res.data.length : 0;
        } catch {
          // Individual step failure, continue with others
        }
      }
      setEligibleCounts((prev) => ({ ...prev, [listId]: totalCount }));
      return totalCount;
    } catch {
      // Overall failure, return undefined (not 0)
      return undefined;
    }
  };

  const handleExpand = (listId: string, steps?: Step[]) => {
    const isExpanding = expandedListId !== listId;
    setExpandedListId(isExpanding ? listId : null);
    if (isExpanding && steps?.length) {
      fetchEligibleContacts(listId, steps);
    }
  };

  const handleConnectionChange = (listId: string, option: string) => {
    setSelectedCalls((prev) => ({ ...prev, [listId]: option }));
    setAnchorEl(null);
    setMenuListId(null);
  };

  const openMenu = (e: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(e.currentTarget);
    setMenuListId(id);
  };

  const closeMenu = () => {
    setAnchorEl(null);
    setMenuListId(null);
  };

  const handleDeleteClick = (id: string) => {
    setListToDelete(id);
    setOpenDialog(true);
  };

  const handleDelete = async () => {
    if (listToDelete) {
      await deleteList(listToDelete);
      setOpenDialog(false);
      setListToDelete(null);
    }
  };

  return {
    selectedCalls,
    expandedListId,
    eligibleContacts,
    eligibleCounts,
    handleExpand,
    fetchEligibleContacts,
    fetchEligibleCounts,
    handleConnectionChange,
    anchorEl,
    menuListId,
    openMenu,
    closeMenu,
    openDialog,
    setOpenDialog,
    handleDeleteClick,
    handleDelete,
    listToDelete,
  };
};

export default useListManager;
