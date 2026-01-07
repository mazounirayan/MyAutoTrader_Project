# Guide Utilisateur - MyAutoTrader

Bienvenue sur **MyAutoTrader** ! Cette application vous permet de créer des robots de trading automatiques (simulés) sur la Blockchain. 

Ce guide vous expliquera pas à pas comment utiliser l'interface, même si vous n'avez jamais utilisé d'application Blockchain auparavant.

---

## 🛠️ Prérequis

Avant de commencer, assurez-vous d'avoir :
1.  Un navigateur web (Chrome, Firefox, Brave).
2.  L'extension **Metamask** installée (c'est votre portefeuille numérique).
3.  L'application lancée (généralement accessible sur `http://localhost:3000`).

---

## 🚀 Étape 1 : Connexion

1.  Ouvrez la page d'accueil.
2.  Cliquez sur le bouton **"Connect Wallet"** en haut à droite.
3.  Sélectionnez "Metamask".
4.  Validez la connexion dans la fenêtre Metamask qui s'ouvre.

> *Vous verrez votre adresse (ex: 0x123...abc) apparaître une fois connecté.*

---

## 💰 Étape 2 : Obtenir des fonds de test (Gas et USDC)

Sur une blockchain, vous avez besoin de deux choses :
1.  **ETH (Gas)** : Pour payer les frais de transaction du réseau.
2.  **USDC** : La monnaie que vous allez investir dans vos stratégies.

Nous avons simplifié le processus avec deux boutons dans le panneau de gauche :

1.  **Cliquez sur "⛽ Gas (ETH)"** : Cela va recharger votre compte en ETH (pour payer les frais). Une alerte vous confirmera l'envoi.
2.  **Cliquez sur "🚰 Faucet USDC"** : Cela va vous donner 1000 USDC pour jouer. (Confirmez la transaction qui s'ouvre dans Metamask).

> *Astuce : Si Metamask vous dit "Fonds insuffisants", c'est que vous avez oublié de cliquer sur le bouton "⛽ Gas" avant !*

---

## 📈 Étape 3 : Créer votre première Stratégie

Vous allez configurer un robot qui achètera de l'ETH quand il est bas, et le revendra quand il est haut.

Dans le panneau de gauche :
1.  **Capital USDC** : Entrez le montant à investir (ex: `100`).
2.  **Buy price $** (Prix d'achat) : À quel prix l'ETH doit descendre pour acheter ? (ex: `1500`).
3.  **Sell price $** (Prix de vente) : À quel prix revendre pour prendre vos profits ? (ex: `2000`).
4.  **Stop loss $** (Sécurité) : Si le prix chute trop bas, on vend pour éviter de tout perdre (ex: `1400`). *Doit être inférieur au prix d'achat*.

Cliquez sur le bouton violet **"Créer stratégie"**.
*   Il y aura **deux** confirmations Metamask :
    1.  Pour autoriser le contrat à utiliser vos USDC (`Approve`).
    2.  Pour créer la stratégie (`Create`).

Une fois terminé, votre stratégie apparaîtra sous forme de carte en bas de l'écran.

---

## 🎮 Étape 4 : Simuler le Marché (Jouer avec le Prix)

C'est ici que la magie opère. Comme nous sommes en simulation, **vous pouvez contrôler le prix de l'ETH** pour voir comment votre robot réagit.

Regardez le panneau de droite (Graphique et Simulation) :

### Scénario A : Déclencher l'Achat
Votre stratégie attend d'acheter à **1500$**.
1.  Dans la case "Nouveau prix oracle", tapez `1490` (un prix inférieur à votre cible).
2.  Cliquez sur **"SET ORACLE"**.
3.  Attendez que le prix se mette à jour sur le graphique.
4.  Normalement, le robot détecte le prix et achète.
    *   *Note : Si le robot automatique (monitor.js) ne tourne pas, vous pouvez forcer l'action en entrant l'ID de votre stratégie dans la case "Strategy ID" et en cliquant sur "EXECUTE".*
5.  Sur votre carte de stratégie, vous verrez l'état passer à **"OPEN (ETH)"** en vert.

### Scénario B : Prendre ses Profits
Maintenant que vous avez acheté, faisons monter le prix !
Votre objectif de vente est **2000$**.
1.  Dans "Nouveau prix oracle", tapez `2100`.
2.  Cliquez sur **"SET ORACLE"**.
3.  Le robot va détecter que l'objectif est atteint et vendre.
4.  Votre carte de stratégie repassera en attente (USDC), et votre profit sera ajouté à votre capital (moins les frais).

---

## 🛑 Étape 5 : Gérer ses Stratégies

Sur chaque carte de stratégie, vous avez des options :

*   **STOP** : Arrête définitivement la stratégie. Si de l'argent était investi (en ETH), il est revendu immédiatement au prix actuel.
*   **COPIER** : Permet de créer une nouvelle stratégie identique mais avec un montant différent.
*   **RETIRER LES FONDS** : Une fois la stratégie stoppée ("CLOSED"), ce bouton apparaît pour récupérer vos USDC dans votre portefeuille.

> ⚠️ **Note importante (Simulation de profit)** : 
> Puisque le système simule des gains importants, le contrat peut manquer de liquidités pour vous payer. Si le retrait échoue :
> 1. Regardez le panneau de droite (Section Admin).
> 2. Cliquez sur le bouton jaune **"🏦 Renflouer Contrat (Admin)"**.
> 3. Réessayez votre retrait.

---

## ❓ FAQ Rapide

*   **Pourquoi rien ne se passe quand je change le prix ?** 
    *   Vérifiez si vous avez cliqué sur "EXECUTE" ou si le script de surveillance tourne en arrière-plan. Sur la blockchain, rien n'est automatique sans une action externe.
*   **C'est du vrai argent ?** 
    *   NON. Tout est fictif (Mock USDC, Mock Token).
*   **Que signifie "WAITING (USDC)" ?**
    *   Le robot a du cash et attend que le prix baisse pour acheter.
*   **Que signifie "OPEN (ETH)" ?**
    *   Le robot a acheté de l'ETH et attend que le prix monte pour vendre.
