import { Box } from "@mui/material";
import React from "react";
import Elections from "./elections/ElectionsTable";
import Title from "./elections/Title";
import VotingModal from "./elections/VotingModal";

function App() {
  const [open, setOpen] = React.useState(false);
  const toggleVotingModal = (open: boolean) => setOpen(open);

  return (
    <Box>
      <Title />
      <Elections toggleVotingModal={toggleVotingModal} />
      <VotingModal open={open} toggleVotingModal={toggleVotingModal} />
    </Box>
  );
}

export default App;
