# 14. Correction vérifiée : la course n'émet plus vers l'ancien transport

## Résultat concret

Le parent a contrôlé le correctif puis exécuté **le même test qui échouait avant correction, sans le modifier**. Il réussit désormais : zéro émission vers le faux transport et images retenues conservées. Les six assertions sont atteintes ; le RED historique reste conservé comme échec sur son ancienne version.

La correction place classification de clé, réservation historique et relecture/validation dans une même transaction immédiate après les attentes asynchrones. La préparation prospective refuse déjà une réservation historique. Un garde transactionnel supplémentaire précède l'enregistrement de tentative. Aucun verrou sur await, nouveau schéma, store ou autorité.

## Vérifications réellement exécutées sur r4

- Course ciblée : **1 PASS, 0 FAIL, 6 assertions**.
- Typecheck complet : **code 0**, environ 3,3 secondes.
- Client : **21 PASS, 0 FAIL, 76 assertions**, dont le cas de course ; ne pas l'additionner une seconde fois au contrôle ciblé.
- Protocole : **6 PASS, 0 FAIL, 26 assertions**.

Quinze secondes par test conservées. Les 360 fichiers pinnés sont identiques après exécution. Aucun thread, service, appel natif ou suite globale exécuté.

Les preuves de préparation DATA, du cas vertical v2 et des primitives restent réutilisées dans leur portée : modules/tests/entrées inchangés, chemins exécutés sans appel aux méthodes de réservation corrigées. Aucun rejeu demandé pour un simple changement de lecteur.

## Étape suivante

Le même reviewer indépendant reprend uniquement le défaut bloquant et l'impact de cette correction sur r4. L'intégration reste suspendue jusqu'à cette reprise ; les résultats verts seuls ne valent pas acceptation indépendante. Publication, prochain contexte et obligations natives restent ouverts, sans GO utilisateur intermédiaire.

## Preuves

- `../evidence/writer-r4-manifest.json`, SHA256 `b05e8ad5a016b46b067340bf466d01d40e993ce2c53e0e21bf5331ec5776df48` ; HEAD `c10ca20762c39084954550492cbed5769445156b`.
- `../evidence/writer-r4-parent-checks.json` et reçus/captures `race-green-r4`, `typecheck-r4`, `client-r4`, `protocol-r4`.
- Comparaison r3→r4 : seul src/client.ts change dans le code, plus les deux documents d'audit ; test RED strictement identique.
- Empreinte client corrigé : `a8b3dee4a539823d0c4acb8a23caf1deaac6efef592d2b15620cca102f820b56` ; test : `54128d6ea9a05ff6e56e8c5102d9acee153149ee4f6ad484b09ee92037d27e4c`.

Localisation : journal client existant et test déterministe. Impact : refus anti-fallback corrigé et vérification renouvelée pour les frontières affectées. Limites : revue encore requise, aucune preuve native ou clôture complète.
