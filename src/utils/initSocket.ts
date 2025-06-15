import { io, Socket } from "socket.io-client";

import config from "../config";

let socketInstance: Socket | null = null;

export const initSocket = (userId: string) => {
  if (socketInstance) return socketInstance;

  socketInstance = io(config.backendDomain, {
    withCredentials: true,
  });

  socketInstance.on("connect", () => {
    console.log("Connected to backend socket:", socketInstance!.id);
    socketInstance!.emit("join-room", { roomId: `user-${userId}` });
  });

  return socketInstance;
};
