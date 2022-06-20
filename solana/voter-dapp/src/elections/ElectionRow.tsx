import {
    Button,
    TableCell,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import React from "react";
import { ElectionData, VoterData } from "../voting-client/accounts";
import { findPda } from "./utils";

function ElectionRow({
    organization,
    electionId,
    connection,
    voter,
    openVotingModal,
}: {
    organization: PublicKey;
    electionId: number;
    connection: Connection;
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
    const [voterPda, setVoterPda] = React.useState<PublicKey>();
    const [canVote, setCanVote] = React.useState(false);
    const [helpMessage, setHelpMessage] = React.useState("Loading...");

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
        findPda(`${organization}_${electionId}_voter_data_${voter}`).then(
            setVoterPda
        );
    }, [electionId, organization, voter]);
    React.useEffect(() => {
        if (!election || !voterPda) {
            return;
        }
        VoterData.fetch(connection, voterPda).then((data) => {
            const voted = !!data;
            const now = new BN(toSeconds(Date.now()));
            if (voted) {
                setHelpMessage("You've already voted.");
            } else if (election.start > now) {
                setHelpMessage("Election hasn't started yet.");
            } else if (election.end < now) {
                setHelpMessage("Election has already finished.");
            } else {
                setHelpMessage("");
                setCanVote(true);
            }
        });
    }, [connection, election, voterPda]);
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
                <Tooltip title={canVote ? "" : helpMessage}>
                    <span>
                        <Button
                            onClick={() =>
                                openVotingModal(
                                    election?.candidates.map((name) => name) ||
                                        [],
                                    electionId,
                                    electionPda!,
                                    voterPda!
                                )
                            }
                            variant="outlined"
                            disabled={!canVote}
                        >
                            Vote
                        </Button>
                    </span>
                </Tooltip>
            </TableCell>
        </TableRow>
    );
}

function toSeconds(milliseconds: number): number {
    return Math.floor(milliseconds / 1000);
}

export default ElectionRow;
