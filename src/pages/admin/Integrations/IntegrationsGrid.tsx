import { Box, Typography, Grid, Paper, Chip, Button, Stack } from "@mui/material";
import { WebhookIcon, HubSpotIcon } from "../../../components/integrations/integrationIcons";
import { useNavigate } from "react-router-dom";

const IntegrationsGrid = () => {
  const navigate = useNavigate();

  return (
    <Box p={3}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Integrations
        </Typography>
        <Typography color="text.secondary">
          Connect Kalliq with your existing tools and workflows.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Webhook integration (active, connected) */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: 3,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "common.white",
                  color: "primary.main",
                }}
              >
                <WebhookIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Webhook
                </Typography>
                <Chip
                  label="Connected"
                  color="success"
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Stack>

            <Typography variant="body2" color="text.secondary" mb={2}>
              Send outbound events from Kalliq to your own webhook endpoint for
              AI processing, enrichment, or automation.
            </Typography>

            <Box mt="auto" pt={2}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate("/integrations/webhook")}
              >
                Configure
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* HubSpot integration (coming soon) */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: 3,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "grey.100",
                  color: "text.secondary",
                }}
              >
                <HubSpotIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  HubSpot
                </Typography>
                <Chip
                  label="Coming soon"
                  color="default"
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Stack>

            <Typography variant="body2" color="text.secondary" mb={2}>
              Sync contacts, activities, and outcomes between Kalliq and
              HubSpot. Deeper CRM integration is on the way.
            </Typography>

            <Box mt="auto" pt={2}>
              <Button variant="outlined" fullWidth disabled>
                Coming soon
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default IntegrationsGrid;

