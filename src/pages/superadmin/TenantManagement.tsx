import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  TextField,
  Stack,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Grid,
  Divider,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import api from "../../utils/axiosInstance";

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

export default function TenantManagement() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [tenantMinutes, setTenantMinutes] = useState<
    { id: string; minutes: number, totalCalls: number }[]
  >([]);
  const [loadingMinutes, setLoadingMinutes] = useState(false);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
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

  const [selectedAdminUsers, setSelectedAdminUsers] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tenants");
      setTenants(res.data);

      const tenantsData = res.data;
      const results = await Promise.all(
        (tenantsData || []).map(async (tenant: any) => {
          try {
            const {data} = await api.get("/call-logs/stats/tenant", {
              params: { period: "month", tenantId: tenant.id },
            });

            return { id: tenant.id, minutes: data.totalMinutes, totalCalls: data.callsTotal };
          } catch (err) {
            console.error("Failed to fetch minutes for tenant", err);
            return { id: tenant.id, minutes: 0, totalCalls: 0 };
          }
        })
      );
      setTenantMinutes(results);

    } catch (error) {
      console.error("Failed to fetch tenants", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const [usersRes, adminsRes] = await Promise.all([
        api.get("/users?role=user"),
        api.get("/users?role=admin"),
      ]);
      setUsers(usersRes.data);
      setAdminUsers(adminsRes.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    loadTenants();
    loadUsers();
  }, []);
  
  const handleCreateTenant = async () => {
    try {
      const tenantData: any = {
        name: formData.name,
        website: formData.website || undefined,
        email: formData.email || undefined,
        description: formData.description || undefined,
        settings: {
          subscription: {
            plan: formData.subscriptionPlan || undefined,
            status: formData.subscriptionStatus || undefined,
            startDate: formData.subscriptionStartDate || undefined,
            endDate: formData.subscriptionEndDate || undefined,
            billingCycle: formData.billingCycle || undefined,
          },
          features: {
            level: formData.featureLevel || undefined,
            maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : undefined,
            maxStorage: formData.maxStorage
              ? parseInt(formData.maxStorage)
              : undefined,
            enabledFeatures: formData.enabledFeatures.length > 0
              ? formData.enabledFeatures
              : undefined,
          },
        },
        adminUsers: selectedAdminUsers.length > 0 ? selectedAdminUsers : undefined,
      };

      await api.post("/tenants", tenantData);
      setOpenCreateDialog(false);
      resetForm();
      await loadTenants();
    } catch (err) {
      console.error("Failed to create tenant", err);
    }
  };


  const resetForm = () => {
    setFormData({
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
      enabledFeatures: [],
    });
    setSelectedAdminUsers([]);
    setSelectedUsers([]);
  };



  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={4}>
      <Box mb={2}>
        <Button
          variant="text"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/superdashboard")}
        >
          Back to Dashboard
        </Button>
      </Box>
      <Typography variant="h5" mb={2}>
        Tenant Management
      </Typography>

      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        <TextField
          label="Search by name"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240 }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setOpenCreateDialog(true);
          }}
        >
          Create Tenant
        </Button>
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((tenant) => (
            <Grid item xs={12} sm={6} md={4} key={tenant.id}>
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
                onClick={() => navigate(`/superdashboard/tenants/${tenant.id}`)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {tenant.name}
                  </Typography>
                  <Stack spacing={1} mt={2}>
                    {tenant.email && (
                      <Typography variant="body2" color="text.secondary">
                        📧 {tenant.email}
                      </Typography>
                    )}
                    {tenant.website && (
                      <Typography variant="body2" color="text.secondary">
                        🌐 {tenant.website}
                      </Typography>
                    )}
                    <Box mt={1}>
                      <Typography variant="body2" color="text.secondary">
                        Minutes this month
                      </Typography>
                      <Typography variant="h6">
                        {(() => {
                          const entry = tenantMinutes.find(
                            (t) => t.id === tenant.id
                          );
                          return  entry ? "Total calls : " +entry.totalCalls + ' lasted ' + entry.minutes + 'm': "0";
                        })()}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                      {tenant.settings?.subscription?.plan && (
                        <Chip
                          label={tenant.settings.subscription.plan}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {tenant.settings?.subscription?.status && (
                        <Chip
                          label={tenant.settings.subscription.status}
                          size="small"
                          color={
                            tenant.settings.subscription.status === "active"
                              ? "success"
                              : "default"
                          }
                        />
                      )}
                    </Box>
                    {tenant.adminUsers && tenant.adminUsers.length > 0 && (
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        👥 {tenant.adminUsers.length} admin user(s)
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end", p: 1 }}>
                </CardActions>
              </Card>
            </Grid>
          ))}
          {filtered.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  No tenants found. Create your first tenant to get started.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Create Tenant Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Tenant</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Name *"
                  fullWidth
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Website"
                  fullWidth
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }}>Subscription Settings</Divider>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Plan</InputLabel>
                  <Select
                    value={formData.subscriptionPlan}
                    label="Plan"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subscriptionPlan: e.target.value,
                      })
                    }
                  >
                    <MenuItem value="basic">Basic</MenuItem>
                    <MenuItem value="professional">Professional</MenuItem>
                    <MenuItem value="enterprise">Enterprise</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.subscriptionStatus}
                    label="Status"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subscriptionStatus: e.target.value,
                      })
                    }
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  value={formData.subscriptionStartDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscriptionStartDate: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Date"
                  type="date"
                  fullWidth
                  value={formData.subscriptionEndDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscriptionEndDate: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Billing Cycle</InputLabel>
                  <Select
                    value={formData.billingCycle}
                    label="Billing Cycle"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingCycle: e.target.value,
                      })
                    }
                  >
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }}>Feature Settings</Divider>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Feature Level</InputLabel>
                  <Select
                    value={formData.featureLevel}
                    label="Feature Level"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        featureLevel: e.target.value,
                      })
                    }
                  >
                    <MenuItem value="basic">Basic</MenuItem>
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Max Users"
                  type="number"
                  fullWidth
                  value={formData.maxUsers}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUsers: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Max Storage (GB)"
                  type="number"
                  fullWidth
                  value={formData.maxStorage}
                  onChange={(e) =>
                    setFormData({ ...formData, maxStorage: e.target.value })
                  }
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }}>Admin Users</Divider>

            <Autocomplete
              multiple
              options={adminUsers}
              getOptionLabel={(option) => option.email}
              value={adminUsers.filter((u) =>
                selectedAdminUsers.includes(u.id)
              )}
              onChange={(_, newValue) => {
                setSelectedAdminUsers(newValue.map((u) => u.id));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Select Admin Users" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.email}
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateTenant}
            disabled={!formData.name}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>


    </Box>
  );
}
