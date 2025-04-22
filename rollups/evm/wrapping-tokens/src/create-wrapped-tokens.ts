import {
    assetList,
    l1GasPrices,
    l1RestEndpoint,
    l2RestEndpoint,
    mnemonic,
  } from "./env";
  import { L2Denom } from "./utils";
  
  import {
    MsgInitiateTokenDeposit,
    MsgCall,
    Wallet,
    RESTClient,
    MnemonicKey,
    AccAddress,
    Coin,
    isTxError,
  } from "@initia/initia.js";
  import { AbiCoder } from "ethers";
  
  async function generateHookMessage(
    l2Wallet: Wallet,
    l1Denom: string,
    bridgeId: bigint,
    sequence: number
  ): Promise<string> {
    const l2Denom = L2Denom(bridgeId, l1Denom);
    console.log(`created l2Denom: ${l2Denom} for ${l1Denom}`);
  
    const abiCoder = new AbiCoder();
    const encoded = abiCoder.encode(
      ["address", "string", "uint256", "uint8"],
      [AccAddress.toHex(l2Wallet.key.accAddress), l2Denom, 0, 6]
    );
  
    const msg = new MsgCall(
      l2Wallet.key.accAddress,
      // TODO: at this step, we don't have rest endpoint for l2, so use pre-computed contract address.
      // It can be changed if we have updated the contract implementation.
      "0x4eb08D5c1B0A821303A86C7b3AC805c2793dE783",
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
  
  async function initiateTokenDepositTx(
    l1RestEndpoint: string,
    l2RestEndpoint: string,
    l1GasPrices: string,
    mnemonic: string,
    assets: string[]
  ): Promise<string> {
    const l1Key = new MnemonicKey({
      mnemonic: mnemonic,
      eth: false,
      coinType: 118,
    });
    const l2Key = new MnemonicKey({
      mnemonic: mnemonic,
      eth: false,
      coinType: 118,
    });
  
    const l1RestClient = new RESTClient(l1RestEndpoint, {
      gasPrices: l1GasPrices,
    });
    const l2RestClient = new RESTClient(l2RestEndpoint, { gasPrices: {} });
    const bridgeInfo = await l2RestClient.opchild.bridgeInfo();
    const bridgeId = BigInt(bridgeInfo.bridge_id);
    const l1Wallet = new Wallet(l1RestClient, l1Key);
    const l2Wallet = new Wallet(l2RestClient, l2Key);
    const messages = [];
  
    // at this step, we don't have rest endpoint for l2, so use 0 sequence
    // let sequence = await l2Wallet.sequence();
    let sequence = 0;
    for (const asset of assets) {
      const hookMessage = await generateHookMessage(
        l2Wallet,
        asset,
        bridgeId,
        sequence
      );
      messages.push(
        new MsgInitiateTokenDeposit(
          l1Key.accAddress,
          Number(bridgeId),
          l2Key.accAddress,
          new Coin(asset, 0),
          hookMessage
        )
      );
      sequence++;
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
      assetList
    );
  
    console.log(`Initiate token deposit tx hash: ${txHash}`);
  }
  
  main();
