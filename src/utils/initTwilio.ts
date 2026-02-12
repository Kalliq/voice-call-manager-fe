import { Device, Call } from "@twilio/voice-sdk";

import api from "./axiosInstance";
import useAppStore from "../store/useAppStore";

let twilioDeviceInstance: Device | null = null;

enum TwilioEvent {
  INCOMING = "incoming",
  REGISTERED = "registered",
  ERROR = "error",
}

export const getTwilioDevice = () => twilioDeviceInstance;

export const initTwilioDevice = async (): Promise<Device> => {

  // use current user id
  const userId = useAppStore.getState().user?.id;

  if (twilioDeviceInstance) return twilioDeviceInstance;

  const identity = userId;

  const { data } = await api.post("/twilio/token", { identity });
  const codecPreferences: any[] = ["opus", "pcmu"];

  const device = new Device(data.token, {
    logLevel: "error",
    codecPreferences,
    edge: ['ashburn', 'us1']
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
