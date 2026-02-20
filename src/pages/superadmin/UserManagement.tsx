import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  Stack,
  Button,
  IconButton,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { UserRole } from "voice-javascript-common";

import api from "../../utils/axiosInstance";

export default function SuperUserManagement() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState(UserRole.ADMIN);
  const [newUserAdminId, setNewUserAdminId] = useState("");

  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedAdminEmail, setSelectedAdminEmail] = useState<string>("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users", {
        params: {
          role: roleFilter || undefined,
        },
      });
      let filteredUsers = res.data;
      if (selectedAdminEmail) {
        filteredUsers = filteredUsers.filter(
          (u: any) => u.adminEmail === selectedAdminEmail,
        );
      }
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, selectedAdminEmail]);

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${userId}`);
      await loadUsers();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post("/users", {
        email: newAdminEmail,
        password: newAdminPassword,
        role: newUserRole,
        adminId: newUserRole === UserRole.USER ? newUserAdminId : undefined,
      });
      setOpenCreateDialog(false);
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewUserRole(UserRole.ADMIN);
      setNewUserAdminId("");
      loadUsers();
    } catch (err) {
      console.error("Failed to create user", err);
    }
  };

  const filtered = users.filter((u: any) =>
    u.email.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const fetchAdmins = async () => {
      const res = await api.get("/users?role=admin");
      setAdmins(res.data);
    };
    fetchAdmins();
  }, []);

  return (
    <Box p={4}>
      <Typography variant="h5" mb={2}>
        User Management
      </Typography>

      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        <TextField
          label="Search by email"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240 }}
        />
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Assigned to</InputLabel>
          <Select
            value={selectedAdminEmail}
            label="Assigned to"
            onChange={(e) => setSelectedAdminEmail(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {admins.map((admin) => (
              <MenuItem key={admin.id} value={admin.email}>
                {admin.email}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            label="Role"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="superadmin">Superadmin</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenCreateDialog(true)}
        >
          + Create User
        </Button>
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Assigned Admin</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.adminEmail || "-"}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleDelete(user.id)}
                        disabled={user.role === "superadmin"}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Email"
              fullWidth
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newUserRole}
                label="Role"
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>
            {newUserRole === UserRole.USER && (
              <FormControl size="small" fullWidth>
                <InputLabel>Assign to Admin</InputLabel>
                <Select
                  value={newUserAdminId}
                  label="Assign to Admin"
                  onChange={(e) => setNewUserAdminId(e.target.value)}
                >
                  {admins.map((admin) => (
                    <MenuItem key={admin.id} value={admin.id}>
                      {admin.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        {/* <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateUser}>
            Create
          </Button>
        </DialogActions> */}
      </Dialog>
    </Box>
  );
}
