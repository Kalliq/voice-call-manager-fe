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
} from "@mui/material";
import { ExpandMore, Edit, Delete, GroupOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
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
}: ListCardProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const hasContacts = list.contacts?.length > 0;
  const contactCount = list.contacts?.length ?? 0;

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
          <Typography
            component="span"
            variant="body2"
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            {list.status}
          </Typography>
        </TableCell>

        <TableCell align="right">
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
