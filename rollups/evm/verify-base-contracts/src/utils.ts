import fs from 'fs';

export const foundryTomlMustExist = () => {
  if (!fs.existsSync('foundry.toml')) {
    console.error('foundry.toml does not exist');
    process.exit(1);
  }
}

export const erc20SolMustExist = () => {
  if (!fs.existsSync('contracts/erc20/ERC20.sol')) {
    console.error('contracts/erc20/ERC20.sol does not exist');
    process.exit(1);
  }
}
