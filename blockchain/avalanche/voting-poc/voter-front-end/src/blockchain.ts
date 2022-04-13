import Web3 from "web3";
import { provider } from "web3-core";

async function getWeb3(): Promise<Web3> {
  return new Web3(await getProvider());
}

async function getProvider(): Promise<provider> {
  if (window.ethereum) {
    const web3 = window.ethereum;
    try {
      await web3.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.error("User denied account access");
    }
    return web3;
  }
  if (window.web3) {
    return window.web3;
  }
  alert("Web3 extension not found!");
  throw Error("Web3 extension not found!");
}

async function getAccounts(web3: Web3): Promise<string[]> {
  return await web3.eth.getAccounts();
}

export { getAccounts, getWeb3 };
