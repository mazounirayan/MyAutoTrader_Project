# MyAutoTrader 🤖

Trading automatisé sur blockchain avec NFT

## 🚀 Installation
```bash
# Backend (Hardhat)
cd back && npm install

# Frontend (Next.js)
cd front && npm install
```

## 📦 Déploiement Local
```bash
# Terminal 1 : Lancer la blockchain locale
cd back && npx hardhat node

# Terminal 2 : Déployer les contrats
cd back && npx hardhat clean && npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost

##  connection front back
# => mettre les constant generer par 
# => npx hardhat run scripts/deploy.js --network localhost
# => dans front constants.js
# Terminal 3 : Lancer le frontend
cd front && npm run dev
```

## 🎯 Utilisation

1. Connectez MetaMask sur `http://localhost:8545`
2. Importez un compte depuis Hardhat (clé privée affichée)
3. Cliquez sur "Faucet +1000" pour recevoir des USDC
4. Créez votre stratégie de trading
5. Testez avec "Set Price" pour simuler les prix

## 🛠️ Zone de Test

- **Set Price** : Change le prix de l'oracle
- **Execute** : Force l'exécution d'une stratégie