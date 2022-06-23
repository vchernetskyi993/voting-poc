import {
    Button,
    Tooltip,
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
    election,
    electionPda,
    openVotingModal,
}: {
    organization: PublicKey;
    electionId: number;
    connection: Connection;
    voter: PublicKey;
    election: ElectionData | undefined;
    electionPda: PublicKey | undefined;
    openVotingModal: (
        candidates: string[],
        electionId: number,
        electionPda: PublicKey,
        voterPda: PublicKey
    ) => void;
}) {
    const [voterPda, setVoterPda] = React.useState<PublicKey>();
    const [canVote, setCanVote] = React.useState(false);
    const [helpMessage, setHelpMessage] = React.useState("Loading...");

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
        <Tooltip title={canVote ? "" : helpMessage}>
            <span>
                <Button
                    onClick={() =>
                        openVotingModal(
                            election?.candidates.map((name) => name) || [],
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
    );
}

function toSeconds(milliseconds: number): number {
    return Math.floor(milliseconds / 1000);
}

export default ElectionRow;
