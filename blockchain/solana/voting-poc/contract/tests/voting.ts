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
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import fs from "fs/promises";
import path from "path";
const { Program, AnchorProvider } = anchor;

chai.should();
chai.use(chaiAsPromised);

describe("voting", () => {
  anchor.setProvider(AnchorProvider.env());
  const connection = anchor.getProvider().connection;

  const programId = Keypair.fromSecretKey(Uint8Array.from(secret)).publicKey;
  const program = new Program(idl as any as Voting, programId);

  let owner;
  const mainData = findPda("main_data");
  const systemProgram = SystemProgram.programId;

  before(async () => {
    owner = await ownerAccount();
    console.log(`Owner: ${owner.publicKey}`);
    await airdrop(owner.publicKey);
    await initialize();
  });

  it("Should register organization", async () => {
    // given
    const organization = Keypair.generate();
    console.log(`Organization: ${organization.publicKey}`);
    const organizationData = findPda(
      sha256.array(`organization_data_${organization.publicKey}`)
    );
    console.log(`Organization Data: ${organizationData}`);

    // when
    const tx = await program.methods
      .registerOrganization(organization.publicKey)
      .accounts({
        owner: owner.publicKey,
        mainData,
        systemProgram,
        organizationData,
      })
      .signers([owner])
      .rpc();
    console.log(`Register transaction: ${tx}`);

    // then
    const savedData = await program.account.organizationData.fetch(
      organizationData
    );
    expect(savedData.electionsCount.toNumber()).to.equal(0);
  });

  it("Should forbid non-owner to register organizations", async () => {
    // given
    const organization = Keypair.generate();
    console.log(`Organization: ${organization.publicKey}`);
    await airdrop(organization.publicKey);
    const organizationData = findPda(
      sha256.array(`organization_data_${organization.publicKey}`)
    );
    console.log(`Organization Data: ${organizationData}`);

    // when+then
    return program.methods
      .registerOrganization(organization.publicKey)
      .accounts({
        owner: organization.publicKey,
        mainData,
        systemProgram,
        organizationData,
      })
      .signers([organization])
      .rpc()
      .should.be.rejectedWith(/RequireKeysEqViolated/);
  });

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

  function ownerAccount(): Promise<Keypair> {
    const ownerKeypairFile = "target/test/owner-keypair.json";
    return fs.stat(ownerKeypairFile).then(
      (stats) => {
        return fs.readFile(ownerKeypairFile).then(Keypair.fromSecretKey);
      },
      (err) => {
        const keypair = Keypair.generate();
        return fs
          .mkdir(path.dirname(ownerKeypairFile), { recursive: true })
          .then(() => fs.writeFile(ownerKeypairFile, keypair.secretKey))
          .then(() => keypair);
      }
    );
  }

  async function initialize(): Promise<void> {
    const initialized = await isInitialized();
    if (!initialized) {
      await program.methods
        .initialize()
        .accounts({
          owner: owner.publicKey,
          mainData,
          systemProgram,
        })
        .signers([owner])
        .rpc();
    }
  }

  function isInitialized(): Promise<boolean> {
    return program.account.mainData
      .fetchNullable(mainData)
      .then((data) => !!data);
  }
});
