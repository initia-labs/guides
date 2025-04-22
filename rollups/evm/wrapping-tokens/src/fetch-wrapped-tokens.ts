import { l2RestEndpoint, assetList } from "./env";
import { L2Denom } from "./utils";

import { AccAddress, RESTClient } from "@initia/initia.js";
import { AbiCoder } from "ethers";

async function contractAddress(
  restClient: RESTClient,
  l2Denom: string
): Promise<string> {
  const contractAddr = await restClient.evm.contractAddrByDenom(l2Denom);
  return contractAddr;
}

async function getWrappedTokenAddress(
  restClient: RESTClient,
  bridgeId: bigint,
  l1Denom: string
): Promise<string> {
  const l2Denom = L2Denom(bridgeId, l1Denom);
  const contractAddr = await contractAddress(restClient, l2Denom);

  const abiCoder = new AbiCoder();
  const encoded = abiCoder.encode(["address", "uint8"], [contractAddr, 6]);

  const input = `0x1efb51e6${encoded.slice(2)}`;
  const res = await restClient.evm.call(
    AccAddress.fromHex(contractAddr),
    // TODO: at this step, we don't have rest endpoint for l2, so use pre-computed contract address.
    // It can be changed if we have updated the contract implementation.
    "0x4eb08D5c1B0A821303A86C7b3AC805c2793dE783",
    input,
    false
  );
  if ("error" in res && res.error !== "") {
    throw new Error(`Failed to get wrapped token address: ${res.error}`);
  }

  // convert 32 bytes hex string to 20 bytes address
  return res.response.slice(26);
}

async function main() {
  for (const asset of assetList) {
    const restClient = new RESTClient(l2RestEndpoint, { gasPrices: {} });
    const bridgeInfo = await restClient.opchild.bridgeInfo();
    const denom = await getWrappedTokenAddress(
      restClient,
      BigInt(bridgeInfo.bridge_id),
      asset
    );

    console.info("--------------------------------");
    console.info(`L1Denom: ${asset}\nL2Denom: evm/${denom}`);
  }
  console.info("--------------------------------");
}

main();
