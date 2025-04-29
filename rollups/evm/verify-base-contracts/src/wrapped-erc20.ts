require('dotenv').config();

import { ethers } from 'ethers';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
const execAsync = promisify(exec);

// Constants
const NAME_PREFIX = 'Wrapped';
const SYMBOL_PREFIX = 'W';
const WRAPPER_CONTRACT_ADDRESS = '0x4eb08D5c1B0A821303A86C7b3AC805c2793dE783';

// Standard ERC20 ABI for name and symbol functions
const ERC20_ABI = [{"type":"constructor","inputs":[{"name":"_name","type":"string","internalType":"string"},{"name":"_symbol","type":"string","internalType":"string"},{"name":"_decimals","type":"uint8","internalType":"uint8"},{"name":"_metadataSealed","type":"bool","internalType":"bool"}],"stateMutability":"nonpayable"},{"type":"function","name":"allowance","inputs":[{"name":"","type":"address","internalType":"address"},{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"approve","inputs":[{"name":"spender","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"nonpayable"},{"type":"function","name":"balanceOf","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"burn","inputs":[{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"burnFrom","inputs":[{"name":"from","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"nonpayable"},{"type":"function","name":"decimals","inputs":[],"outputs":[{"name":"","type":"uint8","internalType":"uint8"}],"stateMutability":"view"},{"type":"function","name":"metadataSealed","inputs":[],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"mint","inputs":[{"name":"to","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"name","inputs":[],"outputs":[{"name":"","type":"string","internalType":"string"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"sudoBurn","inputs":[{"name":"from","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"sudoMint","inputs":[{"name":"to","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"sudoTransfer","inputs":[{"name":"sender","type":"address","internalType":"address"},{"name":"recipient","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"supportsInterface","inputs":[{"name":"interfaceId","type":"bytes4","internalType":"bytes4"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"symbol","inputs":[],"outputs":[{"name":"","type":"string","internalType":"string"}],"stateMutability":"view"},{"type":"function","name":"totalSupply","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"transfer","inputs":[{"name":"recipient","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"nonpayable"},{"type":"function","name":"transferFrom","inputs":[{"name":"sender","type":"address","internalType":"address"},{"name":"recipient","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"nonpayable"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"updateMetadata","inputs":[{"name":"_name","type":"string","internalType":"string"},{"name":"_symbol","type":"string","internalType":"string"},{"name":"_decimals","type":"uint8","internalType":"uint8"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"Approval","inputs":[{"name":"owner","type":"address","indexed":true,"internalType":"address"},{"name":"spender","type":"address","indexed":true,"internalType":"address"},{"name":"value","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"MetadataUpdated","inputs":[{"name":"name","type":"string","indexed":false,"internalType":"string"},{"name":"symbol","type":"string","indexed":false,"internalType":"string"},{"name":"decimals","type":"uint8","indexed":false,"internalType":"uint8"}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"Transfer","inputs":[{"name":"from","type":"address","indexed":true,"internalType":"address"},{"name":"to","type":"address","indexed":true,"internalType":"address"},{"name":"value","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false}];

const WRAPPER_ABI = [{"type":"constructor","inputs":[{"name":"erc20Factory","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"factory","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract ERC20Factory"}],"stateMutability":"view"},{"type":"function","name":"ibc_ack","inputs":[{"name":"callback_id","type":"uint64","internalType":"uint64"},{"name":"success","type":"bool","internalType":"bool"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ibc_timeout","inputs":[{"name":"callback_id","type":"uint64","internalType":"uint64"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"localTokens","inputs":[{"name":"","type":"address","internalType":"address"},{"name":"","type":"uint8","internalType":"uint8"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"remoteDecimals","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint8","internalType":"uint8"}],"stateMutability":"view"},{"type":"function","name":"remoteTokens","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"setFactory","inputs":[{"name":"newFactory","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"supportsInterface","inputs":[{"name":"interfaceId","type":"bytes4","internalType":"bytes4"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"toLocal","inputs":[{"name":"receiver","type":"address","internalType":"address"},{"name":"remoteDenom","type":"string","internalType":"string"},{"name":"remoteAmount","type":"uint256","internalType":"uint256"},{"name":"_remoteDecimals","type":"uint8","internalType":"uint8"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"toLocal","inputs":[{"name":"receiver","type":"address","internalType":"address"},{"name":"remoteDenom","type":"string","internalType":"string"},{"name":"_remoteDecimals","type":"uint8","internalType":"uint8"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"toRemote","inputs":[{"name":"receiver","type":"address","internalType":"address"},{"name":"localDenom","type":"string","internalType":"string"},{"name":"localAmount","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"remoteToken","type":"address","internalType":"address"},{"name":"remoteAmount","type":"uint256","internalType":"uint256"},{"name":"_remoteDecimals","type":"uint8","internalType":"uint8"}],"stateMutability":"nonpayable"},{"type":"function","name":"toRemoteAndIBCTransfer","inputs":[{"name":"localDenom","type":"string","internalType":"string"},{"name":"localAmount","type":"uint256","internalType":"uint256"},{"name":"channel","type":"string","internalType":"string"},{"name":"receiver","type":"string","internalType":"string"},{"name":"timeout","type":"uint256","internalType":"uint256"},{"name":"memo","type":"string","internalType":"string"},{"name":"gasLimit","type":"uint64","internalType":"uint64"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"toRemoteAndIBCTransfer","inputs":[{"name":"localDenom","type":"string","internalType":"string"},{"name":"localAmount","type":"uint256","internalType":"uint256"},{"name":"channel","type":"string","internalType":"string"},{"name":"receiver","type":"string","internalType":"string"},{"name":"timeout","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"toRemoteAndIBCTransfer","inputs":[{"name":"localDenom","type":"string","internalType":"string"},{"name":"localAmount","type":"uint256","internalType":"uint256"},{"name":"channel","type":"string","internalType":"string"},{"name":"receiver","type":"string","internalType":"string"},{"name":"timeout","type":"uint256","internalType":"uint256"},{"name":"memo","type":"string","internalType":"string"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"toRemoteAndOPWithdraw","inputs":[{"name":"receiver","type":"string","internalType":"string"},{"name":"localDenom","type":"string","internalType":"string"},{"name":"localAmount","type":"uint256","internalType":"uint256"},{"name":"gasLimit","type":"uint64","internalType":"uint64"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"toRemoteAndOPWithdraw","inputs":[{"name":"receiver","type":"string","internalType":"string"},{"name":"localDenom","type":"string","internalType":"string"},{"name":"localAmount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"error","name":"StringsInsufficientHexLength","inputs":[{"name":"value","type":"uint256","internalType":"uint256"},{"name":"length","type":"uint256","internalType":"uint256"}]}]

async function main() {
  // Get environment variables
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  const JSON_RPC_ENDPOINT = process.env.JSON_RPC_ENDPOINT;
  const RPC_ENDPOINT = process.env.RPC_ENDPOINT;

  if (!CONTRACT_ADDRESS || !JSON_RPC_ENDPOINT || !RPC_ENDPOINT) {
    console.error('Error: Missing required environment variables');
    console.error('Please set CONTRACT_ADDRESS, JSON_RPC_ENDPOINT, and RPC_ENDPOINT');
    process.exit(1);
  }

  console.log(`CONTRACT_ADDRESS: ${CONTRACT_ADDRESS}`);

  // Format contract address for Initia
  const localToken = CONTRACT_ADDRESS.replace('0x', 'evm/');
  
  try {
    // Create ethers provider
    const provider = new ethers.JsonRpcProvider(JSON_RPC_ENDPOINT);
    
    // Create contract instance
    const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, provider);
    const wrapperContract = new ethers.Contract(WRAPPER_CONTRACT_ADDRESS, WRAPPER_ABI, provider);

    const remoteToken = await wrapperContract.remoteTokens(CONTRACT_ADDRESS);
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
    
    // Command to execute Forge verification (for informational purposes)
    const verifyCommand = 
      `forge verify-contract \\
      --rpc-url ${JSON_RPC_ENDPOINT} \\
      --verifier custom \\
      --verifier-url https://verification.alleslabs.dev/evm/verification/solidity/external/${chainId} \\
      --constructor-args $(cast abi-encode "constructor(string,string,uint256,bool)" "${name}" "${symbol}" 18 false) \\
      ${CONTRACT_ADDRESS} \\
      contracts/erc20/ERC20.sol:ERC20`;
    
    console.log('Verification command:');
    console.log(verifyCommand);
    
    // Uncomment to actually execute the command:
    // await execAsync(verifyCommand, { stdio: 'inherit' });
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error); 
