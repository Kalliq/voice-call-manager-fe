import { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Checkbox,
  IconButton,
  Typography,
  Stack,
} from "@mui/material";
import { Delete, Add } from "@mui/icons-material";

import { SimpleButton, CustomTextField } from "../UI";
import useAppStore from "../../store/useAppStore";
import { CallResult } from "../../types/call-results";

import api from "../../utils/axiosInstance";
import { UserRole } from "voice-javascript-common";

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substr(2, 9);

export default function CallResultsManager() {
  const user = useAppStore((state) => state.user);
  const settings = useAppStore((state) => state.settings);
  const setSettings = useAppStore((state) => state.setSettings);

  const isReadOnly = user?.role !== UserRole.ADMIN;

  const [callResults, setCallResults] = useState<CallResult[]>([]);
  const [newResult, setNewResult] = useState("");

  // Clone on mount/update
  useEffect(() => {
    if (settings?.["Phone Settings"]?.callResults) {
      const cloned = settings["Phone Settings"].callResults.map(
        (item: CallResult) => ({
          id: item.id || generateId(),
          label: item.label || "",
          checked: !!item.checked,
          considerPositive: !!item.considerPositive,
        })
      );
      setCallResults(cloned);
    }
  }, [settings]);

  const toggleCheckbox = (id: string) => {
    setCallResults((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const togglePositive = (id: string) => {
    setCallResults((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, considerPositive: !item.considerPositive }
          : item
      )
    );
  };

  const handleAdd = () => {
    if (!newResult.trim()) return;
    setCallResults((prev) => [
      ...prev,
      {
        id: generateId(),
        label: newResult,
        checked: false,
        considerPositive: false,
      },
    ]);
    setNewResult("");
  };

  const handleDelete = (id: string) => {
    setCallResults((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEdit = (id: string, label: string) => {
    setCallResults((prev) =>
      prev.map((item) => (item.id === id ? { ...item, label } : item))
    );
  };

  const onSubmit = async () => {
    try {
      if (!settings) {
        throw new Error("Missing settings!");
      }
      const existingPhoneSettings = { ...settings["Phone Settings"] };
      const { data } = await api.patch(`/settings`, {
        "Phone Settings": {
          ...existingPhoneSettings,
          callResults,
        },
      });
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" color="info" mb={4}>
        CALL RESULTS LIST
        {isReadOnly && (
          <Typography variant="body2" color="textSecondary" mb={2}>
            You do not have permission to edit call results.
          </Typography>
        )}
      </Typography>
      <Box
        display="flex"
        flexDirection="column"
        padding={2}
        border="1px solid #eee"
        borderRadius={2}
        mt={1}
        width="70%"
        gap={1}
      >
        {callResults.map((item) => (
          <Stack
            key={item.id}
            direction="row"
            spacing={1}
            alignItems="center"
            mb={1}
          >
            <Checkbox
              checked={item.checked}
              onChange={() => toggleCheckbox(item.id)}
              color="info"
              disabled={isReadOnly}
            />
            <TextField
              size="small"
              variant="outlined"
              value={item.label}
              onChange={(e) => handleEdit(item.id, e.target.value)}
              sx={{ flexGrow: 1 }}
              disabled={isReadOnly}
            />
            <Typography variant="body2">Consider positive</Typography>
            <Checkbox
              checked={item.considerPositive || false}
              onChange={() => togglePositive(item.id)}
              color="success"
              disabled={isReadOnly}
            />
            <IconButton
              color="error"
              onClick={() => handleDelete(item.id)}
              disabled={isReadOnly}
            >
              <Delete />
            </IconButton>
          </Stack>
        ))}
        <Stack direction="row" spacing={1} mt={3}>
          <CustomTextField
            placeholder="Add Call Result"
            value={newResult}
            onChange={(e) => setNewResult(e.target.value)}
          />
          <IconButton color="info" onClick={handleAdd} disabled={isReadOnly}>
            <Add />
          </IconButton>
        </Stack>
      </Box>

      <SimpleButton label="Save" onClick={onSubmit} disabled={isReadOnly} />
    </Box>
  );
}
