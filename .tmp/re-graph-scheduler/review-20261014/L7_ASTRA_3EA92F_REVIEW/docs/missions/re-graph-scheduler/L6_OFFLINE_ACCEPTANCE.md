# L6 — acceptance parent hors ligne et intégration du module

2026-10-14. **ACCEPTÉ par le parent comme module de persistance/reprise hors ligne**, sur gel L6RVAFIX piné ci-dessous. **Pas acceptance native/scientifique G4, pas câblage L8 ni clôture L7/L9/L10.** Host/API réels, blind-context/proof-native restent des gates séparées.

## Chaîne de validation

- Revue complète indépendante OWNv6 Sol max : unique blocage normatif P2 RV6V6-01 (RVA0),32SHA inchangés,49bodies mémoire/37omissions disque explicites, witness/fn/type/hash/revocation/effect/CAS contrôlés. Preuves `L6_V6_PARENT_GATES.md`.
- Correctif Astra max : deux lignes de production seulement, rva>0 dans projection commune et regex ownedIDs positive. Parent a vérifié inverse mémoire/restauration byte-exact des anciens fichiers, eventlog/API/OWN6/history/claims/witness inchangés,93tests/gates. `L6_RVA_FIX_PARENT_GATES.md`.
- Dernière revue indépendante fresh Sol max `l6-rva-review`, task `task_mv8439v6_000u_nel2mn`, session `ses_ec584d46cffeA1qW41CL7s0LOt`, **ACCEPTABLE hors ligne strictement pour ce delta**,98assertions mémoire indépendantes PASS.32/32SHA NEW+OLD et6normesMAIN before/after identiques. Ancienne suite86 conservée,93finals enregistrés, retrait en mémoire des changements tests restaure l'ancien SHA ; inverse des deux lignes production restaure OLD exact. Aucun bug nouveau démontré, pas native ni suite disque indépendante prétendue. Shutdown demandé après livraison.

Parent compose ces preuves avec ses propres gates disque/reopen/multiprocess et l'inspection des guards ; le verdict d'un worker seul n'est pas l'acceptance.

## Pins acceptés

- eventlog.ts `98d0dec0dc8a95389e41bde6a4374dc664716ab1c8c433d400efab32a607614a`
- unit-lease.ts `76cbe27572090f505244f492669ac7555b86a0b472160938a87bea4bbae22d4a`
- graph-store.ts `1f532f8d223eb37066e6d092b835d6e2e7a204e43e6f50a81539bc375381f160`
- eventlog.test.ts `2813cfdae18bef082a8f93bf5c855fa7a151245c60aa8a1f6638f7dba600264e`

Gel manifest `595759501412ef8281d910de26d8f016332f33e6f585652c42dd96e753c37af3`. Anciennes versions et worktrees conservés. Aucun `.tmp`, helper d'un autre lot ou configuration ajouté au git.

## Intégration parent effectivement réalisée

Les quatre destinations MAIN étaient absentes : parent copie **uniquement own4** du gel, vérifie hashes exacts ; aucun central `engine/domain/adapter/client/cli/store` modifié. Dépendances de source6 sont déjà les mêmes versions du main ; pas transfert implicite du planner L5REL encore sous review ni du L2 non accepté.

Gates **dans MAIN après le transfert**, et non simple replay de gates auteur :

- `bun run typecheck` exit0.
- `bun test test/eventlog.test.ts` **93PASS/0FAIL**,exit0.
- `bun test` **466PASS/1SKIP/0FAIL**,467tests18fichiers,exit0.

## Limites et conditions d'utilisation

OWN6 livre projection canonique positive owned-functions, pins immuables connus, refus d'absence après I/Oambigu, reçus/facts liés à vrais artefacts, preuve parent/copied callbacks/revocation, intention publication figée/readback exact/selfID scientifique. Ancien state non lié/invalides ne satisfait pas les dépendances. Replay est audit, pas reconstruction automatique ; TTL événementiel/scans historiques/host et DB physique trusted sont des limites annoncées.

Le guard corrigé ne prétend pas valider globalement tous nœuds/contextes d'un snapshot : L2 ingestion/contrat reste requis en amont. Ne pas transformer une mock auth/native witness ou acceptance level1fixture en fait scientifique level2. Aucun appel FF8/IDA/publication réelle ni test du bridge natif effectué dans cette acceptance. L8 devra conserver protocole négatif réel, native model/source/session provenance et format/capture explicitement pris en charge, puis L7/L9/L10 réellement croisés.
