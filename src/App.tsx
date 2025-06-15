import { HashRouter as Router, Routes, Route } from "react-router-dom";

import { useAuth } from "./contexts/AuthContext";
import SuperadminRoute from "./components/SuperadminRoute";
import WithHeader from "./hocs/WithHeader";

// Layouts
import AdminLayout from "./layouts/AdminLayout";

// Main Pages
import SignIn from "./pages/SignIn";

// Superadmin pages
import SuperDashboard from "./pages/superadmin/SuperDashboard";
import NumberPoolSettings from "./pages/superadmin/NumberPoolSettings";

import "./App.css";

function App() {
  const { isAuthenticated, isSuperadmin } = useAuth();
  console.log("isAuthenticated: ", isAuthenticated);
  console.log("isSuperadmin: ", isSuperadmin);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        {/* Private routes */}
        <AdminLayout />
        <Route element={<SuperadminRoute />}>
          <Route path="/superdashboard">
            <Route index element={<WithHeader component={SuperDashboard} />} />
            <Route
              path="numbers-pool"
              element={<WithHeader component={NumberPoolSettings} />}
            />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
