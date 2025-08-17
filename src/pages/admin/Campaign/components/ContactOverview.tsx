import { useEffect, useState, useMemo } from "react";
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
} from "@mui/icons-material";
import { CallLog } from "voice-javascript-common";

import useAppStore from "../../../../store/useAppStore";
import { CallResult } from "../../../../types/call-results";
import api from "../../../../utils/axiosInstance";

import ActivityRow from "./molecules/ActivityRow";

import { Contact } from "../../../../types/contact";
import { FieldItem } from "../../../../components/atoms/FieldItem";

const ContactOverview = ({ contact }: { contact: Contact }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);

  const { settings } = useAppStore((s) => s);
  const callResults: CallResult[] =
    (settings?.["Phone Settings"]?.callResults as CallResult[]) ?? [];

  useEffect(() => {
    const fetchCallLogs = async () => {
      const callLogs = await api.get("/call-logs", {
        params: { contactId: contact.id },
      });

      setCallLogs(callLogs.data.recordings);
    };

    fetchCallLogs();
  }, []);

  const visibleCallLogs = useMemo(
    () => callLogs.filter((l) => !!l.action?.result?.trim()),
    [callLogs]
  );

  const handleResultChange = (sid: string, result: string) => {
    setCallLogs((prev) =>
      prev.map((cl) =>
        cl.sid === sid
          ? {
              ...cl,
              action: {
                ...(cl.action ?? { result: "", notes: "", timestamp: "" }),
                result,
              },
            }
          : cl
      )
    );
  };

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
                value={contact.phone || contact.phone || ""}
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
                value={contact.phone || contact.phone || ""}
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
          {visibleCallLogs.length > 0 ? (
            <Stack spacing={2}>
              {visibleCallLogs.map((callLog) => (
                <ActivityRow
                  key={callLog.sid}
                  entry={callLog}
                  callResults={callResults}
                  onResultChange={handleResultChange}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No activity history available yet.
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default ContactOverview;
