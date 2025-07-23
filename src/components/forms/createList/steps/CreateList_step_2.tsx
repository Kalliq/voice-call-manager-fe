import FormRenderer from "../../../FormRenderer";
import { listFiltersSchema } from "../../../../schemas/create-list/schema_step_2";
import { useFormContext }   from "react-hook-form";
import { Typography, Box }   from "@mui/material";

const CreateList_step_2 = ({
  onNext,
  onPrevious,
}: {
  onNext: (data: any) => void;
  onPrevious: () => void;
}) => {
  const {
    formState: { errors },
  } = useFormContext();
  return (
   <Box>
      <FormRenderer
        schema={listFiltersSchema}
        onNext={onNext}
        onPrevious={onPrevious}
      />

      {errors.filters && (
        <Typography color="error" mt={2}>
          {`${errors.filters.message || ""}`}
        </Typography>
      )}
    </Box>
  );
};

export default CreateList_step_2;
