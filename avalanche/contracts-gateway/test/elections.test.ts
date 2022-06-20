import { credentials, Server } from "@grpc/grpc-js";
import { assert, expect } from "chai";
import dayjs, { Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
import { BigNumber, ContractReceipt, ethers, Event, Wallet } from "ethers";
import { GenericContainer } from "testcontainers";
import { Elections, Elections__factory } from "../src/gen/contracts";
import {
  Election as ElectionProto,
  ElectionsClient,
  uint256,
} from "../src/gen/proto/elections";
import { startServer } from "../src/ts/server";
import { electionsServer } from "../src/ts/elections/grpc";
import { electionsContract } from "../src/ts/elections/contract";
import net, { AddressInfo } from "net";
import { arrayify } from "ethers/lib/utils";
import { JsonRpcProvider } from "@ethersproject/providers";

dayjs.extend(duration);

const PRIVATE_KEY =
  "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027";

type Election = {
  start: number;
  end: number;
  title: string;
  description: string;
  candidates: string[];
};

describe("Elections API", () => {
  let provider: JsonRpcProvider;
  let contract: Elections;
  let client: ElectionsClient;
  let server: Server;
  let currentDate: Dayjs = dayjs();

  before(async () => {
    const evmUrl = await startEvm();
    provider = new ethers.providers.JsonRpcProvider(evmUrl);
    contract = await deployContract(evmUrl);
    const serverPort = await freePort();
    populateEnv(evmUrl, serverPort);
    server = await startServer(electionsServer(electionsContract()));
    client = new ElectionsClient(
      `localhost:${serverPort}`,
      credentials.createInsecure()
    );
  });

  after(async () => {
    server.forceShutdown();
  });

  it("Should create election", async () => {
    const electionData = election();

    const createdId: BigNumber = await new Promise((resolve, reject) =>
      client.createElection(electionData, (err, id) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(BigNumber.from(id.data));
      })
    );

    const saved = await contract.getElection(createdId);
    expect(saved).to.be.deep.equal(asTuple(electionData));
  });

  it("Should get election", async () => {
    const electionData = election();
    const electionId = await contract
      .createElection(electionData)
      .then((t) => t.wait())
      .then(getElectionId);
    await startElection();
    await contract.vote(electionId, BigNumber.from(1));
    const idUint256 = toUint256(electionId);

    const result: ElectionProto = await new Promise((resolve, reject) =>
      client.getElection(idUint256, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      })
    );

    expect(result).to.be.deep.equal({
      ...electionData,
      id: idUint256,
      candidates: [
        {
          name: electionData.candidates[0],
          votes: toUint256(BigNumber.from(0)),
        },
        {
          name: electionData.candidates[1],
          votes: toUint256(BigNumber.from(1)),
        },
      ],
    });
  });

  it("Should return correct count", async () => {
    await contract.createElection(election());
    await contract.createElection(election());

    const expected = await contract.electionsCount();
    const actual: BigNumber = await new Promise((resolve, reject) =>
      client.electionsCount({}, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(BigNumber.from(res.data));
      })
    );

    assert(actual.eq(expected), `${actual} should be ${expected}`);
  });

  it("Should stream elections", async () => {
    const count = await contract.electionsCount();
    const electionData = election();
    await contract.createElection(electionData);
    await contract.createElection(electionData);

    const elections = await new Promise<Election[]>((resolve, reject) => {
      const result: Election[] = [];
      const stream = client.streamElections(toUint256(count));
      stream.on("data", (election) => result.push(election));
      stream.on("end", () => resolve(result));
      stream.on("error", (err) => reject(err));
    });

    expect(elections).to.have.lengthOf(2);
    elections.forEach((election) => {
      expect(election).to.have.property("start", electionData.start);
      expect(election).to.have.property("end", electionData.end);
      expect(election).to.have.property("title", electionData.title);
      expect(election).to.have.property(
        "description",
        electionData.description
      );
    });
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

  function getElectionId(receipt: ContractReceipt): BigNumber {
    return BigNumber.from(
      getEvent(receipt, "ElectionCreated").args?.electionId
    );
  }

  function getEvent(receipt: ContractReceipt, type: string): Event {
    return receipt.events?.find((e) => e.event === type)!;
  }

  async function startEvm(): Promise<string> {
    const evmNode = await new GenericContainer(
      "trufflesuite/ganache-cli:v6.12.2"
    )
      .withExposedPorts(8545)
      .withCmd(["--account", `${PRIVATE_KEY},100000000000000000000`])
      .start();
    return `http://localhost:${evmNode.getMappedPort(8545)}`;
  }

  async function deployContract(evmUrl: string): Promise<Elections> {
    const owner = new Wallet(PRIVATE_KEY, provider);
    return await new Elections__factory(owner).deploy();
  }

  function populateEnv(evmUrl: string, serverPort: number): void {
    process.env.SERVER_PORT = serverPort.toString();
    process.env.EVM_NODE_URL = evmUrl;
    process.env.ELECTIONS_CONTRACT_ADDRESS = contract.address;
    process.env.ELECTIONS_OWNER_KEY = PRIVATE_KEY;
  }

  function freePort(): Promise<number> {
    const server = net.createServer();
    return new Promise<number>((resolve) =>
      server.listen(0, () => {
        resolve((server.address() as AddressInfo).port);
      })
    ).finally(() => server.close());
  }

  function toUint256(n: BigNumber): uint256 {
    return { data: Buffer.from(arrayify(n)) };
  }

  async function startElection(): Promise<void> {
    const duration = dayjs.duration({ days: 1, hours: 1 });
    await provider.send("evm_increaseTime", [duration.asSeconds()]);
    currentDate = currentDate.add(duration);
  }
});
