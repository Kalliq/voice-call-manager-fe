export function transformToNormalCase(str: string) {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function transformToSnakeCase(str: string) {
  return str.trim().toLowerCase().replace(/\s+/g, "_");
}
