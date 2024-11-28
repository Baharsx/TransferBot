// Disable deprecation warnings
process.noDeprecation = true;

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

// Function to load successful addresses
function loadSuccessfulAddresses(fileName) {
  const filePath = path.join(__dirname, fileName);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return new Set(data.split('\n').filter(line => line.trim()));
  }
  return new Set();
}

// Function to save a successful recipient address
function saveSuccessfulAddress(fileName, address) {
  const filePath = path.join(__dirname, fileName);
  fs.appendFileSync(filePath, `${address}\n`);
}

// Convert private key from Base58 to Keypair
function getKeypairFromBase58(privateKey) {
  const secretKey = bs58.decode(privateKey);
  return Keypair.fromSecretKey(secretKey);
}

// Function to get total balance of all p1k wallets
async function getTotalBalance(senderKeys) {
  let totalBalance = 0;
  for (const privateKey of senderKeys) {
    const keypair = getKeypairFromBase58(privateKey);
    const balance = await connection.getBalance(keypair.publicKey);
    totalBalance += balance;
  }
  return totalBalance;
}

// Function to distribute total balance equally among recipients
async function distributeTotalBalance(senderKeys, recipientAddresses, successfulFile) {
  const successfulAddresses = loadSuccessfulAddresses(successfulFile);

  const totalBalanceLamports = await getTotalBalance(senderKeys);
  const lamportsPerRecipient = Math.floor((totalBalanceLamports - REQUIRED_RENT_LAMPORTS) / recipientAddresses.length);

  if (lamportsPerRecipient <= 0) {
    console.log(chalk.red("⚠️ Insufficient total balance to distribute among recipients."));
    return;
  }

  let senderIndex = 0;
  let senderKeypair = getKeypairFromBase58(senderKeys[senderIndex]);
  let senderBalanceLamports = await connection.getBalance(senderKeypair.publicKey);

  for (const recipientAddress of recipientAddresses) {
    if (successfulAddresses.has(recipientAddress)) {
      console.log(chalk.yellow(`⏩ Skipping already successful address: ${recipientAddress}`));
      continue;
    }

    while (senderIndex < senderKeys.length) {
      if (senderBalanceLamports < lamportsPerRecipient + REQUIRED_RENT_LAMPORTS) {
        senderIndex++;
        if (senderIndex >= senderKeys.length) {
          console.log(chalk.red("❌ All sender wallets exhausted."));
          return;
        }
        senderKeypair = getKeypairFromBase58(senderKeys[senderIndex]);
        senderBalanceLamports = await connection.getBalance(senderKeypair.publicKey);
        continue;
      }

      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: senderKeypair.publicKey,
            toPubkey: new PublicKey(recipientAddress),
            lamports: lamportsPerRecipient,
          })
        );

        const signature = await connection.sendTransaction(transaction, [senderKeypair]);
        await connection.confirmTransaction(signature, 'confirmed');
        console.log(chalk.green(`💸 Transferred ${(lamportsPerRecipient / LAMPORTS_PER_SOL).toFixed(6)} SOL from ${senderKeypair.publicKey.toBase58()} to ${recipientAddress} with signature: ${signature}`));

        saveSuccessfulAddress(successfulFile, recipientAddress);
        senderBalanceLamports -= lamportsPerRecipient;
        break;
      } catch (error) {
        console.error(chalk.red(`❌ Failed to transfer to ${recipientAddress}:`), error);
        senderIndex++;
        if (senderIndex >= senderKeys.length) {
          console.log(chalk.red("❌ All sender wallets exhausted."));
          return;
        }
        senderKeypair = getKeypairFromBase58(senderKeys[senderIndex]);
        senderBalanceLamports = await connection.getBalance(senderKeypair.publicKey);
      }
    }
  }
}

// Function to transfer full balance (minus fees) from each sender to corresponding wallet
async function transferFullBalance(senderKeys, recipientAddresses, successfulFile) {
  const successfulAddresses = loadSuccessfulAddresses(successfulFile);

  for (let i = 0; i < senderKeys.length; i++) {
    const senderKeypair = getKeypairFromBase58(senderKeys[i]);
    const recipientAddress = recipientAddresses[i];

    if (successfulAddresses.has(recipientAddress)) {
      console.log(chalk.yellow(`⏩ Skipping already successful address: ${recipientAddress}`));
      continue;
    }

    try {
      const senderBalanceLamports = await connection.getBalance(senderKeypair.publicKey);
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
        console.log(chalk.green(`💸 Transferred ${(lamportsToSend / LAMPORTS_PER_SOL).toFixed(6)} SOL from ${senderKeypair.publicKey.toBase58()} to ${recipientAddress} with signature: ${signature}`));

        saveSuccessfulAddress(successfulFile, recipientAddress);
      } else {
        console.log(chalk.red(`⚠️ Insufficient funds in wallet ${senderKeypair.publicKey.toBase58()} for transfer to ${recipientAddress}.`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to transfer to ${recipientAddress}:`), error);
      continue;
    }
  }
}

// Get public addresses from pk private keys
const pkAddresses = pk.privateKeys.map(privateKey => getKeypairFromBase58(privateKey).publicKey.toBase58());

// Display a rainbow skeleton art after welcome message
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

figlet('Welcome to SoheiL Transfer Bot', (err, data) => {
  if (err) return console.log(chalk.red('Error loading art'));
  console.log(chalk.blue(data));

  // Display the rainbow skeleton
  console.log(rainbowSkeleton);

  console.log(chalk.bold.yellow("💼 Starting transfer from p1k to pk..."));
  const spinner = ora('Transferring...').start();

  distributeTotalBalance(p1k.privateKeys, pkAddresses, 'successful_p1k_to_pk.txt')
    .then(() => {
      spinner.succeed(chalk.green('✅ Completed transfer from p1k to pk.'));

      // Automatically proceed to phase 2 without user confirmation
      console.log(chalk.bold.yellow("💼 Starting transfer from pk to wallets..."));
      return transferFullBalance(pk.privateKeys, wallets.walletAddresses, 'successful_pk_to_wallets.txt');
    })
    .then(() => console.log(chalk.green.bold("✅ Completed transfer from pk to wallets.")))
    .catch((error) => console.error(chalk.red("⚠️ Transfer process failed:"), error));
});
