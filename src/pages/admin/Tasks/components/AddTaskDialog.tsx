import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Stack,
} from "@mui/material";
import { useState } from "react";

interface AddTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: TaskForm) => void;
}

export interface TaskForm {
  title: string;
  description: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  status: "To Do" | "In Progress" | "Completed";
}

const defaultForm: TaskForm = {
  title: "",
  description: "",
  dueDate: "",
  priority: "Medium",
  status: "To Do",
};

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<TaskForm>(defaultForm);

  const handleChange =
    (field: keyof TaskForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [field]: e.target.value });
    };

  const handleSubmit = () => {
    onSubmit(form);
    setForm(defaultForm);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Task</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Title"
            value={form.title}
            onChange={handleChange("title")}
            fullWidth
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={handleChange("description")}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="Due Date"
            type="date"
            value={form.dueDate}
            onChange={handleChange("dueDate")}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Priority"
            select
            value={form.priority}
            onChange={handleChange("priority")}
            fullWidth
          >
            {["Low", "Medium", "High"].map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Status"
            select
            value={form.status}
            onChange={handleChange("status")}
            fullWidth
          >
            {["To Do", "In Progress", "Completed"].map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Add Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTaskDialog;
