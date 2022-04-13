import { AppBar, Toolbar, Typography } from "@mui/material";
import React from "react";
import { getAccounts, getWeb3 } from "../blockchain";

function Title() {
  const [account, setAccount] = React.useState("");
  getWeb3()
    .then(getAccounts)
    .then((accounts) => setAccount(accounts[0]));
  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Elections
        </Typography>
        <Typography>{account}</Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Title;
