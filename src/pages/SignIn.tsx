import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { UserRole } from "voice-javascript-common";

import useAppStore from "../store/useAppStore";
import { useAuth } from "../contexts/AuthContext";
import Logo from "../assets/kalliq_grey.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

const { setUser } = useAppStore.getState();

const Login: React.FC = () => {
  const theme = useTheme();
  const { signin } = useAuth();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await signin(data);
      console.log("Login successful: ", res.data);
      setUser(res.data);

      if (res.data.role == UserRole.SUPER_ADMIN) {
        navigate("/superdashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 400,
          borderRadius: 4,
          border: "none",
          backgroundColor: theme.palette.background.paper,
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.06)",
          transition: "all .25s ease",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 3,
            }}
          >
            <Box
              sx={{
                height: { xs: 40, sm: 60 },
                maxWidth: "100%",
              }}
            >
              <img src={Logo} style={{ height: "100%" }} alt="Logo" />
            </Box>
          </Box>

          <Typography
            variant="h5"
            fontWeight="bold"
            color="text.primary"
            textAlign="center"
            mb={1}
          >
            Welcome back
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mb={3}
          >
            Sign in to your account
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="email"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  fullWidth
                  margin="normal"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: theme.palette.background.default,
                    },
                  }}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: theme.palette.background.default,
                    },
                  }}
                />
              )}
            />

            {errorMessage && (
              <Typography
                color="error"
                variant="body2"
                sx={{ mt: 1, mb: 0.5 }}
              >
                {errorMessage}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 15,
                backgroundColor: theme.palette.dashboard.infoMain,
                "&:hover": {
                  backgroundColor: "#3367d6",
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
