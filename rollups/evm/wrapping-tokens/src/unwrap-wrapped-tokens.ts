import { amount, assets, coinType, l2RestEndpoint, mnemonic } from "./env";
import { getChannelId } from "./utils";
import {
  MsgCall,
  Wallet,
  RESTClient,
  MnemonicKey,
  AccAddress,
  isTxError,
} from "@initia/initia.js";
import { ethers } from "ethers";
import { erc20Intf, wrapIntf } from "./interface";

async function initiateTokenWithdrawTx(
  l2RestEndpoint: string,
  mnemonic: string,
  coinType: number,
  assets: { denom: string; bridgeType: string }[],
): Promise<string> {
  const l2Key = new MnemonicKey({
    mnemonic: mnemonic,
    eth: coinType === 60,
    coinType,
  });

  const l2RestClient = new RESTClient(l2RestEndpoint);
  const l2Wallet = new Wallet(l2RestClient, l2Key);
  const wrapperAddr = await l2Wallet.rest.evm.erc20Wrapper();
  const messages = [];

  const channelId = await getChannelId(l2RestClient);
  
  let sequence = await l2Wallet.sequence();
  for (const asset of assets) {
    const bridgeType = asset.bridgeType;
    messages.push(
      new MsgCall(
        l2Wallet.key.accAddress,
        asset.denom.replace("evm/", "0x"),
        erc20Intf.encodeFunctionData("approve", [
          wrapperAddr,
          ethers.MaxInt256,
        ]),
        "0",
        [],
      ),
    );

    if (bridgeType === "ibc") {
      messages.push(
        new MsgCall(
          l2Wallet.key.accAddress,
          wrapperAddr,
          wrapIntf.encodeFunctionData(
            "toRemoteAndIBCTransfer(string,uint,string,string,uint)",
            [
              asset.denom,
              amount,
              channelId,
              AccAddress.toHex(l2Wallet.key.accAddress),
              ((new Date().getTime() / 1000 + 1000) * 1_000_000_000).toFixed(),
            ],
          ),
          "0",
          [],
        ),
      );
    } else if (bridgeType === "op") {
      messages.push(
        new MsgCall(
          l2Wallet.key.accAddress,
          wrapperAddr,
          wrapIntf.encodeFunctionData(
            "toRemoteAndOPWithdraw(string,string,uint)",
            [AccAddress.toHex(l2Wallet.key.accAddress), asset.denom, amount],
          ),
          "0",
          [],
        ),
      );

      sequence++;
    } else {
      throw new Error(`Unsupported bridge type: ${bridgeType}`);
    }
  }

  const tx = await l2Wallet.createAndSignTx({ msgs: messages });
  const res = await l2RestClient.tx.broadcast(tx);
  if (isTxError(res)) {
    throw new Error(`Failed to broadcast tx: ${res.raw_log}`);
  }

  return res.txhash;
}

async function main() {
  const txHash = await initiateTokenWithdrawTx(
    l2RestEndpoint,
    mnemonic,
    coinType,
    assets,
  );

  console.log(`Withdraw token tx hash: ${txHash}`);
}

main();
