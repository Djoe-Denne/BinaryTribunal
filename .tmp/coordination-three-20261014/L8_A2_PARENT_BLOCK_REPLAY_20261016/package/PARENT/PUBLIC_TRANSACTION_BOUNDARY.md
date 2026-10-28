# L8 v2 — architecture ratifiée, gate transactionnelle isolée avant source

Même task `task_mv6towrm_000c_24005n`, auteur Sol max
`ses_ec12fcc43ffeI6xXQ5rSTty2mV`. Plan v2 reçu avec probes mémoire et gels intacts.
**Versions/bindings ratifiés en principe ; GO limité au spike public ci-dessous**
après lecture/hash/ACK et message parent final. Aucun edit src/test d'intégration
avant résultat du spike vérifié et GO WRITE séparé. Pas acceptation L8.

## Architecture prospective retenue

Les DTOs proposés template/source/input-source v1, prepared-graph v2, graph-run v2,
execution-binding/derived-spec/budget-scope v1, CycleRecord.graph v2 et namespace
l8.graph2.* sont approuvés sous leurs contrôles stricts. Source spec/template
**réellement présents avant plan** sont distincts du spec dérivé après plan ; ce
dernier lie plan/sidecar/triple binding/prepared/inputs sans rétroalimenter leurs
hashes. Aucune valeur actuelle simplement recopiée de l'allocation comme preuve.

CycleRecord.graph v2 ne s'ajoute qu'à un cycle neuf non marqué ; v1 reste inspectable
read-only, aucune migration/reprise v2 de3073 ou remplacement d'un cycle frozen.
Unknown/malformed/extra/own accessor/proxy ne retombe pas legacy. MissionConfig,
Store/schémas L1, modules acceptés et fichiers readonly inchangés.

ScopeKey canonique lié mission/cycle/epoch/contexte/allocation, jamais fence/passe.
Clé claim = préfixe versionné +hash canonique du tuple(scopeKey,unitId,subIntentId),
pas concaténation ambiguë. Rôle/fonction doivent matcher ce vrai sub-intent et le
plan sélectionné. C/N/T et tailles viennent de l'allocation vérifiée, pas du caller.
Claim mono-slot par sous-intent toutes générations/passes, sans remboursement après
commit même en cas de rejet/ambiguïté. Retry même executionId+body exact seulement ;
cela ne réautorise jamais une admission sous une fence/controller changés.

## Lecture parent des APIs réelles

graph-store.ts expose db/events/leases readonly et construit EventLog/UnitLeaseStore
sur **sa même db**. prepareAdmission626–662 et freezeAdmissionInputs utilisent déjà
des transactions imbriquées .immediate(). EventLog.append38–58 possède unicité
(mission,key), digest **incluant time**, cursor monotone ; un prior key retourne
avant le test expectedSequence. Ce n'est pas à lui seul une nouvelle CAS d'autorité.
UnitLeaseStore.assert155–163 vérifie aussi expiration **par séquence d'événements**
et controller token original, pas seulement token familial.

**Composition autorisée pour le spike** : graph.db.transaction(callback synchrone)
.immediate(), via graph.events et graph.leases de CETTE connexion, assertController,
rechecks actuels d'ancre/contexte/réservation ; freezeAdmissionInputs ; claim
EventLog unique exact ou lecture exacte de l'original ; prepareAdmission ; **réassert
controller+lease APRÈS les derniers append**, puis retour. Ce dernier check est
obligatoire : pin/claim/admission consomment la séquence et peuvent expirer la lease.
En cas de failure, laisser throw sortir de l'outer transaction, pas catch-and-commit.

Pas await/Promise/callback externe/I/O réseau ou dispatch dans la transaction.
Mesure du body final et copies JSON sûres avant, validations/fences actuels dans
la transaction. Aucun db.query/prepare/exec/SQL direct, nouveau table/migration,
patch L6 ou écriture de projections en dehors de leurs APIs. Constructeurs/connexions
ouverts avant la transaction, pas un nouvel EventLog/GraphStore dans le callback.

Une lecture publique Store.load d'un Store préouvert peut rechecker l'ancre ;
**pas Store.commit/acquire/renew sur une autre connexion dans l'outer transaction**.
Le protocole d'ancrage/CAS du cycle reste séparé et non activant jusqu'à son commit.
Établir que les lectures sont fraîches, pas un cache stale tenant lieu d'autorité.

Pour prior claim, réutiliser temps et record originaux : pas re-append avec now ou
tokens courants. Comparer exactement body/hash/bytes/IDs/scope/binding et métadonnées
immutables ; maxAttempts/backoff originaux ne sont pas élargis au retry. Refaire les
guards courants indépendamment : lire le claim n'accorde aucune autorité scientifique,
ni quiescence, ni remplacement de famille encore active/quarantined.

## Spike autorisé, pas encore l'implémentation L8

Écrire uniquement OWN/.tmp/L8_PHASE_A_V2/tx-spike.* et logs/receipts associés.
Fixtures SQLite neuves sous ce namespace/opencode unique ou Temp/opencode/l8-v2-tx-*,
handles fermés/DB hashées **conservées**, zéro delete. Vrai nouveau plan L5 v2 et
body complet valides, fake inputs/profiles explicitement fixtures ; aucune science,
native/runtime Ensemble ou vrai provider. Aucun patch aux13sources/tests initiaux.

Gates publiques à démontrer avec vrais codes/observations, pas du SQL de preuve :
- succès : pin+claim+outbox PREPARED et journaux correspondants, même connexion ;
- throw après pin, après claim, après prepare avant commit : rollback complet y
  compris pins/événements/outbox et curseur ; vérifier aussi par APIs publiques
  qu'un pin différent peut ensuite être figé, pas juste l'absence d'un log ;
- rejection body C+1 et expiration de lease après les append : aucune fuite de
  claim/pin/outbox ; guards publics inchangés, sous-gates de rollback explicites ;
- commit réellement passé mais réponse simulée perdue, close/reopen, retry à now
  différent exact : pas nouvel ID/claim/outbox/event. Corruption/second body/ID et
  nouvelle generation/controller/passe ne récupèrent pas un slot ou autorisation ;
- deux connexions contendantes, même vue/sous-intent : au plus un body différent
  admis ; même body retry idempotent. Un simple booléen «deux contrôleurs» ne prouve
  ni cette exclusion ni un interleaving réel ; décrire celui effectivement testé.

Si imbrication SQLite, connexion, atomicité ou API d'observation insuffisantes :
STOP et preuve courte, pas d'extension cachée. Pas support L8 complet revendiqué
sur ce spike. Un claim source correctement rollbacké n'est pas un dispatch réel.

Après PASS parent, un **GO WRITE distinct** pourra autoriser le sous-ensemble du
plan proposé : six src domain/engine/cli/graph-pipeline/graph-adapter/graph-engine,
sept paths tests déjà approuvés. client/adapter restent exacts sans nouveau besoin.
Le futur travail conserve contrôle receipt2/fixture-only avant satisfaction, vrais
ports/proofs pour niveau2, R légal>C retenu/refusé sans troncature/padding, N=1durable,
recovery/CAS/legacy/verticale complète et drains immédiats avant gates A.

Pas full, régime B L4, câblage simulateur ou GO scientifique/réel dans ce message.
Pas Git/install/sous-agent/inbox/DB privée/réseau/LLM/IDA/live/suppression. Le reviewer
simulateur travaille indépendamment ; son éventuel PASS ne vaudra pas GO de câblage.
