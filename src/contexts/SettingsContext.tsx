// SettingsContext.tsx
import React, { createContext, useContext } from "react";
import { useSettings } from "../hooks/useSettings";

const SettingsContext = createContext<ReturnType<typeof useSettings>>(null!);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  return useContext(SettingsContext);
}
