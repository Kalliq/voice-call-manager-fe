const schema = {
  title: "CALL RECORDINGS MANAGEMENT",
  sections: [
    {
      title: "ENABLE RECORDING",
      fields: [
        {
          type: "checkbox",
          name: "enableCallRecording",
          label: "Enable call recording",
        },
        {
          type: "button",
          label: "Save",
          action: "submit",
        },
      ],
    },
    {
      title: "RECORDING RULES",
      fields: [
        {
          type: "textarea",
          name: "recordingExcludePrefixes",
          label: "Exclude calls starting with",
          placeholder: "Enter one prefix per line (e.g., +1, 555)",
          helperText: "One prefix per line. Calls matching any prefix will not be recorded.",
        },
        {
          type: "textarea",
          name: "recordingIncludePrefixes",
          label: "Include only calls starting with (optional)",
          placeholder: "Enter one prefix per line (e.g., +1, 555)",
          helperText: "If specified, only calls matching these prefixes will be recorded. Overrides exclude rules.",
        },
        {
          type: "button",
          label: "Save",
          action: "submit",
        },
      ],
    },
    {
      title: "LEGAL DISCLAIMER",
      fields: [
        {
          type: "static",
          content: "You are responsible for complying with local call recording laws.",
        },
      ],
    },
  ],
};

export { schema as recordingsManagementSchema };
