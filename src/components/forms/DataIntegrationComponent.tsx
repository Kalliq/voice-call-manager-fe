import { useState, useEffect } from "react";
import { Box, Tabs, Tab, Chip, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { Contact } from "voice-javascript-common";

import useAppStore from "../../store/useAppStore";
import { SimpleButton } from "../UI/SimpleButton";
import api from "../../utils/axiosInstance";

type ContactField = keyof Contact;
type AppField = { id: string; name: string };
type ContactFieldOption = { id: ContactField; name: string };
type FieldOptionsMap = {
  contacts: ContactFieldOption[];
  leads: AppField[];
  accounts: AppField[];
  opportunities: AppField[];
};
type TabType = "contacts" | "leads" | "accounts" | "opportunities";
type SaveState = "idle" | "loading" | "success";

const fieldOptions: FieldOptionsMap = {
  contacts: [
    { id: "first_name", name: "First Name" },
    { id: "last_name", name: "Last Name" },
    { id: "company", name: "Company" },
    { id: "email", name: "Email" },
    { id: "phone", name: "Phone" },
    { id: "linkedIn", name: "LinkedIn" },
    { id: "city", name: "City" },
    { id: "timezone", name: "Timezone" },
    { id: "state", name: "State" },
    { id: "title", name: "Title" },
  ],
  leads: [
    { id: "first_name", name: "First Name" },
    { id: "last_name", name: "Last Name" },
    { id: "company", name: "Company" },
    { id: "email", name: "Email" },
    { id: "personal_phone", name: "Personal Phone" },
    { id: "corporate_phone", name: "Corporate Phone" },
  ],
  accounts: [
    { id: "account_name", name: "Account Name" },
    { id: "industry", name: "Industry" },
    { id: "website", name: "Website" },
    { id: "revenue", name: "Revenue" },
  ],
  opportunities: [
    { id: "opportunity_name", name: "Opportunity Name" },
    { id: "stage", name: "Stage" },
    { id: "amount", name: "Amount" },
    { id: "close_date", name: "Close Date" },
  ],
};

export default function FieldMapper() {
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);

  const { integrationSettings } = settings!["Phone Settings"];

  const [activeTab, setActiveTab] = useState<TabType>("contacts");
  const [mappedFields, setMappedFields] = useState<FieldOptionsMap>(
    integrationSettings ?? {
      contacts: [],
      leads: [],
      accounts: [],
      opportunities: [],
    }
  );

  const [saveState, setSaveState] = useState<SaveState>("idle");

  // optional safety: clear success after 3s with cleanup on unmount
  useEffect(() => {
    if (saveState !== "success") return;
    const t = window.setTimeout(() => setSaveState("idle"), 3000);
    return () => clearTimeout(t);
  }, [saveState]);

  const handleAddField = <K extends TabType>(
    field: FieldOptionsMap[K][number],
    tab: K
  ) => {
    setMappedFields((prev) => ({
      ...prev,
      [tab]: [...prev[tab], field] as FieldOptionsMap[K],
    }));
  };

  const handleRemoveField = <K extends TabType>(
    field: FieldOptionsMap[K][number],
    tab: K
  ) => {
    setMappedFields((prev) => ({
      ...prev,
      [tab]: (prev[tab] as FieldOptionsMap[K]).filter(
        (f) => (f as { id: string }).id !== (field as { id: string }).id
      ),
    }));
  };

  const onSubmit = async () => {
    if (saveState === "loading") return; // guard double-clicks
    try {
      if (!settings) throw new Error("Missing settings!");
      setSaveState("loading");

      const existingPhoneSettings = { ...settings["Phone Settings"] };
      const { data } = await api.patch(`/settings`, {
        "Phone Settings": {
          ...existingPhoneSettings,
          integrationSettings: mappedFields,
        },
      });

      setSettings(data);
      setSaveState("success"); // shows green for ~3s, then fades back
    } catch (err) {
      console.error(err);
      setSaveState("idle"); // you could add an 'error' visual if you like
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" color="info">
        INTEGRATION SETTINGS
      </Typography>

      <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
        <Tab label="Contacts" value="contacts" />
        <Tab label="Leads" value="leads" />
        <Tab label="Accounts" value="accounts" />
        <Tab label="Opportunities" value="opportunities" />
      </Tabs>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4, mt: 3 }}>
        {/* Mapped Fields */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">Mapped Fields</Typography>
          <Box
            display="flex"
            p={2}
            border="1px solid #eee"
            borderRadius={2}
            mt={1}
            gap={1}
          >
            {mappedFields[activeTab].map((field) => (
              <Chip
                key={field.id}
                label={field.name}
                onDelete={() => handleRemoveField(field, activeTab)}
                deleteIcon={<CloseIcon />}
                color="info"
              />
            ))}
          </Box>
        </Box>

        {/* Application Fields */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">Application Fields</Typography>
          <Box
            display="flex"
            p={2}
            border="1px solid #eee"
            borderRadius={2}
            mt={1}
            gap={1}
          >
            {fieldOptions[activeTab].map((field) => {
              const already = mappedFields[activeTab].some(
                (f) => f.id === field.id
              );
              return (
                <Chip
                  key={field.id}
                  label={field.name}
                  disabled={already}
                  icon={
                    !already ? (
                      <IconButton
                        size="small"
                        onClick={() => handleAddField(field as any, activeTab)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    ) : undefined
                  }
                />
              );
            })}
          </Box>
        </Box>
      </Box>

      <SimpleButton
        label="save"
        onClick={onSubmit}
        loading={saveState === "loading"}
        success={saveState === "success"}
        disabled={saveState === "loading"}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
