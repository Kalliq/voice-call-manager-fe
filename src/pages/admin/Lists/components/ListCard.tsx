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
  eligibleCount?: number;
  onExpand: (id: string, steps?: Step[]) => void;
  onFetchEligibleContacts: (listId: string, steps: Step[]) => Promise<Record<number, any[]>>;
  onConnectionClick: (e: React.MouseEvent<HTMLElement>, id: string) => void;
  onConnectionChange: (id: string, option: string) => void;
  anchorEl: HTMLElement | null;
  menuListId: string | null;
  closeMenu: () => void;
  onDeleteClick: (id: string) => void;
}

const ListCard = ({
  list,
  selectedCall,
  expanded,
  eligibleContacts,
  eligibleCount,
  onExpand,
  onFetchEligibleContacts,
  onConnectionClick,
  onConnectionChange,
  anchorEl,
  menuListId,
  closeMenu,
  onDeleteClick,
}: ListCardProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Enable DIAL if list has steps (contacts will be fetched on click if needed)
  const hasSteps = (list.steps?.length ?? 0) > 0;
  const allEligibleContacts = Object.values(eligibleContacts ?? {}).flat();
  const fallbackStepContacts = list.steps?.flatMap((step: Step) => step.contacts ?? []) ?? [];
  const availableContacts = allEligibleContacts.length > 0 ? allEligibleContacts : fallbackStepContacts;
  // Prefer eligibleCount prop if available, otherwise use local calculation
  const contactCount = eligibleCount !== undefined 
    ? eligibleCount 
    : availableContacts.length;
  const hasContacts = contactCount > 0;

  const handleDial = async (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    
    if (!list.steps?.length) {
      console.warn("Cannot dial: list has no steps");
      return;
    }
    
    // Aggregate all eligible contacts from all steps
    let allContacts = Object.values(eligibleContacts ?? {}).flat();
    
    // Fallback to step.contacts if eligibleContacts not available
    const fallbackContacts = list.steps?.flatMap((step: Step) => step.contacts ?? []) ?? [];
    let contacts = allContacts.length > 0 ? allContacts : fallbackContacts;
    
    // If no contacts are available, fetch eligible contacts
    if (contacts.length === 0) {
      const fetchedContacts = await onFetchEligibleContacts(list.id, list.steps);
      // Use the fetched contacts directly
      allContacts = Object.values(fetchedContacts ?? {}).flat();
      contacts = allContacts.length > 0 ? allContacts : fallbackContacts;
    }
    
    // Log clear reason if still no contacts after fetch
    if (contacts.length === 0) {
      console.warn(`Cannot dial: no eligible contacts found for list ${list.id} after fetch`);
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
            <GroupOutlined color={contactCount > 0 ? "action" : "disabled"} />
            <Typography variant="body2" color="text.secondary">
              {contactCount !== undefined ? (contactCount > 0 ? contactCount : "0") : "—"}
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
              disabled={!hasSteps}
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
