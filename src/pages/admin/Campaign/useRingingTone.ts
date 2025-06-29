import { useEffect, useRef } from "react";
import { CallSession, Contact } from "../../../types/contact";

export const useRingingTone = ({
  ringingSessions,
  answeredSession,
}: {
  ringingSessions: CallSession[];
  answeredSession: Contact | boolean | null;
}) => {
  const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const hasRinging = ringingSessions.length > 0;
    const noAnswer = !answeredSession;

    if (hasRinging && noAnswer) {
      if (!ringtoneAudioRef.current) {
        ringtoneAudioRef.current = new Audio("/ringtone.wav");
        ringtoneAudioRef.current.loop = true;
      }

      ringtoneAudioRef.current.play().catch(() => {
        // Autoplay policy
      });
    } else {
      if (ringtoneAudioRef.current) {
        ringtoneAudioRef.current.pause();
        ringtoneAudioRef.current.currentTime = 0;
        ringtoneAudioRef.current = null;
      }
    }

    return () => {
      if (ringtoneAudioRef.current) {
        ringtoneAudioRef.current.pause();
        ringtoneAudioRef.current.currentTime = 0;
        ringtoneAudioRef.current = null;
      }
    };
  }, [ringingSessions.length, answeredSession]);
};
