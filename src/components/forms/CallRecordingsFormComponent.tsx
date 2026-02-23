import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormRenderer from "../FormRenderer";
import { recordingsManagementSchema } from "../../schemas/phone-settings/call-recordings/schema";
import { recordingsManagementValidationSchema } from "../../schemas/phone-settings/call-recordings/validation-schema";
import { useGetSettings } from "../../queries/settings";
import { useUpdateSettings } from "../../mutations/settings";

const CallManagementFormComponent = (data: any) => {
  const {
    enableCallRecording,
    recordingExcludePrefixes,
    recordingIncludePrefixes,
    // Backward compatibility with old field names
    excludePhonesStartingWith,
    includeOnlyPhonesStartingWith,
  } = data;
  const { data: settings } = useGetSettings();
  const { mutateAsync: updateSettings } = useUpdateSettings();

  // Convert arrays to multi-line strings for textarea display
  // Handle backward compatibility: if old string fields exist, convert them
  const getExcludeValue = () => {
    if (recordingExcludePrefixes) {
      if (Array.isArray(recordingExcludePrefixes)) {
        return recordingExcludePrefixes.join("\n");
      }
      return String(recordingExcludePrefixes);
    }
    // Backward compatibility
    if (excludePhonesStartingWith) {
      return String(excludePhonesStartingWith);
    }
    return "";
  };

  const getIncludeValue = () => {
    if (recordingIncludePrefixes) {
      if (Array.isArray(recordingIncludePrefixes)) {
        return recordingIncludePrefixes.join("\n");
      }
      return String(recordingIncludePrefixes);
    }
    // Backward compatibility
    if (includeOnlyPhonesStartingWith) {
      return String(includeOnlyPhonesStartingWith);
    }
    return "";
  };

  const methods = useForm({
    defaultValues: {
      enableCallRecording: enableCallRecording ?? true,
      recordingExcludePrefixes: getExcludeValue(),
      recordingIncludePrefixes: getIncludeValue(),
    },
    resolver: zodResolver(recordingsManagementValidationSchema),
  });

  const onSubmit = async (formData: any) => {
    try {
      if (!settings) {
        throw new Error("Missing settings!");
      }
      const existingPhoneSettings = { ...settings["Phone Settings"] };

      // Validation schema already transforms strings to arrays
      // But ensure we send arrays to backend
      const submitData = {
        enableCallRecording: formData.enableCallRecording,
        recordingExcludePrefixes: Array.isArray(formData.recordingExcludePrefixes)
          ? formData.recordingExcludePrefixes
          : formData.recordingExcludePrefixes
              .split("\n")
              .map((line: string) => line.trim())
              .filter((line: string) => line.length > 0),
        recordingIncludePrefixes: Array.isArray(formData.recordingIncludePrefixes)
          ? formData.recordingIncludePrefixes
          : formData.recordingIncludePrefixes
              .split("\n")
              .map((line: string) => line.trim())
              .filter((line: string) => line.length > 0),
      };

      await updateSettings({
        "Phone Settings": {
          ...existingPhoneSettings,
          recordingsManagement: submitData,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <FormProvider {...methods}>
      <FormRenderer
        schema={recordingsManagementSchema}
        onSubmit={(formData) => onSubmit(formData)}
      />
    </FormProvider>
  );
};

export default CallManagementFormComponent;
