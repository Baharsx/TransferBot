const fs = require('fs');
const path = require('path');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const wallets = require('./wallets'); // wallets.js file containing the list of addresses

// RPC settings
const RPC_URL = 'https://api.testnet.v1.sonic.game';
const connection = new Connection(RPC_URL, 'confirmed');

// Function to check wallet balances
async function checkBalances(walletAddresses) {
  console.log("Starting to check balances for provided wallet addresses...");
  const balances = [];
  const results = []; // Array to store balance info for file output
  const lowBalanceAddresses = []; // Array to store low balance addresses

  for (const [index, address] of walletAddresses.entries()) {
    console.log(`Processing wallet #${index + 1} with address: ${address}`);
    try {
      const publicKey = new PublicKey(address);
      console.log(`Fetching balance for wallet #${index + 1}...`);
      const balanceLamports = await connection.getBalance(publicKey);
      console.log(`Balance fetched for wallet #${index + 1}: ${balanceLamports} lamports`);
      const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;

      // Add wallet info to the list
      const walletInfo = {
        WalletNumber: index + 1,
        Address: address,
        Balance: `${balanceSOL.toFixed(4)} SOL`
      };
      balances.push(walletInfo);
      results.push(`Wallet #${walletInfo.WalletNumber} - Address: ${walletInfo.Address}, Balance: ${walletInfo.Balance}\n`);

      // Store addresses with low balance
      if (balanceSOL < 0.001) {
        console.log(`Wallet #${index + 1} has low balance: ${balanceSOL.toFixed(4)} SOL`);
        lowBalanceAddresses.push(address);
      }

      // Display wallet result immediately
      console.log(`Wallet #${walletInfo.WalletNumber} - Address: ${walletInfo.Address}, Balance: ${walletInfo.Balance}`);

    } catch (error) {
      console.error(`Failed to get balance for ${address}:`, error);
      const walletInfo = {
        WalletNumber: index + 1,
        Address: address,
        Balance: "Error"
      };
      balances.push(walletInfo);
      results.push(`Wallet #${walletInfo.WalletNumber} - Address: ${walletInfo.Address}, Balance: ${walletInfo.Balance}\n`);
    }
  }

  // Display first 10 and last 5 wallets in the console
  console.log("Displaying first 10 and last 5 wallets:");
  console.table(balances.slice(0, 10)); // First 10 wallets
  console.table(balances.slice(-5)); // Last 5 wallets

  // Save results to balances.txt file
  console.log("Saving all balances to file...");
  const outputFile = path.join(__dirname, 'balances.txt');
  fs.writeFileSync(outputFile, results.join(''), 'utf8');
  console.log(`All balances saved to ${outputFile}`);

  // Save low balance addresses to low_balances.txt file
  if (lowBalanceAddresses.length > 0) {
    console.log("Saving low balance addresses to file...");
    const lowBalanceFile = path.join(__dirname, 'low_balances.txt');
    fs.writeFileSync(lowBalanceFile, lowBalanceAddresses.join('\n'), 'utf8');
    console.log(`Low balance addresses saved to ${lowBalanceFile}`);
  } else {
    console.log("No low balance addresses found.");
  }
}

// Start checking balances
console.log("Checking wallet balances...");
checkBalances(wallets.walletAddresses)
  .then(() => console.log("Balance check completed"))
  .catch((error) => console.error("Error during balance check:", error));