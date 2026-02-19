import { Contact as ContactBase } from "voice-javascript-common";

type Contact = ContactBase & {
  account?: { id: string; companyName: string };
  [key: string]: unknown;
};

type CallSession = Contact & {
  status: string;
};

export { Contact, CallSession };
