import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormRenderer from "../FormRenderer";
import { powerDialerManagementSchema } from "../../schemas/phone-settings/power-dialer-management/schema";
import { powerDialerManagementValidationSchema } from "../../schemas/phone-settings/power-dialer-management/validation-schema";
import { useGetSettings } from "../../queries/settings";
import { useUpdateSettings } from "../../mutations/settings";

const PowerDialerManagementFormComponent = (data: any) => {
  const { telephonyConnection, powerDialer } = data;
  const { data: settings } = useGetSettings();
  const { mutateAsync: updateSettings } = useUpdateSettings();

  const methods = useForm({
    defaultValues: {
      telephonyConnection,
      powerDialer,
    },
    // resolver: zodResolver(powerDialerManagementValidationSchema),
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
          powerDialerManagement: { ...formData },
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <FormProvider {...methods}>
      <FormRenderer
        schema={powerDialerManagementSchema}
        onSubmit={(formData) => onSubmit(formData)}
      />
    </FormProvider>
  );
};

export default PowerDialerManagementFormComponent;
