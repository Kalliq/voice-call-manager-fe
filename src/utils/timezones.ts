/**
 * Returns a sorted list of IANA timezone identifiers.
 * Uses Intl.supportedValuesOf when available (modern browsers), otherwise a common fallback list.
 */
export function getAllTimezones(): string[] {
  try {
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      const tz = (Intl as any).supportedValuesOf("timeZone") as string[];
      return [...tz].sort();
    }
  } catch {
    // Fallback for older browsers
  }
  return COMMON_TIMEZONES;
}

// Fallback list of common IANA timezones when Intl.supportedValuesOf is not available
const COMMON_TIMEZONES = [
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/New_York",
  "America/Phoenix",
  "America/Toronto",
  "America/Vancouver",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Melbourne",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Paris",
  "Pacific/Auckland",
  "Pacific/Honolulu",
  "UTC",
].sort();
