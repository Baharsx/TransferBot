![image](https://github.com/user-attachments/assets/36310477-54e6-49ad-8761-636e4cc43b11)



# Install Node.js and npm (LTS version)
```
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```
# Initialize project and install dependencies
```
npm init -y
npm install bs58@4.0.1 @solana/web3.js@1.35.0 fs path chalk ora figlet inquirer
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
