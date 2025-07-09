import { l1RestEndpoint, l2RestEndpoint, assets } from "./env";
import { getChannelId, IBCDenom, L2Denom } from "./utils";

import { AccAddress, RESTClient } from "@initia/initia.js";
import { AbiCoder, getAddress } from "ethers";

async function contractAddress(
  restClient: RESTClient,
  l2Denom: string
): Promise<string> {
  const contractAddr = await restClient.evm.contractAddrByDenom(l2Denom);
  return contractAddr;
}

async function getWrappedTokenAddress(
  l2RestClient: RESTClient,
  l2Denom: string
): Promise<string> {
  const contractAddr = await contractAddress(l2RestClient, l2Denom);

  const abiCoder = new AbiCoder();
  const encoded = abiCoder.encode(["address", "uint8"], [contractAddr, 6]);

  const input = `0x1efb51e6${encoded.slice(2)}`;
  const res = await l2RestClient.evm.call(
    AccAddress.fromHex(contractAddr),
    await l2RestClient.evm.erc20Wrapper(),
    input,
    '0'
  );
  if ("error" in res && res.error !== "") {
    throw new Error(`Failed to get wrapped token address: ${res.error}`);
  }

  // convert 32 bytes hex string to 20 bytes address
  return res.response.slice(26);
}

async function main() {
  const l1RestClient = new RESTClient(l1RestEndpoint, { gasPrices: {} });
  const l2RestClient = new RESTClient(l2RestEndpoint, { gasPrices: {} });

  const bridgeInfo = await l2RestClient.opchild.bridgeInfo();
  const bridgeId = BigInt(bridgeInfo.bridge_id);
  const channelId = await getChannelId(l2RestClient);

  for (const asset of assets) {
    const l1Denom = asset.denom;
    const bridgeType = asset.bridgeType;

    let l2Denom = ''
    if (bridgeType === "ibc") {
      l2Denom = await IBCDenom(l1RestClient, l1Denom, channelId);
    } else if (bridgeType === "op") {
      l2Denom = L2Denom(bridgeId, l1Denom);
    } else {
      throw new Error(`Unsupported bridge type: ${bridgeType}`);
    }

    const denom = await getWrappedTokenAddress(l2RestClient, l2Denom);
    console.info("--------------------------------");
    console.info(`L1Denom: ${l1Denom}, L2Denom: ${l2Denom}`);
    console.info(`Wrapped Token Address: evm/${getAddress(denom).slice(2)}`);
  }
  console.info("--------------------------------");
}

main();
