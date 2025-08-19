// src/utils/listApi.ts
import api from "./axiosInstance";

export interface ListItem { listName: string; /* …other fields… */ }

/**
 * Returns true if the name is NOT taken.
 */
export async function isListNameUnique(name: string): Promise<boolean> {
  const { data } = await api.get<ListItem[]>("/lists");
  // case‐insensitive compare against every existing listName
  return !data.some(
    (l) => l.listName.trim().toLowerCase() === name.trim().toLowerCase()
  );
}
