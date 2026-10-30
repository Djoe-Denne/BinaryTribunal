# 204. Correctif BigInt et finalisation : tests affectés réussis

## Résultats du candidat corrigé

Les cinq pins203 ont été vérifiés avant et après chacune des trois commandes :

- Typecheck : sortie0,3757ms.
- Client :3cas sélectionnés,37assertions, zéro échec ;95ms parent,73ms Bun.114cas filtrés non exécutés.
- Binding :5cas sélectionnés,57assertions, zéro échec ;59ms parent,39ms Bun.6cas filtrés non exécutés.

Les deux nouveaux oracles sont exécutés : distinction des identifiants BigInt au-delà de2^53 avec sérialisation décimale, et refus sticky lorsque les coûts de finalisation simulés atteignent ou dépassent120s. Aucun sleep, horloge globale modifiée ou hôte n'est utilisé par ces tests.

Les55primitives/125assertions précédentes restent réutilisées pour leur module et fixture inchangés ; elles ne sont pas rejouées. Les anciens résultats restent rattachés à leurs versions, notamment l'échec initial du mock.

## Gate restante

Le même reviewer reçoit les résultats et reprend les deux blocages et leur impact. Les tests purs ne prouvent pas à eux seuls que toutes les gardes de délai ou d'identité sont placées correctement dans le chemin réel.

**Aucune qualification Bun→Bun n'est encore autorisée.** Un éventuel exercice devra également vérifier le nouveau protocole de finalisation : le reçu provisoire et la candidate stdout ne sont pas adoptables isolément ; l'attestation parent externe doit rapprocher fin/exit, durée totale réelle, expiration et hashes exacts.

## Preuves et périmètre

- Reçus avec argv complets, cinq pins et contrôle après commande : `qa-owned-runtime-203/typecheck.json`, `owned-client-selected.json`, `owned-binding-selected.json` ; logs stdout/stderr voisins.
- Candidat courant : client994c496e, transport54d35747, bindingae6fe77b, tests client35d881db, tests binding5edd7043 ; valeurs complètes dans les reçus.
- Aucune suite globale, thread interdit, diagnostic gelé, quatrième origine, entrée CLI native, base ou serveur créé par ces tests.
- Les chargements natifs restent non qualifiés, tous les POST refusés. Origine170, ses droits expirés et obligations D5/M2 inchangés.
