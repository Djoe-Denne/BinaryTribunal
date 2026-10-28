# Gate parent — typecheck baseline main, sans produit exécuté

Objectif : établir la baseline avant mutation L8 pour distinguer erreurs
préexistantes et régressions. Uniquement tsc installé/caché,appel direct via Node,
--noEmit -p tsconfig actuel ; aucun bun test,import produit,npm/install/réseau.
Hash des entrées compilateur et des247fichiers gardés avant/après,package et
tsconfig inchangés,aucun sourcefix automatique d'un425M utilisateur.

Scratch neuf Temp/opencode pour TEMP/TMP/NODE_COMPILE_CACHE de CE child seulement,
pas de changement d'environnement global. NODE_OPTIONS non vide bloque ce
typecheck avant lancement (pas de clear/preload ignoré),branches sûres continuent.
Timeout120s sur le seul compilateur enfant possédé. Captures/receipts/cache gardés.
Zéro résultat runtime,fixture ou acceptance globale déduit d'une sortie tsc0.
