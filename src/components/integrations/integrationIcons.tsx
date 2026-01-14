import { SvgIconProps } from "@mui/material";
import { Http, Hub, Timeline } from "@mui/icons-material";

export const WebhookIcon = (props: SvgIconProps) => (
  <Http fontSize="large" {...props} />
);

export const HubSpotIcon = (props: SvgIconProps) => (
  <Hub fontSize="large" {...props} />
);

export const ActivityIcon = (props: SvgIconProps) => (
  <Timeline fontSize="large" {...props} />
);

