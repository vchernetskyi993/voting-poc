import { AppBar, Toolbar, Typography } from "@mui/material";

function Title() {
  
  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Elections
        </Typography>
        {/* TODO: get account number */}
        <Typography>my account number</Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Title;
