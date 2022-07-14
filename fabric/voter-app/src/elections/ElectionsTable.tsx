import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Election } from "./contract";
import ElectionRow from "./ElectionRow";

function ElectionsTable({
  openVotingModal,
  elections,
}: {
  openVotingModal: (
    candidates: string[],
    electionId: number
  ) => void;
  elections: Election[];
}) {
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
          {elections.map((election, i) => (
            <ElectionRow
              key={i}
              electionId={i}
              election={election}
              openVotingModal={openVotingModal}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ElectionsTable;
