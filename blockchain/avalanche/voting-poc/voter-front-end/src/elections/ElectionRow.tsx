import { Button, TableCell, TableRow, Typography } from "@mui/material";
import React from "react";
import { ElectionData, getElection } from "./contract";
import { Elections } from "../gen/contracts";

function ElectionRow({
  electionId,
  contract,
  openVotingModal,
  wsContract,
}: {
  electionId: number;
  contract: Elections;
  openVotingModal: (
    candidates: string[],
    contract: Elections,
    electionId: number
  ) => void;
  wsContract: Elections;
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
        {election?.candidates.map(({ name, votes }, i) => (
          <CandidateInfo
            key={i}
            name={name}
            initialVotes={votes}
            contract={wsContract}
            electionId={electionId}
            candidateId={i}
          />
        )) || []}
      </TableCell>
      <TableCell>
        <Button
          onClick={() =>
            openVotingModal(
              election?.candidates.map(({ name }) => name) || [],
              contract,
              electionId
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

function CandidateInfo({
  name,
  initialVotes,
  contract,
  electionId,
  candidateId,
}: {
  name: string;
  initialVotes: bigint;
  contract: Elections;
  electionId: number;
  candidateId: number;
}) {
  const [votes, setVotes] = React.useState(initialVotes);
  contract.events.Voted((err, event) => {
    if (err) {
      console.error(err);
      return;
    }
    if (
      +event.returnValues.electionId === electionId &&
      +event.returnValues.candidateId === candidateId
    ) {
      setVotes(initialVotes + BigInt(1));
    }
  });
  return <Typography key={name}>{`${name} (${votes})`} </Typography>;
}

export default ElectionRow;
