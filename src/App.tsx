import { useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "./contexts/AuthContext";

import { useInboundCall } from "./hooks/useInboundCall";
import SuperadminRoute from "./components/SuperadminRoute";
import WithHeader from "./hocs/WithHeader";
import AdminLayout from "./layouts/AdminLayout";
import PrivateRoute from "./components/PrivateRoute";
import { InboundCallDialog } from "./components/InboundCallDialog";

// Main Pages
import SignIn from "./pages/SignIn";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Campaign from "./pages/admin/Campaign/Campaign";
import Settings from "./pages/admin/Settings/Settings";
import Lists from "./pages/admin/Lists/Lists";
import Contacts from "./pages/admin/Contacts/Contacts";
import Tasks from "./pages/admin/Tasks/Tasks";
import ImportContacts from "./pages/admin/ImportContacts";
import CreateNewList from "./pages/admin/CreateNewList";
import Coaching from "./pages/admin/Coaching/Coaching";
import MyPhoneNumbersList from "./pages/admin/MyNumbersList";
import Reports from "./pages/admin/Reports/Reports";

// Superadmin pages
import SuperDashboard from "./pages/superadmin/SuperDashboard";
import NumberPoolSettings from "./pages/superadmin/NumberPoolSettings";
import UsersManagement from "./pages/superadmin/UserManagement";

import "./App.css";

function App() {
  const { isAuthenticated, isSuperadmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && location.pathname === "/") {
      if (isSuperadmin) {
        navigate("/superdashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, isSuperadmin, location.pathname, navigate]);

  const {
    isInboundCallDialogOpen,
    from,
    accepted,
    acceptCall,
    rejectCall,
    hangUp,
  } = useInboundCall();

  return (
    <>
      <Routes>
        <Route path="/" element={<SignIn />} />
        {/* Private routes */}
        {isAuthenticated && (
          <Route element={<PrivateRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/campaign" element={<Campaign />} />
              <Route path="/lists" element={<Lists />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/import-contacts" element={<ImportContacts />} />
              <Route path="/create-new-list/:id?" element={<CreateNewList />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/my-numbers" element={<MyPhoneNumbersList />} />
              <Route path="/coaching" element={<Coaching />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>
        )}
        <Route element={<SuperadminRoute />}>
          <Route path="/superdashboard">
            <Route index element={<WithHeader component={SuperDashboard} />} />
            <Route
              path="numbers-pool"
              element={<WithHeader component={NumberPoolSettings} />}
            />
            <Route
              path="users"
              element={<WithHeader component={UsersManagement} />}
            />
          </Route>
        </Route>
      </Routes>
      <InboundCallDialog
        open={isInboundCallDialogOpen}
        from={from}
        accepted={accepted}
        onAccept={acceptCall}
        onReject={rejectCall}
        onHangUp={hangUp}
      />
    </>
  );
}

export default App;
