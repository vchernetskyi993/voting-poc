import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import dayjs, { Dayjs } from "dayjs";
import { ContractReceipt } from "ethers";
import { ethers } from "hardhat";
import { Elections } from "../typechain";

use(chaiAsPromised);

type Election = {
  start: number;
  end: number;
  title: string;
  description: string;
  candidates: string[];
};

describe("Elections contract", () => {
  let contract: Elections;

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
      contract.createElection(election(dayjs().subtract(1, "day")))
    ).to.be.rejectedWith(/in the future/);
  });

  it("Should throw if end is less than start", () => {
    return expect(
      contract.createElection(election(dayjs().add(3, "day")))
    ).to.be.rejectedWith(/before/);
  });

  it("Should not create election by non-owner", () => {});

  it("Should save election on ledger", () => {});

  function election(
    start: Dayjs = dayjs().add(1, "day"),
    end: Dayjs = dayjs().add(2, "day")
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
    return receipt.events?.find((e) => e.event === "ElectionCreated")?.args
      ?.electionId;
  }

  function getElection(receipt: ContractReceipt): Election {
    return receipt.events?.find((e) => e.event === "ElectionCreated")?.args
      ?.election;
  }
});
