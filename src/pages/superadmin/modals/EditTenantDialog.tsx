import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Grid,
  Divider,
} from "@mui/material";

interface TenantFormData {
  name: string;
  website: string;
  email: string;
  description: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  billingCycle: string;
  featureLevel: string;
  maxUsers: string;
  maxStorage: string;
  enabledFeatures: string[];
}

interface EditTenantDialogProps {
  open: boolean;
  onClose: () => void;
  tenantName: string;
  formData: TenantFormData;
  adminUsers: any[];
  selectedAdminUsers: string[];
  onFormDataChange: (field: keyof TenantFormData, value: any) => void;
  onAdminUsersChange: (adminIds: string[]) => void;
  onUpdate: () => void;
}

export default function EditTenantDialog({
  open,
  onClose,
  tenantName,
  formData,
  adminUsers,
  selectedAdminUsers,
  onFormDataChange,
  onAdminUsersChange,
  onUpdate,
}: EditTenantDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Tenant</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Name *"
                fullWidth
                value={formData.name}
                onChange={(e) => onFormDataChange("name", e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                fullWidth
                type="email"
                value={formData.email}
                onChange={(e) => onFormDataChange("email", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Website"
                fullWidth
                value={formData.website}
                onChange={(e) => onFormDataChange("website", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => onFormDataChange("description", e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }}>Subscription Settings</Divider>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Plan</InputLabel>
                <Select
                  value={formData.subscriptionPlan}
                  label="Plan"
                  onChange={(e) =>
                    onFormDataChange("subscriptionPlan", e.target.value)
                  }
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.subscriptionStatus}
                  label="Status"
                  onChange={(e) =>
                    onFormDataChange("subscriptionStatus", e.target.value)
                  }
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={formData.subscriptionStartDate}
                onChange={(e) =>
                  onFormDataChange("subscriptionStartDate", e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={formData.subscriptionEndDate}
                onChange={(e) =>
                  onFormDataChange("subscriptionEndDate", e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Billing Cycle</InputLabel>
                <Select
                  value={formData.billingCycle}
                  label="Billing Cycle"
                  onChange={(e) =>
                    onFormDataChange("billingCycle", e.target.value)
                  }
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }}>Feature Settings</Divider>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Feature Level</InputLabel>
                <Select
                  value={formData.featureLevel}
                  label="Feature Level"
                  onChange={(e) =>
                    onFormDataChange("featureLevel", e.target.value)
                  }
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Max Users"
                type="number"
                fullWidth
                value={formData.maxUsers}
                onChange={(e) => onFormDataChange("maxUsers", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Max Storage (GB)"
                type="number"
                fullWidth
                value={formData.maxStorage}
                onChange={(e) => onFormDataChange("maxStorage", e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }}>Admin Users</Divider>

          <Autocomplete
            multiple
            options={adminUsers}
            getOptionLabel={(option) => option.email}
            value={adminUsers.filter((u) => selectedAdminUsers.includes(u.id))}
            onChange={(_, newValue) => {
              onAdminUsersChange(newValue.map((u) => u.id));
            }}
            renderInput={(params) => (
              <TextField {...params} label="Select Admin Users" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.email}
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onUpdate}
          disabled={!formData.name}
        >
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
}
