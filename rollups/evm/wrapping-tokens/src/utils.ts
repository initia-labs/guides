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

export { L2Denom };
