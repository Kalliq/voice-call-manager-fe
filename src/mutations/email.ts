import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  EMAIL_UPDATE_SIGNATURE_KEY,
  EMAIL_DISCONNECT_GMAIL_KEY,
  EMAIL_CREATE_TEMPLATE_KEY,
  EMAIL_UPDATE_TEMPLATE_KEY,
  EMAIL_DELETE_TEMPLATE_KEY,
} from "./constants";
import {
  GET_EMAIL_SIGNATURE_KEY,
  GET_GMAIL_STATUS_KEY,
  GET_EMAIL_TEMPLATES_KEY,
  GET_SETTINGS_KEY,
} from "../queries/constants";
import {
  updateEmailSignature,
  disconnectGmail,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from "../api/email";

export const useUpdateEmailSignature = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: EMAIL_UPDATE_SIGNATURE_KEY,
    mutationFn: updateEmailSignature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_EMAIL_SIGNATURE_KEY });
      queryClient.invalidateQueries({ queryKey: GET_SETTINGS_KEY });
    },
  });
};

export const useDisconnectGmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: EMAIL_DISCONNECT_GMAIL_KEY,
    mutationFn: disconnectGmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_GMAIL_STATUS_KEY });
    },
  });
};

export const useCreateEmailTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: EMAIL_CREATE_TEMPLATE_KEY,
    mutationFn: createEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_EMAIL_TEMPLATES_KEY });
    },
  });
};

export const useUpdateEmailTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: EMAIL_UPDATE_TEMPLATE_KEY,
    mutationFn: updateEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_EMAIL_TEMPLATES_KEY });
    },
  });
};

export const useDeleteEmailTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: EMAIL_DELETE_TEMPLATE_KEY,
    mutationFn: deleteEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_EMAIL_TEMPLATES_KEY });
    },
  });
};
