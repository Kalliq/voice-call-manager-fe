import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserRole } from "voice-javascript-common";
import { adminOnlySettings } from "voice-javascript-common";

import FormRenderer from "../FormRenderer";
import { callManagementSchema } from "../../schemas/phone-settings/call-management/schema";
import { callManagementValidationSchema } from "../../schemas/phone-settings/call-management/validation-schema";
import useAppStore from "../../store/useAppStore";
import { injectAdminOnly } from "../../utils/injectAdminOnly";
import { useGetSettings } from "../../queries/settings";
import { useUpdateSettings } from "../../mutations/settings";

console.log("callManagementSchema: ", callManagementSchema);
console.log("adminOnlySettings: ", adminOnlySettings);

const enrichedSchema = injectAdminOnly(callManagementSchema, adminOnlySettings);

console.log("enrichedSchema: ", enrichedSchema);

const CallManagementFormComponent = (data: any) => {
  const { connectionDefinition, preventMultiple } = data;
  const user = useAppStore((state) => state.user);
  const { data: settings } = useGetSettings();
  const { mutateAsync: updateSettings } = useUpdateSettings();

  const methods = useForm({
    defaultValues: {
      connectionDefinition,
      preventMultiple,
    },
    resolver: zodResolver(callManagementValidationSchema),
  });

  const onSubmit = async (formData: any) => {
    try {
      if (!settings) {
        throw new Error("Missing settings!");
      }
      const existingPhoneSettings = { ...settings["Phone Settings"] };
      await updateSettings({
        "Phone Settings": {
          ...existingPhoneSettings,
          callManagement: { ...formData },
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <FormProvider {...methods}>
      <FormRenderer
        schema={enrichedSchema}
        onSubmit={(formData) => onSubmit(formData)}
        isAdmin={user?.role === UserRole.ADMIN}
      />
    </FormProvider>
  );
};

export default CallManagementFormComponent;
