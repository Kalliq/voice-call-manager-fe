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
};

type User = {
  id: string;
  email: string;
  role: string;
};

const NumberPoolSettings = () => {
  const [view, setView] = useState<"pool" | "problematic" | "cleaned">("pool");
  const [numbers, setNumbers] = useState([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [assignUser, setAssignUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSpammedOnly, setShowSpammedOnly] = useState(false);

  const usageCounts = numbers.map((num: any) => num.usageCount || 0);
  const maxUsage = Math.max(...usageCounts, 1);
  const minUsage = Math.min(...usageCounts, 0);

  const getUsageColor = (count: number) => {
    if (count >= maxUsage * 0.75) return "#d32f2f";
    if (count >= maxUsage * 0.25) return "#fbc02d";
    return "#388e3c";
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const resUsers = await api.get("/users?role=admin");
      setUsers(resUsers.data);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    let url = "/numbers";
    if (view === "problematic") url = "/cleaning/problematic";
    if (view === "cleaned") url = "/cleaning/cleaned";
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
    const r = await api.get("/numbers/cleaning/problematic");

    setNumbers(r.data);
    setLoading(false);
  };

  const handleReactivate = async () => {
    setLoading(true);

    await api.post("/cleaning/reactivate", { numbers: selected });
    const r = await api.get("/cleaning/cleaned");

    setNumbers(r.data);
    setLoading(false);
  };

  const filteredNumbers = showSpammedOnly
    ? numbers.filter((n: any) => n.spammed)
    : numbers;

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        Number Pool Management
      </Typography>

      <ButtonGroup sx={{ mb: 2 }}>
        <Button
          variant={view === "pool" ? "contained" : "outlined"}
          onClick={() => setView("pool")}
        >
          Pool
        </Button>
        <Button
          variant={view === "problematic" ? "contained" : "outlined"}
          onClick={() => setView("problematic")}
        >
          Problematic
        </Button>
        <Button
          variant={view === "cleaned" ? "contained" : "outlined"}
          onClick={() => setView("cleaned")}
        >
          Cleaned
        </Button>
      </ButtonGroup>

      {view === "pool" && (
        <Box mb={2} display="flex" alignItems="center" gap={2}>
          <Select
            value={assignUser}
            onChange={(e) => setAssignUser(e.target.value)}
            displayEmpty
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Assign to user...</MenuItem>
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.email}
              </MenuItem>
            ))}
          </Select>
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
          <FormControlLabel
            control={
              <Switch
                checked={showSpammedOnly}
                onChange={(e) => setShowSpammedOnly(e.target.checked)}
                color="error"
              />
            }
            label="Show spammed only"
          />
        </Box>
      )}

      {/* Problematic‑only controls */}
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

      {/* Cleaned‑only controls */}
      {view === "cleaned" && (
        <Box mb={2}>
          <Button
            variant="contained"
            disabled={!selected.length || loading}
            onClick={handleReactivate}
          >
            Reactivate Selected
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
          {filteredNumbers.map((num: any) => (
            <TableRow
              key={num.id || num.number}
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
