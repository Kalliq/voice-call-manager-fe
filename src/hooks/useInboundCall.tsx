import { useEffect, useState, useRef } from "react";
import { Call } from "@twilio/voice-sdk";

import { useAuth } from "../contexts/AuthContext";

export const useInboundCall = () => {
  const { phoneState } = useAuth();
  const { twilioDevice, registerInboundHandler, socket } = phoneState;

  const [inboundCall, setInboundCall] = useState<Call | null>(null);
  const [isInboundCallDialogOpen, setIsDialogOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const hangupTimer = useRef<any>(null);

  const activeCallRef = useRef<Call | null>(null);

  useEffect(() => {
    if (!inboundCall) return;

    let cleanupCalled = false;

    const cleanup = () => {
      if (cleanupCalled) return;
      cleanupCalled = true;
      stagedClose();
      
      // Reset Campaign answeredSession state by triggering handleCallStatus logic
      // Since handleCallStatus (useCampaign.ts line 131-136) resets answeredSession
      // when !contact && final status, we emit a custom event that Campaign can listen to
      // OR we can directly dispatch a custom event that useCampaign can handle
      // For now, we'll use a window event as a bridge since hooks can't directly communicate
      window.dispatchEvent(new CustomEvent("inbound-call-ended", {
        detail: { status: "completed" }
      }));
    };

    const onDisconnect = () => {
      console.log("Inbound call ended by remote");
      cleanup();
    };

    const onCancel = () => {
      console.log("Inbound call canceled");
      cleanup();
    };

    const onError = (error: any) => {
      console.error("Inbound call error:", error);
      cleanup();
    };

    inboundCall.on("disconnect", onDisconnect);
    inboundCall.on("cancel", onCancel);
    inboundCall.on("error", onError);

    return () => {
      inboundCall.off("disconnect", onDisconnect);
      inboundCall.off("cancel", onCancel);
      inboundCall.off("error", onError);
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
