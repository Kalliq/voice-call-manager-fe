import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Stack,
  SelectChangeEvent,
  Menu,
  ListItemText,
  CircularProgress,
  Typography,
} from "@mui/material";
import { ArrowDropDown } from "@mui/icons-material";
import { useSnackbar } from "../../hooks/useSnackbar";
import RichTextEditor from "../RichTextEditor";
import { useCreateEmailTemplate, useUpdateEmailTemplate } from "../../mutations/email";
import type { EmailTemplate } from "../../api/email";

interface EmailTemplateEditorComponentProps {
  open: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
  onSave: () => void;
}

const VARIABLES = [
  { value: "{{contactName}}", label: "Contact Name" },
  { value: "{{firstName}}", label: "First Name" },
  { value: "{{lastName}}", label: "Last Name" },
  { value: "{{company}}", label: "Company" },
  { value: "{{email}}", label: "Email" },
];

const EmailTemplateEditorComponent = ({
  open,
  onClose,
  template,
  onSave,
}: EmailTemplateEditorComponentProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<"Personal" | "Organization">("Personal");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [variableMenuAnchor, setVariableMenuAnchor] = useState<null | HTMLElement>(null);
  const [editorRef, setEditorRef] = useState<any>(null);
  const { enqueue } = useSnackbar();

  const { mutateAsync: createTemplate, isPending: creating } = useCreateEmailTemplate();
  const { mutateAsync: updateTemplate, isPending: updating } = useUpdateEmailTemplate();
  const saving = creating || updating;

  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name);
        setType(template.type);
        setSubject(template.subject || "");
        setBodyHtml(template.bodyHtml || "");
      } else {
        setName("");
        setType("Personal");
        setSubject("");
        setBodyHtml("");
      }
    }
  }, [open, template]);

  const handleSave = async () => {
    if (!name.trim()) {
      enqueue("Template name is required", { variant: "warning" });
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        type,
        subject: subject.trim() || undefined,
        bodyHtml,
      };

      if (template) {
        await updateTemplate({ id: template.id, ...payload });
        enqueue("Template updated successfully", { variant: "success" });
      } else {
        await createTemplate(payload);
        enqueue("Template created successfully", { variant: "success" });
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error("Failed to save template:", error);
      enqueue(
        error.response?.data?.message || "Failed to save template",
        { variant: "error" }
      );
    }
  };

  const handleInsertVariable = (variable: string) => {
    if (editorRef) {
      editorRef.chain().focus().insertContent(variable).run();
    } else {
      // Fallback: append to bodyHtml
      setBodyHtml((prev) => prev + variable);
    }
    setVariableMenuAnchor(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 2 }}>
          <TextField
            label="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth>
            <InputLabel>Template Type</InputLabel>
            <Select
              value={type}
              onChange={(e: SelectChangeEvent<"Personal" | "Organization">) =>
                setType(e.target.value as "Personal" | "Organization")
              }
              label="Template Type"
            >
              <MenuItem value="Personal">Personal</MenuItem>
              <MenuItem value="Organization">Organization</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Email Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            placeholder="e.g., Follow-up on our conversation"
            InputLabelProps={{ shrink: true }}
          />

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Template Body
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowDropDown />}
                onClick={(e) => setVariableMenuAnchor(e.currentTarget)}
              >
                Insert Variable
              </Button>
            </Stack>
            <Box sx={{ position: "relative" }}>
              <RichTextEditor
                value={bodyHtml}
                onChange={setBodyHtml}
                placeholder="Enter template body..."
                minHeight="300px"
                editorRef={setEditorRef}
              />
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || !name.trim()}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>

      {/* Variable Menu */}
      <Menu
        anchorEl={variableMenuAnchor}
        open={Boolean(variableMenuAnchor)}
        onClose={() => setVariableMenuAnchor(null)}
      >
        {VARIABLES.map((variable) => (
          <MenuItem
            key={variable.value}
            onClick={() => handleInsertVariable(variable.value)}
          >
            <ListItemText primary={variable.label} secondary={variable.value} />
          </MenuItem>
        ))}
      </Menu>
    </Dialog>
  );
};

export default EmailTemplateEditorComponent;
