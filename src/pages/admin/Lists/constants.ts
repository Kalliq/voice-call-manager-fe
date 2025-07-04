import { TelephonyConnection } from "voice-javascript-common";

export const connectionDisplayMap: { [key: string]: string } = {
  [TelephonyConnection.SOFT_CALL]: "x1",
  [TelephonyConnection.PARALLEL_CALL]: "x2",
  [TelephonyConnection.ADVANCED_PARALLEL_CALL]: "x4",
};
