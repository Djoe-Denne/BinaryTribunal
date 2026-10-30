# 6. Qualification reçue : isoler les dépendances avant le raccordement

## Objectif et résultat

Pour réaliser RMS sur sa copie possédée, il faut savoir quels chemins et commandes sont utilisables. La finale du worker de qualification a été retrouvée dans sa session native, malgré la notification incomplète. Aucune relance ni nouveau worker pour remplacer cette livraison.

La qualification en lecture seule est reçue **comme inventaire de préconditions et blocages**, pas comme preuve de fonctionnement. Le modèle effectif natif est OpenAI Sol high. Aucun test produit n'a encore été exécuté.

## Constats et conséquences

- Les 26 fichiers signalés ont été inspectés et leurs octets rapprochés du manifeste.
- Quatre imports atteignent encore les entrées de l'ancienne mission ; quatorze imports de trois entrées copiées ne résolvent plus après déplacement. Ils doivent être corrigés dans une révision manifestée, sans modifier la base reçue silencieusement.
- La copie n'a pas de node_modules et son script typecheck n'emploie pas automatiquement les configurations d'intégration historiques. La présence de dépendances dans le canonique ne suffit pas à qualifier leur consommation.
- Le script de tests primitifs sélectionne un fichier pur, ses données JSON locales et une implémentation sans imports ; il est statiquement admissible pour un exécutant autorisé. Le parent a relu package.json et les imports du test. Ce n'est pas la suite complète.
- La suite globale reste interdite : elle atteint le diagnostic arrêté, les chemins threads et des campagnes exclues. Aucune source/version du handler déployé ni droit d'observation natif n'est établi. « Non établi » ne signifie pas « absent ».

## Suite décidée

Recevoir la tâche de qualification avec ces limites, puis consulter l'unique architecte pour fixer ensemble la jonction v2/v3 et la publication vers le prochain contexte. Le conseiller peut rechercher sur Internet sans transmettre de secrets ; le superviseur garde la décision et ratifie les contrats avant code. Les blocages natifs doivent rester explicites, sans inventer un port public fonctionnel.

Pendant cet avis, le superviseur peut exécuter la sélection primitive autorisée après son propre contrôle final des imports/configurations ; tout autre test demeure conditionné à sa sélection et ses droits. Pas de nouveau GO utilisateur.

## Preuves

- Finale conservée : `../evidence/ses_e7bfd1130ffeJqogvfIcT2LqBE-native-final.json` ; message `msg_18406f176001rVHD0x2IWcjDhf`, finish stop, modèle natif `openai/gpt-6.1-sol`, variante high.
- SHA256 du texte final : `cb4ce3ac37854e0a6fc6a095663392edf1752d6e427dd787ef24f5d9ac615490`.
- Fichiers ciblés : package.json:5–8, tsconfig.json:3–7, test/generic-target-primitives.test.ts:1–12 et test/s2-author/resource-fixtures.ts:4 dans le candidat reçu ; références détaillées dans la finale conservée.
- Le script de récupération a uniquement découvert le service existant et relu la session possédée ; aucun démarrage/restart ou configuration modifiée.

Localisation : fichiers et finale possédés. Impact : réception de qualification, préparation de contrat ; aucune modification du produit. Limites : aucun PASS logiciel ou natif, typecheck et suite globale non exécutés, acceptation RMS toujours non acquise.
