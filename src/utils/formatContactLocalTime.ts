/**
 * Formats the current time in the contact's local timezone.
 * 
 * @param contactTimeZone - IANA timezone string (e.g., "America/New_York")
 * @param userTimeZone - Fallback IANA timezone string (e.g., "America/New_York")
 * @param now - Optional Date object (defaults to current time)
 * @returns Formatted string like "11:01 PM (-05:00 EST)" or null if timezone invalid
 */
export function formatContactLocalTime(
  contactTimeZone?: string,
  userTimeZone?: string,
  now?: Date
): string | null {
  try {
    // Determine which timezone to use
    let tz: string | null = null;
    const date = now || new Date();
    
    // Prefer contact timezone if valid
    if (contactTimeZone && contactTimeZone.trim()) {
      try {
        // Validate by attempting to format a date in that timezone
        const testFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: contactTimeZone.trim(),
        });
        testFormatter.format(date);
        tz = contactTimeZone.trim();
      } catch {
        // Invalid timezone, try fallback
      }
    }
    
    // Fallback to user timezone
    if (!tz && userTimeZone && userTimeZone.trim()) {
      try {
        const testFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: userTimeZone.trim(),
        });
        testFormatter.format(date);
        tz = userTimeZone.trim();
      } catch {
        // Invalid timezone
      }
    }
    
    // If no valid timezone, return null
    if (!tz) {
      return null;
    }
    
    // Format the time using Intl.DateTimeFormat
    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    
    const timeStr = timeFormatter.format(date);
    
    // Get offset and abbreviation
    const partsFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    });
    
    const parts = partsFormatter.formatToParts(date);
    const tzNamePart = parts.find((part) => part.type === "timeZoneName");
    const abbrev = tzNamePart?.value || "";
    
    // Calculate offset by comparing UTC time with timezone time
    const utcFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    
    const tzFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    
    const utcParts = utcFormatter.formatToParts(date);
    const tzParts = tzFormatter.formatToParts(date);
    
    const utcHour = parseInt(utcParts.find((p) => p.type === "hour")?.value || "0", 10);
    const utcMin = parseInt(utcParts.find((p) => p.type === "minute")?.value || "0", 10);
    const tzHour = parseInt(tzParts.find((p) => p.type === "hour")?.value || "0", 10);
    const tzMin = parseInt(tzParts.find((p) => p.type === "minute")?.value || "0", 10);
    
    let offsetMinutes = (tzHour * 60 + tzMin) - (utcHour * 60 + utcMin);
    // Handle day rollover (timezone can be up to +/- 12 hours from UTC)
    if (offsetMinutes > 12 * 60) offsetMinutes -= 24 * 60;
    if (offsetMinutes < -12 * 60) offsetMinutes += 24 * 60;
    
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const offsetSign = offsetMinutes >= 0 ? "+" : "-";
    const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMins).padStart(2, "0")}`;
    
    return `${timeStr} (${offsetStr} ${abbrev})`;
  } catch (error) {
    // Never throw - return null on any error
    return null;
  }
}
