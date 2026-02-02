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
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import api from "../../utils/axiosInstance";
import AccountDialog from "./modals/AccountDialog";

interface Account {
  id: string;
  userId?: string;
  companyName: string;
  location?: string;
  zipCode?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  website: string;
  industry?: string;
  tenantId?: string;
}

const AccountDetails = () => {
  const { tenantId, accountId } = useParams<{
    tenantId: string;
    accountId: string;
  }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (accountId) {
      loadAccount();
      loadDeals();
      loadContacts();
      loadUsers();
    }
  }, [accountId]);

  const loadAccount = async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const res = await api.get(`/accounts/tenant/single/${accountId}`);
      setAccount(res.data);
    } catch (error) {
      console.error("Failed to load account", error);
      navigate(`/superdashboard/tenants/${tenantId}`);
    } finally {
      setLoading(false);
    }
  };

  const loadDeals = async () => {
    if (!accountId) return;
    try {
      setLoadingDeals(true);
      const res = await api.get(`/deals/account/${accountId}`);
      setDeals(res.data.deals || res.data.data || res.data || []);
    } catch (error) {
      console.error("Failed to load deals", error);
      setDeals([]);
    } finally {
      setLoadingDeals(false);
    }
  };

  const loadContacts = async () => {
    if (!accountId) return;
    try {
      setLoadingContacts(true);
      const res = await api.get("/contacts", {
        params: { accountId },
      });
      setContacts(res.data.data || res.data.contacts || res.data || []);
    } catch (error) {
      console.error("Failed to load contacts", error);
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadUsers = async () => {
    try {
      const [usersRes, adminsRes] = await Promise.all([
        api.get("/users?role=user"),
        api.get("/users?role=admin"),
      ]);
      setUsers([...(usersRes.data || []), ...(adminsRes.data || [])]);
    } catch (error) {
      console.error("Failed to load users", error);
    }
  };

  const handleSaveAccount = async (accountData: any) => {
    if (!accountId) return;
    try {
      await api.patch(`/accounts/tenant/update/${accountId}`, accountData);
      await loadAccount();
      setOpenEditDialog(false);
    } catch (err) {
      console.error("Failed to save account", err);
      throw err;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!account) {
    return (
      <Box p={3}>
        <Typography variant="h6">Account not found</Typography>
        <Button
          onClick={() => navigate(`/superdashboard/tenants/${tenantId}`)}
          startIcon={<ArrowBackIcon />}
        >
          Back to Tenant
        </Button>
      </Box>
    );
  }

  const displayFields = [
    { label: "Company Name", value: account.companyName },
    { label: "Website", value: account.website },
    { label: "Industry", value: account.industry },
    { label: "Phone", value: account.phone },
    { label: "Address", value: account.address },
    { label: "City", value: account.city },
    { label: "State", value: account.state },
    { label: "Zip Code", value: account.zipCode },
    { label: "Country", value: account.country },
    { label: "Location", value: account.location },
  ].filter((field) => field.value);

  return (
    <Box p={3}>
      <Box mb={3} display="flex" alignItems="center" gap={2} justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/superdashboard/tenants/${tenantId}`)}
            variant="outlined"
          >
            Back to Tenant
          </Button>
          <Typography variant="h5" fontWeight="bold">
            {account.companyName}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<EditIcon />}
          onClick={() => setOpenEditDialog(true)}
        >
          Edit Account
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Account Details Section */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" mb={3} fontWeight="bold">
              Account Details
            </Typography>
            {displayFields.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                No details available for this account.
              </Typography>
            ) : (
              <Stack spacing={2.5}>
                {displayFields.map((field, index) => (
                  <Box key={index}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 0.5, fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}
                    >
                      {field.label}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontSize: "0.95rem",
                        color: "text.primary",
                        wordBreak: "break-word"
                      }}
                    >
                      {field.value}
                    </Typography>
                    {index < displayFields.length - 1 && (
                      <Divider sx={{ mt: 2 }} />
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Deals Section */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" mb={2}>
              Deals
            </Typography>
            {loadingDeals ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : deals.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                No deals found for this account.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Stage</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deals.map((deal: any) => (
                      <TableRow key={deal.id}>
                        <TableCell>{deal.name || deal.title || "-"}</TableCell>
                        <TableCell>
                          {deal.amount
                            ? new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                              }).format(deal.amount)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {deal.stage ? (
                            <Chip label={deal.stage} size="small" />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {deal.status ? (
                            <Chip
                              label={deal.status}
                              size="small"
                              color={
                                deal.status === "won"
                                  ? "success"
                                  : deal.status === "lost"
                                  ? "error"
                                  : "default"
                              }
                            />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Contacts Section */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" mb={2}>
              Contacts
            </Typography>
            {loadingContacts ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : contacts.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                No contacts found for this account.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Title</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contacts.map((contact: any) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          {contact.first_name || contact.firstName
                            ? `${contact.first_name || contact.firstName} ${
                                contact.last_name || contact.lastName || ""
                              }`.trim()
                            : contact.name || "-"}
                        </TableCell>
                        <TableCell>{contact.email || "-"}</TableCell>
                        <TableCell>{contact.phone || "-"}</TableCell>
                        <TableCell>{contact.title || contact.job_title || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      <AccountDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        account={account}
        users={users}
        onSave={handleSaveAccount}
      />
    </Box>
  );
};

export default AccountDetails;
