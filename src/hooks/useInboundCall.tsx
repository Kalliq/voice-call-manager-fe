import { useEffect, useState, useRef } from "react";
import { Call } from "@twilio/voice-sdk";

import { useTwilio } from "../contexts/TwilioContext";
import { getTwilioDevice } from "../utils/initTwilio";

export const useInboundCall = () => {
  const { twilioDevice } = useTwilio();

  const [inboundCall, setInboundCall] = useState<Call | null>(null);
  const [isInboundCallDialogOpen, setIsDialogOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const hangupTimer = useRef<any>(null);

  const activeCallRef = useRef<Call | null>(null);

  useEffect(() => {
    if (!twilioDevice) return;

    const device = getTwilioDevice();

    const onIncomingHandler = (call: Call) => {
      const params = new URLSearchParams(call.parameters?.Params || "");
      const isOutbound = params.get("outbound") === "true";

      if (isOutbound) {
        console.log("Outbound call received in useInboundCall — skipping.");
        return;
      }

      console.log("Inbound call received", call);
      activeCallRef.current = call;
      setInboundCall(call);
      setIsDialogOpen(true);
    };

    const onRegisteredHandler = () => {
      console.log("Twilio device registered");
    };

    const onErrorHandler = (err: Error) => {
      console.error("Twilio error in useInboundCall:", err.message);
    };

    const attachTwilioHandlers = () => {
      if (!device) {
        console.warn("Twilio device not initialized");
        return;
      }

      device.on("incoming", onIncomingHandler);
      device.on("registered", onRegisteredHandler);
      device.on("error", onErrorHandler);
    };

    attachTwilioHandlers();

    return () => {
      device!.off("incoming", onIncomingHandler);
      device!.off("error", onErrorHandler);
    };
  }, [twilioDevice]);

  useEffect(() => {
    if (!inboundCall) return;

    const onDisconnect = () => {
      console.log("Inbound call ended by remote");
      stagedClose();
    };

    inboundCall.on("disconnect", onDisconnect);

    return () => {
      inboundCall.off("disconnect", onDisconnect);
    };
  }, [inboundCall]);

  const stagedClose = () => {
    if (hangupTimer.current) clearTimeout(hangupTimer.current);

    hangupTimer.current = setTimeout(() => {
      setIsDialogOpen(false);
      setInboundCall(null);
      setAccepted(false);
    }, 1000);
  };

  const acceptCall = () => {
    if (activeCallRef.current) {
      activeCallRef.current.accept();
      setIsDialogOpen(false);
    }
  };

  const rejectCall = () => {
    if (activeCallRef.current) {
      activeCallRef.current.reject();
      setIsDialogOpen(false);
    }
  };

  const hangUp = () => {
    inboundCall?.disconnect();
    stagedClose();
  };

  return {
    isInboundCallDialogOpen,
    from: inboundCall?.parameters?.From || "",
    accepted,
    acceptCall,
    rejectCall,
    hangUp,
  };
};
