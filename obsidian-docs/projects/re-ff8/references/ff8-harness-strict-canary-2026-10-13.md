---
title: >-
    FF8 Harness — Canary natif strict (essai 16 PASS, échecs 12–15, limites,
    2026-10-13)
category: reference
tags: [reverse-engineering, testing, reference]
aliases: [canary strict natif, essai 16, json-schema-strict canary]
sources:
  - tools/ff8-harness/docs/SESSION_20261013.md
  - tools/ff8-harness/docs/STRICT_OUTPUT.md
  - tools/ff8-harness/docs/RESUME_STATUS.md
  - tools/ff8-harness/evidence/native-canary-20261013-attempt16-review.json
summary: >-
  Preuve canary natif strict essai 16 (PASS confirmé parent) : route OpenAI
  json_schema strict, 5 sessions fresh, reprise, publication fixture. Échecs
  12–15 conservés ; limites du PASS synthétique.
provenance:
  extracted: 0.82
  inferred: 0.12
  ambiguous: 0.06
created: 2026-10-13
updated: 2026-10-13
---

# Canary natif strict du harnais FF8 (essai 16, 2026-10-13)

Référence distillée depuis [[_raw/ff8-harness-session-20261013/session-record|l'enregistrement de session]]
et les documents durables `tools/ff8-harness/docs/{SESSION_20261013,STRICT_OUTPUT,RESUME_STATUS}.md`.
Voir aussi [[projects/re-ff8/concepts/ff8-harness-role-policy]] (contrats de rôle)
et [[projects/re-ff8/references/ff8-harness-role-sharing-session-2026-10-13]]
(implémentation et audit inachevé). Contexte projet :
[[projects/re-ff8/re-ff8]].

## Route stricte retenue

- Provider natif autorisé : `openai`, modèle `gpt-6-astra`, variante `high`,
  endpoint de la connexion existante `https://chatgpt.com/backend-api/codex`.
  Aucun achat ni changement de credentials/configuration.
- Protocole Responses : `text.format` avec `type: json_schema`, `name`,
  `schema`, `strict: true`, transport WebSocket (18 requêtes contraintes).
- Route explicite `json-schema-strict` : aucune erreur ne doit faire revenir au
  JSON libre ni changer de modèle. **ZAI `json_object` et OpenCode Go ne sont
  pas des replis admissibles** ; un modèle/route inconnus échouent fermé, sans
  JSON libre silencieux. Le mode historique `file` reste distinct et explicite.

## Essai 16 — PASS complet confirmé par le parent

- Cinq sessions fresh distinctes, sans fork ; `Model.Ref` natif relu
  (`openai/gpt-6-astra#high`) ; 18 requêtes WebSocket schema-bound ; cinq
  captures validées.
- Reprise après perte de réponse **sans retransmission d'intention** ;
  sentinelle refusée ; aucune écriture worker ; dossiers v3 relus.
- Publication **fixture** unique : une écriture, un readback révision 1 ;
  conclusion seule en connaissance ; clôture sur l'ensemble exact des cinq
  couples exécution/session. Exit 0, 165 397 ms.
- Revue parente : `evidence/native-canary-20261013-attempt16-review.json`
  (sha256:eea0c77e9ec45c9068b57aebccf66d65605a9a316cfcd7d545c33272b4c6eb70).

## Échecs 12–15 conservés (négatif durable)

| Essai | Résultat |
| --- | --- |
| 12 | Bloqué avant tout worker : le RPC natif refuse les regex `pattern` dans l'envelope d'entrée ; retirées de l'envelope seulement, nom/hash validés exactement en admission. |
| 13 | Enveloppe profil `AgentGetOutput={location,data}` révélée ; vérifiée et extraite à la frontière SDK (correctif offline validé). |
| 14 | Chemin strict natif confirmé (WebSocket), mais canary complet en échec : R `blocked`, entrées non entièrement lisibles, attestation de hashes manquante. Refus légitime, jamais requalifié `certain`. |
| 15 | Clôture exacte après reprise + certificats des quatre workers confirmés ; R refusé avant allocation (chaîne JSON dupliquée `FrozenProposal.content`). Correctif v3 validé offline sur ses entrées réelles (35 736 octets, ligne max 1288, zéro appel natif). |

## Dossiers stricts v3

`contentLines` + `contentEncoding: utf8-lines-lf` : joindre les lignes avec LF
reconstitue exactement `content`. JSON à clés triées, indenté 2 espaces, LF
final ; certificats SHA256 mesurés source/projection comparés au manifeste ;
ligne physique > 2000 caractères bloque l'admission ; aucun contenu tronqué ou
réparé ; dossiers v2 et fixtures antérieurs immuables.

Autres correctifs : ancêtres symlink/junction refusés avant mkdir ; attentes
d'accès vérifiées indépendamment du resourceBoundary ; réponse terminale exigée
sans `output_pending` ; observation native sous wrapper survivant à la reprise ;
idempotence incluant contrat output/schéma/route ; provenance des captures liée
à executionId+sessionId.

## Limites du PASS (frontières explicites)

- Le PASS est **synthétique** : il ne vaut ni vérité scientifique FF8, ni
  publication IDA/IDB, ni transport HTTP natif, ni validation des permissions
  de production. Il **ne valide aucune fonctionnalité postérieure** (notamment
  l'extension role-sharing, voir [[projects/re-ff8/concepts/ff8-harness-role-policy]]).
- Budget et arrêt **coopératifs** (contrat de durée) : pas une garantie
  d'interruption à 1200 s d'un serveur bloqué ; un RPC jamais rendu exige une
  intervention ciblée, pas une clôture annoncée sur expiration locale.
- Les témoins sont une attestation du pont public authentifié, **pas** une
  signature cryptographique du provider ; un témoin d'appel ne prouve pas
  l'identité du binaire/IDB réellement interrogé.
- `STOP_REQUESTED` créable dans la racine du canary (token jamais persisté) ;
  anciennes fixtures et run01 jamais repris ; tout nouvel essai natif après
  échec exige un GO explicite du parent.
