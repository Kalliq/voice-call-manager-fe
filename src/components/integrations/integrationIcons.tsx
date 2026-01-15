import { SvgIconProps } from "@mui/material";
import WebhookIconMui from "@mui/icons-material/Webhook";
import { Hub, Timeline } from "@mui/icons-material";

/**
 * Centralized integration icons.
 * Swap icons here to update all integration UI locations.
 */

export const WebhookIcon = (props: SvgIconProps) => (
  <WebhookIconMui fontSize="large" {...props} />
);

export const HubSpotIcon = (props: SvgIconProps) => (
  <Hub fontSize="large" {...props} />
);

export const ActivityIcon = (props: SvgIconProps) => (
  <Timeline fontSize="large" {...props} />
);
