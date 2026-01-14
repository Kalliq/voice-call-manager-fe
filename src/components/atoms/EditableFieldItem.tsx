import { useState, useEffect } from "react";
import { Stack, Box, Typography, TextField, IconButton } from "@mui/material";
import { Edit, Check, Close } from "@mui/icons-material";

interface EditableFieldItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onSave?: (value: string) => Promise<void>;
  multiline?: boolean;
}

const EditableFieldItem = ({
  icon,
  label,
  value = "",
  onSave,
  multiline = false,
}: EditableFieldItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  const handleEdit = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!onSave || editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save field:", error);
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <Stack 
      direction="row" 
      spacing={1} 
      alignItems="center" 
      sx={{ width: "100%" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon}
      <Box sx={{ flexGrow: 1 }}>
        <Typography fontSize={13} fontWeight={500} color="text.secondary">
          {label}
        </Typography>
        {isEditing ? (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
            <TextField
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              multiline={multiline}
              size="small"
              autoFocus
              sx={{
                flexGrow: 1,
                "& .MuiInputBase-root": {
                  fontSize: 13,
                  py: 0.5,
                },
              }}
            />
            <IconButton
              size="small"
              onClick={handleSave}
              disabled={isSaving}
              sx={{ minWidth: "auto", p: 0.5 }}
            >
              <Check fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleCancel}
              disabled={isSaving}
              sx={{ minWidth: "auto", p: 0.5 }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
            <Typography fontSize={13} sx={{ flexGrow: 1 }}>
              {value || "—"}
            </Typography>
            {onSave && (
              <IconButton
                size="small"
                onClick={handleEdit}
                sx={{ 
                  minWidth: "auto", 
                  p: 0.5,
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 0.2s",
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  );
};

export { EditableFieldItem };
