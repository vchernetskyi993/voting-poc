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
import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import fs from "fs/promises";
import path from "path";
import dayjs, { Dayjs } from "dayjs";
import BN from "bn.js";
import logger from "mocha-logger";
const { Program, AnchorProvider } = anchor;

chai.should();
chai.use(chaiAsPromised);

describe("Voting Test Suite", () => {
  anchor.setProvider(AnchorProvider.env());
  const connection = anchor.getProvider().connection;

  const programId = Keypair.fromSecretKey(Uint8Array.from(secret)).publicKey;
  const program = new Program(idl as any as Voting, programId);

  let owner;
  const mainData = findPda("main_data");
  const systemProgram = SystemProgram.programId;

  before(async () => {
    owner = await account("owner");
    logger.pending(`Owner: ${owner.publicKey}`);
    await fund(owner.publicKey);
    await initialize();
  });

  describe("Register Organization Tests", () => {
    it("Should register organization", async () => {
      // given
      const organization = Keypair.generate().publicKey;
      logger.pending(`Organization: ${organization}`);
      const organizationData = findPda(
        sha256.array(`organization_data_${organization}`)
      );
      logger.pending(`Organization Data: ${organizationData}`);

      // when
      await registerOrganization(organization, organizationData);

      // then
      const savedData = await program.account.organizationData.fetch(
        organizationData
      );
      expect(savedData.electionsCount.toNumber()).to.equal(0);
    });

    it("Should forbid non-owner to register organizations", async () => {
      // given
      const organization = Keypair.generate();
      logger.pending(`Organization: ${organization.publicKey}`);
      await fund(organization.publicKey);
      const organizationData = findPda(
        sha256.array(`organization_data_${organization.publicKey}`)
      );
      logger.pending(`Organization Data: ${organizationData}`);

      // when+then
      return registerOrganization(
        organization.publicKey,
        organizationData,
        organization
      ).should.be.rejectedWith(/OnlyOwner/);
    });
  });

  describe("Create Election Tests", () => {
    let organization;
    let organizationData;

    before(async () => {
      organization = await account("organization");
      logger.pending(`Organization: ${organization.publicKey}`);
      await fund(organization.publicKey);
      organizationData = findPda(
        sha256.array(`organization_data_${organization.publicKey}`)
      );
      logger.pending(`Organization Data: ${organizationData}`);
      const registered = await isRegistered(organizationData);
      if (!registered) {
        logger.pending(`Registering ${organizationData}`);
        await registerOrganization(organization.publicKey, organizationData);
      }
    });

    it("Should create election", async () => {
      // given
      const electionId = await electionsCount();
      const electionData = findPda(sha256.array(`election_data_${electionId}`));
      const input = election();

      // when
      await program.methods
        .createElection(input)
        .accounts({
          organization: organization.publicKey,
          organizationData,
          electionData,
          systemProgram,
        })
        .signers([organization])
        .rpc();

      // then
      const actualCount = await electionsCount();
      expect(actualCount.toNumber()).to.equal(electionId.toNumber() + 1);
      const { start, end, title, description, candidates } =
        await program.account.electionData.fetch(electionData);
      assert(start.eq(input.start));
      assert(end.eq(input.end));
      expect(title).to.equal(input.title);
      expect(description).to.equal(input.description);
      expect(candidates).to.deep.equal(input.candidates);
    });

    it("Should not create election for unregistered organization", async () => {
      // given
      const organization = Keypair.generate();
      logger.pending(`Organization: ${organization.publicKey}`);
      await fund(organization.publicKey);
      const organizationData = findPda(
        sha256.array(`organization_data_${organization.publicKey}`)
      );
      logger.pending(`Organization Data: ${organizationData}`);
      await registerOrganization(organization.publicKey, organizationData);

      const electionData = findPda(sha256.array(`election_data_0`));
      const input = election();

      // when+then
      return program.methods
        .createElection(input)
        .accounts({
          organization: organization.publicKey,
          organizationData,
          electionData,
          systemProgram,
        })
        .signers([organization])
        .rpc().should.be.rejected;
    });

    it("Should validate more than 2 candidates", async () => {
      // given
      const electionId = await electionsCount();
      const electionData = findPda(sha256.array(`election_data_${electionId}`));
      const input = election({ candidates: ["Single candidate"] });

      // when+then
      return program.methods
        .createElection(input)
        .accounts({
          organization: organization.publicKey,
          organizationData,
          electionData,
          systemProgram,
        })
        .signers([organization])
        .rpc()
        .should.be.rejectedWith(/InvalidCandidatesCount/);
    });

    it("Should validate start date", async () => {
      // given
      const electionId = await electionsCount();
      const electionData = findPda(sha256.array(`election_data_${electionId}`));
      const input = election({ start: dayjs().subtract(1, "day") });

      // when+then
      return program.methods
        .createElection(input)
        .accounts({
          organization: organization.publicKey,
          organizationData,
          electionData,
          systemProgram,
        })
        .signers([organization])
        .rpc()
        .should.be.rejectedWith(/InvalidStartDate/);
    });

    it("Should validate end date", async () => {
      // given
      const electionId = await electionsCount();
      const electionData = findPda(sha256.array(`election_data_${electionId}`));
      const input = election({ start: dayjs().add(4, "day") });

      // when+then
      return program.methods
        .createElection(input)
        .accounts({
          organization: organization.publicKey,
          organizationData,
          electionData,
          systemProgram,
        })
        .signers([organization])
        .rpc()
        .should.be.rejectedWith(/InvalidEndDate/);
    });

    it("Should require exact payment for election creation", async () => {
      // TODO: can we test this in Solana?
    });

    function electionsCount(): Promise<BN> {
      return program.account.organizationData
        .fetch(organizationData)
        .then((data) => data.electionsCount);
    }

    function election(overrides?: { start?: Dayjs; candidates?: string[] }): {
      start: anchor.BN;
      end: anchor.BN;
      title: string;
      description: string;
      candidates: string[];
    } {
      return {
        start: new BN((overrides?.start || dayjs().add(1, "day")).unix()),
        end: new BN(dayjs().add(3, "day").unix()),
        title: "Our Election",
        description: "Our really important election",
        candidates: overrides?.candidates || ["First One", "Second One"],
      };
    }
  });

  xit("Playground", () => {
    // const firstPda = findPda("organization_data_1");
    // logger.pending(`First PDA: ${firstPda}`);
    // const secondPda = findPda("organization_data_2");
    // logger.pending(`Second PDA: ${secondPda}`);
    // expect(firstPda.toBase58()).to.not.equal(secondPda.toBase58());

    const key = Keypair.generate().publicKey;
    const hash = sha256.array(`organization_data_${key}`);
    logger.pending(`Random PDA: ${findPda(hash)}`);

    logger.pending(`Hash: ${sha256.array("organization_data")}`);
  });

  function findPda(seed: number[] | string): PublicKey {
    return PublicKey.findProgramAddressSync([Buffer.from(seed)], programId)[0];
  }

  // TODO: check if needed for local env setup
  async function fund(address: PublicKey): Promise<void> {
    const expectedBalance = 2 * LAMPORTS_PER_SOL;
    const balance = await connection.getBalance(address);
    if (balance > expectedBalance) {
      return;
    }
    const txa = await connection.requestAirdrop(address, expectedBalance);
    logger.pending(`Airdrop 2 SOL to ${address}: ${txa}`);
    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature: txa,
      ...latestBlockHash,
    });
    logger.pending("Waiting for 10 seconds after airdrop...");
    await wait(10000);
  }

  function wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  function account(name: string): Promise<Keypair> {
    const keypairFile = `target/test/${name}-keypair.json`;
    return fs.stat(keypairFile).then(
      (_stats) => {
        return fs.readFile(keypairFile).then(Keypair.fromSecretKey);
      },
      (_err) => {
        const keypair = Keypair.generate();
        return fs
          .mkdir(path.dirname(keypairFile), { recursive: true })
          .then(() => fs.writeFile(keypairFile, keypair.secretKey))
          .then(() => keypair);
      }
    );
  }

  async function initialize(): Promise<void> {
    const initialized = await isInitialized();
    if (!initialized) {
      logger.pending(`Initializing ${mainData}`);
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

  function registerOrganization(
    organization: PublicKey,
    organizationData: PublicKey,
    programOwner: Keypair = owner
  ): Promise<void> {
    return program.methods
      .registerOrganization(organization)
      .accounts({
        owner: programOwner.publicKey,
        mainData,
        systemProgram,
        organizationData,
      })
      .signers([programOwner])
      .rpc()
      .then((tx) => logger.pending(`Register organization: ${tx}`));
  }

  function isRegistered(organizationData: PublicKey): Promise<boolean> {
    return program.account.organizationData
      .fetchNullable(organizationData)
      .then((data) => !!data);
  }
});
