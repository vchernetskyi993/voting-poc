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
import chaiBN from "chai-bn";
import fs from "fs/promises";
import path from "path";
import dayjs, { Dayjs } from "dayjs";
import BN from "bn.js";
import logger from "mocha-logger";
import { MethodsBuilder } from "@project-serum/anchor/dist/cjs/program/namespace/methods";
const { Program, AnchorProvider } = anchor;

chai.should();
chai.use(chaiAsPromised);
chai.use(chaiBN(BN));

type Election = {
  start: anchor.BN;
  end: anchor.BN;
  title: string;
  description: string;
  candidates: string[];
};

describe("Voting Test Suite", () => {
  anchor.setProvider(AnchorProvider.env());
  const connection = anchor.getProvider().connection;

  const programId = Keypair.fromSecretKey(Uint8Array.from(secret)).publicKey;
  const program = new Program(idl as any as Voting, programId);

  let owner: Keypair;
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
      const organizationData = organizationPda(organization);
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
      const organizationData = organizationPda(organization.publicKey);
      logger.pending(`Organization Data: ${organizationData}`);

      // when+then
      return registerOrganization(
        organization.publicKey,
        organizationData,
        organization
      ).should.be.rejectedWith(/OnlyOwner/);
    });
  });

  describe("Election Tests", () => {
    let organization: Keypair;
    let organizationData: PublicKey;

    before(async () => {
      organization = await account("organization");
      organizationData = await createAndRegisterOrganizationData(organization);
      await fund(organization.publicKey);
    });

    it("Should create election", async () => {
      // given
      const electionId = await electionsCount();
      const input = election();
      const ownerBalance = await connection.getBalance(owner.publicKey);

      // when
      await createElectionBuilder({ input }).then((builder) => builder.rpc());

      // then
      const actualCount = await electionsCount();
      expect(actualCount.toNumber()).to.equal(electionId.toNumber() + 1);
      const { start, end, title, description, candidates } =
        await program.account.electionData.fetch(
          await electionPda({ electionId })
        );
      expect(start).to.be.a.bignumber.that.equals(input.start);
      expect(end).to.be.a.bignumber.that.equals(input.end);
      expect(title).to.equal(input.title);
      expect(description).to.equal(input.description);
      expect(candidates).to.deep.equal(input.candidates);
      const newOwnerBalance = await connection.getBalance(owner.publicKey);
      expect(newOwnerBalance).to.equal(ownerBalance + 0.01 * LAMPORTS_PER_SOL);
    });

    it("Should not create election for unregistered organization", async () => {
      // given
      const organization = Keypair.generate();
      logger.pending(`Organization: ${organization.publicKey}`);
      await fund(organization.publicKey);
      const organizationData = organizationPda(organization.publicKey);
      logger.pending(`Organization Data: ${organizationData}`);

      // when+then
      return createElectionBuilder({ organization, organizationData }).then(
        (builder) => builder.rpc()
      ).should.be.rejected;
    });

    it("Should validate more than 2 candidates", async () => {
      // given
      const input = election({ candidates: ["Single candidate"] });

      // when+then
      return createElectionBuilder({ input })
        .then((builder) => builder.rpc())
        .should.be.rejectedWith(/InvalidCandidatesCount/);
    });

    it("Should validate start date", async () => {
      // given
      const input = election({ start: dayjs().subtract(1, "day") });

      // when+then
      return createElectionBuilder({ input })
        .then((builder) => builder.rpc())
        .should.be.rejectedWith(/InvalidStartDate/);
    });

    it("Should validate end date", async () => {
      // given
      const input = election({ start: dayjs().add(4, "day") });

      // when+then
      return createElectionBuilder({ input })
        .then((builder) => builder.rpc())
        .should.be.rejectedWith(/InvalidEndDate/);
    });

    it("Should validate owner account", async () => {
      // given
      const wrongOwner = Keypair.generate().publicKey;

      // when+then
      return createElectionBuilder({ owner: wrongOwner })
        .then((builder) => builder.rpc())
        .should.be.rejectedWith(/ConstraintRaw/);
    });

    it("Should require exact payment for election creation", async () => {
      // given
      const organization = Keypair.generate();
      const method = await createElectionBuilder({ organization });
      const cost = await estimateCosts(
        method,
        organization,
        length(election())
      );
      // Why this 0.001 boost is needed? It remains in the organization account after transaction.
      await fund(organization.publicKey, { balance: cost + 1000000 });

      // when+then
      await method
        .rpc()
        .should.be.rejectedWith(/InsufficientFundsToCreateElection/);
    });

    it("Should vote", async () => {
      // given
      const electionId = await electionsCount();
      await createElectionBuilder().then((builder) => builder.rpc());
      const voter = Keypair.generate();
      // TODO: remove when voting is free
      await fund(voter.publicKey);
      const electionData = await electionPda({ electionId });

      // when
      await vote(electionId, voter, { electionData });

      // then
      const results = await program.account.electionData
        .fetch(electionData)
        .then((data) => data.results);
      expect(results[0]).to.be.a.bignumber.that.is.equal(new BN(0));
      expect(results[1]).to.be.a.bignumber.that.is.equal(new BN(1));
    });

    xit("Should validate start date on vote", async () => {
      // Not possible in solana-test-validator
      // see: https://stackoverflow.com/questions/71925184/how-do-i-control-the-solana-test-validator-clock-in-javascript
    });

    xit("Should validate end date on vote", async () => {
      // Not possible in solana-test-validator
      // see: https://stackoverflow.com/questions/71925184/how-do-i-control-the-solana-test-validator-clock-in-javascript
    });

    it("Should validate vote uniqueness", async () => {
      // given
      const electionId = await electionsCount();
      await createElectionBuilder().then((builder) => builder.rpc());
      const voter = Keypair.generate();
      // TODO: remove when voting is free
      await fund(voter.publicKey);
      await vote(electionId, voter);

      // when+then
      return vote(electionId, voter).should.be.rejected;
    });

    function electionsCount(
      orgData: PublicKey = organizationData
    ): Promise<BN> {
      return program.account.organizationData
        .fetch(orgData)
        .then((data) => data.electionsCount);
    }

    function election(overrides?: {
      start?: Dayjs;
      candidates?: string[];
    }): Election {
      return {
        start: new BN((overrides?.start || dayjs().add(1, "day")).unix()),
        end: new BN(dayjs().add(3, "day").unix()),
        title: "Our Election",
        description: "Our really important election",
        candidates: overrides?.candidates || ["First One", "Second One"],
      };
    }

    function length(election: Election): number {
      return (
        8 +
        8 +
        8 +
        (4 + election.title.length) +
        (4 + election.description.length) +
        (4 +
          election.candidates
            .map((candidate) => 4 + candidate.length)
            .reduce((a, b) => a + b)) +
        (4 + election.candidates.length * 16)
      );
    }

    async function estimateCosts(
      method: MethodsBuilder<any, any>,
      payer: Keypair,
      dataLength: number
    ): Promise<number> {
      const tx = await method.transaction();
      tx.recentBlockhash = await connection
        .getLatestBlockhash()
        .then((data) => data.blockhash);
      tx.feePayer = payer.publicKey;
      const fee = await tx.getEstimatedFee(connection);

      const rent = await connection.getMinimumBalanceForRentExemption(
        dataLength
      );
      return fee + rent;
    }

    async function createAndRegisterOrganizationData(
      organization: Keypair
    ): Promise<PublicKey> {
      logger.pending(`Organization: ${organization.publicKey}`);
      const organizationData = organizationPda(organization.publicKey);
      logger.pending(`Organization Data: ${organizationData}`);
      const registered = await isRegistered(organizationData);
      if (!registered) {
        logger.pending(`Registering ${organizationData}`);
        await registerOrganization(organization.publicKey, organizationData);
      }
      return organizationData;
    }

    async function electionPda(options?: {
      organization?: PublicKey;
      electionId?: BN;
    }): Promise<PublicKey> {
      const org = options?.organization || organization.publicKey;
      const electionId =
        options?.electionId || (await electionsCount(organizationPda(org)));
      return findPda(sha256.array(`${org}_election_data_${electionId}`));
    }

    function voterPda(electionId: BN, voter: PublicKey): PublicKey {
      return findPda(
        sha256.array(
          `${organization.publicKey}_${electionId}_voter_data_${voter}`
        )
      );
    }

    async function createElectionBuilder(options?: {
      input?: Election;
      organization?: Keypair;
      owner?: PublicKey;
      organizationData?: PublicKey;
    }): Promise<MethodsBuilder<Voting, any>> {
      const signer = options?.organization || organization;
      const organizationData =
        options?.organizationData ||
        (await createAndRegisterOrganizationData(signer));
      const electionData = await electionPda({
        organization: signer.publicKey,
      });
      return program.methods
        .createElection(options?.input || election())
        .accounts({
          organization: signer.publicKey,
          mainData,
          owner: options?.owner || owner.publicKey,
          organizationData,
          electionData,
          systemProgram,
        })
        .signers([signer]);
    }

    async function vote(
      electionId: BN,
      voter: Keypair,
      options?: { electionData?: PublicKey }
    ): Promise<string> {
      const electionData =
        options?.electionData || (await electionPda({ electionId }));
      return program.methods
        .vote(electionId, 1)
        .accounts({
          organization: organization.publicKey,
          organizationData,
          electionData,
          voter: voter.publicKey,
          voterData: voterPda(electionId, voter.publicKey),
        })
        .signers([voter])
        .rpc();
    }
  });

  function findPda(seed: number[] | string): PublicKey {
    return PublicKey.findProgramAddressSync([Buffer.from(seed)], programId)[0];
  }

  async function fund(
    address: PublicKey,
    options?: { balance?: number }
  ): Promise<void> {
    const expectedBalance = options?.balance || 2 * LAMPORTS_PER_SOL;
    const balance = await connection.getBalance(address);
    if (balance > expectedBalance) {
      return;
    }
    const txa = await connection.requestAirdrop(address, expectedBalance);
    logger.pending(`Airdrop ${expectedBalance} to ${address}: ${txa}`);
    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature: txa,
      ...latestBlockHash,
    });
    // uncomment for devnet
    // logger.pending("Waiting for 10 seconds after airdrop...");
    // await wait(10000);
  }

  function wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  function account(name: string): Promise<Keypair> {
    const keypairFile = `target/test/${name}-keypair.json`;
    return fs.stat(keypairFile).then(
      (_stats) => {
        return fs
          .readFile(keypairFile, "utf-8")
          .then(JSON.parse)
          .then((arr) => Uint8Array.from(arr))
          .then(Keypair.fromSecretKey);
      },
      (_err) => {
        const keypair = Keypair.generate();
        return fs
          .mkdir(path.dirname(keypairFile), { recursive: true })
          .then(() =>
            fs.writeFile(
              keypairFile,
              JSON.stringify(Array.from(keypair.secretKey))
            )
          )
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

  function organizationPda(organization: PublicKey): PublicKey {
    return findPda(sha256.array(`organization_data_${organization}`));
  }
});
