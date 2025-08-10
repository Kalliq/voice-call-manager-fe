import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

const PrivateRoute = () => {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
