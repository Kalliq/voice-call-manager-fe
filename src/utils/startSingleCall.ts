// src/utils/twilioCall.ts
import { Device } from "@twilio/voice-sdk";

export function startSingleCall(device: Device, contactId: string): void {
  device.connect({
    // Pass through to your /inbound handler logic
    params: {
      contactId,
      outbound: "true",
    },
  });
}
