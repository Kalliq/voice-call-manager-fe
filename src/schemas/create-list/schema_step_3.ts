import { ButtonAction } from "../../enums/form-buttons-actions";

export const getListExitStrategySchema = (
  stepOptions: { label: string; value: string }[]
) => ({
  title: "LIST EXIT STRATEGY CONFIGURATION",
  sections: [
    {
      title: "EXIT STRATEGY",
      fields: [
        {
          type: "text",
          name: "exitStrategy",
          label: "Exit strategy",
          required: true,
          tooltip: "Enter a name for this exit strategy. This identifies when and how contacts should be removed from the list.",
        },
        {
          type: "text",
          name: "exitStrategyDescription",
          label: "Description",
          required: true,
          tooltip: "Provide a detailed description of this exit strategy. Explain when contacts should exit the list and under what conditions.",
        },
      ],
    },
    {
      title: "WHEN TO EXIT POSITIVE",
      fields: [
        {
          type: "dynamic",
          name: "exitConditionsPositive",
          label: "Exit conditions",
          tooltip: "Define conditions that will cause a contact to exit the list with a positive outcome. Add multiple conditions to create complex exit rules.",
          addButtonLabel: "Add Condition",
          nestedFields: [
            {
              type: "select",
              name: "value",
              label: "Call equals to",
              tooltip: "Select the call result that triggers a positive exit. When a contact receives this call result, they will be removed from the list.",
              options: stepOptions,
              required: true,
            },
          ],
        },
      ],
    },
    {
      title: "WHEN TO EXIT NEGATIVE",
      fields: [
        {
          type: "dynamic",
          name: "exitConditionsNegative",
          label: "Exit conditions",
          tooltip: "Define conditions that will cause a contact to exit the list with a negative outcome. Add multiple conditions to create complex exit rules.",
          addButtonLabel: "Add Condition",
          nestedFields: [
            {
              type: "select",
              name: "value",
              label: "Call equals to",
              tooltip: "Select the call result that triggers a negative exit. When a contact receives this call result, they will be removed from the list.",
              options: stepOptions,
              required: true,
            },
          ],
        },
      ],
    },
    {
      title: "STEPS",
      fields: [
        {
          type: "dynamic", // custom dynamic field group
          name: "steps",
          label: "Steps",
          tooltip: "Define the sequence of steps for this list. Each step represents a dialing attempt with a time gap between attempts.",
          addButtonLabel: "Add Step",
          nestedFields: [
            {
              type: "text",
              name: "gap",
              label: "Gap",
              tooltip: "Enter the time gap before this step executes. This is the waiting period after the previous step before dialing contacts in this step.",
              disableOnFirst: true,
            },
            {
              type: "select",
              name: "gapUnit",
              label: "Gap unit",
              tooltip: "Select whether the gap is measured in hours or days. This determines the time unit for the gap value.",
              options: [
                { label: "Hours", value: "hours" },
                { label: "Days", value: "days" },
              ],
              disableOnFirst: true,
            },
            {
              type: "text",
              name: "stepName",
              label: "Step name",
              tooltip: "Enter a descriptive name for this step. This helps identify the step in reports and dialing logs.",
              required: true,
            },
            {
              type: "select",
              name: "stepPriority",
              label: "Step priority",
              tooltip: "Set the priority level for this step. Higher priority steps are dialed before lower priority steps within the same list.",
              options: [
                { label: "High", value: "high" },
                { label: "Medium", value: "medium" },
                { label: "Low", value: "low" },
              ],
            },
            {
              type: "select",
              name: "defaultAction",
              label: "Default Action",
              tooltip: "Select the default call result/disposition that will be assigned if no specific action is taken during the call.",
              options: stepOptions,
              required: true,
            },
          ],
        },
      ],
    },
    {
      fields: [
        {
          type: "button",
          label: "Submit",
          action: ButtonAction.SUBMIT,
        },
        {
          type: "button",
          label: "Previous",
          action: ButtonAction.PREVIOUS,
        },
      ],
    },
  ],
});
