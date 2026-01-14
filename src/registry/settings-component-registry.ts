import PowerDialerManagementFormComponent from "../components/forms/PowerDialerManagementFormComponent";
import CallManagementFormComponent from "../components/forms/CallManagementFormComponent";
import CallResultsComponent from "../components/forms/CallResultsComponent";
import CallRecordingsFormComponent from "../components/forms/CallRecordingsFormComponent";
import CallSchedulesComponent from "../components/forms/CallSchedulesComponent";
import DataIntegrationComponent from "../components/forms/DataIntegrationComponent";
import GeneralSettingsFormComponent from "../components/forms/GeneralSettingsFormComponent";

export const settingsComponentRegistry: Record<
  string,
  Record<string, React.ComponentType<any>>
> = {
  "General Settings": {
    timezone: GeneralSettingsFormComponent,
  },
  "Phone Settings": {
    powerDialerManagement: PowerDialerManagementFormComponent,
    callManagement: CallManagementFormComponent,
    callResults: CallResultsComponent,
    recordingsManagement: CallRecordingsFormComponent,
    schedulesManagement: CallSchedulesComponent,
    integrationSettings: DataIntegrationComponent,
  },
};
