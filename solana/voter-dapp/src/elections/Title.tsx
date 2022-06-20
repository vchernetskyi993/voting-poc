import { AppBar, Toolbar, Typography } from '@mui/material';
import { WalletMultiButton } from '@solana/wallet-adapter-material-ui';

function Title() {
    return (
        <AppBar position="sticky">
            <Toolbar>
                <Typography variant="h4" sx={{ flexGrow: 1 }}>
                    Elections
                </Typography>
                <WalletMultiButton />
            </Toolbar>
        </AppBar>
    );
}

export default Title;
