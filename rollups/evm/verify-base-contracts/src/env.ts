import dotenv from "dotenv";

dotenv.config({ override: true });

const contractAddress = process.env.CONTRACT_ADDRESS || "";
const jsonRpcEndpoint = process.env.JSON_RPC_ENDPOINT || "";
const rpcEndpoint = process.env.RPC_ENDPOINT || "";
const networkType = process.env.NETWORK_TYPE || "MAINNET";

if (!contractAddress) {
  console.error("CONTRACT_ADDRESS is not set");
  process.exit(1);
} else if (!jsonRpcEndpoint) {
  console.error("JSON_RPC_ENDPOINT is not set");
  process.exit(1);
} else if (!rpcEndpoint) {
  console.error("RPC_ENDPOINT is not set");
  process.exit(1);
}

const scanBaseUrl = networkType === "MAINNET" ? "https://scan.initia.xyz" : "https://scan.testnet.initia.xyz";

export {
  contractAddress,
  jsonRpcEndpoint,
  rpcEndpoint,
  networkType,
  scanBaseUrl,
};
