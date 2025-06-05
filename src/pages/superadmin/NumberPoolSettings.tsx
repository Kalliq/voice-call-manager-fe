import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  MenuItem,
  Select,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
} from "@mui/material";

import api from "../../utils/axiosInstance";

type User = {
  id: string;
  email: string;
  role: string;
};

export default function NumberPoolSettings() {
  const [numbers, setNumbers] = useState([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [assignUser, setAssignUser] = useState("");
  const [loading, setLoading] = useState(false);

  const usageCounts = numbers.map((num: any) => num.usageCount || 0);
  const maxUsage = Math.max(...usageCounts, 1);
  const minUsage = Math.min(...usageCounts, 0);

  const getUsageColor = (count: number) => {
    if (count >= maxUsage * 0.75) return "#d32f2f";
    if (count >= maxUsage * 0.25) return "#fbc02d";
    return "#388e3c";
  };

  useEffect(() => {
    const fetchData = async () => {
      const resNums = await api.get("/numbers");
      setNumbers(resNums.data);

      const resUsers = await api.get("/users?role=admin"); // adjust path if needed
      setUsers(resUsers.data);
    };
    fetchData();
  }, []);

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

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        Number Pool Management
      </Typography>
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
          color="primary"
          disabled={!assignUser || selected.length === 0 || loading}
          onClick={handleAssign}
        >
          Assign
        </Button>
        <Button
          variant="outlined"
          color="error"
          disabled={selected.length === 0 || loading}
          onClick={handleUnassign}
        >
          Unassign
        </Button>
      </Box>

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
          </TableRow>
        </TableHead>
        <TableBody>
          {numbers.map((num: any) => (
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
