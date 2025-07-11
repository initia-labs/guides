import {
  amount,
  assets,
  coinType,
  l1RestEndpoint,
  l2RestEndpoint,
  mnemonic,
} from "./env";
import { L2Denom, IBCDenom, getChannelId } from "./utils";
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
import { ethers } from "ethers";
import axios from "axios";
import { erc20Intf, wrapIntf } from "./interface";

async function generateOPBridgeHookMessage(
  l2Wallet: Wallet,
  l2Denom: string,
  sequence: number,
  wrapperAddr: string,
): Promise<string> {
  const erc20WrapperContractAddr = await l2Wallet.rest.evm.erc20Wrapper();
  const msgs = [];

  if (amount != 0) {
    const tokenAddr = await l2Wallet.rest.evm.contractAddrByDenom(l2Denom);
    msgs.push(
      new MsgCall(
        l2Wallet.key.accAddress,
        tokenAddr,
        erc20Intf.encodeFunctionData("approve", [
          erc20WrapperContractAddr,
          ethers.MaxInt256,
        ]),
        "0",
        [],
      ),
    );
  }

  msgs.push(
    new MsgCall(
      l2Wallet.key.accAddress,
      wrapperAddr,
      wrapIntf.encodeFunctionData("toLocal(address,string,uint256,uint8)", [
        AccAddress.toHex(l2Wallet.key.accAddress),
        l2Denom,
        amount,
        6,
      ]),
      "0",
      [],
    ),
  );

  const tx = await l2Wallet.createAndSignTx({
    msgs: msgs,
    gas: "1",
    sequence,
  });
  return Buffer.from(tx.toBytes()).toString("base64");
}

async function generateIBCMemo(
  l2Wallet: Wallet,
  l2Denom: string,
  wrapperAddr: string,
): Promise<string> {
  const input = wrapIntf.encodeFunctionData(
    "toLocal(address,string,uint256,uint8)",
    [AccAddress.toHex(l2Wallet.key.accAddress), l2Denom, amount, 6],
  );
  return `{"evm":{"message":{"contract_addr":"${wrapperAddr}","input":"${input}"}}}`;
}

async function createAccount(
  l1Wallet: Wallet,
  l2Wallet: Wallet,
  bridgeId: bigint,
) {
  const tx = await l1Wallet.createAndSignTx({
    msgs: [
      new MsgInitiateTokenDeposit(
        l1Wallet.key.accAddress,
        Number(bridgeId),
        l2Wallet.key.accAddress,
        new Coin(`uinit`, 0),
      ),
    ],
  });
  const res = await l1Wallet.rest.tx.broadcast(tx);
  if (isTxError(res)) {
    throw new Error(`Failed to broadcast tx: ${res.raw_log}`);
  }

  console.info(
    `Successfully submitted transaction ${res.txhash} to create L2 account for address ${l2Wallet.key.accAddress}`,
  );

  console.info("Waiting for l2 account to be created...");

  // wait for l2 account to be created
  while (true) {
    try {
      const acc = await l2Wallet.rest.auth.accountInfo(l2Wallet.key.accAddress);
      console.info(
        `L2 account for ${
          l2Wallet.key.accAddress
        } created with account number ${acc.getAccountNumber()}`,
      );

      break;
    } catch (e) {
      if (e instanceof axios.AxiosError && e.response?.status === 404) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      } else {
        throw e;
      }
    }
  }
}

async function initiateTokenDepositTx(
  l1RestEndpoint: string,
  l2RestEndpoint: string,
  mnemonic: string,
  coinType: number,
  assets: { denom: string; bridgeType: string }[],
): Promise<string> {
  const l1Key = new MnemonicKey({
    mnemonic: mnemonic,
    eth: coinType === 60,
    coinType,
  });
  const l2Key = new MnemonicKey({
    mnemonic: mnemonic,
    eth: coinType === 60,
    coinType,
  });

  const l1RestClient = new RESTClient(l1RestEndpoint);
  const l2RestClient = new RESTClient(l2RestEndpoint);
  const bridgeInfo = await l2RestClient.opchild.bridgeInfo();
  const bridgeId = BigInt(bridgeInfo.bridge_id);
  const l1Wallet = new Wallet(l1RestClient, l1Key);
  const l2Wallet = new Wallet(l2RestClient, l2Key);
  const wrapperAddr = await l2Wallet.rest.evm.erc20Wrapper();
  const messages = [];

  // check l2 account existence
  try {
    await l2RestClient.auth.accountInfo(l2Key.accAddress);
  } catch (e) {
    if (e instanceof axios.AxiosError && e.response?.status === 404) {
      await createAccount(l1Wallet, l2Wallet, bridgeId);
    } else {
      throw e;
    }
  }

  const channelId = await getChannelId(l2RestClient);

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
          new Coin(l1Denom, amount != 0 ? amount : 1),
          l1Key.accAddress,
          wrapperAddr,
          undefined,
          ((new Date().getTime() / 1000 + 1000) * 1_000_000_000).toFixed(),
          await generateIBCMemo(l2Wallet, l2Denom, wrapperAddr),
        ),
      );
    } else if (bridgeType === "op") {
      const l2Denom = L2Denom(bridgeId, l1Denom);
      console.log(`L2 Denom: ${l2Denom} for ${l1Denom}`);

      messages.push(
        new MsgInitiateTokenDeposit(
          l1Key.accAddress,
          Number(bridgeId),
          l2Key.accAddress,
          new Coin(l1Denom, amount),
          await generateOPBridgeHookMessage(
            l2Wallet,
            l2Denom,
            sequence,
            wrapperAddr,
          ),
        ),
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
    mnemonic,
    coinType,
    assets,
  );

  console.log(`Initiate token deposit tx hash: ${txHash}`);
}

main();
