import fs from 'fs';

const foundryTomlMustExist = () => {
  if (!fs.existsSync('foundry.toml')) {
    console.error('foundry.toml does not exist');
    process.exit(1);
  }
}

const erc20SolMustExist = () => {
  if (!fs.existsSync('contracts/erc20/ERC20.sol')) {
    console.error('contracts/erc20/ERC20.sol does not exist');
    process.exit(1);
  }
}

export const preRunChecks = () => {
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  const JSON_RPC_ENDPOINT = process.env.JSON_RPC_ENDPOINT;
  const RPC_ENDPOINT = process.env.RPC_ENDPOINT;

  if (!CONTRACT_ADDRESS || !JSON_RPC_ENDPOINT || !RPC_ENDPOINT) {
    console.error('Error: Missing required environment variables');
    console.error('Please set CONTRACT_ADDRESS, JSON_RPC_ENDPOINT, and RPC_ENDPOINT');
    process.exit(1);
  }
  
  foundryTomlMustExist();
  erc20SolMustExist();

  return {
    CONTRACT_ADDRESS,
    JSON_RPC_ENDPOINT,
    RPC_ENDPOINT
  }
}
