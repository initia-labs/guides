import { RESTClient, sha256 } from "@initia/initia.js";
import { SHA3 } from "sha3";

// generate L2 denom from l1 denom and bridge id
// format: l2/sha3-256(bridgeId || l1Denom)
function L2Denom(bridgeId: bigint, l1Denom: string) {
  const bridgeIdBuffer = Buffer.alloc(8);
  bridgeIdBuffer.writeBigUInt64BE(bridgeId, 0);
  const l1DenomBuffer = Buffer.from(l1Denom, "utf-8");
  const combinedBuffer = Buffer.concat([bridgeIdBuffer, l1DenomBuffer]);
  const hasher = new SHA3(256);
  hasher.update(combinedBuffer);
  const hash = hasher.digest("hex");
  return `l2/${hash}`;
}

async function IBCDenom(
  l1RestClient: RESTClient,
  l1Denom: string,
  channelId: string
) {
  let baseDenom = l1Denom;
  let denomPath = `transfer/${channelId}`;

  // if l1Denom is an ibc denom, get the denom trace from the rest client
  if (l1Denom.startsWith("ibc/")) {
    const hash = l1Denom.split("/")[1];
    const res = await l1RestClient.apiRequester.get<{
      denom_trace: { path: string; base_denom: string };
    }>(`/ibc/apps/transfer/v1/denom_traces/${hash}`);
    denomPath = `transfer/${channelId}/` + res.denom_trace.path;
    baseDenom = res.denom_trace.base_denom;
  }

  // hash the full denom path and base denom
  const fullDenomPath = `${denomPath}/${baseDenom}`;
  const hash = sha256(Buffer.from(fullDenomPath, "utf-8"));
  return `ibc/${Buffer.from(hash).toString("hex").toUpperCase()}`;
}

export { L2Denom, IBCDenom };
