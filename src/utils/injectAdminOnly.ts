type Field = {
  type: string;
  name?: string;
  label: string;
  action?: string;
  nestedField?: Field;
  adminOnly?: boolean;
};

type Section = {
  backendFriendlyName: string;
  title: string;
  fields: Field[];
};

type Schema = {
  backendFriendlyName: string;
  title: string;
  sections: Section[];
};

export function injectAdminOnly(
  schema: Schema,
  adminOnlySettings: string[]
): Schema {
  const prefix = "Phone Settings.";

  const adminPaths: string[][] = adminOnlySettings
    .filter((path) => path.startsWith(prefix))
    .map((path) => path.slice(prefix.length).split("."));

  schema.sections.forEach((section) => {
    const sectionPath = [
      schema.backendFriendlyName,
      section.backendFriendlyName,
    ];

    section.fields.forEach((field) => {
      if (!field.name) {
        return;
      }

      const fieldPath = [...sectionPath, ...field.name.split(".").slice(1)];

      const isAdminOnly = adminPaths.some(
        (adminPath) =>
          adminPath.length <= fieldPath.length &&
          adminPath.every((part, i) => part === fieldPath[i])
      );

      if (isAdminOnly) {
        console.log("Marking as adminOnly:", fieldPath.join("."));
        field.adminOnly = true;
      }

      if (field.nestedField && field.nestedField.name) {
        const nestedFieldPath = [
          ...sectionPath,
          ...field.nestedField.name.split(".").slice(1),
        ];
        const isNestedAdminOnly = adminPaths.some(
          (adminPath) =>
            adminPath.length <= nestedFieldPath.length &&
            adminPath.every((part, i) => part === nestedFieldPath[i])
        );
        if (isNestedAdminOnly) {
          console.log(
            "Marking nestedField as adminOnly:",
            nestedFieldPath.join(".")
          );
          field.nestedField.adminOnly = true;
        }
      }
    });
  });

  return schema;
}
