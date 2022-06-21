import {
    Box,
    Button,
    FormControl,
    FormControlLabel,
    Modal,
    Radio,
    RadioGroup,
} from "@mui/material";
import { BN } from "@project-serum/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import React from "react";
import { vote } from "../voting-client/instructions";

function VotingModal({
    open,
    closeVotingModal,
    candidates,
    electionId,
    electionData,
    connection,
    wallet,
    organization,
    organizationData,
    voterData,
}: {
    open: boolean;
    closeVotingModal: () => void;
    candidates: string[];
    electionId: number;
    electionData: PublicKey;
    connection: Connection;
    wallet: WalletContextState;
    organization: PublicKey;
    organizationData: PublicKey;
    voterData: PublicKey;
}) {
    const [choice, setChoice] = React.useState<string>("");

    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChoice((event.target as HTMLInputElement).value);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const tx0 = new Transaction().add(
            vote(
                { electionId: new BN(electionId), candidateId: +choice },
                {
                    voter: wallet.publicKey!,
                    systemProgram: SystemProgram.programId,
                    organization,
                    organizationData,
                    electionData,
                    voterData,
                }
            )
        );
        const recentBlockhash = await connection.getLatestBlockhash();
        tx0.recentBlockhash = recentBlockhash.blockhash;
        tx0.feePayer = organization;
        console.log(tx0.signatures);
        const signed = await fetch(`${process.env.REACT_APP_SIGNER_URL}/sign`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                tx: tx0
                    .serialize({ requireAllSignatures: false })
                    .toString("base64"),
            }),
        })
            .then((res) => res.json())
            .then((data) => Buffer.from(data.tx, "base64"))
            .then(Transaction.from);
        console.log(signed.signatures);
        wallet
            .signTransaction?.(signed)
            .then((tx) =>
                Promise.all([
                    connection.sendRawTransaction(tx.serialize()),
                    connection.getLatestBlockhash(),
                ])
            )
            .then(([signature, blockhash]) =>
                connection.confirmTransaction(
                    { signature, ...blockhash },
                    "processed"
                )
            )
            .then(() => {
                setChoice("");
                close();
            });
    };

    const close = () => {
        closeVotingModal();
    };

    return (
        <Modal
            open={open}
            onClose={close}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 400,
                    bgcolor: "background.paper",
                    border: "2px solid #000",
                    boxShadow: 24,
                    p: 4,
                }}
            >
                <form onSubmit={handleSubmit}>
                    <FormControl>
                        <RadioGroup value={choice} onChange={handleRadioChange}>
                            {candidates.map((name, i) => (
                                <FormControlLabel
                                    key={i}
                                    value={i}
                                    control={<Radio />}
                                    label={name}
                                />
                            ))}
                        </RadioGroup>
                        <Button
                            type="submit"
                            variant="outlined"
                            disabled={!choice}
                        >
                            Vote
                        </Button>
                    </FormControl>
                </form>
            </Box>
        </Modal>
    );
}

export default VotingModal;
