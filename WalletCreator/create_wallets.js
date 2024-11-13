const fs = require('fs');
const path = require('path');
const bs58 = require('bs58');
const { Keypair } = require('@solana/web3.js');

// Number of wallets to create
const WALLET_COUNT = 700;

// Output file paths
const PRIVATE_KEYS_FILE = path.join(__dirname, 'p1k.js');
const ADDRESSES_FILE = path.join(__dirname, 'wallets.js');
const SEEDS_FILE = path.join(__dirname, 'all_seeds.js');

// Initialize the files with module exports format
fs.writeFileSync(PRIVATE_KEYS_FILE, 'module.exports = {\n  privateKeys: [\n');
fs.writeFileSync(ADDRESSES_FILE, 'module.exports = {\n  walletAddresses: [\n');
fs.writeFileSync(SEEDS_FILE, 'module.exports = {\n  seeds: [\n');

for (let i = 1; i <= WALLET_COUNT; i++) {
  // Generate a new wallet
  const wallet = Keypair.generate();

  // Encode private key to base58
  const privateKeyBase58 = bs58.encode(wallet.secretKey);

  // Convert secret key to hex for seed
  const seedPhrase = wallet.secretKey.toString('hex');

  // Write each wallet's information to respective files
  fs.appendFileSync(PRIVATE_KEYS_FILE, `    "${privateKeyBase58}"${i < WALLET_COUNT ? ',' : ''}\n`);
  fs.appendFileSync(ADDRESSES_FILE, `    "${wallet.publicKey.toBase58()}"${i < WALLET_COUNT ? ',' : ''}\n`);
  fs.appendFileSync(SEEDS_FILE, `    "${seedPhrase}"${i < WALLET_COUNT ? ',' : ''}\n`);
}

// Close the array and module export syntax
fs.appendFileSync(PRIVATE_KEYS_FILE, '  ]\n};\n');
fs.appendFileSync(ADDRESSES_FILE, '  ]\n};\n');
fs.appendFileSync(SEEDS_FILE, '  ]\n};\n');

console.log(`${WALLET_COUNT} wallets created and saved successfully in module export format.`);
