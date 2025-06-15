import { Route } from "react-router-dom";

import PrivateRoute from "../components/PrivateRoute";
import WithHeader from "../hocs/WithHeader";

// Admin pages
import Dashboard from "../pages/admin/Dashboard";
import Campaign from "../pages/admin/Campaign/Campaign";
import Settings from "../pages/admin/Settings/Settings";
import Lists from "../pages/admin/Lists/Lists";
import Contacts from "../pages/admin/Contacts/Contacts";
import ImportContacts from "../pages/admin/ImportContacts";
import CreateNewList from "../pages/admin/CreateNewList";

import InboundCallDialog from "../components/InboundCallDialog";

const AdminLayout = () => {
  return (
    <>
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard">
          <Route index element={<WithHeader component={Dashboard} />} />
          <Route
            path="campaign"
            element={<WithHeader component={Campaign} />}
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
      <InboundCallDialog />
    </>
  );
};

export default AdminLayout;
