import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

function Elections({
  toggleVotingModal,
}: {
  toggleVotingModal: (open: boolean) => void;
}) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Election ID</TableCell>
            <TableCell>Election Name</TableCell>
            <TableCell>Candidates</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* TODO: populate from actual elections */}
          <TableRow>
            <TableCell>0</TableCell>
            <TableCell>
              <Typography>Some election</Typography>
              <Typography>Some description</Typography>
            </TableCell>
            <TableCell>
              {/* TODO: subscribe to Voted events and update votes */}
              <Typography>First (7)</Typography>
              <Typography>Second (3)</Typography>
            </TableCell>
            <TableCell>
              {/* TODO: disable if already voted */}
              <Button
                onClick={() => toggleVotingModal(true)}
                variant="outlined"
              >
                Vote
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>0</TableCell>
            <TableCell>
              <Typography>Some election</Typography>
              <Typography>Some description</Typography>
            </TableCell>
            <TableCell>
              <Typography>First (7)</Typography>
              <Typography>Second (3)</Typography>
              <Typography>Third (2)</Typography>
            </TableCell>
            <TableCell>
              <Button disabled variant="outlined">
                Vote
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default Elections;
