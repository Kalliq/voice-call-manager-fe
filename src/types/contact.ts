import { Contact as ContactBase } from "voice-javascript-common";

type Contact = ContactBase & {
  [key: string]: unknown;
};

type CallSession = Contact & {
  status: string;
};

export { Contact, CallSession };
