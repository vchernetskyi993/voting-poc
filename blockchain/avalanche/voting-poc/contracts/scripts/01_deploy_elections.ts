import { ethers } from "hardhat";

async function main(): Promise<void> {
  const factory = await ethers.getContractFactory("Elections");
  const contract = await factory.deploy();

  await contract.deployed();

  console.log("Contract deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
