# M2 — 53 : livraison statique vérifiée et paquet final borné

## Objectif et état

Qualifier les frontières DATA/pures S1 par QA API indépendante avant intégration. Rapport52 a autorisé la complétion statique : elle est livrée, pas qualifiée. Aucun nouveau défaut produit établi ni PASS supplémentaire.

## Contrôles parent effectivement faits

Recalcul des empreintes des11TS QA et de la config, tri ordinal et format `path TAB bytes TAB sha LF` final : SHA **c47bc48276cfcd098939f95c3b909800d0103dd37434a12a8d6df422ce4d7e0f**, identique à la livraison. Les42inputs produit sont conformes à la projection ; runner historique SHA f9464a4e… conforme ; ledger toujours9runs/4reprises/4255ms/nonbloqué. Aucun import produit/fixture, test ou typing lancé pour ce contrôle.

Références : Q/reports/plan-and-cases.md, section « Continuation rapport52 », Q/reports/verdict.md ; Q=.tmp/m2-s1-qa-r2. Sept TS affectés, autres sources/config inventoriées inchangées. Examen ciblé parent des tests knowledge (nominaux avant mutations ; domaines RAW distincts et contextes historique/courant) et isolation (huit recettes nominales, douze gardes fail-closed, cycle API complet et oracle DTO indépendant). Cela autorise un essai du paquet, pas une preuve que toutes les recettes sont valides.

57cas root,47knowledge,2isolation **écrits** : B, multifonction/Cf et Cunit, S scientifique UTF8, grants, contextes raw/affinity divergents, knowledge1/2/histoire07/receipts/attestation/publication et isolation des nouveaux chemins. Les37PASS anciens et typing09 gardent seulement leur portée historique. Pas de copie d'oracles auteur ni génération d'attendus via producteur revendiquée.

## Limite contractuelle non levée

Lecture parent de ratifiée03:26 : `actualBodyUTF8 <= CunitCourant <= CrootAcquired`, distinct de `Cunit <= chaque Cf` explicitement interdit. Le S scientifique mesuré par ces futurs tests n'est pas le body de commande native complet. Aucun body natif n'est fourni par les DTO examinés ; la projection historique07 n'en donne pas la préimage. Les tests de caps/bytes DATA ne démontreront donc pas ce contrôle natif. Conserver cette garantie **non prouvée ici**, sans waiver ni déclaration globale d'acceptation S1 sur la seule suite verte. Son attribution précise à la frontière de préparation/acquisition sera décidée séparément avant une promotion qui en dépend ; pas de simulation ou GO natif implicite.

## Décision exécutable

La préparation indépendante est suffisante pour le paquet retenu au rapport52. Autoriser **quatre invocations au plus**, sur cette livraison inchangée, ordre root-sources → knowledge → isolation → typecheck final. Tous les négatifs conservent le contrôle de leur nominal avant mutation. Un nominal non atteint ou un groupe rouge suspend les groupes runtime suivants et leurs dépendants ; un typing final de la même version peut encore être exécuté pour documenter séparément son état, sans réparer/rejouer entre les invocations.

Runner parent : borne10→13runs et4→7reprises uniquement, avec vérification de l'ordre de ce paquet à partir du ledger9. Les trois reprises supplémentaires sont root, isolation et typing ; knowledge est son premier run. **Plafond300s cumulées,30s/groupe,60s/typing inchangés.** Aucun compteur/reçu effacé, aucune14e invocation, groupe renommé, réparation champ-par-champ, retry automatique ou CLI directe. Toute ambiguïté outil/signal/timeout reste bloquante selon le runner.

Après le paquet : résultat par nominal/groupe, cause/version exacte des rouges, portée et lacunes explicites. Si rouge, arrêt et décision parent, pas nouveau correctif expérimental. Si vert, examen de couverture et de la limite body ci-dessus avant acceptation. Aucun nouveau reviewer obligatoire : cette QA API est déjà indépendante des auteurs ; le parent contrôle la préparation et l'intégration, les revues L9/L10 restent distinctes.

## Impact, alternatives et limites

Refaire les contrôles wire/projection inchangés n'apporte pas de preuve distincte ; ils sont réutilisés. Arrêter maintenant laisserait les nominaux complexes sans observation. Ce paquet fini cherche ces preuves après la complétion statique, sans nouvelle infrastructure ni baisse d'exigence. Aucun arbitrage utilisateur nouveau requis pour ces tests ciblés du périmètre approuvé ; aucun changement de contrat fonctionnel autorisé.

000a reste ouverte ; S1 non accepté/intégré, S2–S4/L7exécution/L9/L10 non clos. Trois commandes consolidées M2 NON EXÉCUTÉES. Numeric450+9 et preuves auteur réutilisés dans leurs portées. Aucun Git/merge/push/cleanup, C#, DB/native/live/IDA, framework ou permission supplémentaire.

Contrôle de la modification parent du runner : `node --check` PASS, SHA **1b61a0ea1c97ef7463b41ceeadbb7c508c807a749750c6c7ab9f6c1e1496e742**. Ledger relu9runs/4reprises/4255ms/nonbloqué, zéro test/typing produit lancé par ce contrôle. Q/QA_AUTHORIZATION.md porte le GO explicite53 ; le worker ne doit pas réutiliser les anciennes bornes comme un nouveau blocage ou les anciens GO comme un droit supplémentaire.
