import { useEffect, useState, useRef } from "react";
import { Call } from "@twilio/voice-sdk";

import { useAuth } from "../contexts/AuthContext";

export const useInboundCall = () => {
  const { phoneState } = useAuth();
  const { twilioDevice, registerInboundHandler } = phoneState;

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
    if (!twilioDevice || !registerInboundHandler) return;

    const onIncomingHandler = (call: Call) => {
      console.log("useInboundCall - Inbound call received", call);
      
      // Note: isOutbound check is now done by dispatcher in useAdminPhone
      // This handler only receives inbound calls

      activeCallRef.current = call;
      setInboundCall(call);
      setIsDialogOpen(true);
    };

    registerInboundHandler(onIncomingHandler);

    return () => {
      registerInboundHandler(null);
    };
  }, [twilioDevice, registerInboundHandler]);

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
