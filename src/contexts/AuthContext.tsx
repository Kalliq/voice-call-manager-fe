import { createContext, useContext, useState, ReactNode } from "react";
import { UserRole } from "voice-javascript-common";

import api from "../utils/axiosInstance";
import cfg from "../config";
import useAppStore from "../store/useAppStore";

interface AuthContextType {
  isAuthenticated: boolean;
  isSuperadmin?: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  signin: (creds: Record<string, unknown>) => Promise<any>;
  signout: () => Promise<void>;
  setIsSuperadmin?: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    cfg.isDevMode ? true : false
  );
  const [isSuperadmin, setIsSuperadmin] = useState<boolean>(false);

  const signin = async (creds: Record<string, unknown>) => {
    useAppStore.getState().resetStore();

    const res = await api.post("/auth/signin", creds);
    setIsAuthenticated(true);
    if (res.data.role === UserRole.SUPER_ADMIN) setIsSuperadmin(true);
    return res;
  };

  const signout = async () => {
    await api.post("/auth/signout", {});
    setIsAuthenticated(false);
    setIsSuperadmin(false);

    useAppStore.getState().resetStore();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isSuperadmin,
        setIsAuthenticated,
        signin,
        signout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
