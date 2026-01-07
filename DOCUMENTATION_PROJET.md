# Documentation Complète - Projet MyAutoTrader

## 1. Vue d'ensemble du Projet

**MyAutoTrader** est une application décentralisée (dApp) pédagogique qui simule un système de trading automatisé sur la blockchain. Le but est de permettre aux utilisateurs de créer des stratégies d'investissement (Achat/Vente) basées sur le prix d'un actif (ex: ETH), le tout géré de manière transparente et immuable par des Smart Contracts.

**Note importante :** Ce projet est une **simulation académique**. 
- Il n'effectue pas de véritables échanges sur des bourses décentralisées (DEX).
- Il utilise des jetons de test (Mock USDC) sans valeur réelle.
- Les prix du marché sont fournis par un "Oracle" simulé que l'on peut manipuler pour tester les réactions du système.

---

## 2. Architecture Technique

Le projet est divisé en deux parties principales :
1.  **Smart Contracts (Back-end Blockchain)** : Dossier `MyAutoTrader_Project/`
2.  **Interface Utilisateur (Front-end)** : Dossier `front/`

### 2.1 Les Smart Contracts (`MyAutoTrader_Project/contracts/`)

C'est le "cerveau" de l'application. Il contient la logique métier.

*   **`MyAutoTrader.sol` (Le contrat principal)** :
    *   **Stratégies sous forme de NFT (ERC721)** : Chaque stratégie créée par un utilisateur est représentée par un jeton unique (NFT). Cela permet de transférer potentiellement la propriété d'une stratégie.
    *   **Gestion des Fonds** : Le contrat détient les fonds (USDC) des utilisateurs tant que la stratégie est active.
    *   **Liquidité et Simulation** : Comme le contrat simule des profits de 10% sans réelle interaction avec un marché, il peut se retrouver en situation d'insolvabilité (ne pas avoir assez d'USDC pour payer les gains). Pour corriger cela en test, un script de financement (`scripts/fund_contract.js`) permet d'injecter des liquidités massives dans le contrat.
    *   **Logique d'Exécution** :
        *   *Achat* : Si le prix descend en dessous du prix cible, la stratégie passe en mode "Investi".
        *   *Vente (Take Profit)* : Si le prix monte au-dessus du prix de vente, la position est clôturée avec profit.
        *   *Stop Loss* : Si le prix chute trop bas, la position est vendue pour limiter les pertes.
    *   **Frais de Performance** : Le protocole prélève une commission de 5% sur les profits réalisés.

*   **`MockToken.sol` (USDC Simulé)** :
    *   C'est un jeton standard ERC20 qui imite le dollar numérique (USDC).
    *   Il possède une fonction "Faucet" (`mint`) qui permet à n'importe qui de se générer de l'argent fictif pour tester l'application.

*   **`MockV3Aggregator.sol` (Oracle Simulé)** :
    *   Simule le comportement d'un oracle Chainlink (qui donne normalement le prix réel des cryptomonnaies).
    *   Permet de définir manuellement le prix de l'ETH pour tester si les stratégies se déclenchent correctement.

### 2.2 L'Interface Utilisateur (`front/`)

C'est la partie visible pour l'utilisateur, construite avec des technologies web modernes.

*   **Technologies** :
    *   **Next.js** : Framework React pour la structure du site.
    *   **Wagmi / RainbowKit** : Bibliothèques pour connecter le portefeuille (Wallet) Metamask au site.
    *   **Tailwind CSS** : Pour le design moderne et sombre (Dark Mode).
    *   **Recharts** : Pour afficher le graphique d'évolution du prix.

*   **Fonctionnalités clés du code (`src/pages/index.tsx`)** :
    *   Connexion au Wallet.
    *   Affichage en temps réel du prix (depuis le contrat).
    *   Formulaire de création de stratégie.
    *   Tableau de bord de gestion (simuler le prix, exécuter les ordres).

### 2.3 Le Bot de Surveillance (`front/backend/monitor.js`)

Sur une blockchain, le code ne s'exécute pas tout seul. Il faut que quelqu'un déclenche les transactions.
*   Ce script Node.js agit comme un "Robot".
*   Il tourne en permanence (boucle infinie).
*   Toutes les 30 secondes, il vérifie toutes les stratégies actives et déclenche l'ordre d'achat ou de vente si les conditions de prix sont réunies.

---

## 3. Concepts Blockchain Clés Utilisés

Pour les débutants, voici comment ces concepts s'appliquent ici :

*   **Smart Contract** : C'est le programme autonome qui gère l'argent. Une fois déployé, personne (même pas le créateur) ne peut voler les fonds en dehors des règles définies (retrait par le propriétaire uniquement).
*   **ERC20 (USDC)** : Le jeton utilisé pour payer. On doit "Approuver" (`approve`) le contrat MyAutoTrader avant qu'il puisse prendre nos jetons pour investir.
*   **ERC721 (NFT)** : Votre "ticket" de stratégie. C'est une preuve de propriété stockée sur la blockchain.
*   **Oracle** : La source de vérité pour le prix. Dans la finance décentralisée (DeFi), on ne peut pas simplement aller voir sur Google, il faut un fournisseur de données sécurisé.
*   **Gas** : Les frais payés au réseau pour chaque action (création, exécution).

---

## 4. Structure des Données d'une Stratégie

Une stratégie contient les informations suivantes (visibles dans le code `struct Strategy`) :

| Champ | Description |
| :--- | :--- |
| `amountDeposited` | Le capital investi (ex: 100 USDC). |
| `buyPrice` | Le prix auquel on veut acheter de l'ETH (ex: 1500$). |
| `sellPrice` | Le prix auquel on veut revendre pour faire du profit (ex: 2000$). |
| `stopLossPrice` | Le prix auquel on vend en urgence pour limiter la casse (ex: 1400$). |
| `isInvested` | `Vrai` si on a acheté de l'ETH, `Faux` si on est en USDC (attente). |
| `isActive` | `Vrai` tant que l'utilisateur n'a pas arrêté la stratégie. |

---

## 5. Flux de Vie d'une Stratégie

1.  **Dépôt** : L'utilisateur envoie des USDC au contrat.
2.  **Attente** : Le contrat surveille le prix.
3.  **Achat (Entry)** : Le prix chute -> Le contrat "simule" un achat d'ETH.
4.  **Position Ouverte** : Le contrat attend que le prix remonte ou s'effondre.
5.  **Vente (Exit)** : 
    *   *Scénario positif* : Prix > SellPrice -> Vente avec profit (Le contrat garde 5% de commission).
    *   *Scénario négatif* : Prix < StopLoss -> Vente à perte.
6.  **Retrait** : L'utilisateur désactive la stratégie et récupère ses fonds restants.
