import { useState, useEffect } from "react";

import useAppStore from "../store/useAppStore";
import { translateToTitleCase } from "../utils/translateToTitle";

export const useSettings = () => {
  // Settings

  type SelectedType = {
    parent: string;
    child: string;
  } | null;

  const settings = useAppStore((state) => state.settings) as Record<
    string,
    Record<string, any>
  > | null;

  // Map original keys to display keys for lookup
  const keyMap = settings
    ? Object.keys(settings)
        .filter((key) => key !== "user" && key !== "id" && key !== "createdAt" && key !== "updatedAt")
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
    settings,
    handleChildClick,
    keyMap, // Map display keys back to original keys
  };
};
