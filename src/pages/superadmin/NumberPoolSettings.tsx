import { useEffect, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  MenuItem,
  Select,
  Switch,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  FormControlLabel,
  InputLabel,
  FormControl,
} from "@mui/material";

import api from "../../utils/axiosInstance";

type NumberRecord = {
  number: string;
  friendlyName?: string;
  assigned: boolean;
  released: boolean;
  cooldown: boolean;
  spammed: boolean;
  usageCount: number;
  validationStatus?: "valid" | "invalid" | "unknown";
  remediationStatus?: string;
  user?: string; // assuming this exists on your payload for assigned user id
};

type User = {
  id: string;
  email: string;
  role: string;
};

type View = "pool" | "problematic" | "spammed";
type AssignmentFilter = "all" | "assigned" | "unassigned";

const NumberPoolSettings = () => {
  const [view, setView] = useState<View>("pool");
  const [numbers, setNumbers] = useState<NumberRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [assignUser, setAssignUser] = useState("");
  const [loading, setLoading] = useState(false);

  // NEW: Filters
  const [assignmentFilter, setAssignmentFilter] =
    useState<AssignmentFilter>("all");
  const [assignedUserFilter, setAssignedUserFilter] = useState<string>("");

  const usageCounts = numbers.map((num) => num.usageCount || 0);
  const maxUsage = Math.max(...usageCounts, 1);
  const minUsage = Math.min(...usageCounts, 0);

  const getUsageColor = (count: number) => {
    if (count >= maxUsage * 0.75) return "#d32f2f";
    if (count >= maxUsage * 0.25) return "#fbc02d";
    return "#388e3c";
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const resUsers = await api.get("/users");
      setUsers(resUsers.data);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    // Fetch per view:
    // - pool => /numbers
    // - problematic => /cleaning/problematic
    // - spammed => /numbers (then filter locally)
    let url = "/numbers";
    if (view === "problematic") url = "/cleaning/problematic";
    if (view === "spammed") url = "/numbers";

    api.get(url).then((r) => {
      setNumbers(r.data);
      setSelected([]);
    });
  }, [view]);

  const handleSelect = (number: string) => {
    setSelected((prev) =>
      prev.includes(number)
        ? prev.filter((n) => n !== number)
        : [...prev, number]
    );
  };

  const handleAssign = async () => {
    setLoading(true);
    await api.post("/numbers/assign", {
      userId: assignUser,
      numbers: selected,
    });
    // Re-fetch numbers to update UI
    const resNums = await api.get("/numbers");
    setNumbers(resNums.data);
    setSelected([]);
    setAssignUser("");
    setLoading(false);
  };

  const handleUnassign = async () => {
    setLoading(true);
    await api.post("/numbers/unassign", {
      numbers: selected,
    });
    const resNums = await api.get("/numbers");
    setNumbers(resNums.data);
    setSelected([]);
    setLoading(false);
  };

  const handleValidate = async () => {
    setLoading(true);
    await api.post("/cleaning/validate", { numbers: selected });
    const r = await api.get("/cleaning/problematic");
    setNumbers(r.data);
    setLoading(false);
  };

  const handleRemediate = async () => {
    setLoading(true);
    await api.post("/cleaning/remediate", { numbers: selected });
    // fixed path
    const r = await api.get("/cleaning/problematic");
    setNumbers(r.data);
    setLoading(false);
  };

  // Build filtered list
  let filteredNumbers: NumberRecord[] = numbers;

  // View-based filter (Spammed tab shows only spammed)
  if (view === "spammed") {
    filteredNumbers = filteredNumbers.filter((n) => n.spammed);
  }

  // Assignment filter
  if (assignmentFilter === "assigned") {
    filteredNumbers = filteredNumbers.filter((n) => n.assigned);
  } else if (assignmentFilter === "unassigned") {
    filteredNumbers = filteredNumbers.filter((n) => !n.assigned);
  }

  // Assigned user filter
  if (assignedUserFilter) {
    filteredNumbers = filteredNumbers.filter(
      (n) => n.assigned && n.user === assignedUserFilter
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        Number Pool Management
      </Typography>

      {/* Tabs */}
      <ButtonGroup sx={{ mb: 2 }}>
        <Button
          variant={view === "pool" ? "contained" : "outlined"}
          onClick={() => setView("pool")}
        >
          Pool
        </Button>
        <Button
          variant={view === "spammed" ? "contained" : "outlined"}
          onClick={() => setView("spammed")}
        >
          Spammed
        </Button>
      </ButtonGroup>

      {/* Sync button */}
      <Button
        variant="contained"
        color="primary"
        sx={{ marginLeft: "20px" }}
        onClick={async () => {
          setLoading(true);
          try {
            await api.post("/numbers/sync-twilio-numbers");
            const refreshed = await api.get("/numbers");
            setNumbers(refreshed.data);
          } catch (err) {
            console.error("Failed to sync numbers", err);
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
      >
        Sync Numbers
      </Button>

      {/* Pool & Spammed controls */}
      {(view === "pool" || view === "spammed") && (
        <Box
          mb={2}
          mt={2}
          display="flex"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
        >
          {/* Assign to user */}
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="assign-user-label" shrink>
              Assign to user…
            </InputLabel>
            <Select
              labelId="assign-user-label"
              label="Assign to user…"
              value={assignUser}
              onChange={(e) => setAssignUser(e.target.value as string)}
              displayEmpty
              renderValue={(selected) => {
                if (selected === "") {
                  return (
                    <span style={{ color: "#9e9e9e" }}>Assign to user…</span>
                  );
                }
                const u = users.find((u) => u.id === selected);
                return u ? u.email : (selected as string);
              }}
            >
              {/* Disabled placeholder so it doesn’t show as “None” */}
              <MenuItem disabled value="">
                <em>Assign to user…</em>
              </MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            disabled={!assignUser || !selected.length || loading}
            onClick={handleAssign}
          >
            Assign
          </Button>
          <Button
            variant="outlined"
            color="error"
            disabled={!selected.length || loading}
            onClick={handleUnassign}
          >
            Unassign
          </Button>

          {/* NEW: Assignment filter */}
          <FormControl size="small" sx={{ minWidth: 180, ml: 2 }}>
            <InputLabel id="assignment-filter-label">
              Assignment filter
            </InputLabel>
            <Select
              labelId="assignment-filter-label"
              label="Assignment filter"
              value={assignmentFilter}
              onChange={(e) =>
                setAssignmentFilter(e.target.value as AssignmentFilter)
              }
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="assigned">Assigned</MenuItem>
              <MenuItem value="unassigned">Unassigned</MenuItem>
            </Select>
          </FormControl>

          {/* NEW: Assigned user filter */}
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="assigned-user-filter-label" shrink>
              Filter by assigned user
            </InputLabel>
            <Select
              labelId="assigned-user-filter-label"
              label="Filter by assigned user"
              value={assignedUserFilter}
              onChange={(e) => setAssignedUserFilter(e.target.value as string)}
              displayEmpty
              renderValue={(selected) => {
                if (selected === "") {
                  return <span style={{ color: "#9e9e9e" }}>Any user</span>;
                }
                const u = users.find((u) => u.id === selected);
                return u ? u.email : (selected as string);
              }}
            >
              {/* Keep this so you can clear the filter */}
              <MenuItem value="">
                <em>Any user</em>
              </MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Problematic-only controls */}
      {view === "problematic" && (
        <Box mb={2} display="flex" gap={2}>
          <Button
            variant="outlined"
            disabled={!selected.length || loading}
            onClick={handleValidate}
          >
            Validate Selected
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={!selected.length || loading}
            onClick={handleRemediate}
          >
            Remediate Selected
          </Button>
        </Box>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Number</TableCell>
            <TableCell>Friendly Name</TableCell>
            <TableCell>Assigned User</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Usage</TableCell>
            <TableCell align="center">Cool Down</TableCell>
            <TableCell>Spammed</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredNumbers.map((num) => (
            <TableRow
              key={num.number}
              sx={
                num.cooldown
                  ? { opacity: 0.7, backgroundColor: "#e3f2fd" }
                  : undefined
              }
            >
              <TableCell>
                <Checkbox
                  checked={selected.includes(num.number)}
                  onChange={() => handleSelect(num.number)}
                  disabled={!!num.released}
                />
              </TableCell>
              <TableCell>{num.number}</TableCell>
              <TableCell>{num.friendlyName || "-"}</TableCell>
              <TableCell>
                {num.assigned && num.user
                  ? users.find((u) => u.id === num.user)?.email || num.user
                  : "-"}
              </TableCell>
              <TableCell>
                {num.released
                  ? "Released"
                  : num.assigned
                  ? "Assigned"
                  : "Unassigned"}
              </TableCell>
              <TableCell align="center">
                <Box
                  sx={{
                    width: 60,
                    height: 18,
                    borderRadius: 2,
                    bgcolor: getUsageColor(num.usageCount || 0),
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: 13,
                  }}
                >
                  {num.usageCount || 0}
                </Box>
              </TableCell>
              <TableCell align="center">
                {num.cooldown ? (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={async () => {
                      await api.post("/numbers/uncooldown", {
                        number: num.number,
                      });
                      const resNums = await api.get("/numbers");
                      setNumbers(resNums.data);
                    }}
                  >
                    Return to Pool
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={async () => {
                      await api.post("/numbers/cooldown", {
                        number: num.number,
                      });
                      const resNums = await api.get("/numbers");
                      setNumbers(resNums.data);
                    }}
                  >
                    Cool Down
                  </Button>
                )}
              </TableCell>
              <TableCell align="center">
                {num.spammed ? (
                  <Typography color="error" fontWeight="bold">
                    Yes
                  </Typography>
                ) : (
                  "-"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default NumberPoolSettings;
