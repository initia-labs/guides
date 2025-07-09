import dotenv from "dotenv";

dotenv.config({ override: true });

const assetList = process.env.ASSET_LIST?.split(",") || [];
const mnemonic = process.env.MNEMONIC || "";
const l1RestEndpoint = process.env.L1_REST_ENDPOINT || "";
const l2RestEndpoint = process.env.L2_REST_ENDPOINT || "";
const l1GasPrices = process.env.L1_GAS_PRICES || "";
const coinType = parseInt(process.env.COIN_TYPE || "60");
const amount = parseInt(process.env.AMOUNT || "0");

if (!assetList) {
  console.log("ASSET_LIST is not set");
} else if (!mnemonic) {
  console.log("MNEMONIC is not set");
} else if (!l1RestEndpoint) {
  console.log("L1_REST_ENDPOINT is not set");
} else if (!l2RestEndpoint) {
  console.log("L2_REST_ENDPOINT is not set");
} else if (!l1GasPrices) {
  console.log("L1_GAS_PRICES is not set");
} else if (coinType !== 118 && coinType !== 60) {
  console.log("COIN_TYPE must be 118 or 60");
} else if (amount < 0) {
  console.log("AMOUNT must be greater than or equal to 0");
}

const assets: { denom: string; bridgeType: string }[] = [];
for (const asset of assetList) {
  const [denom, bridgeType] = asset.split(":");
  assets.push({ denom, bridgeType });
}

export {
  assets,
  mnemonic,
  l1RestEndpoint,
  l2RestEndpoint,
  l1GasPrices,
  coinType,
  amount,
};
