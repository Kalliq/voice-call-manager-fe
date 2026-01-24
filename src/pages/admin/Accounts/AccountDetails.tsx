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
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import api from "../../../utils/axiosInstance";
import { useSnackbar } from "../../../hooks/useSnackbar";
import Loading from "../../../components/UI/Loading";

interface Account {
  id: string;
  name?: string;
  account_name?: string;
  industry?: string;
  website?: string;
  revenue?: string;
  employees?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  [key: string]: any;
}

const AccountDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueue } = useSnackbar();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAccount();
    }
  }, [id]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/accounts/${id}`);
      setAccount(res.data);
    } catch (error) {
      enqueue("Failed to load account details", { variant: "error" });
      navigate("/accounts");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!account) {
    return (
      <Box p={3}>
        <Typography variant="h6">Account not found</Typography>
        <Button onClick={() => navigate("/accounts")} startIcon={<ArrowBackIcon />}>
          Back to Accounts
        </Button>
      </Box>
    );
  }

  const accountName = account.name || account.account_name || "N/A";
  const displayFields = [
    { label: "Account Name", value: account.companyName },
    { label: "Industry", value: account.industry },
    { label: "Website", value: account.website },
    { label: "Revenue", value: account.revenue },
    { label: "Employees", value: account.employees },
    { label: "Phone", value: account.phone },
    { label: "Email", value: account.email },
    { label: "Address", value: account.address },
    { label: "City", value: account.city },
    { label: "State", value: account.state },
    { label: "Zip Code", value: account.zip },
    { label: "Country", value: account.country },
  ].filter((field) => field.value);

  return (
    <Box p={3}>
      <Box mb={3} display="flex" alignItems="center" gap={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/accounts")}
          variant="outlined"
        >
          Back to Accounts
        </Button>
        <Typography variant="h5" fontWeight="bold">
          Account Details
        </Typography>
      </Box>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h4" gutterBottom>
              {account.companyName}
            </Typography>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {displayFields.map((field, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
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
                No additional details available for this account.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default AccountDetails;
