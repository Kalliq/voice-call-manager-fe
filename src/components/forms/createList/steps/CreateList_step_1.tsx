// src/components/forms/createList/steps/CreateList_step_1.tsx
import React from "react";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import FormRenderer from "../../../FormRenderer";
import { listSettingsSchema } from "../../../../schemas/create-list/schema_step_1";
import { listSettingsValidationSchema } from "../../../../schemas/create-list/validation-schema";

type Values = z.infer<typeof listSettingsValidationSchema>;

export default function CreateList_step_1({ onNext }: { onNext: (data: Values) => void }) {
  const methods = useForm<Values>({
    resolver: zodResolver(listSettingsValidationSchema, { async: true }),
    mode: "onBlur",
    defaultValues: { listName: "", listPriority: "medium" },
  });

  const handleNext: SubmitHandler<Values> = (data) => onNext(data);

  return <FormRenderer schema={listSettingsSchema} onNext={onNext} />;
}

// import FormRenderer from "../../../FormRenderer";
// import { listSettingsSchema } from "../../../../schemas/create-list/schema_step_1";

// const CreateList_step_1 = ({ onNext }: { onNext: (data: any) => void }) => {
//   return <FormRenderer schema={listSettingsSchema} onNext={onNext} />;
// };

// export default CreateList_step_1;
