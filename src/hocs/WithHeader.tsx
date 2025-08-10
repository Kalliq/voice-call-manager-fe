import { ComponentType } from "react";
import { Box, Typography, useTheme } from "@mui/material";

import Header from "../components/Header";

type WithHeaderProps = {
  component: ComponentType<any>;
};

const WithHeader = ({ component: Component }: WithHeaderProps) => {
  const theme = useTheme();

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      <Box component="main" flexGrow={1}>
        <Component />
      </Box>

      {/* Subtle Footer */}
      <Box
        component="footer"
        textAlign="center"
        py={1}
        bgcolor={theme.palette.background.paper}
        borderTop={`1px solid ${theme.palette.divider}`}
        color="text.secondary"
        fontSize="caption.fontSize"
      >
        <Typography variant="caption">
          © {new Date().getFullYear()} Kalliq — All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default WithHeader;
