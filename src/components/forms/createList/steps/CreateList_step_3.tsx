import FormRenderer from "../../../FormRenderer";
import { getListExitStrategySchema } from "../../../../schemas/create-list/schema_step_3";
import { transformToSnakeCase } from "../../../../utils/transformCase";
import { useGetSettings } from "../../../../queries/settings";
import { CircularProgress, Box } from "@mui/material";

const CreateList_step_3 = ({
  onPrevious,
  onConfirm,
}: {
  onPrevious: () => void;
  onConfirm: (data: any) => void;
}) => {
  const { data: settings } = useGetSettings();
  const callResults = settings?.["Phone Settings"]?.callResults ?? [];

  if (!settings) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const extendedCallResults = callResults.map((callResult: any) => {
    return { ...callResult, value: transformToSnakeCase(callResult.label) };
  });

  const listExitStrategySchema = getListExitStrategySchema(extendedCallResults);

  return (
    <FormRenderer
      schema={listExitStrategySchema}
      onPrevious={onPrevious}
      onSubmit={onConfirm}
    />
  );
};

export default CreateList_step_3;
