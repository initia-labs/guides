# Wrapping Tokens

This guide provides a simple command to create wrapped EVM denoms on your EVM rollup and also shows you how to fetch it. Note that this is a requirement for any bridged token to be used in your EVM rollup.

If more tokens from L1 to be used in your rollup in the future, just append those L1 token denoms to the list and run the command again.

## Installation

```bash
npm install

# if ts-node is not installed globally
npm install -g ts-node typescript
```

## Configuration

Copy `.env.testnet.example` or `.env.mainnet.example` to `.env` based on your rollup network and configure the following variables:

- `ASSET_LIST`: Comma-separated list of L1 denoms to wrap. See [Mainnet default tokens](./mainnet-default-tokens.md) or [Testnet default tokens](./testnet-default-tokens.md) for default L1 token denoms.
- `L1_REST_ENDPOINT`: L1 chain REST endpoint
- `L2_REST_ENDPOINT`: Your rollup chain REST endpoint
- `L1_GAS_PRICES`: Gas prices for L1 transactions
- `MNEMONIC`: The mnemonic of the account to send this transaction
- `COIN_TYPE`: coin type for account derivation path (BIP-44). Default as 60

**Before proceeding, ensure your account meets the following requirements:**

- Has sufficient INIT tokens on L1 to cover transaction gas fees
- Maintains a positive balance for all IBC tokens (ibc/...) listed in `ASSET_LIST` on L1 (zero balance is acceptable for OP tokens with l2/... prefix)
- Is properly registered on your rollup (either as a system account, included in genesis accounts, or has previously received assets)

## Creating Wrapped Tokens

To create wrapped denoms on L2 once you have `.env` ready:

```bash
npm run create-wrapped-tokens
```

This will:

1. Generate hook messages for each L1 denom
2. Create and sign deposit transactions
3. Broadcast the transactions to initiate token deposits
4. Output the transaction hash for tracking

## Fetching Wrapped Token Denoms

To fetch the addresses of wrapped denoms on L2:

```bash
npm run fetch-wrapped-tokens
```

This will:

1. Query the L2 chain for each L1 denom
2. Retrieve the corresponding wrapped token contract addresses
3. Display the mapping between L1 denoms and their L2 wrapped token addresses

Example output:

```shell
--------------------------------
L1Denom: uinit
L2Denom: evm/1234...
--------------------------------
```

## Unwrapping Wrapped Tokens

To unwrap wrapped tokens and transfer them back to L1, you need to set ASSET_LIST in your `.env` file to the L2 denoms you want to unwrap. 

```bash
ASSET_LIST=evm/9989cFca23e97B2AEd8EA21d9CF244A03Cc89f02:ibc
```

Then run:

```bash
npm run unwrap-wrapped-tokens
```

This will:
1. Initiate a withdrawal transaction for each wrapped token
2. Send the wrapped tokens back to the L1 chain
3. Output the transaction hash for tracking
