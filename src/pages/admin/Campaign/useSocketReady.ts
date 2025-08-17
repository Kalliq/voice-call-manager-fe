// useSocketReady.ts
import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

export const useSocketReady = (socket: Socket | undefined, userId?: string) => {
  const [ready, setReady] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !userId) {
      setReady(false);
      setReason("Missing socket or user");
      return;
    }

    let disposed = false;

    const joinRoom = () => {
      socket.emit("join-user-room", { userId }, (ack?: { ok?: boolean }) => {
        if (disposed) return;
        if (ack?.ok) {
          setReady(true);
          setReason(null);
        } else {
          setReady(false);
          setReason("Room join failed");
        }
      });
    };

    const onConnect = () => {
      setReason(null);
      joinRoom();
    };
    const onDisconnect = () => {
      setReady(false);
      setReason("Disconnected");
    };
    const onConnectError = (err: any) => {
      setReady(false);
      setReason(err?.message || "Connect error");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    if (socket.connected) joinRoom();

    return () => {
      disposed = true;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, [socket, userId]);

  return { ready, reason };
};
