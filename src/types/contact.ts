import { Contact as ContactBase } from "voice-javascript-common";

export interface PhoneField {
  number: string;
  isBad: boolean;
  isFavourite: boolean;
}

type Contact = Omit<ContactBase, "phone"> & {
  phone?: PhoneField;
  mobile?: PhoneField;
  other?: PhoneField;
  account?: { id: string; companyName: string };
  [key: string]: unknown;
};

type CallSession = Contact & {
  status: string;
};

export function getContactDialNumber(contact: Contact): string {
  const phones = [contact.phone, contact.mobile, contact.other].filter(
    (p): p is PhoneField => !!p && !!p.number,
  );
  const fav = phones.find((p) => p.isFavourite);
  return fav?.number || contact.phone?.number || "";
}

export function emptyPhoneField(): PhoneField {
  return { number: "", isBad: false, isFavourite: false };
}

export { Contact, CallSession };
