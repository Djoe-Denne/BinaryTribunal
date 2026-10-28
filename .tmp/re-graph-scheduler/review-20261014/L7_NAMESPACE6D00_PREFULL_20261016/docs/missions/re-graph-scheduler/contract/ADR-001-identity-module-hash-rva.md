# ADR-001 — Identité = hash du module + RVA canonique

**Statut :** gelé pour L1, en attente de validation lead.
**Date :** 2026-10-13.

## Décision

L'identité d'une fonction est `moduleSha256 + ":" + RVA`. Le RVA est `0x` + hexadécimal majuscule, sans zéro de tête, strictement positif. Le nom IDA, l'EA absolue et l'image base sont des attributs.

`ea = imageBase + rva` est une conversion contrôlée. Un renommage ou un changement d'image base ne change pas l'id. Le même nom avec un autre hash est une autre fonction. Le même RVA dans deux modules est deux fonctions.

## Compatibilité

`FunctionIdentity` du harnais n'est pas remplacée. La projection vers un intent est `{ sha256: moduleSha256, version: versionLabel, ea }`, une fonction, jamais un groupe. `versionLabel` reste hors de la clé graphe parce que `identityKey` l'exige encore. L8 refuse une projection dont le couple hash/label ne correspond pas à l'artefact de mission.

Le label `mission-label:ff8-en-pc` n'est pas une version PE lue.

## Conséquences

L2 normalise vers cette clé. L3/L5 n'utilisent pas le nom comme clé de fusion. L8 est le seul writer de `domain.ts`.
