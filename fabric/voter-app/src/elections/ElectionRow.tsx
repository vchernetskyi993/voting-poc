import {
  Button,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";
import { Election } from "./contract";

function ElectionRow({
  election,
  electionId,
  openVotingModal,
}: {
  election: Election;
  electionId: number;
  openVotingModal: (candidates: string[], electionId: number) => void;
}) {
  const helpMessage = React.useMemo(() => {
    if (!election.canVote) {
      return "You've already voted.";
    } else if (toMillis(election.data.start) > Date.now()) {
      return "Election hasn't started yet.";
    } else if (toMillis(election.data.end) < Date.now()) {
      return "Election has already finished.";
    } else {
      return "";
    }
  }, [election]);
  return (
    <TableRow>
      <TableCell>
        <Typography variant="h6">{electionId}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="h6">{election.data.title}</Typography>
        <Typography variant="subtitle2">{election.data.description}</Typography>
      </TableCell>
      <TableCell>
        {election.data.candidates.map((name, i) => {
          const votes = election.results[i];
          return <Typography key={name}>{`${name} (${votes})`}</Typography>;
        })}
      </TableCell>
      <TableCell>
        <Tooltip title={helpMessage}>
          <span>
            <Button
              onClick={() =>
                openVotingModal(election.data.candidates, electionId)
              }
              variant="outlined"
              disabled={helpMessage !== ""}
            >
              Vote
            </Button>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

function toMillis(seconds: number): number {
  return seconds * 1_000;
}

export default ElectionRow;
