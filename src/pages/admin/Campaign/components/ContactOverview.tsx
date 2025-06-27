import { useState } from "react";
import { Box, Grid, Paper, Typography, Stack, Tabs, Tab } from "@mui/material";
import {
  Business,
  Person,
  Phone,
  Email,
  LinkedIn,
  LocationOn,
  AccessTime,
  Title,
  InsertDriveFile,
  CheckCircleOutline,
} from "@mui/icons-material";
import { format } from "date-fns";

import { Contact } from "../../../../types/contact";

interface Action {
  result: string;
  timestamp: string;
}

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

const ActivityRow = ({ entry }: { entry: Action }) => {
  const formattedTime = format(new Date(parseInt(entry.timestamp)), "PPpp");

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      py={1}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <CheckCircleOutline color="primary" />
        <Typography fontWeight={500}>{entry.result}</Typography>
      </Stack>
      <Typography color="text.secondary" fontSize={13}>
        {formattedTime}
      </Typography>
    </Box>
  );
};

const CotactOverview = ({ contact }: { contact: Contact }) => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        p: 2,
        mt: 2,
        backgroundColor: "#fff",
        boxShadow: 0,
      }}
    >
      {/* Tabs Header */}
      <Tabs
        value={tabIndex}
        onChange={(_, val) => setTabIndex(val)}
        sx={{ mb: 3 }}
      >
        <Tab
          label="Prospect Fields"
          sx={{
            fontWeight: 600,
            color: tabIndex === 0 ? "#0f59ff" : "text.secondary",
          }}
        />
        <Tab
          label="Activity History"
          sx={{
            fontWeight: 600,
            color: tabIndex === 1 ? "#0f59ff" : "text.secondary",
          }}
        />
      </Tabs>

      {/* Tab Content */}
      {tabIndex === 0 ? (
        <Grid container spacing={3}>
          {/* Left */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <FieldItem
                icon={<Business color="primary" />}
                label="Account Name"
                value={contact.accountName || ""}
              />
              <FieldItem
                icon={<Title color="primary" />}
                label="Title"
                value={contact.title || contact.capacity || ""}
              />
              <FieldItem
                icon={<Email color="primary" />}
                label="Email"
                value={contact.email || ""}
              />
              <FieldItem
                icon={<Phone color="primary" />}
                label="Direct Phone"
                value={contact.mobile_phone || contact.phone || ""}
              />
              <FieldItem
                icon={<LocationOn color="primary" />}
                label="City"
                value={contact.city || ""}
              />
              <FieldItem
                icon={<InsertDriveFile color="primary" />}
                label="Record Type"
                value={contact.recordType || ""}
              />
            </Stack>
          </Grid>

          {/* Right */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <FieldItem
                icon={<Person color="primary" />}
                label="Contact Name"
                value={`${contact.first_name} ${contact.last_name}`}
              />
              <FieldItem
                icon={<Phone color="primary" />}
                label="Phone"
                value={contact.mobile_phone || contact.phone || ""}
              />
              <FieldItem
                icon={<LinkedIn color="primary" />}
                label="LinkedIn URL"
                value={contact.linkedIn || ""}
              />
              <FieldItem
                icon={<AccessTime color="primary" />}
                label="Timezone"
                value={contact.timezone || ""}
              />
              <FieldItem
                icon={<LocationOn color="primary" />}
                label="State"
                value={contact.state || ""}
              />
              <FieldItem
                icon={<InsertDriveFile color="primary" />}
                label={contact.subject || ""}
              />
            </Stack>
          </Grid>
        </Grid>
      ) : (
        <Box px={2}>
          <Typography variant="body2" color="text.secondary">
            {contact.actions?.length > 0 ? (
              <Stack spacing={2}>
                {contact.actions.map((action) => (
                  <ActivityRow key={action.timestamp} entry={action} />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No activity history available yet.
              </Typography>
            )}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CotactOverview;
