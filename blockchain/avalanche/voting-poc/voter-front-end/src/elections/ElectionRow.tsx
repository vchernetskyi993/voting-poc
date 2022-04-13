import { Button, TableCell, TableRow, Typography } from "@mui/material";
import React from "react";
import { ElectionData, getElection } from "./contract";
import { Elections } from "../gen/contracts";

function ElectionRow({
  electionId,
  contract,
  openVotingModal,
}: {
  electionId: number;
  contract: Elections;
  openVotingModal: (candidates: string[]) => void;
}) {
  const [election, setElection] = React.useState<ElectionData>();
  if (!election) {
    getElection(contract, electionId).then((e) => setElection(e));
  }
  return (
    <TableRow>
      <TableCell>
        <Typography variant="h6">{electionId}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="h6">{election?.title}</Typography>
        <Typography variant="subtitle2">{election?.description}</Typography>
      </TableCell>
      <TableCell>
        {/* TODO: subscribe to Voted events and update votes */}
        {election?.candidates.map(({ name, votes }) => (
          <Typography key={name}>{`${name} (${votes})`} </Typography>
        )) || []}
      </TableCell>
      <TableCell>
        {/* TODO: disable if already voted */}
        <Button
          onClick={() =>
            openVotingModal(
              election?.candidates.map(({ name }) => name) || []
            )
          }
          variant="outlined"
        >
          Vote
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default ElectionRow;
