import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Alert, Stack, Container } from "@mui/material";
import { Socket } from "socket.io-client";

import api from "../../../utils/axiosInstance";
import useAppStore from "../../../store/useAppStore";

import StatusLine from "./components/DeviceStatus";
import DialingCards from "./components/DialingCards";
import ActiveDialingCard from "./components/ActiveDialingCard";
import { useCampaign } from "./useCampaign";
import { SimpleButton } from "../../../components/UI";
import { Contact } from "../../../types/contact";
import { CallResult } from "../../../types/call-results";
import ContinueDialog from "./components/ContinueDIalog";
import { getDialingSessionsWithStatuses } from "../../../utils/getDialingSessionsWithStatuses";
import { useRingingTone } from "./useRingingTone";
import { useTwilio } from "../../../contexts/TwilioContext";

enum TelephonyConnection {
  SOFT_CALL = "Soft call",
  PARALLEL_CALL = "Two Parallel calls",
  ADVANCED_PARALLEL_CALL = "Four Parallel calls",
}

interface LocationState {
  contacts: any[];
  mode: TelephonyConnection;
}

const Campaign = () => {
  const location = useLocation();
  const { contacts, mode } = (location.state || {}) as LocationState;
  const { socket, inputVolume, outputVolume, volumeHandler, hangUpHandler } =
    useTwilio();
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

  // State management for the dialog box
  const [contactNotes, setContactNotes] = useState<Record<string, string>>({});
  const [selectedResults, setSelectedResults] = useState<
    Record<string, string>
  >({});

  // Private hook state variables
  const {
    status,
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

  const makeCallBatch = async () => {
    // TO-DO implement try-catch
    const slice = contacts.slice(currentIndex, currentIndex + callsPerBatch);
    if (slice.length === 0) {
      setIsCampaignFinished(true);
      setRingingSessions([]);
      setIsCampaignRunning(false);
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
          return batchContact.mobile_phone === activeCall.phoneNumber;
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
    if (isCampaignRunning) {
      handleContinue();
    }
  };

  const hangUp = () => {
    api.post("/campaign/stop-campaign");
    handleHangUp();
  };

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
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

        {/* Dialing Cards Section */}
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
            session={answeredSession}
            inputVolume={inputVolume}
            outputVolume={outputVolume}
            hangUp={hangUp}
          />
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
        handleStopCampaign={handleStopCampaign}
        handleResult={handleResult}
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
