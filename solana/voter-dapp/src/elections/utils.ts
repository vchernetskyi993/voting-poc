import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "../voting-client/programId";
import { sha256 } from "js-sha256";

export function findPda(seed: string): Promise<PublicKey> {
    return PublicKey.findProgramAddress(
        [Buffer.from(sha256.array(seed))],
        PROGRAM_ID
    ).then(([pda, _bump]) => pda);
}
