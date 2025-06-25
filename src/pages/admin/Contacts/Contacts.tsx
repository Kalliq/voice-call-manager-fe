// src/pages/admin/Contacts/ContactsPage.tsx
import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  TablePagination,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Call as CallIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import _ from "lodash";

import api from "../../../utils/axiosInstance";
import { Contact } from "../../../types/contact";
import ContactDrawer from "../../../components/ContactDrawer";
import { DeleteDialog } from "../../../components/DeleteDialog";
import DialPad from "../../../components/DialPad";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { useTwilio } from "../../../contexts/TwilioContext";
import { startSingleCall } from "../../../utils/startSingleCall";

const ContactsPage = () => {
  const theme = useTheme();
  const { twilioDevice } = useTwilio();
  const { enqueue } = useSnackbar();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialOpen, setDialOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/contacts", {
        params: { search, page: page + 1, limit: rowsPerPage },
      });
      setContacts(res.data.data);
      setTotal(res.data.total);
    } catch {
      enqueue("Failed to load contacts", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, page, rowsPerPage, enqueue]);

  const onSearch = _.debounce((val: string) => {
    setPage(0);
    setSearch(val);
  }, 300);

  const onDelete = async (c: Contact) => {
    await api.delete(`/contacts/${c.id}`);
    enqueue("Deleted", { variant: "success" });
    setDeleting(null);
    load();
  };

  const onCall = (c: Contact) => {
    if (!twilioDevice) return enqueue("Not connected", { variant: "warning" });
    enqueue(`Dialling ${c.mobile_phone}…`);
    startSingleCall(twilioDevice, c.id);
  };

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box p={3}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Contacts
        </Typography>
        <Typography color="text.secondary">Manage your contacts</Typography>
      </Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <TextField
          size="small"
          placeholder="Search..."
          onChange={(e) => onSearch(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
          }}
          sx={{ width: 300 }}
          disabled={loading}
        />
      </Stack>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 6,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={1}
          sx={{
            width: "100%",
            "& .MuiTable-root": { minWidth: 650 },
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                {["Name", "Company", "Email", "Mobile", "Actions"].map(
                  (header) => (
                    <TableCell
                      key={header}
                      sx={{
                        fontWeight: 600,
                        textTransform: "uppercase",
                        py: 1.5,
                      }}
                    >
                      {header}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {contacts.map((c) => (
                <TableRow
                  key={c.id}
                  hover
                  onClick={() => {
                    setEditing(c);
                    setDrawerOpen(true);
                  }}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell sx={{ py: 1.5 }}>
                    {c.first_name} {c.last_name}
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>{c.company}</TableCell>
                  <TableCell sx={{ py: 1.5 }}>{c.email}</TableCell>
                  <TableCell sx={{ py: 1.5 }}>{c.mobile_phone}</TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(c);
                            setDrawerOpen(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Call">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCall(c);
                          }}
                        >
                          <CallIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleting(c);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
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
                  sx={{
                    "& .MuiTablePagination-toolbar": {
                      px: 2,
                      py: 1,
                    },
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}

      <ContactDrawer
        open={drawerOpen}
        contact={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          load();
        }}
      />

      <DeleteDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => onDelete(deleting!)}
        title="Delete Contact?"
        text={`Are you sure you want to delete ${deleting?.first_name} ${deleting?.last_name}?`}
      />

      <DialPad
        open={dialOpen}
        onClose={() => setDialOpen(false)}
        onCall={(num) => {
          if (!twilioDevice)
            return enqueue("Not connected", { variant: "warning" });
          enqueue(`Dialling ${num}…`);
          twilioDevice.connect({ params: { To: num, outbound: "true" } });
        }}
      />
    </Box>
  );
};

export default ContactsPage;
