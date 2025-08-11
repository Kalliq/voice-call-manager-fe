import { createContext, useContext } from "react";

import { useAdminPhone } from "../hooks/useAdminPhone";
import useAppStore from "../store/useAppStore";

const TwilioContext = createContext<ReturnType<typeof useAdminPhone> | null>(
  null
);

export const TwilioProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAppStore();
  const phoneState = useAdminPhone(user?.id);
  return (
    <TwilioContext.Provider value={phoneState}>
      {children}
    </TwilioContext.Provider>
  );
};

export const useTwilio = () => {
  const ctx = useContext(TwilioContext);
  if (!ctx) throw new Error("useTwilio must be used inside <TwilioProvider>");
  return ctx;
};
