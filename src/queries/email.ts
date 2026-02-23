import { useQuery } from "@tanstack/react-query";
import {
  GET_EMAIL_SIGNATURE_KEY,
  GET_GMAIL_STATUS_KEY,
  GET_EMAIL_TEMPLATES_KEY,
} from "./constants";
import {
  fetchEmailSignature,
  fetchGmailStatus,
  fetchEmailTemplates,
} from "../api/email";

export const useGetEmailSignature = () => {
  return useQuery({
    queryKey: GET_EMAIL_SIGNATURE_KEY,
    queryFn: fetchEmailSignature,
  });
};

export const useGetGmailStatus = () => {
  return useQuery({
    queryKey: GET_GMAIL_STATUS_KEY,
    queryFn: fetchGmailStatus,
  });
};

export const useGetEmailTemplates = () => {
  return useQuery({
    queryKey: GET_EMAIL_TEMPLATES_KEY,
    queryFn: fetchEmailTemplates,
  });
};
