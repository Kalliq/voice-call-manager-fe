import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Alert, Stack, Container } from "@mui/material";

import api from "../../../utils/axiosInstance";
import useAppStore from "../../../store/useAppStore";

import DialingCards from "./components/DialingCards";
import ActiveDialingCard from "./components/ActiveDialingCard";
import SingleCallCampaignPanel from "./components/SingleCallCampaign";
import { useCampaign } from "./useCampaign";
import { SimpleButton } from "../../../components/UI";
import { CallSession, Contact } from "../../../types/contact";
import { CallResult } from "../../../types/call-results";
import ContinueDialog from "./components/ContinueDIalog";
import {
  getDialingSessionsWithStatuses,
  getSingleDialingSessionWithStatus,
} from "../../../utils/getDialingSessionsWithStatuses";
import { useRingingTone } from "./useRingingTone";
import { useTwilio } from "../../../contexts/TwilioContext";
import { useSnackbar } from "../../../hooks/useSnackbar";
import MinimalCallPanel from "./components/MinimalCallPanel";

enum TelephonyConnection {
  SOFT_CALL = "Soft call",
  PARALLEL_CALL = "Two Parallel calls",
  ADVANCED_PARALLEL_CALL = "Four Parallel calls",
}

interface LocationState {
  contacts: any[];
  mode: TelephonyConnection;
  contactId: string;
  phone: string;
  autoStart: boolean;
}

const Campaign = () => {
  const location = useLocation();
  const { contacts, mode, contactId, phone, autoStart } = (location.state ||
    {}) as LocationState;
  const { socket, inputVolume, outputVolume, volumeHandler, hangUpHandler } =
    useTwilio();
  const { enqueue } = useSnackbar();
  if (!socket) {
    throw new Error("Socket not initialized properly!");
  }

  const { user, settings } = useAppStore((state) => state);
  if (!user) {
    throw new Error("Problem with authentication. Missing user!");
  }
  if (!settings) {
    throw new Error("Missing settings!");
  }

  const callResults = settings["Phone Settings"].callResults as CallResult[];
  const [manualSession, setManualSession] = useState<CallSession | null>(null);

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
  } = useCampaign({
    userId: user!.id,
    socket,
    callEventHandlers: {
      volumeHandler,
      hangUpHandler,
    },
  });

  useRingingTone({ ringingSessions, answeredSession });

  const callsPerBatch = {
    [TelephonyConnection.SOFT_CALL]: 1,
    [TelephonyConnection.PARALLEL_CALL]: 2,
    [TelephonyConnection.ADVANCED_PARALLEL_CALL]: 4,
  }[mode];

  const singleSession = getSingleDialingSessionWithStatus(currentBatch);

  const makeCallNotKnown = async (phone: string) => {
    await api.post("/campaign/call-notknown", {
      phone,
    });
  };

  const makeCallBatch = async () => {
    // TO-DO implement try-catch
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

    const { data } = await api.post("/contacts/batch", {
      ids: slice.map((contact) => contact.id),
    });
    const batchContacts = data;

    const activeCalls = await api.post("/campaign/call-campaign", {
      contacts: batchContacts,
    });

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
  };

  const handleStartCampaign = () => {
    setIsCampaignRunning(true);
    setIsCampaignFinished(false);
    setCurrentIndex(0);
    makeCallBatch();
  };

  const handleContinue = () => {
    setShowContinueDialog(false);
    makeCallBatch();
  };

  const handleStopCampaign = () => {
    setIsCampaignRunning(false);
    setShowContinueDialog(false);
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
    });
  };

  const maybeProceedWithNextBatch = () => {
    if (isCampaignRunning && mode !== TelephonyConnection.SOFT_CALL) {
      handleContinue();
    }
  };

  const hangUpNotKnown = () => {
    api.post("/campaign/stop-campaign");
    handleHangUpNotKnown();
  };

  const hangUp = () => {
    api.post("/campaign/stop-campaign");
    handleHangUp();
  };

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        {!contactId && !phone && (
          <Stack direction="row" spacing={1} justifyContent="center">
            <SimpleButton
              label="Start campaign"
              onClick={handleStartCampaign}
              disabled={isCampaignRunning}
            />
            <SimpleButton
              label="Stop campaign"
              onClick={handleStopCampaign}
              disabled={!isCampaignRunning}
            />
          </Stack>
        )}

        {phone && !manualSession && (
          <MinimalCallPanel
            answeredSession={answeredSession as boolean}
            phone={phone}
            onStartCall={makeCallNotKnown}
            onEndCall={hangUpNotKnown}
            callStarted={false}
          />
        )}

        {!autoStart && manualSession && (
          <SingleCallCampaignPanel
            session={manualSession}
            answeredSession={answeredSession as Contact}
            onStartCall={makeCallBatch}
            onNextCall={() => {}}
            onEndCall={hangUp}
            manual={true}
            phone={phone}
          />
        )}

        {!phone && !manualSession && !autoStart && (
          <>
            {!isCampaignFinished &&
            isCampaignRunning &&
            mode === TelephonyConnection.SOFT_CALL &&
            singleSession ? (
              <SingleCallCampaignPanel
                session={singleSession}
                answeredSession={answeredSession as Contact}
                onNextCall={makeCallBatch}
                onEndCall={hangUp}
                manual={false}
              />
            ) : (
              <>
                {!isCampaignFinished && !answeredSession && (
                  <DialingCards
                    sessions={getDialingSessionsWithStatuses(
                      currentBatch,
                      ringingSessions,
                      pendingResultContacts
                    )}
                  />
                )}
                {!isCampaignFinished && answeredSession && (
                  <ActiveDialingCard
                    session={answeredSession as Contact}
                    inputVolume={inputVolume}
                    outputVolume={outputVolume}
                    hangUp={hangUp}
                  />
                )}
              </>
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
        setContactNotes={setContactNotes}
        maybeProceedWithNextBatch={maybeProceedWithNextBatch}
        handleStopAndSkip={handleStopCampaign}
        handleResult={handleResult}
        isCampaign={!manualSession}
      />
      {isCampaignFinished && (
        <Alert severity="success" sx={{ mt: 3 }}>
          Call campaign completed!
        </Alert>
      )}
    </Container>
  );
};

export default Campaign;
