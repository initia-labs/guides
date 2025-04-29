import "dotenv/config"
import { ethers } from "ethers"
import { exec } from "child_process"
import { promisify } from "util"
import axios from "axios"
import { preRunChecks } from "./utils"
import ERC20_ABI from "../abis/ERC20.json"

const execAsync = promisify(exec)

async function main() {
  const { CONTRACT_ADDRESS, JSON_RPC_ENDPOINT, RPC_ENDPOINT } = preRunChecks();
  
  try {
    // Create ethers provider
    const provider = new ethers.JsonRpcProvider(JSON_RPC_ENDPOINT);
    
    // Create contract instance
    const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, provider);

    const ERC20_NAME = await tokenContract.name();
    const ERC20_SYMBOL = await tokenContract.symbol();

    console.log(`Using ERC20 NAME: ${ERC20_NAME}, SYMBOL: ${ERC20_SYMBOL}`)
    // Build the contracts with forge
    console.log("Building ERC20 contract...")
    await execAsync(
      "forge build --contracts contracts/erc20/ERC20.sol --build-info --use 0.8.25 --optimize false"
    )

    // Get chain ID from RPC endpoint
    const chainIdResponse = await axios.get(`${RPC_ENDPOINT}/status`)
    const chainId = chainIdResponse.data.result.node_info.network

    console.log(`Chain ID: ${chainId}`)
    console.log(
      `Verifying ERC20 contract with NAME='${ERC20_NAME}', SYMBOL='${ERC20_SYMBOL}'...`
    )

    // Encode constructor arguments using ethers.js
    const iface = new ethers.Interface(ERC20_ABI);
    const constructorArgs = iface.encodeDeploy([ERC20_NAME, ERC20_SYMBOL, 18, false]).slice(2);
    console.log(`Encoded constructor args: ${constructorArgs}`);

    // Verify the contracts
    const verifyCommand = `forge verify-contract \\
      --rpc-url ${JSON_RPC_ENDPOINT} \\
      --verifier custom \\
      --verifier-url https://verification-staging.alleslabs.dev/evm/verification/solidity/external/${chainId} \\
      --constructor-args ${constructorArgs} \\
      ${CONTRACT_ADDRESS} \\
      contracts/erc20/ERC20.sol:ERC20`

    console.log("Verification command:")
    console.log(verifyCommand)

    // Execute the verification command
    await execAsync(verifyCommand)
  } catch (error: any) {
    console.error("Error:", error.message)
    process.exit(1)
  }
}

main().catch(console.error)
