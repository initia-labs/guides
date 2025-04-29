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

# remove minievm
rm -rf minievm

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
EOF

echo "Setup complete."
