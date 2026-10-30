# 89. Correction r3 : compilation et négatifs ciblés réussis

## Objectif et résultat

Le défaut de typage isolé est corrigé par une seule annotation, sans changement de production ni d'assertion. Le superviseur a vérifié le pin et les sept empreintes composées des manifestes r2/r3. La compilation réussit en3348 ms.

Les contrôles comportementaux exécutés sur r3 réussissent :22 cas,147 assertions, aucun échec. Cela comprend16 cas `RMSO-` et6 négatifs existants de migration/version future corrigés. La preuve des55 primitives et125 assertions est réutilisée sur entrées et environnement inchangés, pas présentée comme un nouveau test exécuté.

## Risques exercés

Les16 cas ciblés vérifient notamment les contradictions de cible client, la reprise après rétention avant projection, la perte de table et de ligne d'autorité, le rollback après révocation parent post-append, le quota sans retry après obsolescence, une livraison en vol avec rapprochement après reprise, les unités indépendantes, les effets physiques de publication déjà engagés et la source devenue obsolète pendant une vraie lecture de contexte hors ligne.

Les6 cas existants ont été sélectionnés après lecture de leurs corps : cinq migrations conservant les admissions historiques non épinglées et refusant les versions futures, puis un refus de version future sans réparation de schéma ni réécriture de snapshot. Les noms historiques « vers v7 » sont conservés mais la version supportée est8 et le négatif injecte9.

## Bornes et preuves

Les exécutions sont sérielles, fermées par fichier et motif, avec dix minutes par test. Le cas le plus long dure26368,71 ms ; aucun dépassement. Aucun test filtré n'est compté PASS. Aucun Worker/contender, quatrième origine native, suite globale, diagnostic gelé ou campagne scientifique n'a été lancé.

Les imports et branches des nouveaux tests client/intégration ont été inspectés ; ils emploient les fixtures existantes hors ligne et des bases/fichiers possédés. Les bases d'intégration sont conservées par le registre existant. Une erreur du premier lecteur de manifeste r3 a été corrigée : ce manifeste est différentiel et référence r2, il ne contient pas directement la liste complète. Cette erreur de script n'a exécuté aucun produit et n'est pas un échec de compilation.

## Réception encore ouverte

La revue indépendante reprend sur les cinq défauts et leurs impacts, y compris l'éventuelle perte du négatif client de corruption. Les régressions pertinentes doivent être rapprochées sans imposer de couverture maximale. Les22 réussites ne constituent pas une suite globale, une qualification native ou une acceptation du parcours complet. Aucune fusion n'est encore effectuée.

## Annexe

- Pin : `0366c6f7324866a0544024692dd2646fbf226b9c` ; r2 `635df39656a8eb34df549f63686f5566830a5fe2` conservé.
- [Reçus parent et durées par sélection](../evidence/obsolescence-r3-targeted-parent.json).
- [Défauts à fermer](87-revue-obsolescence-corrections-bloquantes.md), [échec de typage r2 conservé](88-correction-r2-recue-defaut-de-typage-isole.md).
