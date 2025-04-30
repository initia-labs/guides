import { ethers } from 'ethers';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { contractAddress, jsonRpcEndpoint, rpcEndpoint, scanBaseUrl } from './env';
import ERC20_ABI from '../abis/ERC20.json';
import WRAPPER_ABI from '../abis/ERC20Wrapper.json';
const execAsync = promisify(exec);

// Constants
const WRAPPER_CONTRACT_ADDRESS = '0x4eb08D5c1B0A821303A86C7b3AC805c2793dE783';
const WRAPPED_NAME_PREFIX = 'Wrapped';
const WRAPPED_SYMBOL_PREFIX = 'W';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

async function main() {
  console.log(`CONTRACT_ADDRESS: ${contractAddress}`);

  try {
    // Create ethers provider
    const provider = new ethers.JsonRpcProvider(jsonRpcEndpoint);
    
    // Create contract instance
    const tokenContract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
    const wrapperContract = new ethers.Contract(WRAPPER_CONTRACT_ADDRESS, WRAPPER_ABI, provider);

    const remoteToken = await wrapperContract.remoteTokens(contractAddress);
    console.log(`Remote token: ${remoteToken}`);

    let name: string;
    let symbol: string;

    if (remoteToken.toLowerCase() === ZERO_ADDRESS) {
      // Regular ERC20 token verification
      console.log('Regular ERC20 token detected, proceeding with standard verification...');
      name = await tokenContract.name();
      symbol = await tokenContract.symbol();
      console.log(`Token name: ${name}`);
      console.log(`Token symbol: ${symbol}`);
    } else {
      // Wrapped token verification
      console.log('Wrapped token detected, proceeding with wrapped token verification...');
      console.log(`Getting token name from ${remoteToken}...`);
      const erc20Name = await tokenContract.name();
      console.log(`Remote token name: ${erc20Name}`);
      console.log(`Getting token symbol from ${remoteToken}...`);
      const erc20Symbol = await tokenContract.symbol();
      console.log(`Remote token symbol: ${erc20Symbol}`);

      // Concatenate as per reference logic
      name = `${WRAPPED_NAME_PREFIX}${erc20Name}`;
      symbol = `${WRAPPED_SYMBOL_PREFIX}${erc20Symbol}`; 
    }
    
    
    // Get chain ID from RPC endpoint
    const chainIdResponse = await axios.get(`${rpcEndpoint}/status`);
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
      --rpc-url ${jsonRpcEndpoint} \\
      --verifier custom \\
      --verifier-url https://verification.alleslabs.dev/evm/verification/solidity/external/${chainId} \\
      --constructor-args ${constructorArgs} \\
      --watch \\
      ${contractAddress} \\
      contracts/erc20/ERC20.sol:ERC20`;
    
    console.log('Verification command:');
    console.log(verifyCommand);
    
    await execAsync(verifyCommand);

    console.log('Verification request submitted successfully');
    console.log(`You can check the status of the verification at ${scanBaseUrl}/${chainId}/evm-contracts/${contractAddress}`);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error); 
