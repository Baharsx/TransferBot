![image](https://github.com/user-attachments/assets/36310477-54e6-49ad-8761-636e4cc43b11)

# Clone TransferBot
```
git clone https://github.com/Baharsx/TransferBot.git
cd TransferBot
```

# Install Node.js and npm (LTS version)
```
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```
# Initialize project and install dependencies
```
npm init -y
npm install bs58@4.0.1 @solana/web3.js@1.35.0 fs path ora@4.0.4 chalk@4.1.2 figlet inquirer
```
# create p1k.js and pk.js and wallet.js
```
nano p1k.js 
nano pk.js
nano wallets.js
```

# Run the script
```
node script.js
```
# if you want to check your (wallet.js) balance
```
node balancechecker.js
```
