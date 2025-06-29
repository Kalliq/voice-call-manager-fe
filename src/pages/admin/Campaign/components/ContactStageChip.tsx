import React, { useState } from "react";
import { Chip, Menu, MenuItem } from "@mui/material";

import { Contact } from "../../../../types/contact";

// TO DO -- add to common module
const stages = ["cold", "lead", "disqualified", "nurture"];

type ContactStageChipProps = {
  contact: Contact;
  onStageChange: (stage: string) => Promise<void>;
};

const ContactStageChip = ({
  contact,
  onStageChange,
}: ContactStageChipProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (stage: string) => {
    handleClose();
    onStageChange(stage);
  };

  return (
    <>
      <Chip
        label={contact.status ?? "cold"}
        size="small"
        variant="outlined"
        color="default"
        onClick={handleOpen}
        sx={{ cursor: "pointer" }}
      />
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {stages.map((stage) => (
          <MenuItem key={stage} onClick={() => handleSelect(stage)}>
            {stage}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ContactStageChip;
