type SchemaField = {
  type: string;
  name?: string;
  label?: string;
  adminOnly?: boolean;
  nestedField?: SchemaField;
  [key: string]: any;
};

type SchemaSection = {
  title: string;
  fields: SchemaField[];
};

type Schema = {
  title: string;
  sections: SchemaSection[];
};

export function applyAdminOnlyFlags(
  schema: Schema,
  adminOnlyPaths: string[]
): Schema {
  const updatedSchema = JSON.parse(JSON.stringify(schema)); // deep clone

  for (const adminPath of adminOnlyPaths) {
    const [, sectionKey, fieldGroup] = adminPath.split("."); // e.g., ["Phone Settings", "callManagement", "connectionDefinition"]

    for (const section of updatedSchema.sections) {
      const sectionBackendKey = mapSectionTitleToBackendKey(section.title); // e.g., "callManagement"

      if (
        sectionBackendKey !== fieldGroup &&
        sectionBackendKey !== sectionKey
      ) {
        continue;
      }

      for (const field of section.fields) {
        if (field.name?.startsWith(`${fieldGroup}.`)) {
          field.adminOnly = true;
        }

        if (field.nestedField?.name?.startsWith(`${fieldGroup}.`)) {
          field.adminOnly = true; // we mark parent field for nested match
        }
      }
    }
  }

  return updatedSchema;
}

function mapSectionTitleToBackendKey(title: string): string {
  const map: Record<string, string> = {
    "CALL MANAGEMENT": "callManagement",
    "PREVENT MULTIPLE CALLS TO THE SAME CONTACT": "callManagement",
    // Add more mappings here as needed
  };
  return map[title] || title.toLowerCase().replace(/\s+/g, "");
}
