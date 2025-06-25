type Task = {
  id: string;
  status: "To Do" | "In Progress" | "Completed";
  title: string;
  description: string;
  dueDate: string;
  initials: string;
  priority: string;
};

export { Task };
