#!/bin/bash

# Usage information
function show_usage {
  echo "Usage: $0 <ERC20_NAME> <ERC20_SYMBOL>"
  echo "Example: $0 \"TestToken\" \"TEST\""
  exit 1
}

# Check for required arguments
if [ $# -lt 2 ]; then
  echo "Error: Missing required arguments"
  show_usage
fi

# Get ERC20 name and symbol from command line arguments
ERC20_NAME="$1"
ERC20_SYMBOL="$2"

echo "Using ERC20 NAME: $ERC20_NAME, SYMBOL: $ERC20_SYMBOL"

# check if foundry.toml exists
if [ ! -f "foundry.toml" ]; then
  echo "foundry.toml does not exist"
  exit 1
fi

# check if the ERC20.sol file exists
if [ ! -f "contracts/erc20/ERC20.sol" ]; then
  echo "contracts/erc20/ERC20.sol does not exist"
  echo "Current directory structure:"
  find contracts -type f -name "*.sol" | sort
  exit 1
fi

# build the contracts with forge
echo "Building ERC20 contract..."
forge build --contracts contracts/erc20/ERC20.sol --build-info --use 0.8.25 --optimize false

# get chain id from rpc endpoint
CHAIN_ID=$(curl -s $RPC_ENDPOINT/status | jq -r '.result.node_info.network')

# verify the contracts
forge verify-contract \
  --rpc-url $JSON_RPC_ENDPOINT \
  --verifier custom \
  --verifier-url https://verification.alleslabs.dev/evm/verification/solidity/external/$CHAIN_ID \
  --constructor-args $(cast abi-encode "constructor(string,string,uint256,bool)" "$ERC20_NAME" "$ERC20_SYMBOL" 18 false) \
  $CONTRACT_ADDRESS \
  contracts/erc20/ERC20.sol:ERC20
