import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SuperadminRoute() {
  const { isAuthenticated, isSuperadmin } = useAuth();

  console.log("isSuperadmin: ", isSuperadmin);

  if (!isAuthenticated) return <Navigate to="/" />;
  if (!isSuperadmin) return <Navigate to="/dashboard" />; // or a 403 page

  return <Outlet />;
}
