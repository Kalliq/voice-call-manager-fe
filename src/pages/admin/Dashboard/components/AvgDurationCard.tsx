import { Typography } from "@mui/material";
import { AccessTime as ClockIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import KpiCard from "./KpiCard";
import { TARGET_DURATION } from "../dashboard.constants";

interface AvgDurationCardProps {
  duration: number;
}

export default function AvgDurationCard({ duration }: AvgDurationCardProps) {
  const theme = useTheme();
  const d = theme.palette.dashboard;

  return (
    <KpiCard
      icon={<ClockIcon sx={{ color: d.durationMain, fontSize: 22 }} />}
      iconBg={d.durationBg}
      title="Avg Duration"
      value={duration}
      subtitle="min"
    >
      <Typography
        variant="caption"
        color="text.secondary"
        mt={2}
        display="block"
      >
        Target: {TARGET_DURATION}
      </Typography>
    </KpiCard>
  );
}
