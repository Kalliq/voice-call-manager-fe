import { useEffect, useState, useRef } from "react";
import { Call } from "@twilio/voice-sdk";

import { useAuth } from "../contexts/AuthContext";

export const useInboundCall = () => {
  const { phoneState } = useAuth();
  const { twilioDevice, setIncomingHandler } = phoneState;

  const [inboundCall, setInboundCall] = useState<Call | null>(null);
  const [isInboundCallDialogOpen, setIsDialogOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const hangupTimer = useRef<any>(null);

  const activeCallRef = useRef<Call | null>(null);

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

  useEffect(() => {
    if (!twilioDevice || !setIncomingHandler) return;

    const onIncomingHandler = (call: Call) => {
      console.log("useInboundCall");
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

    setIncomingHandler(() => onIncomingHandler);
  }, [twilioDevice]);

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
      setAccepted(true);
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
