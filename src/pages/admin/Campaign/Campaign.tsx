import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Stack, Container } from "@mui/material";
import { TelephonyConnection } from "voice-javascript-common";

import api from "../../../utils/axiosInstance";
import useAppStore from "../../../store/useAppStore";

import DialingCards from "./components/DialingCards";
import SingleCallCampaignPanel from "./components/SingleCallCampaign";
import { useCampaign } from "./useCampaign";
import { useSocketReady } from "./useSocketReady";
import { SimpleButton } from "../../../components/UI";
import { CallSession, Contact } from "../../../types/contact";
import { CallResult } from "../../../types/call-results";
import ContinueDialog from "./components/ContinueDIalog";
import {
  getDialingSessionsWithStatuses,
  getSingleDialingSessionWithStatus,
} from "../../../utils/getDialingSessionsWithStatuses";
import { useRingingTone } from "./useRingingTone";
import { useAuth } from "../../../contexts/AuthContext";
import { useSnackbar } from "../../../hooks/useSnackbar";
import MinimalCallPanel from "./components/MinimalCallPanel";

interface LocationState {
  contacts: any[];
  mode: TelephonyConnection;
  contactId: string;
  phone: string;
  defaultDisposition: string;
  autoStart: boolean;
}

const Campaign = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { contacts, mode, contactId, phone, defaultDisposition, autoStart } =
    (location.state || {}) as LocationState;
  const { phoneState } = useAuth();
  const { socket, volumeHandler, hangUpHandler } = phoneState;
  const { enqueue } = useSnackbar();

  const { user, settings } = useAppStore((state) => state);

  const shouldRedirect = !socket || !user || !settings;

  useEffect(() => {
    if (shouldRedirect) {
      navigate("/dashboard", { replace: true, state: { from: location } });
    }
  }, [shouldRedirect, navigate, location]);

  const { ready: isSocketReady, reason: socketReason } = useSocketReady(
    socket,
    user?.id
  );

  const callResults: CallResult[] =
    (settings?.["Phone Settings"]?.callResults as CallResult[]) ?? [];

  const [manualSession, setManualSession] = useState<CallSession | null>(null);
  const [callStarted, setCallStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStartingNextCall, setIsStartingNextCall] = useState(false);

  useEffect(() => {
    if (contactId && !contacts && !mode) {
      api.get(`/contacts/${contactId}`).then((res) => {
        setManualSession(res.data);
      });
    }
  }, [contactId]);

  // State management for the dialog box
  const [contactNotes, setContactNotes] = useState<Record<string, string>>({});
  const [selectedResults, setSelectedResults] = useState<
    Record<string, string>
  >({});

  // Private hook state variables
  const {
    currentIndex,
    isCampaignRunning,
    isCampaignFinished,
    showContinueDialog,
    ringingSessions,
    answeredSession,
    pendingResultContacts,
    currentBatch,
    currentBatchRef,
    lastAnsweredId,
    setCurrentBatch,
    setIsCampaignRunning,
    setIsCampaignFinished,
    setCurrentIndex,
    setPendingResultContacts,
    setShowContinueDialog,
    setStatus,
    setRingingSessions,
    handleHangUp,
    handleHangUpNotKnown,
    handleNumpadClick,
  } = useCampaign({
    userId: user!.id ?? "",
    socket,
    enabled: isSocketReady,
    callEventHandlers: {
      volumeHandler,
      hangUpHandler,
    },
  });

  useRingingTone({ ringingSessions, answeredSession });

  // MODE DETECTION - Determine if this is one-off call vs batch/power dialer
  // One-off: phone present, no manualSession, no contacts array, no mode
  // Batch: contacts array present OR isCampaignRunning with mode
  const isOneOff = useMemo(() => {
    return !!(phone && !manualSession && !contacts && !mode);
  }, [phone, manualSession, contacts, mode]);

  const isBatchDial = useMemo(() => {
    return !!(contacts || (isCampaignRunning && mode));
  }, [contacts, isCampaignRunning, mode]);

  // STABLE DIALER STATE MACHINE - Only moves forward, prevents flicker
  // This centralizes UI interpretation and ensures UI never reacts directly to raw event timing
  const dialerState = useMemo(() => {
    // Priority order (highest to lowest) - ensures only ONE state is active
    if (isStartingNextCall && isBatchDial) {
      return "TRANSITIONING" as const;
    }
    if (answeredSession) {
      return "IN_CALL" as const;
    }
    if (callStarted || ringingSessions.length > 0) {
      return "DIALING" as const;
    }
    return "IDLE" as const;
  }, [isStartingNextCall, isBatchDial, answeredSession, callStarted, ringingSessions.length]);

  // STABLE CALL BAR VISIBILITY - Prevents flicker
  // CallBar stays visible during transitions and active calls
  const shouldShowCallBar = useMemo(() => {
    return dialerState === "DIALING" || dialerState === "IN_CALL" || dialerState === "TRANSITIONING";
  }, [dialerState]);

  // Guaranteed cleanup: reset callStarted when call ends (remote hangup, terminal status, etc.)
  // FIX: For one-off calls, ringingSessions is always empty, so don't use it as a condition
  // One-off cleanup relies on socket terminal status events, not ringingSessions check
  useEffect(() => {
    // Skip cleanup for one-off calls during initial start phase
    // One-off calls never populate ringingSessions, so this check would always be true
    if (isOneOff) {
      return;
    }
    
    // For batch/power dialer: If callStarted is true but there's no active call (answeredSession is null)
    // and no ringing calls, then the call has ended → reset to idle
    if (
      callStarted &&
      answeredSession === null &&
      ringingSessions.length === 0
    ) {
      setCallStarted(false);
    }
  }, [callStarted, answeredSession, ringingSessions, isOneOff]);

  // Clear isStartingNextCall when call actually starts or on error
  useEffect(() => {
    if (callStarted) {
      setIsStartingNextCall(false);
    }
  }, [callStarted]);

  useEffect(() => {
    if (error) {
      setIsStartingNextCall(false);
    }
  }, [error]);

  useEffect(() => {
    if (shouldRedirect)
      navigate("/dashboard", { replace: true, state: { from: location } });
  }, [shouldRedirect, navigate, location]);

  const guardNoSocket = () => {
    if (!isSocketReady) {
      enqueue(
        `Real-time connection not ready${
          socketReason ? `: ${socketReason}` : ""
        }`,
        { variant: "warning" }
      );
      return true;
    }
    return false;
  };

  const resolvedMode = mode ?? TelephonyConnection.SOFT_CALL;
  const callsPerBatch = {
    [TelephonyConnection.SOFT_CALL]: 1,
    [TelephonyConnection.PARALLEL_CALL]: 2,
    [TelephonyConnection.ADVANCED_PARALLEL_CALL]: 4,
  }[resolvedMode];

  const singleSession = getSingleDialingSessionWithStatus(currentBatch);

  const makeCallNotKnown = async (phone: string) => {
    if (guardNoSocket()) return;
    try {
      await api.post("/campaign/call-notknown", {
        phone,
      });
      // Only set callStarted after backend confirms call creation
      setCallStarted(true);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to start call. Please try again.";
      enqueue(errorMessage, { variant: "error" });
      setError(errorMessage);
      // Do NOT set callStarted on error - UI stays in idle state
    }
  };

  const makeCallBatch = async () => {
    if (guardNoSocket()) return;
    let slice: Contact[];
    if (contacts) {
      slice = contacts.slice(currentIndex, currentIndex + callsPerBatch);
      if (slice.length === 0) {
        setIsCampaignFinished(true);
        setRingingSessions([]);
        setIsCampaignRunning(false);
        return;
      }
    } else if (contactId) {
      slice = [manualSession as Contact];
    } else {
      enqueue("Some error happened. Please try again!", { variant: "error" });
      return;
    }

    try {
      const { data } = await api.post("/contacts/batch", {
        ids: slice.map((contact) => contact.id),
      });
      const batchContacts = data;

      const activeCalls = await api.post("/campaign/call-campaign", {
        contacts: batchContacts,
      });
      // Only set callStarted after backend confirms call creation
      setCallStarted(true);
      
      const extendedBatchContactsWithSid = batchContacts.map(
        (batchContact: Contact) => {
          const call = activeCalls.data.find((activeCall: any) => {
            return batchContact.phone === activeCall.phoneNumber;
          });

          return { ...batchContact, callSid: call.callSid };
        }
      );

      setCurrentBatch(extendedBatchContactsWithSid);
      currentBatchRef.current = extendedBatchContactsWithSid;
      setStatus(`Calling ${batchContacts.length} contact(s)...`);
      setCurrentIndex((prev) => prev + callsPerBatch);
    } catch (error: any) {
      const msg = error.response.data.errors[0].message;
      setError(typeof msg === "string" ? msg : error.message);
      setIsStartingNextCall(false);
      // Do NOT set callStarted on error - UI stays in idle state
    }
  };

  const handleStartCampaign = () => {
    setIsCampaignRunning(true);
    setIsCampaignFinished(false);
    setCurrentIndex(0);
    makeCallBatch();
  };

  const handleContinue = () => {
    setShowContinueDialog(false);
    // Only set transition state for batch dialer, not one-off calls
    if (isBatchDial) {
      setIsStartingNextCall(true);
    }
    makeCallBatch();
  };

  const handleStopCampaign = () => {
    setIsCampaignRunning(false);
    setShowContinueDialog(false);
    setIsCampaignFinished(true);
    setStatus("Campaign manually stopped!");
    api.post("/campaign/stop-campaign");
  };

  const handleDialogClose = () => {
    setShowContinueDialog(false);
    makeCallBatch();
  };

  const handleResult = async (contact: Contact, result: string) => {
    await api.patch(`/contacts/${contact.id}`, {
      result,
      notes: contactNotes[contact.id] || "",
      timestamp: Date.now(),
      callSid: contact.callSid || null,
    });
  };

  const maybeProceedWithNextBatch = () => {
    if (!manualSession && isCampaignRunning) {
      handleContinue();
    }
  };

  const hangUpNotKnown = () => {
    api.post("/campaign/stop-campaign");
    handleHangUpNotKnown();
    setCallStarted(false);
  };

  const hangUp = () => {
    api.post("/campaign/stop-campaign");
    handleHangUp();
    setCallStarted(false);
  };

  // TO DO -- in the campaign mode answeredSession is passed to two props
  // fix that redundancy in the whole component

  return (
    <Container sx={{ py: 4 }}>
      {!isSocketReady && (
        <Alert severity="warning">
          Reconnecting to real-time service… You can’t start a campaign until
          it’s ready.
        </Alert>
      )}
      <Stack spacing={3}>
        {!contactId && !phone && (
          <Stack direction="row" spacing={1} justifyContent="center">
            <SimpleButton
              label="Start campaign"
              onClick={handleStartCampaign}
              disabled={!isSocketReady || isCampaignRunning}
            />
            <SimpleButton
              label="Stop campaign"
              onClick={handleStopCampaign}
              disabled={!isCampaignRunning}
            />
          </Stack>
        )}
        {/* "Starting next call..." only for batch/power dialer, not one-off calls */}
        {isStartingNextCall && isBatchDial && (
          <Alert severity="info" sx={{ mt: 3 }}>
            Starting next call...
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {phone && !manualSession && (
          <MinimalCallPanel
            answeredSession={answeredSession as boolean}
            phone={phone}
            onStartCall={makeCallNotKnown}
            onEndCall={hangUpNotKnown}
            callStarted={callStarted}
            handleNumpadClick={handleNumpadClick}
          />
        )}

        {!autoStart && manualSession && (
          <SingleCallCampaignPanel
            session={manualSession}
            answeredSession={answeredSession as Contact}
            onStartCall={handleStartCampaign}
            onEndCall={hangUp}
            manual={true}
            phone={phone}
            callStarted={callStarted}
            handleNumpadClick={handleNumpadClick}
          />
        )}

        {!phone && !manualSession && !autoStart && (
          <>
            {/* STABLE DIALER CONTAINER - Always mounted to prevent layout jumps */}
            {!isCampaignFinished && isCampaignRunning && mode === TelephonyConnection.SOFT_CALL && singleSession && (
              <SingleCallCampaignPanel
                session={singleSession}
                answeredSession={dialerState === "IN_CALL" ? (answeredSession as Contact) : null}
                onEndCall={hangUp}
                manual={false}
                callStarted={dialerState === "DIALING" || dialerState === "IN_CALL"}
                handleNumpadClick={handleNumpadClick}
              />
            )}
            {/* Fallback: Show DialingCards only when truly idle (not transitioning) */}
            {!isCampaignFinished && 
             isCampaignRunning && 
             mode === TelephonyConnection.SOFT_CALL && 
             !singleSession && 
             dialerState === "IDLE" && 
             currentBatch.length > 0 && (
              <DialingCards
                sessions={getDialingSessionsWithStatuses(
                  currentBatch,
                  ringingSessions,
                  pendingResultContacts
                )}
              />
            )}
          </>
        )}

        {/* <AudioDevicesList devices={devices} /> */}
      </Stack>
      <ContinueDialog
        callResults={callResults}
        contactNotes={contactNotes}
        currentBatch={currentBatch}
        pendingResultContacts={pendingResultContacts}
        selectedResults={selectedResults}
        showContinueDialog={showContinueDialog}
        handleDialogClose={handleDialogClose}
        setSelectedResults={setSelectedResults}
        setPendingResultContacts={setPendingResultContacts}
        setShowContinueDialog={setShowContinueDialog}
        setIsCampaignFinished={setIsCampaignFinished}
        setContactNotes={setContactNotes}
        maybeProceedWithNextBatch={maybeProceedWithNextBatch}
        handleStopAndSkip={handleStopCampaign}
        handleResult={handleResult}
        isCampaign={!manualSession}
        answeredSessionId={lastAnsweredId}
        mode={mode}
        defaultDisposition={defaultDisposition}
        setIsStartingNextCall={setIsStartingNextCall}
      />
      {isCampaignFinished && (
        <Alert severity="success" sx={{ mt: 3 }}>
          {contacts &&
          contacts.slice(currentIndex, currentIndex + callsPerBatch).length ===
            0
            ? "Call campaign completed!"
            : "Call campaign stopped!"}
        </Alert>
      )}
    </Container>
  );
};

export default Campaign;
