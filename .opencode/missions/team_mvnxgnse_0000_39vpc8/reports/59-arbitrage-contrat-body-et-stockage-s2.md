# M2 — 59 : arbitrage explicite du contrat body et de la tranche S2

## Objectif et stade

Reprendre l'implémentation utile après S1 DATA/pures qualifié, sans modifier silencieusement la définition du body budgété ou ouvrir les stores legacy à un schéma incompatible. La révision documentaire56 est terminée ;000b reste ouverte. Aucun code/projection/test/DB/native S2 lancé. Public000c reste RO ; suffixe TDD non exécuté préservé au58.

La décision ci-dessous porte sur un contrat important et un opener v3 dédié : elle est soumise à l'utilisateur plutôt que présentée comme une exclusion déjà acquise ou un GO découlant du numéro S2.

## Acquis réutilisés et vérifications parent

- S1 candidat qualifié offline DATA/pures au55 : typing+107PASS QA indépendants ; numeric450+9 et planner415 préservés dans leurs portées, pas à rejouer.
- DRAIN575–588 exige body scientifique final complet (dossier/prompt/manifests/knowledge/context/proposals/modèle/access/resultHeader), mesureUTF8 entière avant admission, pin/outbox puis revalidation avant effet. DRAIN625–636 conserve SPENT/BURNED et retry exact sans crédit.
- Code client55–68/87–124 relu au56 : transport ajoute principal/token,scope/controller/revision, ces derniers pouvant changer au retry. Image scientifique et requête RPC finale ne sont pas identiques. Le SDK reçoit un objet ; égalité canonique de la projection n'est pas égalité RAW HTTP/SDK.
- QA_MATRIX132–161 impose génération/OWNv3 ;147–150 interdit de prétendre les tables v6 génération-aware ;195–200 protège shared files/legacy. Parent confirme dans store.ts:8–21 l'allowlist metadata engine/fixture-publication et graph-store:219–255 tables/clés v6 mission/unit. Ils ne peuvent pas ouvrir un OWNv3 marqué sans changement, qui n'est pas autorisé.
- EventLog:25–53 accepte une connexion injectée et offre append/CAS/idempotence. Sa réutilisation transactionnelle est possible sans toucher aux tables/loader v6 ; cela ne prouve pas encore la nouvelle persistance.

## Proposition recommandée : domaine scientifique conservateur + OWNv3 isolé

### 1. Image exacte budgétée et immuable

Définir `A=UTF8(canonical(Admission complète))`, **command incluse intégralement**, pas prompt seul ni sidecar S1. Capture JSON stricte détachée, aucune omission/normalisation/troncature. A inclut identité admission et tous les contenus scientifiques finalement transmis ; mesurer A<=CunitCourant<=CrootAcquired et conserver reservedDebit acquis. SHA des bytes exacts, digest de requête documentaire et D(kind,value) restent des rôles distincts.

Command est extraite de l'admission durable sans reconstruction/enrichissement ; son image canonique exacte est liée à A. S3 devra comparer exhaustivement la projection scientifique de l'objet final au dernier RpcTransport.call(submit,input), avant effet. Toute science ajoutée/modifiée/omise, collision de champ ou mismatch de modèle/contexte/identité refuse. Les tests seront d'abord des transports contrôlés, pas des preuves publiques natives.

**Exclusion à ratifier** : seuls les champs de protocole/auth fermés missionId/directory/controllerId/expectedRevision/principalId/token et enveloppeSDK rpcID/location ne sont pas comptés dans A ; ils ne peuvent pas porter de contenu scientifique ni écraser un champ de command. Leur identité/fence et autorisation restent contrôlées, même s'ils sont hors taille scientifique. Aucun credential sérialisé/loggé/persisté/hashé pour démontrer une égalité de body. Retry conserve A/command/ID/slot/policy ; seul un changement protocole explicitement revalidé peut accompagner le retry.

Conséquence assumée : cette option **ne promet pas un plafond sur les bytes RAW de la requête réseau/SDK**. Elle ferme le body scientifique complet décrit par DRAIN, avec une image conservatrice plus large que la command seule. L'utilisateur doit accepter cette définition, plutôt qu'une simple note prétendant le gap résolu.

### 2. Persistance de génération sans modifier v6

Autoriser une tranche fixture/offline dans trois modules dédiés : graph-generation-store, graph-trusted-authority, graph-generation-budget ; un opener OWNv3 **privé**, marqué et à allowlist fermée, refuse Ensemble/foreign/legacy inadéquat. Une seule connexion OWNv3/EventLog, transactions atomiques ; pas de service/backend natif, second scheduler, gateway ou v6 instancié sur OWNv3. Réutiliser primitives SQL/journal/codecs/invariants, pas dupliquer le moteur RMS.

Le v6 et ses loaders/tables restent inchangés. L'opener v3 est une adaptation de la tranche génération déjà requise, mais constitue un choix de stockage à approuver, pas une permission d'ouvrir/migrer une base existante. OWNfixtures neuves possédées et enregistrées seulement après préflight parent ; aucun codeDB autorisé par le seul plan actuel.

La tranche initiale porte bootstrapA fixture, head/refs/CAS, famille/slots root/admission/outbox/retry/Q et BURNED, sans dispatch. Transition/drain/replacement/succession/publication non prouvés restent HOLD/non autorisants et travaux ultérieurs. Elle ne clôt pas S2/S3/S4. Les détails SQL/interfaces/closure/paths/droits et runner seront fermés par le parent avant code/exécution ; revue indépendante des nouvelles frontières SQL/fences requise, pas pipeline QA générique additionnel.

### 3. Refus avant/après engagement

Conserver les oraclesv2. Avant engagement : refus sans effet ; après engagement, body over-cap : BURNED terminal durable, aucun dispatch/crédit. Retry ne recrée pas un slot. Pas d'exigence contradictoire zéro mutationDB post-engagement.

## Alternatives et compromis

- **Proposition ci-dessus (recommandée)** : ferme les domaines métier et débloque une tranche S2 bornée, maintient sécurité/legacy et secrets hors stockage. ObligationS3 de mapping avant émission conservée ; aucune garantie RAW HTTP.
- **Exiger le RPC RAW complet** : inclure le transport et sa représentation finale dans l'image budgétée. Les frontières actuelles objet/SDK ne le garantissent pas ; il faut un nouveau cadrage de capture/sérialisation et traitement sûr des credentials. Pas d'implémentation/harness plus large autorisé implicitement ;000b reste bloquée sur ce contrat.
- **Suspendre S2** : conserver le candidat S1 qualifié et les plans. Aucun faux PASS, mais pas de progression persistance/admission/parcours intégré.

Ces options ne rouvrent pas numeric/M1, ne modifient aucun seuil, n'ajoutent pas de C# ou GO natif/jeu. Aucun commit/merge/push/nettoyage/configglobal. Les trois commandes consolidées M2 demeurent NON EXÉCUTÉES.

## Décision demandée exactement

Ratifier ou refuser le **couple** : (a) body scientifique A conservateur avec exclusions protocole/auth fermées et mappingS3 obligatoire, sans promesse RAW HTTP ; (b) OWNv3 privé isolé réutilisant primitives/EventLog, legacyv6 inchangé. L'approbation permet au parent de fermer la tranche de code/tests ciblés et son budget dans le contratM2reinforced existant ; **pas d'appel natif, DB existante, test non borné ou acceptationS2/M2 implicite**.

Une préférence différente sur un seul des deux points peut être précisée en réponse libre. Aucun changement du contrat proposé n'est appliqué tant que cette décision n'est pas reçue.
