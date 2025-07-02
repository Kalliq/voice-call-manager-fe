type PhoneNumber = {
  number: string;
  friendlyName?: string;
  user?: string;
  assigned?: boolean;
  released?: boolean;
  spammed?: boolean;
  lastUsed?: Date;
  usageCount: number;
  cooldown: boolean;
};

export { PhoneNumber };
