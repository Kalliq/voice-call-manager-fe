import { Stack, Box, Typography } from "@mui/material";

const FieldItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) => (
  <Stack direction="row" spacing={1} alignItems="center">
    {icon}
    <Box>
      <Typography fontSize={13} fontWeight={500} color="text.secondary">
        {label}
      </Typography>
      <Typography fontSize={13}>{value || "—"}</Typography>
    </Box>
  </Stack>
);

export { FieldItem };
