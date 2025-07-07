import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
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
  Button,
} from "@mui/material";
import {
  Call as CallIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import _ from "lodash";
import { List } from "voice-javascript-common";

import api from "../../../utils/axiosInstance";
import { Contact } from "../../../types/contact";
import ContactDrawer from "./components/ContactDrawer";
import { DeleteDialog } from "../../../components/DeleteDialog";
import SelectField from "../../../components/UI/SelectField";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { MoveContactsDialog } from "../../../components/MoveContactsDialog";
import { useMoveContacts } from "../../../hooks/useMoveContacts";
import Loading from "../../../components/UI/Loading";
import CheckboxField from "../../../components/UI/CheckboxField";

const ContactsPage = () => {
  const theme = useTheme();
  const { enqueue } = useSnackbar();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [lists, setLists] = useState<List[]>([]);

  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [targetListId, setTargetListId] = useState("");

  const { moveContacts } = useMoveContacts({
    onMoved: (moved: number, skipped: number) => {
      enqueue(`moved: ${moved} skipped: ${skipped}`, { variant: "success" });

      setMoveDialogOpen(false);
      setSelectedContactIds([]);
      load();
    },
  });

  const onMoveConfirmHandler = async () => {
    await moveContacts(selectedListId, targetListId, selectedContactIds);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/contacts", {
        params: {
          search,
          page: page + 1,
          limit: rowsPerPage,
          listId: selectedListId || undefined,
        },
      });
      setContacts(res.data.data);
      setTotal(res.data.total);
    } catch {
      enqueue("Failed to load contacts", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, page, rowsPerPage, selectedListId, enqueue]);

  const loadLists = async () => {
    try {
      const res = await api.get("/lists");
      setLists(
        res.data.map((list: List) => ({ id: list.id, listName: list.listName }))
      );
    } catch {
      enqueue("Failed to load lists", { variant: "error" });
    }
  };

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
    navigate("/campaign", {
      state: { contactId: c.id, autoStart: false },
    });
  };

  useEffect(() => {
    load();
    setSelectedContactIds([]);
  }, [load]);

  useEffect(() => {
    loadLists();
  }, []);

  return (
    <Box p={3}>
      <Box mb={3} display="flex" justifyContent="space-between">
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Contacts
          </Typography>
          <Typography color="text.secondary">Manage your contacts</Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(null);
            setDrawerOpen(true);
          }}
        >
          Create New Contact
        </Button>
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
        <Box display="flex" gap={2}>
          {selectedContactIds.length > 0 && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setMoveDialogOpen(true)}
            >
              Move to List
            </Button>
          )}
          <SelectField
            items={lists}
            label="Filter by List"
            value={selectedListId}
            onChange={(val) => {
              setSelectedListId(val);
              setPage(0);
            }}
            getValue={(l) => l.id}
            getLabel={(l) => l.listName}
          />
        </Box>
      </Stack>

      {loading ? (
        <Loading />
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
                <TableCell padding="checkbox">
                  <CheckboxField
                    label=""
                    checked={
                      contacts.length > 0 &&
                      selectedContactIds.length === contacts.length
                    }
                    indeterminate={
                      selectedContactIds.length > 0 &&
                      selectedContactIds.length < contacts.length
                    }
                    onChange={(checked) => {
                      if (checked) {
                        setSelectedContactIds(contacts.map((c) => c.id));
                      } else {
                        setSelectedContactIds([]);
                      }
                    }}
                  />
                </TableCell>
                {["Name", "Company", "Email", "Number", "Actions"].map(
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
                <TableRow key={c.id} hover sx={{ cursor: "pointer" }}>
                  <TableCell padding="checkbox">
                    <CheckboxField
                      label=""
                      checked={selectedContactIds.includes(c.id)}
                      onChange={(checked) => {
                        if (checked) {
                          setSelectedContactIds((prev) => [...prev, c.id]);
                        } else {
                          setSelectedContactIds((prev) =>
                            prev.filter((id) => id !== c.id)
                          );
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    {c.first_name} {c.last_name}
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>{c.company}</TableCell>
                  <TableCell sx={{ py: 1.5 }}>{c.email}</TableCell>
                  <TableCell sx={{ py: 1.5 }}>{c.phone}</TableCell>
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
                  rowsPerPageOptions={[5, 10, 25, 50]}
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
        lists={lists}
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
      <MoveContactsDialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        onConfirm={onMoveConfirmHandler}
        lists={lists}
        selectedListId={selectedListId}
        setTargetListId={setTargetListId}
      />
    </Box>
  );
};

export default ContactsPage;
