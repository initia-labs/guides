import dotenv from "dotenv";

dotenv.config();

const assetList = process.env.ASSET_LIST?.split(",") || [];
const mnemonic = process.env.MNEMONIC || "";
const l1RestEndpoint = process.env.L1_REST_ENDPOINT || "";
const l2RestEndpoint = process.env.L2_REST_ENDPOINT || "";
const l1GasPrices = process.env.L1_GAS_PRICES || "";

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
}

export {
  assetList,
  mnemonic,
  l1RestEndpoint,
  l2RestEndpoint,
  l1GasPrices,
};
