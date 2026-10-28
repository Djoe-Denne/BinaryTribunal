# Ratification parser-B L8 — schémas réels acquis in-place, cohérence C1-C5

Fresh reviewer indépendant, disjoint de l'auteur de la matrice command-B et de
tous les auteurs/reviewers L8. NONBLIND déclaré. Lecture seule, ZÉRO écriture
centrale, ZÉRO exécution.

Contexte : la matrice command-B (l8-command-b-matrix-r1-PUBLIC-REPORT-20261017.md,
contrats C1-C5) a demandé au parent l'ACQUISITION de trois schémas déclarés
absents ; le parent les a ACQUIS in-place — ce sont des artefacts RÉELS du
produit central (preuve : loaders lineage.ts:16-17 et investigation-groups.ts:45)
— reçus dans PARENT/L8_SCHEMAS_ACQUISITION.json (pins complets, fichiers en
place, non déplacés).

TA TÂCHE : RATIFIER ou non la cohérence du contrat parser-B (C1 l8-prepared-graph-v3
discriminé A/B sans widening v1/v2 ; C2 l8-partition-adoption-v1 séparé, lié aux
IDs/digests/révisions/acteur/inventaire actif ; putPartition refuse digest changé
sous même ID graph-store.ts:318-328) contre les TROIS schémas réels :

1. Pin/lecture in-place de cluster-partition-v1.schema.json,
   investigation-group-v1.schema.json, knowledge-delta-v1.schema.json (re-hash
   par toi, chemins du reçu d'acquisition).
2. Vérifier que les champs exigés par C1/C2 (partitA/adopted=false type L3
   structural cluster.ts:38-42, communityContentId/kernel/context/ownership
   préservés, digests/révisions/acteur/inventaire) EXISTENT dans les schémas
   réels avec les types/noms attendus — ou lister les écarts exacts
   (champ:chemin:attendu vs réel).
3. Vérifier que les loaders centraux (lineage.ts:16-17,
   investigation-groups.ts:45) valident bien ces fichiers (cohérence des
   chemins de chargement).
4. Verdict : RATIFIÉ (contrat B cohérent avec les schémas réels, prêt pour la
   tranche centrale) | CORRIGE (écarts précis champ par champ) | BLOCK. 3–8
   ancrages fichier:ligne, limites (ce que la ratification ne prouve pas :
   pas de code écrit, pas d'exécution, pas d'adoption G7).

Interdits : toute écriture (y compris centrale — lecture seule du produit gelé),
compile/test/exécuté/Job/Process/DB/git/IDB/board-write/délégation/changement
de modèle. Re-hash début ET fin. Rapport PUBLIC team_message.

PHASES : 1 ACK pins puis HOLD ; 2 sur GO distinct = review + verdict public.

Modèle imposé : cursor/grok-4.7 Grok 4.7 Extra High (complexité 65), spawn
fresh, Model.Ref vérifié.
