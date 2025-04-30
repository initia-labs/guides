# Verify Base Contracts

This guide provides instructions for verifying ERC20 token contracts on your EVM rollup. The verification process ensures that the deployed contract matches the expected source code and constructor arguments.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) must be installed
- Node.js and pnpm installed

## Installation

Install dependencies

```bash
pnpm install
```

Setup project

```bash
./setup.sh
```

## Configuration

Copy `.env.example` to `.env` and configure the following variables:

- `CONTRACT_ADDRESS`: The address of the ERC20 contract to verify
- `JSON_RPC_ENDPOINT`: Your rollup chain's JSON-RPC endpoint
- `RPC_ENDPOINT`: Your rollup chain's RPC endpoint
- `NETWORK_TYPE`: MAINNET or TESTNET. Default as MAINNET if not specified

## Verification Process

The verification script will:

1. Connect to the specified contract address
2. Determine if the token is a regular ERC20 or a wrapped token
3. Extract the token's name and symbol
4. Generate the appropriate constructor arguments
5. Submit the verification request to the verification service

To verify an ERC20 contract:

```bash
pnpm run erc20
```

This will:
1. Query the contract to get its details
2. Generate the verification command with the correct constructor arguments
3. Submit the verification request

## Notes

- The verification process supports both regular ERC20 tokens and wrapped tokens
- For wrapped tokens, the script automatically prepends "Wrapped" to the name and "W" to the symbol
- The verification uses the custom verifier at `https://verification-staging.alleslabs.dev`
