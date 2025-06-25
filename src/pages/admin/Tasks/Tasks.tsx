import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  Typography,
  Paper,
  Stack,
  Divider,
  Tooltip,
  IconButton,
} from "@mui/material";
import { Add, AccessTime, CheckCircle, Info, Close } from "@mui/icons-material";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { format } from "date-fns";

import AddTaskDialog, { TaskForm } from "./components/AddTaskDialog";
import { useSnackbar } from "../../../hooks/useSnackbar";

import api from "../../../utils/axiosInstance";
import { Task } from "../../../types/task";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return { label: "High", color: "error", bg: "#red" };
    case "Medium":
      return { label: "Medium", color: "warning", bg: "#yellow" };
    case "Low":
      return { label: "Low", color: "success", bg: "#green" };
    default:
      return { label: "", color: "default", bg: "default" };
  }
};

const TaskCard = ({
  task,
  onDelete,
}: {
  task: Task;
  onDelete: (id: string, status: Task["status"]) => void;
}) => {
  const priority = getPriorityColor(task.priority);

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderRadius: 2, position: "relative" }}
    >
      <Tooltip title="Delete task">
        <IconButton
          size="small"
          onClick={() => onDelete(task.id, task.status)}
          sx={{ position: "absolute", top: 8, right: 8 }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Tooltip>
      <Typography variant="subtitle1" fontWeight="bold" fontSize={16}>
        {task.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {task.description}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <AccessTime fontSize="small" sx={{ color: "text.secondary" }} />
        <Typography variant="caption" color="text.secondary">
          {format(new Date(task.dueDate), "dd.MM.yyyy")}
        </Typography>
      </Stack>
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Chip
          size="small"
          label={priority.label}
          color={priority.color as any}
          sx={{ backgroundColor: priority.bg, fontWeight: 500 }}
        />
      </Stack>
    </Paper>
  );
};

const Tasks = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [tasks, setTasks] = useState<Record<Task["status"], Task[]>>({
    "To Do": [],
    "In Progress": [],
    Completed: [],
  });
  const { enqueue } = useSnackbar();

  const handleAddTask = async (task: TaskForm) => {
    try {
      const { data: newTask } = await api.post("/tasks/create", task);

      setTasks((prev) => {
        const updated = { ...prev };
        const statusKey = task.status as keyof typeof prev;

        if (!updated[statusKey]) {
          updated[statusKey] = [] as Task[];
        }

        updated[statusKey] = [newTask, ...updated[statusKey]];
        return updated;
      });
    } catch (err: any) {
      console.error("Failed to add task:", err);
      enqueue(err.message || "Error!", { variant: "error" });
    }
  };

  const handleDeleteTask = async (id: string, status: Task["status"]) => {
    try {
      await api.delete(`/tasks/${id}`);

      setTasks((prev) => {
        const updated = { ...prev };
        updated[status] = updated[status].filter((t) => t.id !== id);
        return updated;
      });

      enqueue("Task deleted successfully", { variant: "success" });
    } catch (err: any) {
      console.error("Failed to delete task:", err);
      enqueue(err.message || "Failed to delete task", { variant: "error" });
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    const sourceStatus = source.droppableId as Task["status"];
    const destStatus = destination.droppableId as Task["status"];

    if (sourceStatus === destStatus && source.index === destination.index)
      return;

    const sourceTasks = Array.from(tasks[sourceStatus]);
    const [movedTask] = sourceTasks.splice(source.index, 1);

    const destTasks = Array.from(tasks[destStatus]);
    movedTask.status = destStatus;
    destTasks.splice(destination.index, 0, movedTask);

    setTasks((prev) => ({
      ...prev,
      [sourceStatus]: sourceTasks,
      [destStatus]: destTasks,
    }));

    await api.patch(`/tasks/${movedTask.id}`, { status: destStatus });
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await api.get("/tasks");

        const grouped = {
          "To Do": [] as Task[],
          "In Progress": [] as Task[],
          Completed: [] as Task[],
        };

        data.forEach((task: Task) => {
          if (grouped[task.status]) {
            grouped[task.status].push(task);
          }
        });

        setTasks(grouped);
      } catch (err: any) {
        console.error("Failed to fetch tasks:", err);
        enqueue(err.message || "Failed to load tasks", { variant: "error" });
      }
    };

    fetchTasks();
  }, [enqueue]);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Task Manager
          </Typography>
          <Typography color="text.secondary">
            Organize and track your tasks efficiently
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          color="info"
        >
          Add New Task
        </Button>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Grid container spacing={2}>
          {["To Do", "In Progress", "Completed"].map((status) => {
            const statusKey = status as keyof typeof tasks;
            const Icon =
              status === "To Do"
                ? Info
                : status === "In Progress"
                ? AccessTime
                : CheckCircle;

            const currentTasks = tasks[statusKey];

            return (
              <Grid item xs={12} md={4} key={status}>
                <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <Icon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      {status}
                    </Typography>
                    <Chip
                      label={currentTasks.length}
                      size="small"
                      sx={{ bgcolor: "#eee", fontWeight: 500 }}
                    />
                  </Stack>
                  <Droppable droppableId={statusKey}>
                    {(provided) => (
                      <Stack
                        spacing={2}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {currentTasks.map((task, index) => (
                          <Draggable
                            key={`${task.title}-${index}`}
                            draggableId={`${task.title}-${index}`}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <TaskCard
                                  task={task}
                                  onDelete={handleDeleteTask}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Stack>
                    )}
                  </Droppable>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </DragDropContext>
      <AddTaskDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleAddTask}
      />
    </Box>
  );
};

export default Tasks;
