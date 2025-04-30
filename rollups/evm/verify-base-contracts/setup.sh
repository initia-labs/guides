#!/bin/bash

rm -rf minievm contracts foundry.toml

# download contracts from https://github.com/initia-labs/minievm
git clone https://github.com/initia-labs/minievm

# get current minievm version from calling rpc endpoint /abci_info via HTTPS GET
MINIEVM_VERSION=$(curl -s $RPC_ENDPOINT/abci_info | jq -r '.result.response.version')
echo "Using MINIEVM_VERSION: $MINIEVM_VERSION from $RPC_ENDPOINT"

# checkout the specific version of minievm or use main if checkout fails
cd minievm
if ! git checkout $MINIEVM_VERSION 2>/dev/null; then
    echo "Failed to checkout $MINIEVM_VERSION, falling back to main branch"
    git checkout main
fi
cd ..

# then copy minievm/x/evm/contracts to this directory
cp -r minievm/x/evm/contracts .

# create base foundry.toml
cat <<EOF > foundry.toml
[profile.default]
src = "contracts"
out = "out"
libs = ["lib"]
solc = "0.8.25"
optimize = false
build_info = true
allow_paths = ["contracts"]
extra_output = ["abi", "evm.bytecode"]
bytecode_hash = "none"
EOF

# create abis directory if it doesn't exist
mkdir -p abis

# build the contracts and extract ABIs
echo "Building ERC20 contract..."
forge build --contracts contracts/erc20/ERC20.sol --build-info --use 0.8.25 --optimize false
jq '.abi' out/ERC20.sol/ERC20.json > abis/ERC20.json

echo "Building ERC20Wrapper contract..."
forge build --contracts contracts/erc20_wrapper/ERC20Wrapper.sol --build-info --use 0.8.25 --optimize false
jq '.abi' out/ERC20Wrapper.sol/ERC20Wrapper.json > abis/ERC20Wrapper.json

echo "Building ERC20Factory contract..."
forge build --contracts contracts/erc20_factory/ERC20Factory.sol --build-info --use 0.8.25 --optimize false
jq '.abi' out/ERC20Factory.sol/ERC20Factory.json > abis/ERC20Factory.json

# remove minievm
rm -rf minievm

echo "Setup complete."
