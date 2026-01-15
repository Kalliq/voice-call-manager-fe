// src/utils/listApi.ts
import api from "./axiosInstance";

export interface ListItem { 
  id?: string;
  _id?: string;
  listName: string; 
  /* …other fields… */ 
}

/**
 * Returns true if the name is NOT taken.
 * @param name - The list name to check
 * @param excludeListId - Optional list ID to exclude from uniqueness check (for edit mode)
 */
export async function isListNameUnique(name: string, excludeListId?: string): Promise<boolean> {
  const { data } = await api.get<ListItem[]>("/lists");
  // case‐insensitive compare against every existing listName, excluding current list if editing
  return !data.some(
    (l) => {
      const listId = String(l.id || l._id || "");
      const excludeId = excludeListId ? String(excludeListId) : "";
      // Skip the current list being edited (normalize both to strings for comparison)
      if (excludeId && listId === excludeId) return false;
      return l.listName.trim().toLowerCase() === name.trim().toLowerCase();
    }
  );
}
