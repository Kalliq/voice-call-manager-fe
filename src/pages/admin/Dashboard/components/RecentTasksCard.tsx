import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { Task } from "voice-javascript-common";
import {
  cardStyle,
  TABLE_COLUMNS,
  getPriorityChipSx,
  getStatusChipSx,
} from "../dashboard.constants";

interface RecentTasksCardProps {
  tasks: Task[];
  onViewAll: () => void;
}

function formatDueDate(iso: string | Date): string {
  const due = new Date(iso);
  const now = new Date();
  const isToday = due.toDateString() === now.toDateString();
  if (isToday) return "Due Today";
  return `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function TaskRow({ task }: { task: Task }) {
  const theme = useTheme();
  const d = theme.palette.dashboard;
  const prioritySx = getPriorityChipSx(task.priority, theme.palette);
  const statusSx = getStatusChipSx(task.status, d);

  return (
    <Box
      key={task.id}
      display="flex"
      alignItems="center"
      px={1}
      py={1.5}
      sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
    >
      <Box sx={{ flex: 2 }}>
        <Typography variant="body2" fontWeight={500}>
          {task.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDueDate(task.dueDate)}
        </Typography>
      </Box>

      <Box sx={{ width: 100, textAlign: "center" }}>
        <Chip
          label={(task.priority ?? "Medium").toUpperCase()}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: 11,
            height: 24,
            ...prioritySx,
            "& .MuiChip-label": { px: 1 },
          }}
        />
      </Box>

      <Box sx={{ width: 120, textAlign: "center" }}>
        <Chip
          label={task.status}
          size="small"
          sx={{
            padding: "0 4px",
            fontWeight: 500,
            fontSize: 11,
            height: 24,
            ...statusSx,
            "& .MuiChip-label": { px: 1 },
          }}
          icon={
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: 3,
                ml: 1,
                backgroundColor: statusSx.color,
              }}
            />
          }
        />
      </Box>

      <Box sx={{ width: 40, textAlign: "center" }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ cursor: "pointer" }}
        >
          ···
        </Typography>
      </Box>
    </Box>
  );
}

export default function RecentTasksCard({
  tasks,
  onViewAll,
}: RecentTasksCardProps) {
  const theme = useTheme();
  const activeCount = tasks.filter((t) => t.status !== "Completed").length;

  return (
    <Card elevation={0} sx={{ ...cardStyle, width: "100%" }}>
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={0.5}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Recent Tasks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You have {activeCount} active tasks today
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              cursor: "pointer",
              whiteSpace: "nowrap",
              color: theme.palette.secondary.main,
            }}
            onClick={onViewAll}
          >
            View all tasks →
          </Typography>
        </Stack>

        {/* Table header */}
        <Box
          display="flex"
          alignItems="center"
          px={1}
          py={1.5}
          mt={2}
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          {TABLE_COLUMNS.map((col) => (
            <Typography
              key={col.label}
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              sx={{ ...col.sx, letterSpacing: 0.5 }}
            >
              {col.label}
            </Typography>
          ))}
        </Box>

        {/* Task rows */}
        <Stack
          sx={{ overflowY: "auto", maxHeight: 280 }}
          className="hide-scrollbar"
        >
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
