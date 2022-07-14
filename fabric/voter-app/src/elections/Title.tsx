import { AppBar, Button, Toolbar, Typography } from "@mui/material";

function Title({
  username,
  logout,
}: {
  username: string | undefined;
  logout: () => void;
}) {
  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Elections
        </Typography>
        <Typography mx={3} variant="h5">{username}</Typography>
        <Button variant="contained" onClick={logout}>Logout</Button>
      </Toolbar>
    </AppBar>
  );
}

export default Title;
