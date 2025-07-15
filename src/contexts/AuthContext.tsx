import { useEffect } from "react";
import { createContext, useContext, useState, ReactNode } from "react";
import { UserRole } from "voice-javascript-common";

import api from "../utils/axiosInstance";
import cfg from "../config";
import useAppStore from "../store/useAppStore";
import { useAdminPhone } from "../hooks/useAdminPhone";

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperadmin?: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  signin: (creds: Record<string, unknown>) => Promise<any>;
  signout: () => Promise<void>;
  setIsSuperadmin?: React.Dispatch<React.SetStateAction<boolean>>;
  phoneState: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const { user, setUser } = useAppStore();

  const phoneState = useAdminPhone(user?.id);

  const signin = async (creds: Record<string, unknown>) => {
    useAppStore.getState().resetStore();

    const res = await api.post("/auth/signin", creds);
    setIsAuthenticated(true);
    if (res.data.role === UserRole.SUPER_ADMIN) {
      setIsSuperadmin(true);
    } else if (res.data.role === UserRole.ADMIN) {
      setIsAdmin(true);
    }
    return res;
  };

  const signout = async () => {
    await api.post("/auth/signout", {});
    setIsAuthenticated(false);
    setIsSuperadmin(false);
    setIsAdmin(false);

    useAppStore.getState().resetStore();
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (data.user) {
          console.log("user from me: ", data.user);
          setIsAuthenticated(true);
          setUser(data.user);
          if (data.data.role === UserRole.SUPER_ADMIN) {
            setIsSuperadmin(true);
          } else if (data.data.role === UserRole.ADMIN) {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        setIsAuthenticated(false);
      }
    };

    checkSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        isSuperadmin,
        setIsAuthenticated,
        signin,
        signout,
        phoneState,
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
