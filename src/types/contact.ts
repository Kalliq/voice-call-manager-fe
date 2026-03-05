import { Contact as ContactBase } from "voice-javascript-common";

type Contact = ContactBase & {
  account?: { id: string; companyName: string; website: string, description: string };
  [key: string]: unknown;
};

type CallSession = Contact & {
  status: string;
};

export { Contact, CallSession };
