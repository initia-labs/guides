import { ethers } from 'ethers';
import { spawn } from 'child_process';
import axios from 'axios';
import { contractAddress, jsonRpcEndpoint, rpcEndpoint, scanBaseUrl } from './env';
import ERC20_ABI from '../abis/ERC20.json';
import WRAPPER_ABI from '../abis/ERC20Wrapper.json';
import { erc20SolMustExist, foundryTomlMustExist } from './utils';

// Constants
const WRAPPER_CONTRACT_ADDRESS = '0x4eb08D5c1B0A821303A86C7b3AC805c2793dE783';
const WRAPPED_NAME_PREFIX = 'Wrapped';
const WRAPPED_SYMBOL_PREFIX = 'W';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

async function main() {
  foundryTomlMustExist();
  erc20SolMustExist();

  console.log(`CONTRACT_ADDRESS: ${contractAddress}`);

  try {
    // Create ethers provider
    const provider = new ethers.JsonRpcProvider(jsonRpcEndpoint);
    
    // Create contract instance
    const tokenContract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
    const wrapperContract = new ethers.Contract(WRAPPER_CONTRACT_ADDRESS, WRAPPER_ABI, provider);

    const remoteToken = await wrapperContract.remoteTokens(contractAddress);

    let name: string;
    let symbol: string;

    if (remoteToken.toLowerCase() === ZERO_ADDRESS) {
      // Regular ERC20 token verification
      console.log('Regular ERC20 token detected, proceeding with standard verification...');
      name = await tokenContract.name();
      symbol = await tokenContract.symbol();
      console.log(`Token name: ${name}, token symbol: ${symbol}`);
    } else {
      // Wrapped token verification
      console.log('Wrapped token detected, proceeding with wrapped token verification...');
      console.log(`Getting token information from ${remoteToken}...`);
      const erc20Name = await tokenContract.name();
      const erc20Symbol = await tokenContract.symbol();
      console.log(`Remote token name: ${erc20Name}, token symbol: ${erc20Symbol}`);

      // Concatenate as per reference logic
      name = `${WRAPPED_NAME_PREFIX}${erc20Name}`;
      symbol = `${WRAPPED_SYMBOL_PREFIX}${erc20Symbol}`; 
    }
    
    // Get chain ID from RPC endpoint
    const chainIdResponse = await axios.get(`${rpcEndpoint}/status`);
    const chainId = chainIdResponse.data.result.node_info.network;
    
    // Encode constructor arguments using ethers.js
    const iface = new ethers.Interface(ERC20_ABI);
    const constructorArgs = iface.encodeDeploy([name, symbol, 18, false]).slice(2);
    
    const verifyArgs = [
      'verify-contract',
      '--rpc-url', jsonRpcEndpoint,
      '--verifier', 'custom',
      '--verifier-url', `https://verification.alleslabs.dev/evm/verification/solidity/external/${chainId}`,
      '--constructor-args', constructorArgs,
      '--watch',
      contractAddress,
      'contracts/erc20/ERC20.sol:ERC20'
    ];
    
    const forgeProcess = spawn('forge', verifyArgs, {
      stdio: 'inherit',
      shell: false
    });

    await new Promise((resolve, reject) => {
      forgeProcess.on('close', (code) => {
        if (code === 0) {
          resolve(undefined);
        } else {
          reject(new Error(`Forge process exited with code ${code}`));
        }
      });
      
      forgeProcess.on('error', (err) => {
        reject(err);
      });
    });

    console.log('Verification request submitted successfully');
    console.log(`You can check the status of the verification at ${scanBaseUrl}/${chainId}/evm-contracts/${contractAddress}`);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
