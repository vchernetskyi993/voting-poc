import {
  Button,
  FormControl,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import { ElectionsClient } from "./elections/contract";

function Login({
  username,
  password,
  setUsername,
  setPassword,
  setLoggedIn,
}: {
  username: string | undefined;
  password: string | undefined;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  setLoggedIn: (loggedIn: boolean) => void;
}) {
  const [error, setError] = React.useState(false);

  const handleUsernameInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername((event.target as HTMLInputElement).value);
  };

  const handlePasswordInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword((event.target as HTMLInputElement).value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client = new ElectionsClient(username!, password!);
    client
      .getElections()
      .then(() => {
        setError(false);
        setLoggedIn(true);
      })
      .catch(() => {
        setError(true);
      });
  };

  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: "80vh" }}
    >
      <Grid item>
        <form onSubmit={handleSubmit}>
          <FormControl>
            <TextField
              required
              label="Username"
              onChange={handleUsernameInput}
              sx={{ m: 0.5 }}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              onChange={handlePasswordInput}
              sx={{ m: 0.5 }}
            />
            <Typography
              color="error"
              display={error ? "block" : "none"}
              align="center"
              sx={{ m: 0.5 }}
            >
              Invalid credentials.
            </Typography>
            <Button
              type="submit"
              variant="contained"
              disabled={!username || !password}
              sx={{ m: 0.5 }}
            >
              Login
            </Button>
          </FormControl>
        </form>
      </Grid>
    </Grid>
  );
}

export default Login;
