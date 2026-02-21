import React from "react";
import { Grid, Typography, Avatar, Paper } from "@mui/material";
import { Person } from "@mui/icons-material";

interface MinimalCallPanelProps {
  phone: string;
}

/** Contact/phone info card for one-off calls. Call controls live in the persistent CallBar. */
const MinimalCallPanel: React.FC<MinimalCallPanelProps> = ({ phone }) => (
  <Paper
        variant="outlined"
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: 3,
          px: 4,
          py: 2,
          mt: 2,
          backgroundColor: "#fff",
          boxShadow: 0,
        }}
      >
        <Grid
          item
          display="flex"
          flexDirection="row"
          alignItems="center"
          gap={2}
        >
          <Avatar sx={{ width: 56, height: 56 }}>
            <Person sx={{ fontSize: 36 }} />
          </Avatar>
          <Typography variant="h5" fontWeight="bold">
            {phone || "no number"}
          </Typography>
        </Grid>
      </Paper>
);

export default MinimalCallPanel;
