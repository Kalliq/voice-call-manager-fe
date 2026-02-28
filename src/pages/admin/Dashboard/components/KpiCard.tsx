import type { ReactNode } from "react";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { cardStyle, iconBoxSx } from "../dashboard.constants";

interface KpiCardProps {
  icon: ReactNode;
  iconBg: string;
  iconColor?: string;
  chip?: { label: string; bg: string; color: string };
  title: string;
  value: ReactNode;
  subtitle?: string;
  children?: ReactNode;
}

export default function KpiCard({
  icon,
  iconBg,
  chip,
  title,
  value,
  subtitle,
  children,
}: KpiCardProps) {
  return (
    <Card elevation={0} sx={{ ...cardStyle, width: "100%" }}>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box sx={{ ...iconBoxSx, backgroundColor: iconBg }}>{icon}</Box>
          {chip && (
            <Chip
              label={chip.label}
              size="small"
              sx={{
                backgroundColor: chip.bg,
                color: chip.color,
                fontWeight: 600,
                fontSize: 11,
                height: 22,
                "& .MuiChip-label": { px: 1 },
              }}
            />
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={0.5}>
          {title}
        </Typography>
        <Stack direction="row" alignItems="baseline" spacing={0.5}>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}
