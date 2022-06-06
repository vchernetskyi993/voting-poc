import * as anchor from "@project-serum/anchor";
import idl from "../target/idl/voting.json";
import secret from "../target/deploy/voting-keypair.json";
const { Program, AnchorProvider } = anchor;
const { Keypair } = anchor.web3;

describe("voting", () => {
  anchor.setProvider(AnchorProvider.env());

  const programId = Keypair.fromSecretKey(Uint8Array.from(secret)).publicKey;
  const program = new Program(idl, programId);

  it("Is initialized!", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
