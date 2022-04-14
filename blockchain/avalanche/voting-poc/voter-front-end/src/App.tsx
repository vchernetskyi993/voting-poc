import { Box } from "@mui/material";
import React from "react";
import Web3 from "web3";
import { getAccounts, getWeb3 } from "./blockchain";
import ElectionsTable from "./elections/ElectionsTable";
import Title from "./elections/Title";
import VotingModal from "./elections/VotingModal";
import { Elections } from "./gen/contracts";

function App() {
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
  const [open, setOpen] = React.useState(false);
  const [candidates, setCandidates] = React.useState<string[]>([]);
  const [contract, setContract] = React.useState<Elections>();
  const [electionId, setElectionId] = React.useState<number>();
  const openVotingModal = (
    candidates: string[],
    contract: Elections,
    electionId: number
  ) => {
    setOpen(true);
    setCandidates(candidates);
    setContract(contract);
    setElectionId(electionId);
  };
  const closeVotingModal = () => {
    setOpen(false);
    setCandidates([]);
  };

  return (
    <Box>
      <Title account={account} />
      <ElectionsTable
        web3={web3}
        account={account}
        openVotingModal={openVotingModal}
      />
      <VotingModal
        open={open}
        closeVotingModal={closeVotingModal}
        candidates={candidates}
        contract={contract!}
        electionId={electionId!}
      />
    </Box>
  );
}

export default App;
