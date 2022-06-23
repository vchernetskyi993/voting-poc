import { TableCell, TableRow, Typography } from "@mui/material";
import { BN, Program } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import React from "react";
import { Voting } from "../idl/voting";
import { ElectionData } from "../voting-client/accounts";
import { findPda } from "./utils";
import VoteButton from "./VoteButton";
import memoizee from "memoizee";

function ElectionRow({
    organization,
    electionId,
    connection,
    program,
    voter,
    openVotingModal,
}: {
    organization: PublicKey;
    electionId: number;
    connection: Connection;
    program: Program<Voting>;
    voter: PublicKey;
    openVotingModal: (
        candidates: string[],
        electionId: number,
        electionPda: PublicKey,
        voterPda: PublicKey
    ) => void;
}) {
    const [electionPda, setElectionPda] = React.useState<PublicKey>();
    const [election, setElection] = React.useState<ElectionData>();

    React.useEffect(() => {
        findPda(`${organization}_election_data_${electionId}`).then(
            setElectionPda
        );
    }, [electionId, organization]);
    React.useEffect(() => {
        if (!electionPda) {
            return;
        }
        ElectionData.fetch(connection, electionPda).then((data) => {
            if (!data) {
                console.error(`Election ${electionPda} not initialized.`);
                return;
            }
            setElection(data);
        });
    }, [connection, electionPda]);
    React.useEffect(() => {
        console.log(`Adding event listener for ${electionId}`);
        const listener = program.addEventListener(
            "Voted",
            memoizee(
                (event) => {
                    setElection((e) => {
                        if (event.electionId.toNumber() !== electionId || !e) {
                            return;
                        }
                        console.log(`Voted: ${JSON.stringify(event)}`);
                        e.results[event.candidateId] = e.results[
                            event.candidateId
                        ].add(new BN(1));
                        return new ElectionData(e);
                    });
                },
                {
                    normalizer: ([event]) => JSON.stringify(event),
                }
            )
        );
        return () => {
            console.log(`Removing event listener for ${electionId}`);
            program.removeEventListener(listener);
        };
    }, [electionId, program]);

    return (
        <TableRow>
            <TableCell>
                <Typography variant="h6">{electionId}</Typography>
            </TableCell>
            <TableCell>
                <Typography variant="h6">{election?.title}</Typography>
                <Typography variant="subtitle2">
                    {election?.description}
                </Typography>
            </TableCell>
            <TableCell>
                {election?.candidates.map((name, i) => (
                    <Typography key={name}>
                        {`${name} (${election.results[i]})`}{" "}
                    </Typography>
                )) || []}
            </TableCell>
            <TableCell>
                <VoteButton
                    organization={organization}
                    electionId={electionId}
                    connection={connection}
                    voter={voter}
                    election={election}
                    electionPda={electionPda}
                    openVotingModal={openVotingModal}
                />
            </TableCell>
        </TableRow>
    );
}

export default ElectionRow;
