require('dotenv').config();

import { ethers } from 'ethers';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { preRunChecks } from './utils';
import ERC20_ABI from '../abis/ERC20.json';
import WRAPPER_ABI from '../abis/ERC20Wrapper.json';
const execAsync = promisify(exec);

// Constants
const NAME_PREFIX = 'Wrapped';
const SYMBOL_PREFIX = 'W';
const WRAPPER_CONTRACT_ADDRESS = '0x4eb08D5c1B0A821303A86C7b3AC805c2793dE783';

async function main() {
  // Get environment variables
  const { CONTRACT_ADDRESS, JSON_RPC_ENDPOINT, RPC_ENDPOINT } = preRunChecks();

  console.log(`CONTRACT_ADDRESS: ${CONTRACT_ADDRESS}`);

  // Format contract address for Initia
  const localToken = CONTRACT_ADDRESS.replace('0x', 'evm/');
  
  try {
    // Create ethers provider
    const provider = new ethers.JsonRpcProvider(JSON_RPC_ENDPOINT);
    
    // Create contract instance
    const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, provider);
    const wrapperContract = new ethers.Contract(WRAPPER_CONTRACT_ADDRESS, WRAPPER_ABI, provider);

    const remoteToken = await wrapperContract.remoteTokens(localToken);
    console.log(`Remote token: ${remoteToken}`);

    // Get ERC20 name using ethers.js
    console.log(`Getting token name from ${remoteToken}...`);
    const erc20Name = await tokenContract.name();
    console.log(`Token name: ${erc20Name}`);

    // Get ERC20 symbol using ethers.js
    console.log(`Getting token symbol from ${remoteToken}...`);
    const erc20Symbol = await tokenContract.symbol();
    console.log(`Token symbol: ${erc20Symbol}`);

    // Concatenate as per reference logic
    const name = `${NAME_PREFIX}${erc20Name}`;
    const symbol = `${SYMBOL_PREFIX}${erc20Symbol}`;
    
    console.log(`Final name: ${name}`);
    console.log(`Final symbol: ${symbol}`);
    
    // Get chain ID from RPC endpoint
    const chainIdResponse = await axios.get(`${RPC_ENDPOINT}/status`);
    const chainId = chainIdResponse.data.result.node_info.network;
    
    console.log(`Chain ID: ${chainId}`);
    console.log(`Verifying ERC20 contract with NAME='${name}', SYMBOL='${symbol}'...`);

    // Encode constructor arguments using ethers.js
    const iface = new ethers.Interface(ERC20_ABI);
    const constructorArgs = iface.encodeDeploy([name, symbol, 18, false]).slice(2);
    console.log(`Encoded constructor args: ${constructorArgs}`);
    
    // Command to execute Forge verification (for informational purposes)
    const verifyCommand = 
      `forge verify-contract \\
      --rpc-url ${JSON_RPC_ENDPOINT} \\
      --verifier custom \\
      --verifier-url https://verification.alleslabs.dev/evm/verification/solidity/external/${chainId} \\
      --constructor-args ${constructorArgs} \\
      ${CONTRACT_ADDRESS} \\
      contracts/erc20/ERC20.sol:ERC20`;
    
    console.log('Verification command:');
    console.log(verifyCommand);
    
    // await execAsync(verifyCommand);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error); 
