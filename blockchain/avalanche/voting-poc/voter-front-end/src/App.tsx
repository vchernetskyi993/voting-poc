import { Box } from "@mui/material";
import React from "react";
import Web3 from "web3";
import { getAccounts, getWeb3 } from "./blockchain";
import ElectionsTable from "./elections/ElectionsTable";
import Title from "./elections/Title";
import VotingModal from "./elections/VotingModal";

function App() {
  const [open, setOpen] = React.useState(false);
  const toggleVotingModal = (open: boolean) => setOpen(open);
  const [web3, setWeb3] = React.useState<Web3>();
  const [account, setAccount] = React.useState<string>();
  if (!web3 && !account) {
    getWeb3().then((w3) =>
      getAccounts(w3).then((accounts) => {
        setWeb3(w3);
        setAccount(accounts[0]);
      })
    );
  }

  return (
    <Box>
      <Title account={account}/>
      <ElectionsTable
        web3={web3}
        account={account}
        toggleVotingModal={toggleVotingModal}
      />
      <VotingModal open={open} toggleVotingModal={toggleVotingModal} />
    </Box>
  );
}

export default App;
