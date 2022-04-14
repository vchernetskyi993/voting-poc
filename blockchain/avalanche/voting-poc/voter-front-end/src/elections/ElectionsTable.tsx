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
import { getWsWeb3 } from "../blockchain";

function ElectionsTable({
  openVotingModal,
  web3,
  account,
}: {
  openVotingModal: (
    candidates: string[],
    contract: Elections,
    electionId: number
  ) => void;
  web3: Web3 | undefined;
  account: string | undefined;
}) {
  const [contract, setContract] = React.useState<Elections>();
  const [electionIds, setElectionIds] = React.useState<number[]>([]);
  if (web3 && account && !contract && electionIds.length === 0) {
    const c = getElectionsContract(web3, account);
    c.methods
      .electionsCount()
      .call()
      .then((count) => {
        setContract(c);
        setElectionIds(Array.from(Array(+count).keys()));
      });
  }
  const [wsContract, setWsContract] = React.useState<Elections>();
  if (account && !wsContract) {
    setWsContract(getElectionsContract(getWsWeb3(), account));
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
              wsContract={wsContract!}
              openVotingModal={openVotingModal}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ElectionsTable;
