import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import dayjs, { Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
import { ContractReceipt, Event } from "ethers";
import { ethers } from "hardhat";
import { Elections } from "../typechain";

use(chaiAsPromised);
dayjs.extend(duration);

type Election = {
  start: number;
  end: number;
  title: string;
  description: string;
  candidates: string[];
};

describe("Elections contract", () => {
  let contract: Elections;
  let currentDate = dayjs();

  before(async () => {
    const electionsFactory = await ethers.getContractFactory("Elections");
    contract = await electionsFactory.deploy();
    await contract.deployed();
  });

  it("Should increment election id", async () => {
    const electionId = await contract.lastElectionId();

    return Promise.all([
      expect(
        contract
          .createElection(election())
          .then((r) => r.wait())
          .then(getElectionId)
      ).to.eventually.equal(electionId),
      expect(
        contract
          .createElection(election())
          .then((r) => r.wait())
          .then(getElectionId)
      ).to.eventually.equal(electionId.add(1)),
    ]);
  });

  it("Should emit created election", () => {
    const electionData = election();
    return expect(
      contract
        .createElection(electionData)
        .then((r) => r.wait())
        .then(getElection)
    ).to.eventually.deep.equal(asTuple(electionData));
  });

  it("Should throw if start is before now", () => {
    return expect(
      contract.createElection(election(currentDate.subtract(1, "day")))
    ).to.be.rejectedWith(/in the future/);
  });

  it("Should throw if end is less than start", () => {
    return expect(
      contract.createElection(election(currentDate.add(3, "day")))
    ).to.be.rejectedWith(/before/);
  });

  it("Should not create election by non-owner", async () => {
    const [, user] = await ethers.getSigners();

    return expect(
      contract.connect(user).createElection(election())
    ).to.be.rejectedWith(/owner/);
  });

  it("Should save election on ledger", async () => {
    const electionData = election();
    const createdId = await contract
      .createElection(electionData)
      .then((r) => r.wait())
      .then(getElectionId);

    return expect(contract.getElection(createdId)).to.be.eventually.deep.equal(
      asTuple(electionData)
    );
  });

  it("Should emit event on each vote", async () => {
    const candidateId = 1;
    const electionId = await contract
      .createElection(election())
      .then((r) => r.wait())
      .then(getElectionId);
    await startElection();

    const [actualElectionId, actualCandidateId] = await contract
      .vote(electionId, candidateId)
      .then((r) => r.wait())
      .then(getVotedEvent);

    expect(actualElectionId).to.equal(electionId);
    expect(actualCandidateId).to.equal(candidateId);
  });

  it("Should throw for non-existent election", async () => {
    const lastElectionId = await contract.lastElectionId();
    return expect(contract.vote(lastElectionId.add(1), 1)).to.be.rejectedWith(
      /id invalid/
    );
  });

  it("Should throw for non-existent candidate", async () => {
    const electionId = await contract
      .createElection(election())
      .then((r) => r.wait())
      .then(getElectionId);
    await startElection();

    return expect(contract.vote(electionId, 2)).to.be.rejectedWith(
      /id invalid/
    );
  });

  it("Should prohibit to vote before election start", async () => {
    const electionId = await contract
      .createElection(election())
      .then((r) => r.wait())
      .then(getElectionId);

    return expect(contract.vote(electionId, 1)).to.be.rejectedWith(/started/);
  });

  it("Should prohibit to vote after election end", () => {
    throw new Error("Not implemented!");
  });

  it("Any user should be able to vote", async () => {
    const candidateId = 1;
    const electionId = await contract
      .createElection(election())
      .then((r) => r.wait())
      .then(getElectionId);
    const [, user] = await ethers.getSigners();
    await startElection();

    await contract
      .connect(user)
      .vote(electionId, candidateId)
      .then((r) => r.wait());

    const [first, second] = await contract.getVotingResults(electionId);
    expect(first.votes).to.equal(0);
    expect(second.votes).to.equal(1);
  });

  it("Should prohibit to vote more then once", () => {
    throw new Error("Not implemented!");
  });

  function election(
    start: Dayjs = currentDate.add(1, "day"),
    end: Dayjs = currentDate.add(2, "day")
  ): Election {
    return {
      start: start.unix(),
      end: end.unix(),
      title: "Title",
      description: "Description",
      candidates: ["John", "Pedro"],
    };
  }

  function asTuple(
    election: Election
  ): [number, number, string, string, string[]] {
    return [
      election.start,
      election.end,
      election.title,
      election.description,
      election.candidates,
    ];
  }

  function getElectionId(receipt: ContractReceipt): number {
    return getEvent(receipt, "ElectionCreated").args?.electionId;
  }

  function getElection(receipt: ContractReceipt): Election {
    return getEvent(receipt, "ElectionCreated").args?.election;
  }

  function getVotedEvent(receipt: ContractReceipt): [number, number] {
    return getEvent(receipt, "Voted").args as [number, number];
  }

  function getEvent(receipt: ContractReceipt, type: string): Event {
    return receipt.events?.find((e) => e.event === type)!;
  }

  async function startElection(): Promise<void> {
    const startElectionDuration = dayjs.duration({ days: 1, hours: 1 });
    await ethers.provider.send("evm_increaseTime", [
      startElectionDuration.asSeconds(),
    ]);
    currentDate = currentDate.add(startElectionDuration);
  }
});
