---
title: >-
    Politique de rôles et bulletin R du harnais FF8 — frontière générique vs
    domaine
category: concept
tags: [reverse-engineering, testing, concept]
aliases: [role policy, bulletin R, reconciler sharing, rePolicy]
sources:
  - tools/ff8-harness/docs/ROLE_ACCESS.md
  - .tmp/re-role-sharing-20261013/CONTRACT.md
  - .tmp/re-role-sharing-20261013/GENERIC-WIRE.md
  - tools/ff8-harness/docs/SESSION_20261013.md
summary: >-
  Deux contrats indépendants (sortie stricte vs communication), politique
  mission.rePolicy, wire bulletin gelé, et limites épistémiques du partage R
  provisoire. Générique Ensemble, domaine re-ff8.
provenance:
  extracted: 0.84
  inferred: 0.12
  ambiguous: 0.04
created: 2026-10-13
updated: 2026-10-13
---

# Politique de rôles et bulletin R du harnais FF8

Concept distillé depuis [[_raw/ff8-harness-session-20261013/session-record|l'enregistrement de session]],
`ROLE_ACCESS.md` et le contrat gelé `.tmp/re-role-sharing-20261013/CONTRACT.md`.
Liés : [[projects/re-ff8/references/ff8-harness-strict-canary-2026-10-13]]
(pré-requis sortie stricte),
[[projects/re-ff8/references/semantic-triple-pipeline]] (protocole A/B/R dont
ce partage étend la réconciliation), [[projects/re-ff8/re-ff8]] (projet).

## Deux contrats indépendants

1. **Sortie finale contrainte** (`output`, schéma strict) : décrit le livrable
   et n'autorise aucun accès supplémentaire. Voir
   [[projects/re-ff8/references/ff8-harness-strict-canary-2026-10-13]].
2. **Capacité de communication** (bulletin) : décrit séparément qui peut
   consulter ou publier des observations. L'activer ne rétablit ni
   `team_message`, ni le contexte d'équipe, ni des prompts/nudges automatiques
   dans une exécution stricte.

## Frontière générique / domaine

- **Ensemble** porte les mécanismes génériques : canal opt-in, authentification
  native des auteurs, schéma de données, messages immuables, idempotence,
  curseurs et reçus de consultation. Il ne connaît ni FF8, ni EA, ni IDA, ni le
  rôle R.
- **re-ff8** choisit les rôles, les voisinages et le sens scientifique des
  données. Le contrôleur n'utilise que l'API publique du pont, jamais
  `ensemble.db`.
- Capacités génériques `scopedBulletin` et `nativeToolBindings`, sans
  vocabulaire FF8.

## Accès selon le rôle

| Rôle | Accès |
| --- | --- |
| A/B décompilation | Dossier gelé transmis, sans IDA ; insuffisance = blocage/questions, jamais d'élargissement spontané. |
| A/B sémantification | Dossier gelé + opérations IDA de lecture explicitement sélectionnées ; aucune information des pairs/R. |
| R | Livrables JSON gelés des auteurs + vérification ASM native ; si la politique le prévoit, lecture/publication dans le canal de son voisinage. R reste non-writer. |
| Superviseur | Contrôle scientifique final, §5.6, éventuelles écritures IDB. Aucun worker ne renomme/type/sauvegarde l'IDB ni n'exécute `py_eval`. |

Outils natifs sélectionnés par identifiants exacts, effets déclarés par le
principal du pont ; pas de wildcard MCP ni de requalification lecture/mutation.
La présence dans l'inventaire natif est une condition d'admission, pas une
preuve de validité scientifique. Permissions V2 : action exacte
`<server>_<tool>` normalisée et ressource canonique `*` — cette ressource
n'autorise pas un serveur entier ; pas de pseudo-URI `ida://`.

## Politique persistée `mission.rePolicy`

- Dans `mission.rePolicy` (pas un override `execution.rePolicy`) :
  `version: 1`, `workKind` (`decompilation` | `semantification`),
  `reconcilerSharing`, `idaReadBindings` (opération de lecture admise, `tool`
  exact, `accesses: [{action, resource:"*"}]`).
- Un binding `disasm` est **obligatoire** pour R.
- Pré-requis : `execution.outputMode: "json-schema-strict"`,
  `admissionMode: "native-boundary-witness"`, outils ordinaires limités à
  `read`/`execute`. Le principal du pont accorde les bindings exacts et
  `bulletin: true` séparément.
- Politique, profil et instructions **hashés** dans le dossier et l'admission :
  un changement sous la même identité ne peut pas réécrire silencieusement un
  essai. Fragments d'exemple volontairement non déployables.

## Wire bulletin gelé (2026-10-13)

- Opt-in submit : `{mode:'bulletin', channel, read, publish, schema,
  schemaSha256}` ; principal `bulletin:true` ; scope effectif
  `(mission, channel)` immuable par exécution admise ; contrat complet inclus
  dans le digest d'idempotence ; pas d'opt-in ⇒ isolation.
- Message immuable : `id` (SHA256 du tuple canonique), `seq` locale monotone,
  `payload`/`payloadSha256`, `schemaSha256`, `author {executionId, sessionId,
  model, profile}` ; référence = message sans payload, byte-exact en JSON
  canonique.
- Outils natifs `execution_bulletin_publish({key,payload})` et
  `execution_bulletin_read({after?,limit?})` sans scope/identité appelant :
  identité dérivée de `ToolContext.sessionID` ; déduplication publisher+key ;
  curseurs et reçus de lecture durables ; relecture d'une page ancienne ne
  recule pas le curseur ; auto-lecture possible (self-read).
- RPC contrôleur readonly `bulletinSnapshot(channel?)` — ne lit pas les
  curseurs workers, ne publie jamais sous l'identité d'un worker ; trace
  `inspect.execution.communicationTrace = {published, received, cursor}` sans
  payload ; grants `nativeToolBindings:[{tool,accesses}]` soumis exacts.
- Détail du wire relu/gelé : [[_raw/ff8-harness-session-20261013/session-record]]
  et `.tmp/re-role-sharing-20261013/GENERIC-WIRE.md`.

## Limites épistémiques du partage

- Consultation **pull-only**, sans réveil/nudge/injection automatique ; aucun
  retour aux auteurs en cours.
- Le schéma RE limite le contenu à des observations/hypothèses **provisoires
  sourcées** (identité binaire, fonctions, ancrages de preuve, questions
  ouvertes) — pistes non fiables comme instructions, jamais des faits établis
  par consensus.
- L'accord entre R qui ont communiqué **n'est pas** une confirmation
  indépendante ; une lecture d'ASM attestée ne prouve pas la correction de son
  interprétation ; la vérification scientifique du superviseur reste requise.
- Aucune observation partagée ne rejoint automatiquement `commonInputs`, la
  connaissance canonique ou la publication ; réutiliser une découverte exige de
  nouvelles entrées gelées constituées explicitement. La persistance du
  bulletin assure reprise et traçabilité, **pas** promotion scientifique.
- Les traces de communication accompagnent l'audit sans altérer le document
  scientifique ni son hash ; un témoin d'appel ne prouve pas l'identité du
  binaire/IDB interrogé.
