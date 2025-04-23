import {
  assets,
  coinType,
  l1GasPrices,
  l1RestEndpoint,
  l2RestEndpoint,
  mnemonic,
  channelId,
} from "./env";
import { L2Denom, IBCDenom } from "./utils";

import {
  MsgInitiateTokenDeposit,
  MsgCall,
  Wallet,
  RESTClient,
  MnemonicKey,
  AccAddress,
  Coin,
  isTxError,
  MsgTransfer,
} from "@initia/initia.js";
import { AbiCoder } from "ethers";

async function generateOPBridgeHookMessage(
  l2Wallet: Wallet,
  l2Denom: string,
  sequence: number,
  wrapperAddr: string
): Promise<string> {
  const abiCoder = new AbiCoder();
  const encoded = abiCoder.encode(
    ["address", "string", "uint256", "uint8"],
    [AccAddress.toHex(l2Wallet.key.accAddress), l2Denom, 0, 6]
  );

  const msg = new MsgCall(
    l2Wallet.key.accAddress,
    wrapperAddr,
    `0x1efd1a84${encoded.slice(2)}`,
    "0",
    []
  );

  const tx = await l2Wallet.createAndSignTx({
    msgs: [msg],
    gas: "1",
    sequence,
  });
  return Buffer.from(tx.toBytes()).toString("base64");
}

async function generateIBCMemo(
  l2Wallet: Wallet,
  l2Denom: string,
  wrapperAddr: string
): Promise<string> {
  const abiCoder = new AbiCoder();
  const encoded = abiCoder.encode(
    ["address", "string", "uint256", "uint8"],
    [AccAddress.toHex(l2Wallet.key.accAddress), l2Denom, 0, 6]
  );

  const input = `0x1efd1a84${encoded.slice(2)}`;
  return `{"evm":{"message":{"contract_addr":"${wrapperAddr}","input":"${input}"}}}`;
}

async function initiateTokenDepositTx(
  l1RestEndpoint: string,
  l2RestEndpoint: string,
  l1GasPrices: string,
  mnemonic: string,
  coinType: number,
  assets: { denom: string; bridgeType: string }[]
): Promise<string> {
  const l1Key = new MnemonicKey({
    mnemonic: mnemonic,
    eth: coinType == 60 ? true : false,
    coinType,
  });
  const l2Key = new MnemonicKey({
    mnemonic: mnemonic,
    eth: coinType == 60 ? true : false,
    coinType,
  });

  const l1RestClient = new RESTClient(l1RestEndpoint, {
    gasPrices: l1GasPrices,
  });
  const l2RestClient = new RESTClient(l2RestEndpoint, { gasPrices: {} });
  const bridgeInfo = await l2RestClient.opchild.bridgeInfo();
  const bridgeId = BigInt(bridgeInfo.bridge_id);
  const l1Wallet = new Wallet(l1RestClient, l1Key);
  const l2Wallet = new Wallet(l2RestClient, l2Key);
  const wrapperAddr = await l2Wallet.rest.evm.erc20Wrapper();
  const messages = [];

  // at this step, we don't have rest endpoint for l2, so use 0 sequence
  let sequence = await l2Wallet.sequence();
  for (const asset of assets) {
    const l1Denom = asset.denom;
    const bridgeType = asset.bridgeType;

    if (bridgeType === "ibc") {
      const l2Denom = await IBCDenom(l1RestClient, l1Denom, channelId);
      console.log(`L2 Denom: ${l2Denom} for ${l1Denom}`);

      const res = await l2RestClient.apiRequester.get<{
        channel: { counterparty: { channel_id: string } };
      }>(`/ibc/core/channel/v1/channels/${channelId}/ports/transfer`);

      messages.push(
        new MsgTransfer(
          "transfer",
          res.channel.counterparty.channel_id,
          new Coin(l1Denom, 1),
          l1Key.accAddress,
          wrapperAddr,
          undefined,
          ((new Date().getTime() / 1000 + 1000) * 1_000_000_000).toFixed(),
          await generateIBCMemo(
            l2Wallet,
            l2Denom,
            wrapperAddr
          )
        )
      );
    } else if (bridgeType === "op") {
      const l2Denom = L2Denom(bridgeId, l1Denom);
      console.log(`L2 Denom: ${l2Denom} for ${l1Denom}`);

      messages.push(
        new MsgInitiateTokenDeposit(
          l1Key.accAddress,
          Number(bridgeId),
          l2Key.accAddress,
          new Coin(l1Denom, 0),
          await generateOPBridgeHookMessage(
            l2Wallet,
            l2Denom,
            sequence,
            wrapperAddr
          )
        )
      );

      sequence++;
    } else {
      throw new Error(`Unsupported bridge type: ${bridgeType}`);
    }
  }

  const tx = await l1Wallet.createAndSignTx({ msgs: messages });
  const res = await l1RestClient.tx.broadcast(tx);
  if (isTxError(res)) {
    throw new Error(`Failed to broadcast tx: ${res.raw_log}`);
  }

  return res.txhash;
}

async function main() {
  const txHash = await initiateTokenDepositTx(
    l1RestEndpoint,
    l2RestEndpoint,
    l1GasPrices,
    mnemonic,
    coinType,
    assets
  );

  console.log(`Initiate token deposit tx hash: ${txHash}`);
}

main();
