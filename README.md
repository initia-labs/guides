# Initia Guides

This repository contains comprehensive guides and tools for working with Interwoven rollups. These guides help developers set up, configure, and manage their rollup deployments created with the Interwoven stack.

## 📚 Available Guides

### EVM Rollups

#### 1. [Wrapping Tokens](./rollups/evm/wrapping-tokens/)

A comprehensive guide for creating and managing wrapped EVM denoms on your EVM rollup. This is a **required step** for any bridged token to be used in your EVM rollup.

**Key Features:**
- Create wrapped tokens from L1 to L2
- Fetch wrapped token addresses and mappings
- Support for both mainnet and testnet configurations
- Pre-configured default token lists

**Prerequisites:**
- Node.js and npm/pnpm
- TypeScript and ts-node
- Sufficient INIT tokens on L1 for gas fees
- Proper account registration on your rollup

#### 2. [Verify Base Contracts](./rollups/evm/verify-base-contracts/)

A guide for verifying ERC20 token contracts on your EVM rollup. This ensures that deployed contracts match expected source code and constructor arguments.

**Key Features:**
- Automated ERC20 contract verification
- Support for both regular and wrapped tokens
- Integration with verification services
- Foundry-based verification process

**Prerequisites:**
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js and pnpm
- Access to your rollup's JSON-RPC endpoint
