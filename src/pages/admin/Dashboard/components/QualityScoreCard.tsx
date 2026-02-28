import { Chip, Stack, Typography } from "@mui/material";
import { StarOutlineOutlined as StarIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import KpiCard from "./KpiCard";

interface QualityScoreCardProps {
  satisfaction: number;
}

export default function QualityScoreCard({ satisfaction }: QualityScoreCardProps) {
  const theme = useTheme();
  const d = theme.palette.dashboard;

  return (
    <KpiCard
      icon={<StarIcon sx={{ color: d.qualityMain, fontSize: 22 }} />}
      iconBg={d.qualityBg}
      chip={
        satisfaction >= 4
          ? { label: "High", bg: d.completedBg, color: d.completedMain }
          : undefined
      }
      title="Quality Score"
      value={satisfaction}
      subtitle="/ 5.0"
    >
      <Stack direction="row" spacing={0.25} mt={2}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Typography
            key={star}
            sx={{
              color: star <= Math.round(satisfaction) ? d.qualityMain : d.starInactive,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ★
          </Typography>
        ))}
      </Stack>
    </KpiCard>
  );
}
