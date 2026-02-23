import api from "../utils/axiosInstance";

export interface EmailTemplate {
  id: string;
  name: string;
  type: "Personal" | "Organization";
  subject?: string;
  bodyHtml: string;
  updatedAt: string;
}

export interface GmailStatus {
  connected: boolean;
  emailAddress?: string;
}

export const fetchEmailSignature = async () => {
  const { data } = await api.get<{ html: string }>("/email/signature");
  return data;
};

export const updateEmailSignature = async (html: string) => {
  const { data } = await api.put("/email/signature", { html });
  return data;
};

export const fetchGmailStatus = async () => {
  const { data } = await api.get<GmailStatus>("/email/gmail/status");
  return data;
};

export const disconnectGmail = async () => {
  const { data } = await api.delete("/email/gmail/disconnect");
  return data;
};

export const fetchEmailTemplates = async () => {
  const { data } = await api.get<EmailTemplate[]>("/email/templates");
  return data;
};

export const createEmailTemplate = async (payload: {
  name: string;
  type: "Personal" | "Organization";
  subject?: string;
  bodyHtml: string;
}) => {
  const { data } = await api.post("/email/templates", payload);
  return data;
};

export const updateEmailTemplate = async ({
  id,
  ...payload
}: {
  id: string;
  name: string;
  type: "Personal" | "Organization";
  subject?: string;
  bodyHtml: string;
}) => {
  const { data } = await api.put(`/email/templates/${id}`, payload);
  return data;
};

export const deleteEmailTemplate = async (id: string) => {
  const { data } = await api.delete(`/email/templates/${id}`);
  return data;
};
