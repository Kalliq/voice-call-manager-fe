import {
  Box,
  TableCell,
  TableHead,
  Table,
  TableContainer,
  Typography,
  useTheme,
  TableRow,
  Paper,
  TableBody,
  TableFooter,
  TablePagination,
  TextField,
  Button,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/axiosInstance";
import { useEffect, useState, useCallback } from "react";
import AccountDialog from "../../superadmin/modals/AccountDialog";
import { DeleteDialog } from "../../../components/DeleteDialog";
import useAppStore from "../../../store/useAppStore";
import { Account, AccountFormData } from "../../../types/account";

const AccountsPage = () => {
  const theme = useTheme();
  const { enqueue } = useSnackbar();
  const navigate = useNavigate();
  const { user } = useAppStore();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [openAccountDialog, setOpenAccountDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountFormData | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/accounts/all", {
        params: {
          search,
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      setAccounts(res.data.accounts);
      setTotal(res.data.total);
    } catch (error) {
      enqueue("Failed to load accounts", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, enqueue]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    try {
      await api.delete(`/accounts/${accountToDelete.id}`);
      enqueue("Account deleted", { variant: "success" });
      setAccountToDelete(null);
      await loadAccounts();
    } catch (err) {
      enqueue("Failed to delete account", { variant: "error" });
    }
  };

  const handleSaveAccount = async (accountData: AccountFormData) => {
    try {
      const payload = { ...accountData, tenantId: user?.tenantId };
      if (selectedAccount?.id) {
        await api.patch(
          `/accounts/tenant/update/${selectedAccount.id}`,
          payload,
        );
      } else {
        await api.post("/accounts/tenant/create", payload);
      }
      await loadAccounts();
      setSelectedAccount(null);
    } catch (err) {
      console.error("Failed to save account", err);
      throw err;
    }
  };

  return (
    <Box p={3}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography variant="h5" fontWeight="bold">
          Accounts
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedAccount(null);
            setOpenAccountDialog(true);
          }}
        >
          Create Account
        </Button>
      </Stack>
      <TextField
        label="Search"
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSearch(e.target.value)
        }
        fullWidth
        margin="normal"
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Website</TableCell>
              <TableCell>Industry</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Zip Code</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Location</TableCell>
              <TableCell sx={{ width: 150 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow
                  key={account.id}
                  onClick={() => navigate(`/accounts/${account.id}`)}
                  hover
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>{account.companyName}</TableCell>
                  <TableCell>{account.website}</TableCell>
                  <TableCell>{account.industry}</TableCell>
                  <TableCell>{account.phone}</TableCell>
                  <TableCell>{account.address}</TableCell>
                  <TableCell>{account.zipCode}</TableCell>
                  <TableCell>{account.country}</TableCell>
                  <TableCell>{account.location}</TableCell>
                  <TableCell
                    sx={{ width: 150 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title="View">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/accounts/${account.id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Contacts">
                      <IconButton
                        color="primary"
                        onClick={() =>
                          navigate(`/accounts/contacts/${account.id}`)
                        }
                      >
                        <PeopleIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        onClick={() => setAccountToDelete(account)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                count={total}
                page={page}
                rowsPerPage={rowsPerPage}
                component="td"
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(+e.target.value);
                  setPage(0);
                }}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      <AccountDialog
        open={openAccountDialog}
        onClose={() => {
          setOpenAccountDialog(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
        users={[]}
        onSave={handleSaveAccount}
      />

      <DeleteDialog
        open={!!accountToDelete}
        title="Delete Account"
        text={`Are you sure you want to delete "${accountToDelete?.companyName}"?`}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleDeleteAccount}
      />
    </Box>
  );
};

export default AccountsPage;
