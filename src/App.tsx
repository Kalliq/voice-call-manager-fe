import { useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import { useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import SuperadminRoute from "./components/SuperadminRoute";
import WithHeader from "./hocs/WithHeader";

// Main Pages
import SignIn from "./pages/SignIn";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import TwilioDevice from "./pages/admin/TwilioDevice/TwilioDevice";
import Settings from "./pages/admin/Settings/Settings";
import Lists from "./pages/admin/Lists/Lists";
import Contacts from "./pages/admin/Contacts/Contacts";
import ImportContacts from "./pages/admin/ImportContacts";
import CreateNewList from "./pages/admin/CreateNewList";

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
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard">
            <Route index element={<WithHeader component={Dashboard} />} />
            <Route
              path="device"
              element={<WithHeader component={TwilioDevice} />}
            />
            <Route
              path="settings"
              element={<WithHeader component={Settings} />}
            />
            <Route path="lists" element={<WithHeader component={Lists} />} />
            <Route
              path="contacts"
              element={<WithHeader component={Contacts} />}
            />
            <Route
              path="import-contacts"
              element={<WithHeader component={ImportContacts} />}
            />
            <Route
              path="create-new-list/:id?"
              element={<WithHeader component={CreateNewList} />}
            />
          </Route>
        </Route>
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
