import { Backdrop, Box, CircularProgress } from "@mui/material";
import { WalletError } from "@solana/wallet-adapter-base";
import {
    WalletDialogProvider,
    WalletMultiButton,
} from "@solana/wallet-adapter-material-ui";
import {
    ConnectionProvider,
    useConnection,
    useWallet,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import {
    GlowWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { PublicKey } from "@solana/web3.js";
import { useSnackbar } from "notistack";
import React, { FC, ReactNode, useCallback } from "react";
import ElectionsTable from "./elections/ElectionsTable";
import Title from "./elections/Title";
import { findPda } from "./elections/utils";
import VotingModal from "./elections/VotingModal";
import { Theme } from "./Theme";

export const App: FC = () => {
    return (
        <Theme>
            <Context>
                <Content />
            </Context>
        </Theme>
    );
};

const Context: FC<{ children: ReactNode }> = ({ children }) => {
    const endpoint = process.env.REACT_APP_SOLANA_URL;
    const wallets = [
        new PhantomWalletAdapter(),
        new GlowWalletAdapter(),
        new SlopeWalletAdapter(),
        new TorusWalletAdapter(),
    ];

    const { enqueueSnackbar } = useSnackbar();
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(
                error.message ? `${error.name}: ${error.message}` : error.name,
                { variant: "error" }
            );
            console.error(error);
        },
        [enqueueSnackbar]
    );

    return (
        <ConnectionProvider endpoint={endpoint!}>
            <WalletProvider wallets={wallets} onError={onError} autoConnect>
                <WalletDialogProvider>{children}</WalletDialogProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

const Content: FC = () => {
    const connection = useConnection();
    const wallet = useWallet();

    const [open, setOpen] = React.useState(false);
    const [candidates, setCandidates] = React.useState<string[]>([]);
    const [electionId, setElectionId] = React.useState<number>();
    const [electionPda, setElectionPda] = React.useState<PublicKey>();
    const [organization, _setOrganization] = React.useState(
        new PublicKey(process.env.REACT_APP_ORGANIZATION_KEY!)
    );
    const [organizationPda, setOrganizationPda] = React.useState<PublicKey>();
    const [voterPda, setVoterPda] = React.useState<PublicKey>();

    React.useEffect(() => {
        findPda(`organization_data_${organization}`).then(setOrganizationPda);
    }, [organization]);

    if (!wallet.connected) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "100px",
                }}
            >
                <WalletMultiButton />
            </div>
        );
    }

    if (!organizationPda) {
        return (
            <Backdrop open={true}>
                <CircularProgress color="inherit" />
            </Backdrop>
        );
    }

    const openVotingModal = (
        candidates: string[],
        electionId: number,
        electionPda: PublicKey,
        voterPda: PublicKey
    ) => {
        setOpen(true);
        setCandidates(candidates);
        setElectionId(electionId);
        setElectionPda(electionPda);
        setVoterPda(voterPda);
    };
    const closeVotingModal = () => {
        setOpen(false);
        setCandidates([]);
    };

    return (
        <Box>
            <Title />
            <ElectionsTable
                openVotingModal={openVotingModal}
                connection={connection.connection}
                voter={wallet.publicKey!}
                organization={organization}
                organizationPda={organizationPda!}
            />
            <VotingModal
                open={open}
                closeVotingModal={closeVotingModal}
                candidates={candidates}
                electionId={electionId!}
                electionData={electionPda!}
                connection={connection.connection}
                wallet={wallet}
                organization={organization}
                organizationData={organizationPda!}
                voterData={voterPda!}
            />
        </Box>
    );
};
