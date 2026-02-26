import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  Avatar,
  Link,
  Alert,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Phone,
  Email,
  Person,
} from "@mui/icons-material";
import api from "../../../utils/axiosInstance";
import { useSnackbar } from "../../../hooks/useSnackbar";
import Loading from "../../../components/UI/Loading";
import { Contact } from "../../../types/contact";
import ContactDrawer from "../Contacts/components/ContactDrawer";
import ContactStageChip from "../Campaign/components/ContactStageChip";
import { CallBar } from "../Campaign/components/molecules/CallBar";
import { useDialerCall } from "./useDialerCall";
import { List, normalizePhone } from "voice-javascript-common";


const DialerPopoverCall = () => {
  const { phoneNumber: encodedPhone } = useParams<{ phoneNumber: string }>();
  const phoneNumber = encodedPhone ? decodeURIComponent(encodedPhone) : "";
  const navigate = useNavigate();
  const { enqueue } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<Contact | null>(null);
  const [contactNotFound, setContactNotFound] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [lists, setLists] = useState<List[]>([]);

  const {
    startCall,
    startCallWithContact,
    hangUp,
    callStarted,
    callStartTime,
    elapsedTime,
    answered,
    isSocketReady,
    handleNumpadClick,
  } = useDialerCall(phoneNumber);

  useEffect(() => {
    if (!phoneNumber) {
      navigate("/dashboard");
      return;
    }
    checkContact();
  }, [phoneNumber]);

  const checkContact = async () => {
    setLoading(true);
    setContact(null);
    setContactNotFound(false);
    debugger;
    // remove special ca numbers from phone number
    const normalizedPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    try {
      const { data } = await api.get(
        `/contacts/lookup-by-phone?phone=${encodeURIComponent(phoneNumber)}`
      );
      const contactId = data?.id ?? data?.contactId;
      if (contactId) {
        const res = await api.get(`/contacts/${contactId}`);
        setContact(res.data);
      } else {
        setContactNotFound(true);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setContactNotFound(true);
      } else {
        enqueue("Failed to lookup contact", { variant: "error" });
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };
  const loadLists = async () => {
    try {
      const res = await api.get("/lists");
      setLists(res.data || []);
    } catch {
      enqueue("Failed to load lists", { variant: "error" });
    }
  };

  const handleStartCall = async () => {
    if (!contact) return;
    try {
      await startCallWithContact(contact);
    } catch (err: any) {
      enqueue(err?.message || "Failed to start call", { variant: "error" });
    }
  };

  const handleCallAnyway = async () => {
    try {
      await startCall();
    } catch (err: any) {
      enqueue(err?.message || "Failed to start call", { variant: "error" });
    }
  };

  const handleCreateContactSaved = () => {
    setCreateDrawerOpen(false);
    checkContact();
  };

  const handleStageChange = async (status: string) => {
    if (!contact?.id) return;
    try {
      await api.patch(`/contacts/basic/${contact.id}`, { status });
      setContact((prev) => (prev ? { ...prev, status } : null));
      enqueue("Stage updated", { variant: "success" });
    } catch {
      enqueue("Failed to update stage", { variant: "error" });
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!phoneNumber) {
    return null;
  }

  return (
    <Box p={3}>
      {!isSocketReady && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Reconnecting to real-time service… You can&apos;t start a call until
          it&apos;s ready.
        </Alert>
      )}

      <Box mb={3} display="flex" alignItems="center" gap={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Back
        </Button>
        <Typography variant="h6" color="text.secondary">
          Dialer call: {phoneNumber}
        </Typography>
      </Box>

      {(contactNotFound || contact) && callStarted && (
        <CallBar
          mode="active"
          displayLabel={
            contact
              ? `${contact.first_name} ${contact.last_name} – ${contact.phone || phoneNumber}`
              : phoneNumber
          }
          phone={phoneNumber}
          session={contact ?? undefined}
          onEndCall={hangUp}
          callStartTime={callStartTime}
          elapsedTime={elapsedTime}
          hasAnsweredSession={answered}
          handleNumpadClick={handleNumpadClick}
        />
      )}

      {contact && !callStarted ? (
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            p: 2,
            mb: 2,
          }}
        >
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar sx={{ width: 56, height: 56, mr: 2 }}>
              <Person sx={{ fontSize: 36 }} />
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" fontWeight="bold">
                {contact.first_name} {contact.last_name}
              </Typography>
              {(contact.title || contact.account?.companyName) && (
                <Typography variant="body2" color="text.secondary">
                  {contact.title ?? ""}
                  {contact.title ? " at " : ""}
                  {contact.account?.companyName ?? ""}
                </Typography>
              )}
            </Box>
          </Box>

          <Stack spacing={1} mb={2}>
            <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
              <ContactStageChip
                contact={contact}
                onStageChange={handleStageChange}
              />
              {contact.email && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Email fontSize="small" />
                  <Link
                    href={`mailto:${contact.email}`}
                    underline="hover"
                    color="inherit"
                    fontSize="12px"
                  >
                    {contact.email}
                  </Link>
                </Stack>
              )}
              <Stack direction="row" spacing={1} alignItems="center">
                <Phone fontSize="small" />
                <Typography fontSize="12px" color="text.secondary">
                  {contact.phone || phoneNumber}
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/contacts/${contact.id}`)}
            >
              View full details
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<Phone />}
              onClick={handleStartCall}
            >
              Start call
            </Button>
          </Stack>
        </Paper>
      ) : contactNotFound && !callStarted ? (
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            p: 2,
            mb: 2,
          }}
        >
          <Typography variant="body1" mb={2}>
            This number is not in your contacts. Create a contact to save their
            details before calling.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={() => {
                loadLists();
                setCreateDrawerOpen(true);
              }}
            >
              Create contact
            </Button>
            <Button
              variant="outlined"
              startIcon={<Phone />}
              onClick={handleCallAnyway}
              disabled={!isSocketReady}
            >
              Call anyway
            </Button>
          </Stack>
        </Paper>
      ) : null}

      <ContactDrawer
        open={createDrawerOpen}
        contact={null}
        lists={lists}
        onClose={() => setCreateDrawerOpen(false)}
        onSaved={handleCreateContactSaved}
        defaultPhone={phoneNumber}
      />
    </Box>
  );
};

export default DialerPopoverCall;
