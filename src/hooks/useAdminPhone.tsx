import { useEffect, useRef, useState, useCallback } from "react";
import { Device } from "@twilio/voice-sdk";
import { Socket } from "socket.io-client";

import { initTwilioDevice, destroyTwilioDevice } from "../utils/initTwilio";
import { initSocket } from "../utils/initSocket";
import { getAudioDevices } from "../utils/audioDevice";
import useAppStore from "../store/useAppStore";
import { AudioDevice } from "../interfaces/audio-device";

export const useAdminPhone = () => {
  const user = useAppStore((state) => state.user);
  const userId = user?.id;

  const [twilioDevice, setTwilioDevice] = useState<Device | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [devices, setDevices] = useState<AudioDevice[] | null>(null);
  const [inputVolume, setInputVolume] = useState<number>(0);
  const [outputVolume, setOutputVolume] = useState<number>(0);
  const [incomingHandler, setIncomingHandler] = useState<
    ((call: any) => void) | null
  >(null);

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
    const device = twilioDevice;
    console.log("twilioDeviceRef.current: ", twilioDevice);
    if (!device) return;

    const onIncoming = (call: any) => {
      if (incomingHandler) {
        incomingHandler(call);
      } else {
        console.warn("No incoming handler set");
      }
    };

    device.on("incoming", onIncoming);
  }, [incomingHandler]);

  useEffect(() => {
    if (twilioDevice && userId) {
      getDevices();
    }
  }, [twilioDevice, getDevices]);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        // Initialize Twilio
        const device = await initTwilioDevice();

        setTwilioDevice(device);
        device.register();

        // Initialize Socket
        const socket = initSocket(userId);

        setSocket(socket);
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      destroyTwilioDevice();
      if (socket) socket.disconnect();
    };
  }, [userId]);

  return {
    inputVolume,
    outputVolume,
    volumeHandler,
    hangUpHandler,
    twilioDevice,
    socket,
    devices,
    setIncomingHandler,
  };
};
