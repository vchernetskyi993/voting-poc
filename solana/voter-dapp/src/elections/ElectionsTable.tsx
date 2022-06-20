import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { Connection, PublicKey } from "@solana/web3.js";
import React from "react";
import { OrganizationData } from "../voting-client/accounts";
import ElectionRow from "./ElectionRow";

function ElectionsTable({
    openVotingModal,
    connection,
    voter,
    organization,
    organizationPda,
}: {
    openVotingModal: (
        candidates: string[],
        electionId: number,
        electionPda: PublicKey,
        voterPda: PublicKey
    ) => void;
    connection: Connection;
    voter: PublicKey;
    organization: PublicKey;
    organizationPda: PublicKey;
}) {
    const [electionIds, setElectionIds] = React.useState<number[]>([]);

    React.useEffect(() => {
        OrganizationData.fetch(connection, organizationPda).then((data) => {
            if (!data) {
                return;
            }
            setElectionIds([...Array(data.electionsCount.toNumber()).keys()]);
        });
    }, [connection, organizationPda]);

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
                            connection={connection}
                            voter={voter}
                            openVotingModal={openVotingModal}
                            organization={organization}
                        />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default ElectionsTable;
