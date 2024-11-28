const { Connection, Keypair, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');
const bs58 = require('bs58');
const chalk = require('chalk');
const ora = require('ora');
const figlet = require('figlet');
const p1k = require('./p1k');
const pk = require('./pk');
const wallets = require('./wallets');

// RPC endpoint
const RPC_URL = 'https://api.testnet.v1.sonic.game';
const connection = new Connection(RPC_URL, 'confirmed');

// Minimum balance reserved for transaction fees
const REQUIRED_RENT_LAMPORTS = 0.001 * LAMPORTS_PER_SOL;

// Load addresses with successful transfers to avoid duplicate sends
function loadSuccessfulAddresses(fileName) {
  const filePath = path.join(__dirname, fileName);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return new Set(data.split('\n').filter(line => line.trim()));
  }
  return new Set();
}

// Save a successful recipient address to avoid re-sending to it
function saveSuccessfulAddress(fileName, address) {
  const filePath = path.join(__dirname, fileName);
  fs.appendFileSync(filePath, `${address}\n`);
}

// Convert private key from Base58 to Keypair
function getKeypairFromBase58(privateKey) {
  const secretKey = bs58.decode(privateKey);
  return Keypair.fromSecretKey(secretKey);
}

// Function to get balance of a specific sender wallet
async function getSenderBalance(senderKeypair) {
  const balance = await connection.getBalance(senderKeypair.publicKey);
  return balance;
}

// Function to distribute total balance equally to each pk recipient
async function distributeTotalBalance(senderKeys, recipientAddresses, successfulFile) {
  const successfulAddresses = loadSuccessfulAddresses(successfulFile);

  for (let senderIndex = 0; senderIndex < senderKeys.length; senderIndex++) {
    const senderKeypair = getKeypairFromBase58(senderKeys[senderIndex]);
    let senderBalanceLamports = await getSenderBalance(senderKeypair);

    // Calculate lamports to send per recipient for this sender
    const lamportsPerRecipient = Math.floor((senderBalanceLamports - REQUIRED_RENT_LAMPORTS) / recipientAddresses.length);

    if (lamportsPerRecipient <= 0) {
      console.log(chalk.red.bold(`⛔ Insufficient balance in sender wallet ${senderKeypair.publicKey.toBase58()} for distribution.`));
      continue;
    }

    for (const recipientAddress of recipientAddresses) {
      if (successfulAddresses.has(recipientAddress)) {
        console.log(chalk.yellow(`⚠️ Skipping already successful address: ${recipientAddress}`));
        continue;
      }

      try {
        // Create and send the transaction
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: senderKeypair.publicKey,
            toPubkey: new PublicKey(recipientAddress),
            lamports: lamportsPerRecipient,
          })
        );

        const signature = await connection.sendTransaction(transaction, [senderKeypair]);
        await connection.confirmTransaction(signature, 'confirmed');
        console.log(chalk.green.bold(`✅ Transferred ${(lamportsPerRecipient / LAMPORTS_PER_SOL).toFixed(6)} SOL from ${senderKeypair.publicKey.toBase58()} to ${recipientAddress} with signature: ${signature}`));

        saveSuccessfulAddress(successfulFile, recipientAddress);
        senderBalanceLamports -= lamportsPerRecipient;

      } catch (error) {
        console.error(chalk.red.bold(`❌ Failed to transfer to ${recipientAddress}: ${error.message}`));
        continue;
      }
    }
  }
}

// Transfer the entire balance (minus fees) from each sender in pk to corresponding wallet in wallets
async function transferFullBalance(senderKeys, recipientAddresses, successfulFile) {
  const successfulAddresses = loadSuccessfulAddresses(successfulFile);

  for (let i = 0; i < senderKeys.length; i++) {
    const senderKeypair = getKeypairFromBase58(senderKeys[i]);
    const recipientAddress = recipientAddresses[i];

    if (successfulAddresses.has(recipientAddress)) {
      console.log(chalk.yellow(`⚠️ Skipping already successful address: ${recipientAddress}`));
      continue;
    }

    try {
      const senderBalanceLamports = await getSenderBalance(senderKeypair);
      const lamportsToSend = senderBalanceLamports - REQUIRED_RENT_LAMPORTS;

      if (lamportsToSend > 0) {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: senderKeypair.publicKey,
            toPubkey: new PublicKey(recipientAddress),
            lamports: lamportsToSend,
          })
        );

        const signature = await connection.sendTransaction(transaction, [senderKeypair]);
        await connection.confirmTransaction(signature, 'confirmed');
        console.log(chalk.green.bold(`✅ Transferred ${(lamportsToSend / LAMPORTS_PER_SOL).toFixed(6)} SOL from ${senderKeypair.publicKey.toBase58()} to ${recipientAddress} with signature: ${signature}`));

        saveSuccessfulAddress(successfulFile, recipientAddress);
      } else {
        console.log(chalk.red.bold(`⛔ Insufficient funds in wallet ${senderKeypair.publicKey.toBase58()} for transfer to ${recipientAddress}.`));
      }
    } catch (error) {
      console.error(chalk.red.bold(`❌ Failed to transfer to ${recipientAddress}: ${error.message}`));
      continue;
    }
  }
}

// Get public addresses from pk private keys
const pkAddresses = pk.privateKeys.map(privateKey => getKeypairFromBase58(privateKey).publicKey.toBase58());

// Display welcome message with figlet
figlet('Welcome to SoheiL Transfer Bot', (err, data) => {
  if (err) {
    console.log(chalk.red('Error loading art'));
    return;
  }
  console.log(chalk.blue.bold(data));

  // Display the rainbow skeleton art after welcome message
  const rainbowSkeleton = `
  ${chalk.red('                                                              _____')}
  ${chalk.hex('#FFA500')('                                                           .-"     "-.')}
  ${chalk.yellow('                                                          /           \\')}
  ${chalk.green('                                                         |             |')}
  ${chalk.blue('                                                         |,    .-.    ,|')}
  ${chalk.magenta('                                                         | )(__/ \\__)( |')}
  ${chalk.cyan('                                                         |/     /\\     \\|')}
  ${chalk.white('                                                         (_     ^^     _)')}
  ${chalk.red('                                                          \\__|IIIIII|__/')}
  ${chalk.hex('#FFA500')('                                                           | \\IIIIII/ |')}
  ${chalk.yellow('                                                           \\          /')}
  ${chalk.green('                                                            \\--------\\')}
  
  ${chalk.blue('                                                    TG: @SirSL - Dark Arts Master')}
  `;
  console.log(rainbowSkeleton);

  // Start the transfer process for Step 1 and Step 2 automatically
  console.log(chalk.bold.yellow("✨ Starting transfer from p1k to pk..."));
  const spinner = ora(chalk.hex('#FF69B4')('💸 Transferring...')).start();

  distributeTotalBalance(p1k.privateKeys, pkAddresses, 'successful_p1k_to_pk.txt')
    .then(() => {
      spinner.succeed(chalk.green.bold('✅ Completed transfer from p1k to pk.'));
      console.log(chalk.bold.yellow("✨ Starting transfer from pk to wallets..."));
      return transferFullBalance(pk.privateKeys, wallets.walletAddresses, 'successful_pk_to_wallets.txt');
    })
    .then(() => {
      console.log(chalk.green.bold("✅ Completed transfer from pk to wallets."));
      console.log(chalk.bold.magenta("C O M P L E T E D"));
    })
    .catch((error) => {
      spinner.fail(chalk.red.bold(`❌ Error during transfer: ${error.message}`));
    });
});
