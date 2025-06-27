import { CallSession } from "../types/contact";

export const getDialingSessionsWithStatuses = (
  batch: CallSession[],
  ringingSessions: CallSession[],
  pendingResultContacts: CallSession[]
) => {
  return batch.map((contact) => {
    const isRinging = ringingSessions.some((c) => c.id === contact.id);
    const isCompleted = pendingResultContacts.some((c) => c.id === contact.id);
    let status = "Starting";
    if (isRinging) {
      status = "Ringing";
    } else if (isCompleted) {
      status = "Completed";
    }
    return {
      ...contact,
      status,
    };
  });
};

export function getSingleDialingSessionWithStatus(
  batch: CallSession[]
): CallSession | null {
  if (batch.length === 0) return null;
  const contact = batch[0];
  return { ...contact, status: "Active" };
}
