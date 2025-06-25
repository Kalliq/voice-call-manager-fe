import { Device, Call } from "@twilio/voice-sdk";

import api from "./axiosInstance";

let twilioDeviceInstance: Device | null = null;

enum TwilioEvent {
  INCOMING = "incoming",
  REGISTERED = "registered",
  ERROR = "error",
}

export const getTwilioDevice = () => twilioDeviceInstance;

export const initTwilioDevice = async (): Promise<Device> => {
  if (twilioDeviceInstance) return twilioDeviceInstance;

  const identity = "webrtc_user";

  const { data } = await api.post("/twilio/token", { identity });
  const codecPreferences: any[] = ["opus", "pcmu"];

  const device = new Device(data.token, {
    logLevel: "error",
    codecPreferences,
  });

  twilioDeviceInstance = device;

  return device;
};

export const destroyTwilioDevice = () => {
  if (twilioDeviceInstance) {
    twilioDeviceInstance.destroy();
    twilioDeviceInstance = null;
  }
};
