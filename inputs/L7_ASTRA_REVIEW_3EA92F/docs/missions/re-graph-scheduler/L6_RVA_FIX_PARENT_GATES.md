# L6 — correctif RVA positif : delta et gates parent

2026-10-14. **NON ACCEPTÉ, RE-REVIEW CIBLÉE EN COURS** ; aucune integration L8/native/G4.

Auteur l6-rva-astra/Astra max vérifié, task `task_mv83dgcl_000o_nhwqpa`, owneditable3 seulement. Ancien gel L6V6 préservé, eventlog readonly inchangé. Shutdown demandé après livraison, pas abort ni commit worker.

## Gel corrigé

- unit-lease.ts `76cbe27572090f505244f492669ac7555b86a0b472160938a87bea4bbae22d4a`
- graph-store.ts `1f532f8d223eb37066e6d092b835d6e2e7a204e43e6f50a81539bc375381f160`
- eventlog.test.ts `2813cfdae18bef082a8f93bf5c855fa7a151245c60aa8a1f6638f7dba600264e`
- eventlog.ts inchangé `98d0dec0dc8a95389e41bde6a4374dc664716ab1c8c433d400efab32a607614a`

Parent source/copieSHA exacts, bundle canonique `.tmp/re-graph-scheduler/review-20261014/L6RVAFIX`,32 chemins, manifest `595759501412ef8281d910de26d8f016332f33e6f585652c42dd96e753c37af3`.

## Vérification exacte du delta

Parent compare fichiers OLDL6V6 et source corrigée, pas prose auteur : **une seule ligne différente par fichier production**, mêmes nombres de lignes. Remplacement en mémoire de chacune par sa ligne ancienne restitue le SHA entier ancien exactement, sans écrire de source.

- unit-lease.ts:38 ajoute `rva > 0n` à projection commune avant rva<limit/base/EA bounds.
- graph-store.ts:335 ownedID regex passe de `0x(?:0|[1-9A-F][0-9A-F]*)` à `0x[1-9A-F][0-9A-F]*`.

Pas mutation de parser generic/base0, API/OWN6/history/claims/publication/witness ni autres champs source. EventlogSHA ancien actuel conforme. Tests7nouveaux explicitement ajoutés ; leurs assertions ne prouvent pas allinputs/universalité ni parent authoritynative.

## Gates parent relancés

Séquentiels Context Mode/cwd absolu auteur, sur SHA finaux vérifiés :

- `bun run typecheck` exit0.
- `bun test test/eventlog.test.ts` **93PASS/0FAIL** exit0.
- `bun test` **466PASS/1SKIP/0FAIL**,467tests18fichiers,exit0.

Les sept cas ciblés incluent oracleL1 complet sur snapshot isolé0RVA, refus avantadmission/I/O, primitive/legacy/reopen/durableuse, positiveRVA+base0/width endpoints, noncanonical/overflow refusés et maintien frontière OWN (pas globalruleinventée). Disque/reopen/multiprocess du reste sont exercés ciblés+suite, mais ni tousinterleavings ni API native/FF8 ; skip natif existant maintenu.

## Dernière re-review ciblée

Task `task_mv8439v6_000u_nel2mn`, **l6-rva-review**, session `ses_ec584d46cffeA1qW41CL7s0LOt`, fresh/read-only/plan/worktreefalse, **Sol max nativeRef relu**. Entrées : OLDL6V6/fullcontract/uniqueP2repro et FINALgelfixed, pas authorverdict comme preuve. Inversebyteexact, no genericbase0ban, propreprimitive/zero→noI/O etcontrols à vérifier indépendamment ; pas re-audit infini sansnouveaucontreexemple. SHA beforeafter, nouvelle erreurbloquante à escalader, pas d'acceptance implicite.
