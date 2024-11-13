# Install Node.js and npm (LTS version)
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```
# Optional: Install NVM to manage Node.js versions
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.nvm/nvm.sh
nvm install --lts
nvm use --lts
```
# Initialize project and install dependencies
```
npm init -y
npm install chalk@4 ora@5 figlet inquirer@8.2.0 cli-table
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
