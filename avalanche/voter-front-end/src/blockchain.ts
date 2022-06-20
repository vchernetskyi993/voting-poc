import Web3 from "web3";
import { provider } from "web3-core";

async function getWeb3(): Promise<Web3> {
  console.log("Connecting to web3...");
  return new Web3(await getProvider());
}

function getWsWeb3(): Web3 {
  console.log("Connecting to websocket web3...");
  return new Web3(process.env.REACT_APP_WEB_SOCKET_URL!);
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
  console.log("Retrieving accounts...");
  return await web3.eth.getAccounts();
}

export { getAccounts, getWeb3, getWsWeb3 };
