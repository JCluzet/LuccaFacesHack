# Lucca Faces Score Hack Script

**⚠️ AVERTISSEMENT : Ce script est strictement éducatif. L'utilisation de ce script pour tricher viole les termes et conditions de Lucca Faces. Utilisez-le à vos risques et périls. Je ne suis pas responsable des conséquences liées à son utilisation. ⚠️**

---

## Description

Ce script JavaScript permet de **modifier le score obtenu dans le jeu Lucca Faces** en simulant des réponses automatiques précises et adaptées au score cible choisi. Il ajuste dynamiquement le délai entre les réponses pour optimiser le score final et tente de respecter les marges de sécurité pour éviter les risques de détection.

## Fonctionnalités

- **Score cible ajustable** : Entrez le score que vous souhaitez atteindre (limité pour réduire les risques de bannissement).
- **Automatisation complète** : Le script répond automatiquement aux questions en utilisant les données locales et des réponses aléatoires en cas de nouvelles personnes inconnues.
- **Adaptation dynamique** : Le délai entre les réponses est ajusté en fonction du score cible.
- **Sauvegarde des données** : Les réponses apprises sont sauvegardées dans `localStorage` pour améliorer les performances lors des sessions futures.

---

## Prérequis

1. Navigateur avec support JavaScript (Chrome, Firefox, etc.).
2. Accès au jeu Lucca Faces sur le site officiel.
3. **Autorisation des scripts** : Assurez-vous que votre navigateur permet l'exécution de scripts personnalisés.

---

## Instructions

### 1. Copier le script

Copiez le code complet du script fourni dans ce dépôt.

### 2. Ouvrir la console

- Dans votre navigateur, ouvrez le jeu Lucca Faces et allez sur la page `/faces/game`.
- Cliquez avec le bouton droit de la souris et sélectionnez **"Inspecter"**.
- Allez dans l'onglet **"Console"**.

### 3. Coller le script

Collez le script dans la console du navigateur et appuyez sur **Entrée**.

### 4. Entrer un score cible

Lorsque le script vous demande d'entrer un score cible, choisissez un score raisonnable (recommandé : 1550 ou moins).

- **Attention** : Entrer un score trop élevé peut entraîner un bannissement temporaire.

### 5. Observer le processus

Le script automatisera les réponses pour atteindre le score cible. Vous pouvez suivre la progression dans la console.

---

## Notes importantes

1. **Risques de bannissement** : 
   - Un score supérieur à 1550 est détectable par Lucca. Le script affiche un avertissement pour tout score dépassant cette limite.
   - Vous assumez l'entière responsabilité des actions entreprises avec ce script.

2. **Données locales** :
   - Les personnes identifiées sont stockées dans `localStorage` pour optimiser les parties suivantes.
   - Pour réinitialiser les données, videz le cache de votre navigateur.

3. **Performances** :
   - Si le script échoue à répondre à certaines questions, il choisira une réponse aléatoire pour continuer.

---

## Dépannage

- **Le script ne démarre pas :**
  - Assurez-vous que vous êtes sur la page `/faces/game` avant de lancer le script.
  - Rafraîchissez la page et essayez à nouveau.

- **Erreur lors de la découverte des images :**
  - Vérifiez votre connexion Internet.
  - Si nécessaire, redémarrez le script.

- **Problème de score incorrect :**
  - Le script ajuste dynamiquement les délais, mais il peut y avoir une marge d'erreur de ±20 points.

---

## Contribuer

Ce script est open-source et peut être amélioré. Si vous avez des suggestions ou des corrections, créez une PR ou ouvrez une issue sur le dépôt GitHub.

---

## Avertissement final

**Ce script est à utiliser uniquement à des fins éducatives ou pour tester vos compétences en JavaScript. Toute utilisation contraire aux conditions d'utilisation du jeu Lucca Faces pourrait entraîner des conséquences légales ou des restrictions de compte.**

---

🎮 Bonne chance et amusez-vous (avec modération) !
