import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  TextField,
  Button,
  Container,
  Typography,
  CircularProgress,
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
  const { isSuperadmin } = useAuth();
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
    <Container maxWidth="xs">
      <Box display="flex" justifyContent="center" my={1}>
        <Box
          sx={{
            height: { xs: 40, sm: 60, md: 80 },
            maxWidth: "100%",
          }}
        >
          <img src={Logo} style={{ height: "100%" }} alt="Logo" />
        </Box>
      </Box>
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
            />
          )}
        />

        {errorMessage && (
          <Typography color="error" variant="body2">
            {errorMessage}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          color="info"
          fullWidth
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Login"}
        </Button>
      </form>
    </Container>
  );
};

export default Login;
