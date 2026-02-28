import { Box, Stack, Typography } from "@mui/material";
import { CheckBoxOutlined as TaskIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { Task } from "voice-javascript-common";
import KpiCard from "./KpiCard";

interface PendingTasksCardProps {
  groupedTasks: { "To Do": Task[]; "In Progress": Task[] };
  tasks: Task[];
}

export default function PendingTasksCard({
  groupedTasks,
  tasks,
}: PendingTasksCardProps) {
  const theme = useTheme();
  const d = theme.palette.dashboard;
  const pendingCount =
    groupedTasks["To Do"].length + groupedTasks["In Progress"].length;

  return (
    <KpiCard
      icon={
        <TaskIcon sx={{ color: theme.palette.primary.main, fontSize: 22 }} />
      }
      iconBg={d.pendingBg}
      title="Pending Tasks"
      value={pendingCount}
      subtitle="active"
    >
      <Stack direction="row" spacing={0.5} mt={2} alignItems="center">
        {tasks.slice(0, 3).map((_: any, i: number) => (
          <Box
            key={i}
            sx={{
              width: 24,
              height: 24,
              borderRadius: 1,
              backgroundColor: d.neutralBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="caption" fontWeight={600}>
              {i + 1}
            </Typography>
          </Box>
        ))}
        {tasks.length > 3 && (
          <Typography variant="caption" color="text.secondary">
            +{tasks.length - 3} more
          </Typography>
        )}
      </Stack>
    </KpiCard>
  );
}
