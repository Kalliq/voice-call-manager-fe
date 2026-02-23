import { useState, useEffect } from "react";

import { useGetSettings } from "../queries/settings";
import { translateToTitleCase } from "../utils/translateToTitle";

export const useSettings = () => {
  // Settings

  type SelectedType = {
    parent: string;
    child: string;
  } | null;

  const { data: settings } = useGetSettings() as {
    data: Record<string, Record<string, any>> | undefined;
  };

  // Map original keys to display keys for lookup
  const keyMap = settings
    ? Object.keys(settings)
        .filter((key) => {
          const lowerKey = key.toLowerCase().replace(/\s+/g, "");
          return (
            key !== "user" &&
            key !== "id" &&
            !["createdat", "updatedat", "created_at", "updated_at"].includes(lowerKey)
          );
        })
        .reduce((acc, key) => {
          acc[translateToTitleCase(key)] = key;
          return acc;
        }, {} as Record<string, string>)
    : {};

  const settingsKeys = Object.keys(keyMap);

  const [selected, setSelected] = useState<SelectedType>({
    parent: "Phone Settings",
    child: "powerDialerManagement",
  });

  useEffect(() => {
    if (settings && !selected) {
      const parent = settingsKeys.find((k) =>
        k.toLowerCase().includes("power dialer")
      );
      if (parent) {
        const originalKey = keyMap[parent] || parent;
        const child = Object.keys(settings[originalKey] || {}).find(
          (subKey) =>
            subKey.toLowerCase().includes("powerdialer") ||
            subKey.toLowerCase().includes("power_dialer")
        );
        if (child) setSelected({ parent, child });
      }
    }
  }, [settings, settingsKeys, selected, keyMap]);

  const handleChildClick = (parent: string, child: string) => {
    setSelected({ parent, child });
  };

  return {
    selected,
    settingsKeys,
    settings: settings ?? null,
    handleChildClick,
    keyMap, // Map display keys back to original keys
  };
};
