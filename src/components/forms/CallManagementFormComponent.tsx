import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserRole } from "voice-javascript-common";
import { adminOnlySettings } from "voice-javascript-common";

import FormRenderer from "../FormRenderer";
import { callManagementSchema } from "../../schemas/phone-settings/call-management/schema";
import { callManagementValidationSchema } from "../../schemas/phone-settings/call-management/validation-schema";
import api from "../../utils/axiosInstance";
import useAppStore from "../../store/useAppStore";
import { injectAdminOnly } from "../../utils/injectAdminOnly";

console.log("callManagementSchema: ", callManagementSchema);
console.log("adminOnlySettings: ", adminOnlySettings);

const enrichedSchema = injectAdminOnly(callManagementSchema, adminOnlySettings);

console.log("enrichedSchema: ", enrichedSchema);

const CallManagementFormComponent = (data: any) => {
  const { connectionDefinition, preventMultiple } = data;
  const user = useAppStore((state) => state.user);
  const settings = useAppStore((state) => state.settings);
  const setSettings = useAppStore((state) => state.setSettings);

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
      const { data } = await api.patch(`/settings`, {
        "Phone Settings": {
          ...existingPhoneSettings,
          callManagement: { ...formData },
        },
      });
      setSettings(data);
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
