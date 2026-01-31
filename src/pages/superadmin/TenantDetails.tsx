import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
  Tabs,
  Tab,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import api from "../../utils/axiosInstance";
import { UserRole } from "voice-javascript-common";
import AssignAdminUsersDialog from "./modals/AssignAdminUsersDialog";
import CreateAdminDialog from "./modals/CreateAdminDialog";
import CreateUserDialog from "./modals/CreateUserDialog";
import AssignUserToAdminDialog from "./modals/AssignUserToAdminDialog";
import AssignNumbersDialog from "./modals/AssignNumbersDialog";
import EditTenantDialog from "./modals/EditTenantDialog";
import AccountDialog from "./modals/AccountDialog";

interface TenantSettings {
  subscription?: {
    plan?: string;
    status?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    billingCycle?: string;
  };
  features?: {
    level?: string;
    enabledFeatures?: string[];
    maxUsers?: number;
    maxStorage?: number;
    customFeatures?: Record<string, any>;
  };
}

interface Tenant {
  id: string;
  name: string;
  website?: string;
  email?: string;
  description?: string;
  settings?: TenantSettings;
  adminUsers?: string[];
  dateCreated?: Date | string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tenant-tabpanel-${index}`}
      aria-labelledby={`tenant-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TenantDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allAdmins, setAllAdmins] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [openCreateUserDialog, setOpenCreateUserDialog] = useState(false);
  const [openCreateAdminDialog, setOpenCreateAdminDialog] = useState(false);
  const [openAssignUserToAdminDialog, setOpenAssignUserToAdminDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedAdminUsers, setSelectedAdminUsers] = useState<string[]>([]);
  const [selectedUserForAdmin, setSelectedUserForAdmin] = useState<any>(null);
  const [selectedAdminForUser, setSelectedAdminForUser] = useState<string>("");

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserAdminId, setNewUserAdminId] = useState("");
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [createAdminError, setCreateAdminError] = useState<string | null>(null);

  // Edit tenant state
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    website: "",
    email: "",
    description: "",
    subscriptionPlan: "",
    subscriptionStatus: "",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    billingCycle: "",
    featureLevel: "",
    maxUsers: "",
    maxStorage: "",
    enabledFeatures: [] as string[],
  });
  const [editSelectedAdminUsers, setEditSelectedAdminUsers] = useState<
    string[]
  >([]);

  // Number assignment state
  const [numbers, setNumbers] = useState<any[]>([]);
  const [userNumbers, setUserNumbers] = useState<Record<string, any[]>>({});
  const [openAssignNumberDialog, setOpenAssignNumberDialog] = useState(false);
  const [selectedUserForNumber, setSelectedUserForNumber] = useState<string | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);

  // Accounts state
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [openAccountDialog, setOpenAccountDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);

  useEffect(() => {
    if (id) {
      loadTenant();
      loadTenantUsers();
      loadAllUsers();
      loadNumbers();
      loadAccounts();
    }
  }, [id]);

  useEffect(() => {
    if (id && numbers.length > 0 && (adminUsers.length > 0 || users.length > 0)) {
      loadUserNumbers();
    }
  }, [id, numbers, adminUsers, users]);

  const loadTenant = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tenants/${id}`);
      setTenant(res.data);
    } catch (error) {
      console.error("Failed to load tenant", error);
      navigate("/superdashboard/tenants");
    } finally {
      setLoading(false);
    }
  };

  const loadTenantUsers = async () => {
    if (!id) return;
    try {
      setLoadingUsers(true);
      const [usersRes, adminsRes] = await Promise.all([
        api.get(`/tenants/${id}/users`),
        api.get(`/tenants/${id}/admin-users`),
      ]);
      setUsers(usersRes.data || []);
      setAdminUsers(adminsRes.data || []);
    } catch (error) {
      console.error("Failed to load tenant users", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const [usersRes, adminsRes] = await Promise.all([
        api.get("/users?role=user"),
        api.get("/users?role=admin"),
      ]);
      setAllUsers(usersRes.data || []);
      setAllAdmins(adminsRes.data || []);
    } catch (error) {
      console.error("Failed to load all users", error);
    }
  };

  const loadNumbers = async () => {
    try {
      const res = await api.get("/numbers");
      setNumbers(res.data || []);
    } catch (error) {
      console.error("Failed to load numbers", error);
    }
  };

  const loadAccounts = async () => {
    if (!id) return;
    try {
      setLoadingAccounts(true);
      const res = await api.get(`/accounts/tenant/${id}`, {
      });
      setAccounts(res.data || []);
    } catch (error) {
      console.error("Failed to load accounts", error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const loadUserNumbers = async () => {
    if (!id) return;
    try {
      const allTenantUsers = [...adminUsers, ...users];
      const numbersMap: Record<string, any[]> = {};
      
      // Initialize all users with empty arrays
      allTenantUsers.forEach((user) => {
        numbersMap[user.id] = [];
      });
      
      // Filter numbers by user ID from the main numbers list
      numbers.forEach((num: any) => {
        if (num.assigned && num.user && numbersMap[num.user]) {
          numbersMap[num.user].push(num);
        }
      });
      
      setUserNumbers(numbersMap);
    } catch (error) {
      console.error("Failed to load user numbers", error);
    }
  };

  const handleAssignUsers = async () => {
    if (!id) return;
    try {
      await api.post(`/tenants/${id}/assign-users`, {
        // Business rule: tenants are assigned ONLY to admin users
        adminUserIds: selectedAdminUsers,
      });
      setOpenAssignDialog(false);
      setSelectedUsers([]);
      setSelectedAdminUsers([]);
      await loadTenantUsers();
      await loadTenant();
    } catch (err) {
      console.error("Failed to assign users", err);
    }
  };

  const handleCreateUser = async () => {
    if (!id) return;
    setCreateUserError(null);
    try {
      await api.post("/users", {
        email: newUserEmail,
        password: newUserPassword,
        role: UserRole.USER,
        // Attach user to an admin; backend derives tenant from the admin
        adminId: newUserAdminId,
      });
      setOpenCreateUserDialog(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserAdminId("");
      setCreateUserError(null);
      await loadTenantUsers();
      await loadAllUsers();
      await loadNumbers();
    } catch (err: any) {
      console.error("Failed to create user", err);
      const errorMessage =
        err?.response?.data?.errors[0]?.message ||
        err?.error?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create user. Please try again.";
      setCreateUserError(errorMessage);
    }
  };

  const handleCreateAdmin = async () => {
    if (!id) return;
    setCreateAdminError(null);
    try {
      await api.post("/users", {
        email: newAdminEmail,
        password: newAdminPassword,
        role: UserRole.ADMIN,
        tenantId: id,
      });
      setOpenCreateAdminDialog(false);
      setNewAdminEmail("");
      setNewAdminPassword("");
      setCreateAdminError(null);
      await loadTenantUsers();
      await loadAllUsers();
      await loadNumbers();
    } catch (err: any) {
      console.error("Failed to create admin", err);
      const errorMessage =
        err?.response?.data?.errors[0]?.message ||
        err?.error?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create admin. Please try again.";
      setCreateAdminError(errorMessage);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!id || !confirm("Are you sure you want to remove this user?")) return;
    try {
      await api.delete(`/users/${userId}`);
      await loadTenantUsers();
      await loadTenant();
    } catch (err) {
      console.error("Failed to remove user", err);
    }
  };

  const handleAssignUserToAdmin = async () => {
    if (!selectedUserForAdmin || !selectedAdminForUser) return;
    try {
      await api.post(`/users/assign-admin`, {
        userId: selectedUserForAdmin.id,
        adminId: selectedAdminForUser,
      });
      setOpenAssignUserToAdminDialog(false);
      setSelectedUserForAdmin(null);
      setSelectedAdminForUser("");
      await loadTenantUsers();
      await loadAllUsers();
    } catch (err) {
      console.error("Failed to assign user to admin", err);
    }
  };

  const openAssignUserToAdmin = (user: any) => {
    setSelectedUserForAdmin(user);
    setSelectedAdminForUser(user.adminId || "");
    setOpenAssignUserToAdminDialog(true);
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!id || !confirm("Are you sure you want to remove this admin?")) return;
    try {
      await api.delete(`/tenants/${id}/admin-users/${adminId}`);
      await loadTenantUsers();
      await loadTenant();
    } catch (err) {
      console.error("Failed to remove admin", err);
    }
  };

  const handleAssignNumbers = async () => {
    if (!selectedUserForNumber || selectedNumbers.length === 0) return;
    try {
      await api.post("/numbers/assign", {
        userId: selectedUserForNumber,
        numbers: selectedNumbers,
      });
      setOpenAssignNumberDialog(false);
      setSelectedUserForNumber(null);
      setSelectedNumbers([]);
      await loadNumbers();
      await loadUserNumbers();
    } catch (err) {
      console.error("Failed to assign numbers", err);
    }
  };

  const handleUnassignNumber = async (userId: string, number: string) => {
    if (!confirm("Are you sure you want to unassign this number?")) return;
    try {
      await api.post("/numbers/unassign", {
        numbers: [number],
      });
      await loadNumbers();
      await loadUserNumbers();
    } catch (err) {
      console.error("Failed to unassign number", err);
    }
  };

  const openAssignNumber = (userId: string) => {
    setSelectedUserForNumber(userId);
    setSelectedNumbers([]);
    setOpenAssignNumberDialog(true);
  };

  const handleDeleteTenant = async () => {
    if (!id || !tenant) return;
    if (
      !confirm(
        `Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`
      )
    )
      return;
    try {
      await api.delete(`/tenants/${id}`);
      navigate("/superdashboard/tenants");
    } catch (err) {
      console.error("Failed to delete tenant", err);
      alert("Failed to delete tenant. Please try again.");
    }
  };

  const handleEditTenant = async () => {
    if (!id || !tenant) return;
    try {
      const tenantData: any = {
        name: editFormData.name,
        website: editFormData.website || undefined,
        email: editFormData.email || undefined,
        description: editFormData.description || undefined,
        settings: {
          subscription: {
            plan: editFormData.subscriptionPlan || undefined,
            status: editFormData.subscriptionStatus || undefined,
            startDate: editFormData.subscriptionStartDate || undefined,
            endDate: editFormData.subscriptionEndDate || undefined,
            billingCycle: editFormData.billingCycle || undefined,
          },
          features: {
            level: editFormData.featureLevel || undefined,
            maxUsers: editFormData.maxUsers
              ? parseInt(editFormData.maxUsers)
              : undefined,
            maxStorage: editFormData.maxStorage
              ? parseInt(editFormData.maxStorage)
              : undefined,
            enabledFeatures:
              editFormData.enabledFeatures.length > 0
                ? editFormData.enabledFeatures
                : undefined,
          },
        },
        adminUsers:
          editSelectedAdminUsers.length > 0
            ? editSelectedAdminUsers
            : undefined,
      };

      await api.put(`/tenants/${id}`, tenantData);
      setOpenEditDialog(false);
      await loadTenant();
      await loadTenantUsers();
    } catch (err) {
      console.error("Failed to update tenant", err);
    }
  };

  const openEdit = () => {
    if (!tenant) return;
    setEditFormData({
      name: tenant.name || "",
      website: tenant.website || "",
      email: tenant.email || "",
      description: tenant.description || "",
      subscriptionPlan: tenant.settings?.subscription?.plan || "",
      subscriptionStatus: tenant.settings?.subscription?.status || "",
      subscriptionStartDate: tenant.settings?.subscription?.startDate
        ? new Date(tenant.settings.subscription.startDate)
            .toISOString()
            .split("T")[0]
        : "",
      subscriptionEndDate: tenant.settings?.subscription?.endDate
        ? new Date(tenant.settings.subscription.endDate)
            .toISOString()
            .split("T")[0]
        : "",
      billingCycle: tenant.settings?.subscription?.billingCycle || "",
      featureLevel: tenant.settings?.features?.level || "",
      maxUsers: tenant.settings?.features?.maxUsers?.toString() || "",
      maxStorage: tenant.settings?.features?.maxStorage?.toString() || "",
      enabledFeatures: tenant.settings?.features?.enabledFeatures || [],
    });
    setEditSelectedAdminUsers(tenant.adminUsers || []);
    setOpenEditDialog(true);
  };

  const handleSaveAccount = async (accountData: any) => {
    if (!id) return;
    try {
      if (selectedAccount?.id) {
        // Update existing account
        await api.patch(`/accounts/tenant/update/${selectedAccount.id}`, {
          ...accountData,
          tenantId: id,
        });
      } else {
        // Create new account
        await api.post("/accounts/tenant/create", {
          ...accountData,
          tenantId: id,
        });
      }
      await loadAccounts();
      setSelectedAccount(null);
    } catch (err) {
      console.error("Failed to save account", err);
      throw err;
    }
  };

  const handleOpenAccountDialog = (account: any | null) => {
    setSelectedAccount(account);
    setOpenAccountDialog(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!tenant) {
    return (
      <Box p={3}>
        <Typography variant="h6">Tenant not found</Typography>
        <Button
          onClick={() => navigate("/superdashboard/tenants")}
          startIcon={<ArrowBackIcon />}
        >
          Back to Tenants
        </Button>
      </Box>
    );
  }

  const displayFields = [
    { label: "Name", value: tenant.name },
    { label: "Email", value: tenant.email },
    { label: "Website", value: tenant.website },
    { label: "Description", value: tenant.description },
    {
      label: "Subscription Plan",
      value: tenant.settings?.subscription?.plan,
    },
    {
      label: "Subscription Status",
      value: tenant.settings?.subscription?.status,
    },
    {
      label: "Billing Cycle",
      value: tenant.settings?.subscription?.billingCycle,
    },
    {
      label: "Feature Level",
      value: tenant.settings?.features?.level,
    },
    {
      label: "Max Users",
      value: tenant.settings?.features?.maxUsers?.toString(),
    },
    {
      label: "Max Storage (GB)",
      value: tenant.settings?.features?.maxStorage?.toString(),
    },
    {
      label: "Date Created",
      value: tenant.dateCreated
        ? new Date(tenant.dateCreated).toLocaleDateString()
        : undefined,
    },
  ].filter((field) => field.value);

  return (
    <Box p={3}>
      <Box mb={3} display="flex" alignItems="center" gap={2} justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/superdashboard/tenants")}
            variant="outlined"
          >
            Back to Tenants
          </Button>
          <Typography variant="h5" fontWeight="bold">
            {tenant.name}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={openEdit}
          >
            Edit Tenant
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteTenant}
          >
            Delete Tenant
          </Button>
        </Stack>
      </Box>

      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Details" />
          <Tab label="User Management" />
          <Tab label="Accounts" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {displayFields.map((field, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      {field.label}
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {field.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {displayFields.length === 0 && (
              <Grid item xs={12}>
                <Typography color="text.secondary" align="center" py={4}>
                  No details available for this tenant.
                </Typography>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Stack spacing={4}>
            {/* Admin Users Section */}
            <Box>
              <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Admin Users</Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSelectedAdminUsers(adminUsers.map((u) => u.id));
                      setOpenAssignDialog(true);
                    }}
                  >
                    Assign Existing Admins
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenCreateAdminDialog(true)}
                  >
                    Create Admin
                  </Button>
                </Stack>
              </Stack>

              {loadingUsers ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Assigned Numbers</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {adminUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography color="text.secondary" py={2}>
                              No admin users assigned to this tenant
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        adminUsers.map((admin: any) => {
                          const assignedNumbers = userNumbers[admin.id] || [];
                          return (
                            <TableRow key={admin.id}>
                              <TableCell>{admin.email}</TableCell>
                              <TableCell>{admin.role}</TableCell>
                              <TableCell>
                                {assignedNumbers.length > 0 ? (
                                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                    {assignedNumbers.map((num: any) => (
                                      <Chip
                                        key={num.number || num}
                                        label={num.number || num}
                                        size="small"
                                        onDelete={() =>
                                          handleUnassignNumber(
                                            admin.id,
                                            num.number || num
                                          )
                                        }
                                        sx={{ mb: 0.5 }}
                                      />
                                    ))}
                                  </Stack>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    No numbers assigned
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5}>
                                  <IconButton
                                    onClick={() => openAssignNumber(admin.id)}
                                    size="small"
                                    color="primary"
                                    title="Assign Numbers"
                                  >
                                    <PhoneIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    onClick={() => handleRemoveAdmin(admin.id)}
                                    size="small"
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            <Divider />

            {/* Regular Users Section */}
            <Box>
              <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Regular Users</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateUserDialog(true)}
                  disabled={adminUsers.length === 0}
                >
                  Create User
                </Button>
              </Stack>
              {adminUsers.length === 0 && (
                <Box mb={2}>
                  <Typography variant="body2" color="warning.main">
                    ⚠️ You need to create or assign at least one admin user before creating regular users.
                  </Typography>
                </Box>
              )}

              {loadingUsers ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Assigned Admin</TableCell>
                        <TableCell>Assigned Numbers</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary" py={2}>
                              No users assigned to this tenant
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user: any) => {
                          const assignedNumbers = userNumbers[user.id] || [];
                          return (
                            <TableRow key={user.id}>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.role}</TableCell>
                              <TableCell>{user.adminId ? user.adminId.email : "-"}</TableCell>
                              <TableCell>
                                {assignedNumbers.length > 0 ? (
                                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                    {assignedNumbers.map((num: any) => (
                                      <Chip
                                        key={num.number || num}
                                        label={num.number || num}
                                        size="small"
                                        onDelete={() =>
                                          handleUnassignNumber(
                                            user.id,
                                            num.number || num
                                          )
                                        }
                                        sx={{ mb: 0.5 }}
                                      />
                                    ))}
                                  </Stack>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    No numbers assigned
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5}>
                                  <IconButton
                                    onClick={() => openAssignUserToAdmin(user)}
                                    size="small"
                                    color="secondary"
                                    title="Assign to Admin"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    onClick={() => openAssignNumber(user.id)}
                                    size="small"
                                    color="primary"
                                    title="Assign Numbers"
                                  >
                                    <PhoneIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    onClick={() => handleRemoveUser(user.id)}
                                    size="small"
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Stack>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Stack spacing={3}>
            <Box>
              <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Accounts</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenAccountDialog(null)}
                >
                  Create Account
                </Button>
              </Stack>

              {loadingAccounts ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : accounts.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Typography color="text.secondary">
                    No accounts found for this tenant
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {accounts.map((account: any) => {
                    const user = [...adminUsers, ...users].find(
                      (u) => u.id === account.userId
                    );
                    return (
                      <Grid item xs={12} sm={6} md={4} key={account.id}>
                        <Card
                          sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            cursor: "pointer",
                            "&:hover": {
                              boxShadow: 4,
                            },
                          }}
                          onClick={() =>
                            navigate(
                              `/superdashboard/tenants/${id}/accounts/${account.id}`
                            )
                          }
                        >
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                              {account.companyName || "Unnamed Account"}
                            </Typography>
                            <Stack spacing={1} mt={2}>
                              {account.website && (
                                <Typography variant="body2" color="text.secondary">
                                  🌐 {account.website}
                                </Typography>
                              )}
                              {account.phone && (
                                <Typography variant="body2" color="text.secondary">
                                  📞 {account.phone}
                                </Typography>
                              )}
                              {(account.city && account.state) || account.location ? (
                                <Typography variant="body2" color="text.secondary">
                                  📍{" "}
                                  {account.city && account.state
                                    ? `${account.city}, ${account.state}`
                                    : account.location}
                                </Typography>
                              ) : null}
                              {account.industry && (
                                <Box mt={1}>
                                  <Chip
                                    label={account.industry}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </Box>
                              )}
                              {user && (
                                <Typography variant="body2" color="text.secondary" mt={1}>
                                  👤 {user.email}
                                </Typography>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          </Stack>
        </TabPanel>
      </Paper>

      <AssignAdminUsersDialog
        open={openAssignDialog}
        onClose={() => setOpenAssignDialog(false)}
        tenantName={tenant.name}
        allAdmins={allAdmins}
        selectedAdminUsers={selectedAdminUsers}
        onAdminUsersChange={setSelectedAdminUsers}
        onAssign={handleAssignUsers}
      />

      <CreateAdminDialog
        open={openCreateAdminDialog}
        onClose={() => {
          setOpenCreateAdminDialog(false);
          setCreateAdminError(null);
        }}
        tenantName={tenant.name}
        email={newAdminEmail}
        password={newAdminPassword}
        error={createAdminError}
        onErrorClear={() => setCreateAdminError(null)}
        onEmailChange={(email) => {
          setNewAdminEmail(email);
          setCreateAdminError(null);
        }}
        onPasswordChange={(password) => {
          setNewAdminPassword(password);
          setCreateAdminError(null);
        }}
        onCreate={handleCreateAdmin}
      />

      <CreateUserDialog
        open={openCreateUserDialog}
        onClose={() => {
          setOpenCreateUserDialog(false);
          setCreateUserError(null);
        }}
        tenantName={tenant.name}
        email={newUserEmail}
        password={newUserPassword}
        adminId={newUserAdminId}
        adminUsers={adminUsers}
        error={createUserError}
        onErrorClear={() => setCreateUserError(null)}
        onEmailChange={(email) => {
          setNewUserEmail(email);
          setCreateUserError(null);
        }}
        onPasswordChange={(password) => {
          setNewUserPassword(password);
          setCreateUserError(null);
        }}
        onAdminIdChange={(adminId) => {
          setNewUserAdminId(adminId);
          setCreateUserError(null);
        }}
        onCreate={handleCreateUser}
      />

      <AssignUserToAdminDialog
        open={openAssignUserToAdminDialog}
        onClose={() => setOpenAssignUserToAdminDialog(false)}
        user={selectedUserForAdmin}
        adminUsers={adminUsers}
        selectedAdminId={selectedAdminForUser}
        onAdminIdChange={setSelectedAdminForUser}
        onAssign={handleAssignUserToAdmin}
      />

      <AssignNumbersDialog
        open={openAssignNumberDialog}
        onClose={() => setOpenAssignNumberDialog(false)}
        userEmail={
          selectedUserForNumber
            ? [...adminUsers, ...users].find(
                (u) => u.id === selectedUserForNumber
              )?.email || null
            : null
        }
        numbers={numbers}
        selectedNumbers={selectedNumbers}
        onNumbersChange={setSelectedNumbers}
        onAssign={handleAssignNumbers}
      />

      <EditTenantDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        tenantName={tenant.name}
        formData={editFormData}
        adminUsers={allAdmins}
        selectedAdminUsers={editSelectedAdminUsers}
        onFormDataChange={(field, value) => {
          setEditFormData({ ...editFormData, [field]: value });
        }}
        onAdminUsersChange={setEditSelectedAdminUsers}
        onUpdate={handleEditTenant}
      />

      <AccountDialog
        open={openAccountDialog}
        onClose={() => {
          setOpenAccountDialog(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
        users={[...adminUsers, ...users]}
        onSave={handleSaveAccount}
      />
    </Box>
  );
};

export default TenantDetails;
