# 152. Premier contrôle statique : défaut local de nom de fichier

## Objectif et résultat réel

La première acquisition RMS doit être préparée sans créer de droit ni adopter la base de test. La correction de la phrase utilisateur et son delta strict sont vérifiés par le parent et le reviewer : l'inversion restitue exactement les empreintes antérieures. L'avis préparatoire est favorable.

Le premier contrôle réel, limité aux pièces manquantes, échoue en **215 ms** : le producteur ne retrouve pas une source pourtant présente. Aucune pièce parent n'est écrite, aucun droit, session ou origine RMS n'est créé. Les huit contrôles ne sont donc pas encore reçus.

## Cause et correction décidée

Le producteur met le chemin source en minuscules, puis le compare à un suffixe resté en casse mixte, independentSources.json. Le manifeste gelé contient correctement ce fichier. C'est un défaut local du comparateur, pas une permission manquante ou un ancien registre à retrouver.

Le parent autorise uniquement une comparaison normalisée des deux côtés, puis l'actualisation des empreintes du candidat. Le manifeste source et le produit restent intacts. Une revue du seul delta est engagée ; le contrôle affecté sera rejoué après vérification des nouveaux bytes. La création des trois pièces et cinq brouillons reste conditionnée au succès réel de ce parcours statique.

## Annexe technique

- Module testé : 20855 octets, SHA77235935add04e9397564102fd32aacced7d9367a379af9cb37252b1a171e873 ; manifeste19709/SHA9d1daa3c21cac512144b63d4f44c36c1df33aaced038af0de8cdea0433958fe2.
- Revue du delta ASCII : result_mvusbvnh_0002_eqzs3w, inversion exacte confirmée aussi par parent.
- Défaut : first-acquisition-data.mjs:76, key(path).endsWith("/" + name), name conservant le S majuscule.
- Commande : Bun, prepare-first-acquisition.mjs --inspect-missing, borne600s, sortie1, durée processus215ms ; cas missing pièces échoué en4,01ms, created=[], grantsIssued=0, rmsOriginsCommitted=0.
- Un lanceur Context Mode avait d'abord une erreur de syntaxe d'échappement avant toute invocation ; corrigée avec String.fromCharCode(10). Ce n'était ni une panne MCP ni un test du producteur.
- Le namespace first-acquisition-151 reste non créé ; aucune reprise ou écrasement d'état partiel.
