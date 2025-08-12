import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Select,
  MenuItem,
  Button,
  Tabs,
  Tab,
  InputLabel,
  FormControl,
} from "@mui/material";
import { useEffect, useState } from "react";
import { DatePicker } from "@mui/x-date-pickers";
import { format } from "date-fns";
import api from "../../../utils/axiosInstance";
import { useSnackbar } from "../../../hooks/useSnackbar";

const ReportsPage = () => {
  const { enqueue } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("list");
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const [listPerformance, setListPerformance] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);

  const [users, setUsers] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedListId, setSelectedListId] = useState("");

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [usersRes, adminsRes, listsRes] = await Promise.all([
          api.get("users?role=admin"),
          api.get("/users?role=user"),
          api.get("/lists/all"),
        ]);
        const allUsers = usersRes.data.concat(adminsRes.data);
        setUsers(allUsers);
        setLists(listsRes.data);
      } catch (err) {
        enqueue("Failed to load filters", { variant: "error" });
      }
    };
    loadFilters();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const start = format(startDate!, "yyyy-MM-dd");
      const end = format(endDate!, "yyyy-MM-dd");

      const userIds = selectedUserId ? [selectedUserId] : undefined;
      const listIds = selectedListId ? [selectedListId] : undefined;

      const [listRes, activityRes] = await Promise.all([
        api.get("/reports/list-performance", {
          params: { start, end, userIds, listIds },
        }),
        api.get("/reports/activity", {
          params: { start, end, userIds },
        }),
      ]);

      setListPerformance(listRes.data);
      setActivityData(activityRes.data);
    } catch (err) {
      enqueue("Failed to fetch reports", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <Box p={3}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Reports
        </Typography>
        <Typography color="text.secondary" mb={2}>
          Analyze your team's performance by list and user activity
        </Typography>
        <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(val) => setStartDate(val)}
            slotProps={{ textField: { size: "small" } }}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(val) => setEndDate(val)}
            slotProps={{ textField: { size: "small" } }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>User</InputLabel>
            <Select
              value={selectedUserId}
              label="User"
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>List</InputLabel>
            <Select
              value={selectedListId}
              label="List"
              onChange={(e) => setSelectedListId(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {lists.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.listName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button onClick={fetchReports} variant="contained">
            Run Report
          </Button>
        </Stack>

        <Tabs
          value={tab}
          onChange={(e, val) => setTab(val)}
          sx={{ mb: 2 }}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab value="list" label="List Performance" />
          <Tab value="activity" label="Activity Report" />
        </Tabs>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : tab === "list" ? (
        <>
          <Typography variant="h6" mb={1}>
            List Performance
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>List Name</TableCell>
                  <TableCell>Calls Out</TableCell>
                  <TableCell>Connects</TableCell>
                  <TableCell>Connect Rate</TableCell>
                  <TableCell>Avg Talk Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  listPerformance.map((row) => (
                    <TableRow key={row.listId}>
                      <TableCell>{row.listName}</TableCell>
                      <TableCell>{row.callsOut}</TableCell>
                      <TableCell>{row.connects}</TableCell>
                      <TableCell>{row.connectRate ?? "-"}%</TableCell>
                      <TableCell>{row.avgTalkTime}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <>
          <Typography variant="h6" mb={1}>
            Activity Report
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Total Dials</TableCell>
                  <TableCell>Outbound</TableCell>
                  <TableCell>Inbound</TableCell>
                  <TableCell>Connects</TableCell>
                  <TableCell>Connect Rate</TableCell>
                  <TableCell>Total Talk</TableCell>
                  <TableCell>Avg Talk</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activityData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  activityData.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.totalDials}</TableCell>
                      <TableCell>{user.outboundCalls}</TableCell>
                      <TableCell>{user.inboundCalls}</TableCell>
                      <TableCell>{user.connects}</TableCell>
                      <TableCell>{user.connectRate ?? "-"}%</TableCell>
                      <TableCell>{user.totalTalkTime}</TableCell>
                      <TableCell>{user.avgTalkTime}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default ReportsPage;
