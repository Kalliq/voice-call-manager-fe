// src/components/forms/createList/steps/CreateList_step_1.tsx
import React from "react";
import { useFormContext } from "react-hook-form";
import { Box } from "@mui/material";

import FormRenderer from "../../../FormRenderer";
import { listSettingsSchema } from "../../../../schemas/create-list/schema_step_1";
import { SimpleButton } from "../../../UI/SimpleButton";
import { useSnackbar } from "../../../../hooks/useSnackbar";

type Values = { listName: string; listPriority: "high" | "medium" | "low" };

interface CreateList_step_1Props {
  onNext: (data: Values) => void;
  onRename?: () => Promise<void>;
  originalListName?: string;
  currentListName?: string;
}

export default function CreateList_step_1({ 
  onNext, 
  onRename,
  originalListName = "",
  currentListName = ""
}: CreateList_step_1Props) {
  const { watch } = useFormContext<Values>();
  const { enqueue } = useSnackbar();
  const watchedName = watch("listName") || currentListName;
  const nameHasChanged = originalListName && watchedName !== originalListName;

  const handleRename = async () => {
    if (!onRename) return;
    try {
      await onRename();
      enqueue("List name updated successfully", { variant: "success" });
    } catch (err: any) {
      enqueue(err?.response?.data?.message || "Failed to update list name", { variant: "error" });
    }
  };

  return (
    <Box>
      <FormRenderer schema={listSettingsSchema} onNext={onNext} />
      {onRename && nameHasChanged && (
        <Box mt={2} display="flex" justifyContent="flex-end">
          <SimpleButton
            label="Save name"
            onClick={handleRename}
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
}

// import FormRenderer from "../../../FormRenderer";
// import { listSettingsSchema } from "../../../../schemas/create-list/schema_step_1";

// const CreateList_step_1 = ({ onNext }: { onNext: (data: any) => void }) => {
//   return <FormRenderer schema={listSettingsSchema} onNext={onNext} />;
// };

// export default CreateList_step_1;
