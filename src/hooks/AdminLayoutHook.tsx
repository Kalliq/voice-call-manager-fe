import { useEffect, useRef, useState, useCallback } from "react";
import { Device } from "@twilio/voice-sdk";
import { Socket } from "socket.io-client";

import { initTwilioDevice, destroyTwilioDevice } from "../utils/initTwilio";
import { initSocket } from "../utils/initSocket";
import { getAudioDevices } from "../utils/audioDevice";
import useAppStore from "../store/useAppStore";
import { AudioDevice } from "../interfaces/audio-device";

export const useAdminLayout = () => {
  const user = useAppStore((state) => state.user);
  const userId = user?.id;

  const [status, setStatus] = useState("Connecting...");
  const [twilioDevice, setTwilioDevice] = useState<Device | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [devices, setDevices] = useState<AudioDevice[] | null>(null);
  const [inputVolume, setInputVolume] = useState<number>(0);
  const [outputVolume, setOutputVolume] = useState<number>(0);

  const twilioDeviceRef = useRef<Device | null>(null);

  const getDevices = useCallback(async () => {
    if (twilioDeviceRef.current) {
      const audioDevices = await getAudioDevices(twilioDeviceRef.current);
      setDevices(audioDevices);
    }
  }, []);

  const volumeHandler = (inputVolume: number, outputVolume: number) => {
    setInputVolume(inputVolume);
    setOutputVolume(outputVolume);
  };

  const hangUpHandler = () => {};

  useEffect(() => {
    if (twilioDevice) {
      getDevices();
    }
  }, [twilioDevice, getDevices]);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        // Twilio init
        const device = await initTwilioDevice();

        setTwilioDevice(device);
        device.register();

        // Socket init
        const socket = initSocket(userId);

        setSocket(socket);
      } catch (error) {
        setStatus("Communication error has occurred.");
        console.error(error);
      }
    })();

    return () => {
      destroyTwilioDevice();
      if (socket) socket.disconnect();
    };
  }, [userId]);

  return {
    status,
    inputVolume,
    outputVolume,
    volumeHandler,
    hangUpHandler,
    twilioDevice,
    socket,
    devices,
  };
};
