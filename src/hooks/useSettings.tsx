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

  const settingsKeys = settings
    ? Object.keys(settings)
        .filter((key) => key !== "user" && key !== "id")
        .map((key) => translateToTitleCase(key))
    : [];

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
        const child = Object.keys(settings[parent]).find(
          (subKey) =>
            subKey.toLowerCase().includes("powerdialer") ||
            subKey.toLowerCase().includes("power_dialer")
        );
        if (child) setSelected({ parent, child });
      }
    }
  }, [settings, settingsKeys, selected]);

  const handleChildClick = (parent: string, child: string) => {
    setSelected({ parent, child });
  };

  return {
    selected,
    settingsKeys,
    settings,
    handleChildClick,
  };
};
