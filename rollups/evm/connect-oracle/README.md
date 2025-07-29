##  Connect Oracle

### Foundry

For this tutorial, we will be using [Foundry](https://github.com/foundry-rs/foundry) toolkit to develop, compile, and deploy our contracts. If you do not have Foundry installed, follow the [Foundry installation instructions](https://getfoundry.sh/).

## Setup

Clone the repository and navigate to the `rollups/evm/connect-oracle` directory:

```sh
git clone https://github.com/initia-labs/guides.git
cd guides/rollups/evm/connect-oracle
```

## Deploying the Contract

Set your environment variables and run the deployment. Be sure to replace `PRIVATE_KEY` with the deployer's private key, and `JSON_RPC_URL` with your rollup's JSON-RPC endpoint.

```sh
export PRIVATE_KEY=0x...
export JSON_RPC_URL=https://json-rpc.minievm-2.initia.xyz

forge script script/Oracle.s.sol:OracleScript \
  --rpc-url $JSON_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --via-ir \
  --with-gas-price 0 \
  --skip-simulation
```

Output should look like this:

```sh
[⠊] Compiling...
[⠊] Compiling 18 files with Solc 0.8.28
[⠒] Solc 0.8.28 finished in 918.49ms
Compiler run successful!
Script ran successfully.

SKIPPING ON CHAIN SIMULATION.

##### 4303131403034904
✅  [Success] Hash: 0x8d9c488d7599fd867e45eee3b3a6ede24fec8f6459433051c341ef1937026bcf
Contract Address: 0x505500221090Cd06400125B4f41A266B89Ffd62e
Block: 10493369
Gas Used: 290728

✅ Sequence #1 on 4303131403034904 | Total Paid: 0. ETH (290728 gas * avg 0 gwei)
```

To query the `oracle_get_price()` function, use Foundry’s cast call command.

```sh
cast call 0x505500221090Cd06400125B4f41A266B89Ffd62e "oracle_get_price()" --rpc-url $JSON_RPC_URL
```

Output should look like this:

```sh
0x00000000000000000000000000000000000000000000000000000002c3cd0d430000000000000000000000000000000000000000000000001856610b4b695788
```

The output is a hexadecimal representation of the price and timestamp.