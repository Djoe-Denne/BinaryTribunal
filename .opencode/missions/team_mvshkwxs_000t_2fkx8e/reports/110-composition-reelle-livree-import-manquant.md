# 110. Composition réelle livrée : import manquant à corriger

## Objectif et résultat

La nouvelle réalisation ajoute l'entrée locale du superviseur, la composition du provider, le transport HTTP réel et les décisions privées révocables. Elle est livrée au pin r9, sans exécution par l'auteur. Le superviseur confirme les 18 empreintes et celle du manifeste.

La compilation parent échoue sur **un diagnostic** : le nouveau contrôle JSON appelle un symbole non importé dans graph-store. Les tests comportementaux r9 ne sont pas encore exécutés ; les 75 réussites de r8 restent leur preuve historique, pas une validation de r9.

## Correction autorisée

Ajouter l'import explicite du symbole existant depuis son module réel. Ne pas retirer la validation ni ajouter une fonction factice pour faire compiler. Seule cette correction est autorisée avant un nouveau pin/manifeste stabilisé.

Le contrôle parent est attribué à r9 : code2 en 3 650 ms. Aucun effet natif, octroi, initialisation de compte ou appel service effectué. Après compilation réussie, inspecter les nouvelles branches d'import et tests avant les sélections pertinentes, puis revoir indépendamment les frontières host et leurs impacts.

## Limites et preuves

La présence de l'entrée ne prouve pas son invocation réelle, les droits exercés ou les acquisitions. Le checkpoint déclare ces éléments non attestés ; ils restent des gates parent. Aucun provider réel n'est réputé qualifié par ses seuls types, documents ou tests.

- Pin r9 : `941524f645c437fabf87a993c5b9230f3cfff75a`.
- Diagnostic TS2304 : `src/graph-store.ts:499:3`, import existant relu à la ligne22.
- [Reçu de compilation](../evidence/native-runtime-r9-typecheck-parent.json).
- Contrat de réalisation : [plan108](108-composition-parent-et-transport-reels-plan-ratifie.md), [entrée109](109-entree-locale-parent-concrete-autorisee.md).
