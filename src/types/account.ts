export interface Account {
  id: string;
  createdByUserId: string;
  companyName: string;
  location?: string;
  zipCode?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  website: string;
  industry?: string;
  tenantId?: string;
}

export type AccountFormData = Omit<Account, "id" | "createdByUserId"> & {
  id?: string;
  userId?: string;
};
