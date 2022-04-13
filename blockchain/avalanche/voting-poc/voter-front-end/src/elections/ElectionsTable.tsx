import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React from "react";
import Web3 from "web3";
import { getElectionsContract } from "./contract";
import { Elections } from "../gen/contracts";
import ElectionRow from "./ElectionRow";

function ElectionsTable({
  toggleVotingModal,
  web3,
  account,
}: {
  toggleVotingModal: (open: boolean) => void;
  web3: Web3 | undefined;
  account: string | undefined;
}) {
  const [contract, setContract] = React.useState<Elections>();
  const [electionIds, setElectionIds] = React.useState<number[]>([]);
  if (web3 && account) {
    if (!contract) {
      setContract(getElectionsContract(web3, account));
    }
    if (contract && electionIds.length === 0) {
      contract.methods
        .electionsCount()
        .call()
        .then((count) => setElectionIds(Array.from(Array(+count).keys())));
    }
  }
  return (
    <TableContainer>
      <Table>
        <colgroup>
          <col width="20%" />
          <col width="35%" />
          <col width="35%" />
          <col width="10%" />
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant="h5">ID</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="h5">Description</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="h5">Results</Typography>
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {electionIds.map((electionId) => (
            <ElectionRow
              key={electionId}
              electionId={electionId}
              contract={contract!}
              toggleVotingModal={toggleVotingModal}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ElectionsTable;
