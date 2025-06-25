import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Paper,
  Table,
  TableBody,
  TableContainer,
  Typography,
  CircularProgress,
} from "@mui/material";

import { SimpleButton } from "../../../components/UI/SimpleButton";
import useAppStore from "../../../store/useAppStore";
import { useSnackbar } from "../../../hooks/useSnackbar";
import useListManager from "./useListManager";
import ListCard from "./components/ListCard";
import { DeleteDialog } from "../../../components/DeleteDialog";

const Lists = () => {
  const navigate = useNavigate();
  const lists = useAppStore((state) => state.lists);
  const fetchLists = useAppStore((state) => state.fetchLists);
  const { enqueue } = useSnackbar();

  const [loading, setLoading] = useState(false);

  const {
    selectedCalls,
    expandedListId,
    eligibleContacts,
    handleExpand,
    handleConnectionChange,
    anchorEl,
    menuListId,
    openMenu,
    closeMenu,
    openDialog,
    setOpenDialog,
    handleDeleteClick,
    handleDelete,
    listToDelete,
  } = useListManager();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      fetchLists();
    } catch {
      enqueue("Failed to load lists", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Lists
          </Typography>
          <Typography color="text.secondary">
            Manage your prospect lists for outreach campaigns
          </Typography>
        </Box>
        <Box>
          <SimpleButton
            label="Import New Contacts"
            onClick={() => navigate("/import-contacts")}
            color="info"
          />
          <SimpleButton
            label="Create New List"
            onClick={() => navigate("/create-new-list")}
            color="info"
          />
        </Box>
      </Box>

      <Box>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 6,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ width: "100%", mb: 1 }}>
            <Table size="medium" sx={{ width: "100%" }}>
              {lists &&
                lists.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    selectedCall={selectedCalls[list.id]}
                    expanded={expandedListId === list.id}
                    eligibleContacts={eligibleContacts[list.id]}
                    onExpand={handleExpand}
                    onConnectionClick={openMenu}
                    onConnectionChange={handleConnectionChange}
                    anchorEl={anchorEl}
                    menuListId={menuListId}
                    closeMenu={closeMenu}
                    onDeleteClick={handleDeleteClick}
                  />
                ))}
            </Table>
          </TableContainer>
        )}
      </Box>

      <DeleteDialog
        open={openDialog}
        title="Confirm Deletion"
        text="Are you sure you want to delete this list?"
        onClose={() => setOpenDialog(false)}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

export default Lists;
