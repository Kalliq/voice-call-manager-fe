import {
  TableRow,
  TableCell,
  IconButton,
  Box,
  Collapse,
  Table,
  TableHead,
  TableBody,
  Typography,
  useTheme,
  Tooltip,
} from "@mui/material";
import {
  ExpandMore,
  Edit,
  Delete,
  GroupOutlined,
  HelpOutline,
  Call,
  ContentCopy,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { TelephonyConnection } from "voice-javascript-common";
import ConnectionMenu from "./ConnectionMenu";
import StepRow from "./StepRow";
import { Step } from "../../../../interfaces/list-dialing-step";

interface ListCardProps {
  list: any;
  selectedCall: string;
  expanded: boolean;
  eligibleContacts: Record<number, any[]>;
  onExpand: (id: string, steps?: Step[]) => void;
  onConnectionClick: (e: React.MouseEvent<HTMLElement>, id: string) => void;
  onConnectionChange: (id: string, option: string) => void;
  anchorEl: HTMLElement | null;
  menuListId: string | null;
  closeMenu: () => void;
  onDeleteClick: (id: string) => void;
  onCloneClick: (id: string) => void;
  cloningId: string | null;
}

const ListCard = ({
  list,
  selectedCall,
  expanded,
  eligibleContacts,
  onExpand,
  onConnectionClick,
  onConnectionChange,
  anchorEl,
  menuListId,
  closeMenu,
  onDeleteClick,
  onCloneClick,
  cloningId,
}: ListCardProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const hasContacts = list.contacts?.length > 0;
  const contactCount = list.contacts?.length ?? 0;

  const handleDial = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    
    // Aggregate all eligible contacts from all steps
    const allContacts = Object.values(eligibleContacts ?? {}).flat();
    
    // Fallback to step.contacts if eligibleContacts not available
    const fallbackContacts = list.steps?.flatMap((step: Step) => step.contacts ?? []) ?? [];
    const contacts = allContacts.length > 0 ? allContacts : fallbackContacts;
    
    if (contacts.length === 0) {
      return;
    }
    
    const mode = selectedCall || TelephonyConnection.SOFT_CALL;
    const defaultDisposition = list.steps?.[0]?.defaultAction;
    
    navigate("/campaign", {
      state: {
        contacts,
        mode,
        defaultDisposition,
        autoStart: false,
      },
    });
  };

  return (
    <>
      <TableRow hover>
        <TableCell padding="checkbox">
          <IconButton
            size="small"
            onClick={() => onExpand(list.id, list.steps)}
            sx={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <ExpandMore />
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography fontWeight={600}>{list.listName}</Typography>
        </TableCell>
        <TableCell>
          <Box display="flex" alignItems="center" gap={0.5}>
            <GroupOutlined color={hasContacts ? "action" : "disabled"} />
            <Typography variant="body2" color="text.secondary">
              {hasContacts ? contactCount : "0"}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography
              component="span"
              variant="body2"
              sx={{ px: 1, py: 0.25, borderRadius: 1 }}
            >
              {list.exitStrategy ? "Exit strategy" : "No exit strategy"}
            </Typography>
            {list.exitStrategyDescription && (
              <Tooltip title={list.exitStrategyDescription} arrow>
                <HelpOutline fontSize="small" color="action" />
              </Tooltip>
            )}
          </Box>
        </TableCell>
        <TableCell align="right">
          <Tooltip title="Dial eligible contacts">
            <IconButton
              size="small"
              color="primary"
              onClick={handleDial}
              disabled={!hasContacts}
            >
              <Call fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={() => navigate(`/create-new-list/${list.id}`)}
          >
            <Edit fontSize="small" />
          </IconButton>
          <Tooltip title="Clone list">
            <IconButton
              size="small"
              onClick={() => onCloneClick(list.id)}
              disabled={cloningId === list.id}
            >
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            color="error"
            onClick={() => onDeleteClick(list.id)}
          >
            <Delete fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Step Name</TableCell>
                    <TableCell>Eligible Contacts</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell align="right">Operations</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.steps?.map((step: Step, i: number) => (
                    <StepRow
                      key={step.id}
                      step={step}
                      index={i}
                      contacts={eligibleContacts?.[i] ?? step.contacts}
                      selectedCallType={selectedCall}
                      list={list}
                      onConnectionClick={onConnectionClick}
                    />
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      <ConnectionMenu
        anchorEl={anchorEl}
        open={menuListId === list.id}
        onClose={closeMenu}
        onSelect={(opt: string) => onConnectionChange(list.id, opt)}
      />
    </>
  );
};

export default ListCard;
