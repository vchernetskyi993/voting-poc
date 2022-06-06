import * as anchor from "@project-serum/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { sha256 } from "js-sha256";
import { Voting } from "../target/types/voting";
import idl from "../target/idl/voting.json";
import secret from "../target/deploy/voting-keypair.json";
import { before } from "mocha";
import { expect } from "chai";
const { Program, AnchorProvider } = anchor;

describe("voting", () => {
  anchor.setProvider(AnchorProvider.env());
  const connection = anchor.getProvider().connection;

  const programId = Keypair.fromSecretKey(Uint8Array.from(secret)).publicKey;
  const program = new Program(idl as any as Voting, programId);

  const owner = Keypair.generate();
  const [mainData, _] = PublicKey.findProgramAddressSync(
    [Buffer.from("main_data")],
    programId
  );
  const systemProgram = SystemProgram.programId;

  before(async () => {
    console.log(`Owner: ${owner.publicKey}`);
    await airdrop(owner.publicKey);
    // await program.methods
    //   .initialize()
    //   .accounts({
    //     owner: owner.publicKey,
    //     mainData,
    //     systemProgram,
    //   })
    //   .signers([owner])
    //   .rpc();
  });

  it("Should register organization", async () => {
    // given
    const organization = Keypair.generate();
    console.log(`Organization: ${organization.publicKey}`);
    await airdrop(organization.publicKey);
    const organizationData = findPda(
      sha256.array(`organization_data_${organization.publicKey}`)
    );
    console.log(`Organization Data: ${organizationData}`);

    // when
    const tx = await program.methods
      .registerOrganization(organization.publicKey)
      .accounts({
        owner,
        mainData,
        systemProgram,
        organizationData,
      })
      .signers([owner])
      .rpc();
    console.log(`Transaction: ${tx}`);

    // then
    const savedData = await program.account.organizationData.fetch(
      organizationData
    );
    expect(savedData.electionsCount.toNumber()).to.equal(0);
  });

  it("Should forbid non-owner to register organizations", async () => {});

  xit("Playground", () => {
    // const firstPda = findPda("organization_data_1");
    // console.log(`First PDA: ${firstPda}`);
    // const secondPda = findPda("organization_data_2");
    // console.log(`Second PDA: ${secondPda}`);
    // expect(firstPda.toBase58()).to.not.equal(secondPda.toBase58());

    const key = Keypair.generate().publicKey;
    const hash = sha256.array(`organization_data_${key}`);
    console.log(`Random PDA: ${findPda(hash)}`);

    console.log(`Hash: ${sha256.array("organization_data")}`);
  });

  function findPda(seed: number[] | string): PublicKey {
    return PublicKey.findProgramAddressSync([Buffer.from(seed)], programId)[0];
  }

  // TODO: check if needed for local env setup
  async function airdrop(address: PublicKey): Promise<void> {
    const txa = await connection.requestAirdrop(address, 2 * LAMPORTS_PER_SOL);
    console.log(`Airdrop 2 SOL to ${address}: ${txa}`);
    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature: txa,
      ...latestBlockHash,
    });
    console.log("Waiting for 10 seconds after airdrop...");
    await wait(10000);
  }

  function wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
});
