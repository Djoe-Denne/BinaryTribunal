# Complétion des projections planner fixes — qualification bornée

Statut : **qualifiée offline sur le corpus acquis, non intégrée à MAIN/S1**.
Source native R2 `result_mvfkgpe7_00bx_lwodkz`, quatre artefacts gelés dans
`.tmp/mission-v2-20261018-continuous/planner-fixed-projections-r2-frozen/`.

## Périmètre

Quatre projections pures partagées pour une ownership déjà fixée : estimation,
ressources, sub-intents et G3 ; déplacement littéral de `pipelineCost`. Le
producteur utilise les mêmes helpers. Aucun calcul SCC, regroupement, sélection,
admission ou readiness n'a été ajouté au codec. Le correctif R2 réduit uniquement
le type des appels aux extrémités `sourceId`/`destinationId` requises.

Les 53 noms publics planner sont conservés. La feuille expose 20 valeurs et
10 types. Les preuves inverses de corps, les six substitutions du producteur et
le corps de 287 octets de `pipelineCost` restent des preuves de périmètre, pas
des substituts aux résultats ci-dessous.

## Résultats exécutés et readbacks parent

- Candidate : typecheck strict sur tout `src/test/scripts`, exit 0 ; résolution
  SDK et `--listFiles` fermés, sans réduction du corpus.
- Baseline R1 qualifiée et candidate R2 : chacune **139 tests, 14 726 assertions,
  deux fichiers**, zéro échec/skip. Les copies fraîches utilisent le même pathname
  actif, avec archive intégrale de la baseline.
- FULL RAW : **593 912 596 octets par trace**, 567 fenêtres parcourues jusqu'aux
  deux EOF, aucune différence. SHA-256
  `e5090d756ba3c475b75e868e4f415270d72834f4fe9117ac7f729896140fafa0`.
  Chaque branche : 701 appels, 594 retours, 107 refus, 1 402 lignes ; footer privé
  `afterAll` complet. Les propriétés Error capturées, dont `sourceURL` et
  `original*`, ne sont pas normalisées. L'exclusion historique de `Error.stack`
  du harnais R5 n'a pas été changée.
- Readback indépendant : **5 970 comparaisons**, quatre inventaires fermés et
  269 gardes MAIN exacts, bail immuable libéré. Reçu FULL
  `40d983ad41476e6c2440d16b473dbbdb423f7f7d69f5a57df7c0463e30afb395`.
- Régressions restantes : **276 tests, 2 351 assertions, 11 fichiers** ; nouveau
  driver revu, GO distinct, une tentative. Readback indépendant de 936
  comparaisons : 97 DB possédées (96 receipts de fermeture et une DB legacy en
  namespace exclusif), 82 réservations sans DB, cinq JSON CLI attendus conservés,
  aucune DB existante non close ni WAL/SHM/journal. Huit contrôles MAIN achevés.
  Reçu `8dfd051145eb73daccea7140d89ff3f744e89e2a7258928f0a1490ad5180aab4`.

Total scientifique candidate : **415 tests / 17 077 assertions / 13 fichiers**.
Sept petits oracles parent supplémentaires couvrent les nouvelles API, sans
être ajoutés à ce total. Un chargement natif de la feuille dans une fermeture
de huit modules TS et six schémas JSON réussit avec sept producteurs absents.
Ceci n'est ni une interception par module ni une preuve de pureté universelle.

## Contrôles conservés et limitations

Les refus de source et contrôles précédents restent conservés : type trop large
dans R1, trois défauts du premier driver remaining276 (pins RAW, double lecture
GO, drapeau MAIN inconditionnel). Aucun de ces drivers refusés n'a servi à lancer
les nouveaux tests. Les anciens rouges R4/R5 et leurs traces ne sont pas réécrits.
Tous les DB, logs, snapshots et environ 3,56 Go de traces cumulées sont conservés.

Preuves détaillées sous `.tmp/mission-v2-20261018-continuous/` :

- `planner-fixed-r2-parent-green-verification.json`
- `planner-fixed-r2-regressions-parent-verification.json`
- `planner-fixed-r2-public-api-closure-readback.json`
- `planner-fixed-r2-hand-oracles-receipt.json`

Cette clôture ne qualifie pas le comportement numeric/context R2 : ses 450 paires
et neuf régressions restent non exécutées. Elle ne ratifie pas le schéma commun
S1, n'autorise pas son implémentation, ne constitue pas une publication de
connaissance et ne ferme ni full44, ni L7 global, ni L9/L10. Aucun live FF8,
changement global, commit, push ou nettoyage n'a été effectué.
