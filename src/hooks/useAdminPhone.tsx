import { useEffect, useRef, useState, useCallback } from "react";
import { Device } from "@twilio/voice-sdk";
import { Socket } from "socket.io-client";

import { initTwilioDevice, destroyTwilioDevice } from "../utils/initTwilio";
import { destroySocket, initSocket } from "../utils/initSocket";
import { getAudioDevices } from "../utils/audioDevice";
import useAppStore from "../store/useAppStore";
import { AudioDevice } from "../interfaces/audio-device";

export const useAdminPhone = (userId: string | undefined) => {
  const [twilioDevice, setTwilioDevice] = useState<Device | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [devices, setDevices] = useState<AudioDevice[] | null>(null);
  const [inputVolume, setInputVolume] = useState<number>(0);
  const [outputVolume, setOutputVolume] = useState<number>(0);
  const [incomingHandler, setIncomingHandler] = useState<
    ((call: any) => void) | null
  >(null);

  const socketRef = useRef<Socket | null>(null);
  const twilioDeviceRef = useRef<Device | null>(null);
  
  // Dispatcher pattern: store both handlers separately
  const campaignHandlerRef = useRef<((call: any) => void) | null>(null);
  const inboundHandlerRef = useRef<((call: any) => void) | null>(null);
  
  // Queue inbound calls that arrive before handler is registered
  const queuedInboundCallRef = useRef<any | null>(null);

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

  // Register single incoming handler that dispatches to appropriate handler
  useEffect(() => {
    const device = twilioDevice;
    console.log("twilioDeviceRef.current: ", twilioDevice);
    if (!device) return;

    const onIncoming = (call: any) => {
      // STEP 6: Log incoming call event
      console.log("🔥 DEVICE INCOMING", {
        parameters: call.parameters,
        state: call.state,
        direction: call.direction,
      });

      // Check if this is an outbound call
      const params = new URLSearchParams(call.parameters?.Params || "");
      const isOutbound = params.get("outbound") === "true";

      if (isOutbound) {
        // Dispatch to campaign handler
        if (campaignHandlerRef.current) {
          campaignHandlerRef.current(call);
        } else {
          console.warn("Outbound call received but no campaign handler registered");
        }
      } else {
        // Dispatch to inbound handler
        if (inboundHandlerRef.current) {
          inboundHandlerRef.current(call);
        } else {
          // Queue the call until handler is ready
          queuedInboundCallRef.current = call;
          console.log("Inbound call queued — handler not ready");
        }
      }
    };

    device.on("incoming", onIncoming);

    // Cleanup: remove listener when device is destroyed
    return () => {
      device.off("incoming", onIncoming);
    };
  }, [twilioDevice]);

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

        // STEP 6: Log device registration state
        device.on("registered", () => {
          console.log("🔥 DEVICE REGISTERED - ready for incoming calls");
        });
        device.on("error", (error: any) => {
          console.error("🔥 DEVICE ERROR:", error);
        });
        device.on("tokenWillExpire", () => {
          console.warn("🔥 DEVICE TOKEN WILL EXPIRE");
        });

        setTwilioDevice(device);
        device.register();
        console.log("🔥 DEVICE REGISTER CALLED - state:", device.state);
      } catch (error) {
        console.error("🔥 DEVICE INIT ERROR:", error);
      }
    })();

    const s = initSocket(userId);
    socketRef.current = s;
    setSocket(s);

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      destroySocket();
      destroyTwilioDevice();
    };
  }, [userId]);

  // Register campaign handler (for outbound calls)
  const registerCampaignHandler = useCallback((handler: ((call: any) => void) | null) => {
    campaignHandlerRef.current = handler;
  }, []);

  // Register inbound handler (for inbound calls)
  const registerInboundHandler = useCallback((handler: ((call: any) => void) | null) => {
    inboundHandlerRef.current = handler;
    
    // Process any queued inbound call immediately
    if (handler && queuedInboundCallRef.current) {
      const queuedCall = queuedInboundCallRef.current;
      queuedInboundCallRef.current = null;
      handler(queuedCall);
    }
  }, []);

  return {
    inputVolume,
    outputVolume,
    volumeHandler,
    hangUpHandler,
    twilioDevice,
    socket,
    devices,
    setIncomingHandler, // Keep for backward compatibility if needed
    registerCampaignHandler,
    registerInboundHandler,
  };
};
