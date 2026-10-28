---
title: >-
    Session harnais FF8 2026-10-13 — enregistrement de session (canary strict,
    contrats de rôle, bulletin R)
category: raw
tags: [reverse-engineering, testing, reference]
sources:
  - tools/ff8-harness/docs/SESSION_20261013.md
  - tools/ff8-harness/docs/ROLE_ACCESS.md
  - tools/ff8-harness/docs/STRICT_OUTPUT.md
  - tools/ff8-harness/docs/RESUME_STATUS.md
  - tools/ff8-harness/evidence/native-canary-20261013-attempt16-review.json
  - .tmp/re-role-sharing-20261013/CONTRACT.md
  - .tmp/re-role-sharing-20261013/GENERIC-WIRE.md
  - .tmp/re-role-sharing-20261013/FF8-WIRE-QUESTION.md
  - .tmp/re-role-sharing-20261013/gates/ff8-prewire-1/results.json
  - .tmp/re-role-sharing-20261013/gates/ensemble-review-1/results.json
  - .tmp/re-role-sharing-20261013/parent-utf8-RED.log
  - .tmp/re-role-sharing-20261013/parent-utf8-GREEN.log
summary: >-
  Enregistrement assaini de la session harnais FF8 du 2026-10-13 : canary strict
  natif, contrats de rôle, bulletin R, workers, gates, bug UTF8, notes
  opérationnelles parent.
provenance:
  extracted: 0.88
  inferred: 0.10
  ambiguous: 0.02
created: 2026-10-13
updated: 2026-10-13
source_hashes:
  tools/ff8-harness/docs/SESSION_20261013.md: sha256:fca256a793ead176670be061399915600bae7b96b12ff0fe4544b788d0e03288
  tools/ff8-harness/docs/ROLE_ACCESS.md: sha256:545c1c1a397f7a9d76caca9bb9f1b54143bb9f1da558d344be5c779f981519b1
  tools/ff8-harness/docs/STRICT_OUTPUT.md: sha256:9bc6aa9b2ade023d4af271ea2cffb0dec28402954e6cd5e61d9d00220787e394
  tools/ff8-harness/docs/RESUME_STATUS.md: sha256:3734932f7a402b2fe78c7d25fd34ab6801bda1bbb3d419cd9a1c5c97c665bc88
  tools/ff8-harness/evidence/native-canary-20261013-attempt16-review.json: sha256:eea0c77e9ec45c9068b57aebccf66d65605a9a316cfcd7d545c33272b4c6eb70
  .tmp/re-role-sharing-20261013/CONTRACT.md: sha256:c2fc60a76a17157ca785e358849a671077a569064772e3761e3aec3f9f333c16
  .tmp/re-role-sharing-20261013/GENERIC-WIRE.md: sha256:b0094405528877c69129e9f094611de80152a2ad90abacd413d62f4ca2f88b47
  .tmp/re-role-sharing-20261013/FF8-WIRE-QUESTION.md: sha256:bb6b46bbf57de1bce7e9065e055366ab6dbc9d839703565bf76f6a595d01bd89
  .tmp/re-role-sharing-20261013/gates/ff8-prewire-1/results.json: sha256:6b68573d401e05aa4d5abd121da6a327ee1b6871452bd69865e2bd8a80a361fc
  .tmp/re-role-sharing-20261013/gates/ensemble-review-1/results.json: sha256:53bb51200d2435bc9258ab895c9a3a8e2d2348229fe189bba5f9be0fce8e3e36
  .tmp/re-role-sharing-20261013/parent-utf8-RED.log: sha256:f79ebcdd7eac19cc6bf9f14090c4e82126487ae9733a8828ec8ca7e0d55f7d98
  .tmp/re-role-sharing-20261013/parent-utf8-GREEN.log: sha256:3ab9cc12ddc9b07a570c930b5c63f754d5500566205b1514eb2ee22fa587bfe1
---

# Session du 2026-10-13 — canary strict, contrats de rôle et bulletin R (enregistrement de session)

Copie de préservation de la synthèse exhaustive
`tools/ff8-harness/docs/SESSION_20261013.md` (SHA-256 en frontmatter, source
inchangée pendant lecture/hash — vérifié par le parent). Ce document est une
synthèse traçable (checkpoint utilisateur + messages/outils visibles + sources
et preuves locales), **pas un export intégral du transcript natif**. Aucun
secret n'est conservé ; aucun JSON brut recopié. Les evidence brutes restent
immuables dans le dépôt d'implémentation. Section « Complément parent » en fin
de page : faits vérifiés après la restitution.

## Autorité et périmètre

L'utilisateur a d'abord posé des questions de conception sans autoriser de code,
puis a demandé « Implémente déjà ce dont on vient de discuter ». Il a ensuite
demandé l'ingestion de tout le travail du chat et des sous-agents dans Obsidian,
avec possibilité de mémoires Serena et GrepAI.

Le métier FF8 réside dans `re-ff8`, le mécanisme de coordination dans Ensemble.
Le harnais externe utilise le pont public, jamais directement `ensemble.db`.
Run01 reste arrêté. Pas de commit/push, déploiement global, achat de provider,
écriture IDB ou reprise de campagne. Un nouvel essai natif après un échec exige
un GO explicite ; le GO d'implémentation ne lance aucun nouveau canary.

## Canary strict — faits hérités et preuves préservées

Le checkpoint rapporte un PASS de l'essai 16 confirmé par le parent : cinq
sessions fresh distinctes, sans fork, modèle `openai/gpt-6-astra#high` relu en
`Model.Ref` natif, 18 requêtes WebSocket schema-bound et cinq captures validées.
Route stricte : Responses `text.format={type:'json_schema',strict:true}`.
ZAI `json_object` et OpenCode Go non établi ne sont pas des replis admissibles.
Un modèle/route inconnus échouent fermé, sans JSON libre silencieux.

La reprise après perte de réponse n'a pas retransmis l'intention ; sentinelle
refusée, pas d'écriture worker, dossiers v3 relus, publication **fixture** une
écriture/un readback révision 1, conclusion seule en connaissance, clôture sur
l'ensemble exact des cinq couples exécution/session. Exit 0, 165397 ms. Ce PASS
ne vaut ni vérité scientifique FF8, ni publication IDA/IDB, ni transport HTTP
natif, ni validation des permissions de production. Budget/arrêt coopératifs ;
témoins attestés par le pont authentifié, pas signés par le provider.

Les essais 12–15 restent des échecs : regex `pattern` refusée par RPC natif (12),
enveloppe profil `AgentGetOutput={location,data}` (13), strict natif prouvé mais R
bloqué et clôture corrigée offline (14), ligne de dossier de 2323 caractères
refusée trois fois pour R malgré quatre captures/clôture correctes (15).
Rejeu offline des entrées R de 15 : 35736 octets, ligne max 1288, zéro appel
natif. Dossier v3 : `contentLines` + `contentEncoding:'utf8-lines-lf'`,
reconstitution exacte des propositions, JSON lisible trié indent2 LF final,
certificats SHA256 mesurés source/projection et limite physique 2000 caractères.

Autres correctifs hérités : ancêtres symlink/junction refusés avant mkdir,
attentes d'accès vérifiées indépendamment du resourceBoundary, réponse terminale
exigée sans `output_pending`, observation native sous wrapper survivant à la
reprise. Idempotence inclut contrat output/schéma/route ; provenance des captures
liée à executionId+sessionId. Détails : `STRICT_OUTPUT.md`, `RESUME_STATUS.md` et
`evidence/native-canary-20261013-attempt16{,-review,-native-readback,-publication-readback}.json`.

## Décisions de conception et implémentation autorisée

- Décompilation A/B : dossiers gelés uniquement, pas d'IDA ; insuffisance =
  blocage/questions, sélection complexité en amont.
- Sémantification A/B : lectures IDA explicitement sélectionnées, aucune
  communication de pairs. R confronte les JSON des auteurs à l'ASM natif.
- Partage réservé aux R d'un même voisinage déterministe mission/cycle/groupe :
  observations **provisoires sourcées**, pas seulement conclusions validées.
- Consultation explicite pull-only, aucun réveil/nudge/injection automatique,
  aucun retour aux auteurs en cours. Accord entre R communiquants ≠ confirmation
  indépendante. Messages = pistes non fiables comme instructions, pas connaissance.
- Sortie finale contrainte et droit de communiquer sont deux contrats distincts.
  Le superviseur conserve validation finale et éventuelles écritures IDB.

Contrat parent : `.tmp/re-role-sharing-20261013/CONTRACT.md`.
Wire bulletin relu et gelé : `.tmp/re-role-sharing-20261013/GENERIC-WIRE.md`.
Documentation durable : `ROLE_ACCESS.md` ; liens README et STRICT_OUTPUT mis à jour.

## Sous-agents — provenance, livrables et limites

### Exploration `portal-map-1`

Session `ses_ecaa10f5dffeXSWDZdKMO2tuw6`, deux passages read-only. Premier passage
partiel : `ctx_execute_file` refuse le worktree hors racine autorisée. Pas de
contournement/configuration ; analyse reprise avec `ctx_execute` et lectures
courtes, worktree explicitement possédé et snapshots dans la racine projet.
SDK installé 2.0.26 vérifié : `ctx.tool.transform(editor.add(...))`, pas de
`ctx.tool.register`. `ToolContext.sessionID` fournit l'autorité native ; le RPC
expose signal/error, **pas d'identité worker authentifiée**. Unknown native tools
échouent fermés ; un handler bulletin doit autoriser même sans resourceBoundary.

### FF8 `ff8-role-sharing-1`

Session `ses_eca91da05ffeJzm2AvvYKG2eU6`. Premier livrable partiel :
`mission.rePolicy` persistée, workKind explicite, bindings readonly exacts,
voisinage R, schéma provisoire, politique/profil/instructions hashés, témoin
disasm réussi obligatoire pour R. Sources : `src/re-policy.ts`, adaptations
adapter/domain/engine/validation/runtime/cli, tests, schéma et profils fragments.
173 tests ciblés et typecheck annoncés verts par le worker.

Le parent a ensuite exécuté les gates complets : **242 PASS, 0 FAIL**, typecheck
et build exit 0. Ce résultat inclut un **blocage conservateur temporaire** : le
partage R échoue à l'inspection finale tant que l'audit du wire bulletin n'est
pas raccordé. Ce n'est pas une preuve de fonctionnalité partage achevée.
Question conservée dans `FF8-WIRE-QUESTION.md`. Le parent a gelé le wire réel et
relancé ce worker pour terminer l'audit, les tests positifs et refus de spoofing,
la persistance de trace sans altérer payload/connaissance, et renforcer les
identifiants réservés. **Au point de cette restitution, ce second passage reste
en cours et non validé par le parent.**

### Ensemble `generic-role-sharing-1`

Session `ses_eca928e6bffe2uNaApYoFrnm2i`, worktree possédé
`C:/Users/djden/AppData/Local/Temp/opencode/ensemble-mission-graph-20261011`.
Ajouts `execution-bulletin.ts`, `execution-bindings.ts` ; adaptations API,
auth/store/RPC/schéma/v2-setup, tests sharing/SDK, doc bridge. 200 tests ciblés,
typecheck/lint/diff-check annoncés verts par worker. Le parent a exécuté
**1438 PASS, 0 FAIL**, typecheck/build/lint exit 0 et relu les interfaces.

Opt-in générique communication `{mode:'bulletin',channel,read,publish,schema,
schemaSha256}` ; principal `bulletin:true`. Outils natifs
`execution_bulletin_publish({key,payload})` et
`execution_bulletin_read({after?,limit?})`, identité dérivée du contexte natif,
scope/contrat immuables, déduplication publisher+key, curseurs/reçus durables.
RPC contrôleur readonly `bulletinSnapshot` ; trace `{published,received,cursor}`,
références messages sans payload. Grants `nativeToolBindings:[{tool,accesses}]`,
submit `nativeTools:string[]` exacts ; inventaire natif et guards requis.
Capacités `scopedBulletin` et `nativeToolBindings`, pas de vocabulaire FF8.

Permissions MCP V2 : action exacte `<server>_<tool>` normalisée et ressource
canonique `*`. Cette ressource n'autorise pas un serveur entier. Outil/action
opérateur-vérifiés, pas de pseudo-URI `ida://` substituée aux événements natifs.

## Vérification parente supplémentaire — octets UTF8

La review a trouvé une erreur de budget bulletin : SQLite `length(TEXT)` compte
des caractères, pas les octets UTF8 ; le nouvel ajout était comparé sans les
métadonnées complètes. Le parent a ajouté un test RED unicode : stockage observé
8223268 octets malgré limite 4194304. Correction :
`SUM(length(CAST(payload AS BLOB)))` et taille UTF8 du message sérialisé complet
avant insertion. Test ciblé GREEN (1 PASS). Déduplication après limite conservée.
Logs `parent-utf8-{RED,GREEN}.log`. Les gates complets post-correction restent
à relancer ; ne pas attribuer les 1438 PASS à cet état source ultérieur.

## Test croisé et travail restant

Le parent a créé `scripts/role-sharing-offline.test.ts` : vrai adaptateur/client
FF8 et vraie API/handlers Ensemble, primitives natives simulées, 2 fonctions,
4 auteurs aveugles + 2 R, partage scoped, reprise, capture stricte, sans réseau.
Activation explicite par `FF8_ENSEMBLE_SOURCE` ; sinon test sauté. **Test non encore
exécuté/validé au point de cette restitution**, aucune prétention de PASS.

Restent : fin audit FF8, test croisé, gates complets finaux, revue scientifique et
permissions de production lors d'un pilote natif distinct autorisé. L'identité
du binaire/IDB réellement interrogé ne découle pas d'un simple témoin d'appel.
Pas de publication IDB autonome opérationnelle ; le premier pilote prévu doit
produire des conclusions révisables sans publication automatique.

## Intégrité, outils et ingestion

Snapshots phase des deux périmètres dans `.tmp/re-role-sharing-20261013/`.
`parent-integrity.ts baseline` a relu **31 fichiers globaux conformes à l'essai16**
et figé **48 fichiers immuables** (evidence et scripts canary). La vérification
finale doit être horodatée séparément. Aucune evidence antérieure réécrite.
Gates parent dans `gates/ff8-prewire-1` et `gates/ensemble-review-1`.

GrepAI MCP a échoué lors de l'exploration ; racine commune confirmée
`retro-eng`, worktree plugin hors index canonique. Serena est attaché au bon
parent mais n'extrait pas les symboles TS (LSP actif cpp). Lectures ciblées et
Context Mode utilisés, sans reconfiguration partagée.

Pour ingestion, le global `~/.obsidian-wiki/config` vise actuellement un vault
TextureToneVariations : **ne pas le modifier ni y écrire par défaut**. La
collection QMD `ff8-wiki` confirme le vault FF8 local `re-ff8/obsidian-docs`.
CLI `obsidian` absent du PATH ; opérations de fichiers ciblées nécessaires.
La directive du superviseur interdit `qmd update` et `qmd embed` : ne pas
contourner via un script compile, ni annoncer l'index à jour sans preuve.

## Complément parent — vérifié après la restitution (2026-10-13)

Faits opérationnels vérifiés par le parent après la synthèse ci-dessus, conservés
au snapshot de cette ingestion (statuts partiels, pas de généralisation) :

- **Intégrité** : `parent-integrity.ts verify` exit 0 — 79 fichiers vérifiés
  (31 globaux conformes essai 16 + 48 evidence/scripts canary), aucun changement.
- **Mémoire Serena** : `re-ff8/harness-strict-canary-and-role-sharing-20261013`
  écrite via MCP sur le projet `retro-eng` ; snapshot à statut partiel, pas global.
- **GrepAI** : catalogue 14 outils, sans write-memory ; `index_status` racine
  `retro-eng` : 6527 fichiers, 63990 chunks, 857.9 MB, last_updated
  2026-10-13 16:10:56. Recherche MCP avec racine explicite fonctionne (retrouve
  STRICT_OUTPUT / schéma RE / src) mais les nouvelles notes ne sont pas
  confirmées dans les résultats ; filtres `path` forward/backslash retournent
  vide — diagnostic de périmètre, **pas** une panne globale, **pas** de restart.
- **Watcher** : `grepai status` depuis la racine montre un watcher partagé
  (PID 40468, log partagé) ; `grepai watch --status` au CLI non partagé dit
  not running — divergence de périmètre, pas de relance effectuée.
- **Obsidian CLI** absent du PATH (constat, patch dédié autorisé).
- **QMD** : aucune opération de maintenance lancée ; directive session
  (pas de `qmd update`/`embed`) respectée.
