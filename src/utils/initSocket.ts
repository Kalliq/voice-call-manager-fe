import { io, Socket } from "socket.io-client";

import config from "../config";

let socketInstance: Socket | null = null;
let currentRoomId: string | null = null;

export const initSocket = (userId: string) => {
  const desiredRoom = `user-${userId}`;

  if (socketInstance) {
    if (socketInstance.connected) {
      if (currentRoomId !== desiredRoom) {
        if (currentRoomId)
          socketInstance.emit("leave-room", { roomId: currentRoomId });
        socketInstance.emit("join-room", { roomId: desiredRoom });
        currentRoomId = desiredRoom;
      }
    } else {
      socketInstance.once("connect", () => {
        socketInstance!.emit("join-room", { roomId: desiredRoom });
        currentRoomId = desiredRoom;
      });
    }

    return socketInstance;
  }

  socketInstance = io(config.backendDomain, {
    withCredentials: true,
  });

  socketInstance.on("connect", () => {
    socketInstance!.emit("join-room", { roomId: `user-${userId}` });
    currentRoomId = desiredRoom;
    console.log("Connected to backend socket:", socketInstance!.id);
  });

  return socketInstance;
};

export const destroySocket = () => {
  if (socketInstance) {
    try {
      if (currentRoomId) {
        socketInstance.emit("leave-room", { roomId: currentRoomId });
      }
      socketInstance.disconnect();
    } finally {
      socketInstance = null;
      currentRoomId = null;
    }
  }
};
