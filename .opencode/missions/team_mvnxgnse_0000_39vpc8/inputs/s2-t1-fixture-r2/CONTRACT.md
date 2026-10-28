# Fixture83/85 — INITIAL + T1 (non exécuté)

Sources : DRAIN18–68/128–162/296–337, ENVELOPE223–249, QA_MATRIX132–161 ; S1
PreparationObservationT0146–154/CandidateRef/DrainEntry/Head227–259 inchangés.
Formes privées/attentes : transition-fixtures.ts. Pas seal/bind/native/run ;82 intact.

## Octroi85 : trois origines, bootstrap compris

Décision utilisateur85 « Trois dossiers (recommandé) » : plafond3 origines DURABLES
par root/lineage fixture. Chaque origine nouvellement committed charge1, bootstrap
inclus ; stage persisté perdant aussi. Retry exact0, rollback avant commit0 ; aucun
refund/reset. Activation/remplacement gardent leurs compteurs indépendants (S1:171/
1230–1250), ne paient pas les préparations à leur place. Aucun crédit C/N/T/physique.

Octroi privé privilégié enregistré AVANT bootstrap des NOUVELLES fixtures : scope
mission/lineage/root, unité durable-origin/plafond3, décision/sourceMission/rootRefs,
issuer/provenance/ownershipRef/connexion, révision et révocation courantes séparées.
Provider lie records à l'objet DB, relit source/current/counter et histoire OWN en
TX ; ni constante caller3, compteur de requête ou selfhash ne font autorité.
Initial0 exige preuve indépendante première émission/histoire vide ; bootstrap=>1,
même TX origine/compteur/event. Set exact origines+clés commit comparé à OWN.
Nouveau OWN ne réémet/reset rien ; ownership/histoire inconnue=>HOLD, pas retrofit82.

Absent/inconnu/périmé/révoqué=>HOLD AVANT effet ; cas négatif conservé, plus blocage
structurel83. Source+compteur courants réellement vérifiés rendent les blueprints
nominaux conditionnellement consommables ; 3 utilisés refuse toute NOUVELLE origine
avant effet, retry exact reste0. Aucun booléen vérifié fourni par le caller.

## Préparation et attente T1, sans réécrire T0

Fille avant seal depuis parent A retenu : mission/lineage/root/sources root/policy
inchangés, ordinal+1,parentId exact. Mission/knowledge différents de T0=>HOLD,
pas update candidat. T0/provenance host indépendants, pas demande selfhashée.
Refs envelope/run/candidat après qualification future.

Choix local retenu85 : avant préparation (h,c,q),
après préparation (h,c+1,q+1). Le CAS initial exige pointeur candidat NULL ; insérer
origine PREPARED + run + T0 + record pré/post + pointeur candidat et event ensemble.
head.revision reste h ; candidateRevision avance. Toutes mutations CAS comparent
h ET candidateRevision/pointeur/barrière. SourceMission/activePlan/K/inventory/L5/
pool inchangés ; compteur préparation85 distinct, charge1 au commit.
Record privé lie counterBefore/counterAfter ; T1 attend le post-compteur committed,
pas le pointer pré-T0. Histoire/clé commit et sourcegrant sont revérifiées, pas un
counterAfter ref donné par requête. L'event propre T0 explique cette seule charge.

T0.headRevision=h/observedEventSequence=q intacts. Record privé lie postimage
(h,c+1,q+1) ; T1 compare T0 ET cet exact postimage, pas lecture rafraîchie.
Seul event préparatoire explique q→q+1 ; autre mouvement exige
nouvelle préparation autorisée, pas tolérance arbitraire. DRAIN302–309/327–337 :
T0 non actif, h→h+1 à T1 ; contradiction codec/source=>STOP avec citation, pas cast
ou refresh T0. Doublon préparation relit ses refs
sans nouveau compteur/event ; candidat différent quand pointeur occupé refuse.

## Autorité/cuts privés

resolveTransitionA(caseRecordRef) : handle purpose=request-drain DISTINCT du
bootstrap/controller, lié par registre privé à l'objet DB/connexion, issuer/case
revision, candidat/parent A/préimage-postimage/T0/sourceRefs/owner/controllerFence.
Les IDs de connexion JSON ne prouvent rien. Relire records/sources/révocations
indépendants au consommateur ; cohash/authorizationKind/ref caller seuls refusés.
Case T1 ne peut servir à T2. B/public/native et recyclage bootstrap => HOLD.

Cuts EngagedFamilies/InventoryAtCut fermés BoundDocument triés tuple/slot/exec/pool,
TOUTES réservations actives, même sans
outbox, lease/fences, origin/run/plan/unit refs, slots A/B/R engagés/dépensés/brûlés,
images/pins/outboxes/claims et refs observations/Q/sourcecaps existantes. Leur
enumerationRef provient du host et est revérifiée contre les collections OWN
complètes au même cut ; COMPLETE caller ne suffit pas. UNKNOWN/null => HOLD,
jamais []. Absence de Q dans un set complet de records n'est PAS preuve Q.
Physique = projection ledger82 auditée/acquisition/current/cuts exacts, pas autre
remaining/inventaire. Cut local T1≠inventaire final publications/readback/S3/drain fini.

## Transaction T1 et continuations

Même connexion/TX immédiate, zéro await/callback : candidat courant PREPARED,
RUNNING sans barrière/pause ; parent/owner/fences/T0/sources/case/counters exacts.
Appender les cuts et DrainEntryV1, barrière immuable, PENDING_DRAIN, mode
DRAIN_NEW_FAMILIES, postimage (h+1,c+2,q+2). Ne changer ni activePlan, connaissance,
slots/débits L5, inventory physique, acquisition ou poolRevision. TTL après append,
échec=>rollback complet. Même CAS réservation/T1 : réserve avant incluse ; après
refusée. Retry exact relit mêmes refs/barrière, zéro event ; différent refuse.

Après cut : nouvelles familles/entitlements hors set et candidat non ACTIVE
interdits. Observations/Q/release et A/B/R déjà prévus continuent sous origine,
preuves/profil/quotas propres. R82 sans reviewer/prédécesseurs reste HOLD propre,
pas nominal R. Retry identité≠redispatch ; ambiguïté≠resend. T1 périme workCuts :
nouvelle observation host indépendante avant nouvelle occupation, mêmes droits/
pool/set, aucune seconde déduction. Pas sortie globale avant continueEngaged.

Tables existantes seulement : origins/head JSON/authority/EventLog/claims/slots ;
cuts/documents immuables dans authority, lien event exact. Pas DDL ou reset OWN ;
SPENT/BURNED/ENCUMBERED et occupations82 conservés. Un besoin réel de colonne ou
projection sûre impossible exige escalade avant code. T2/ActivationAttempt/
remplacement/succession/levée barrière/S3 HOLD et hors livraison. Aucun runner rouvert.

## Exemples

La source fournit fille non scellée, types/records host et coupes conditionnelles,
ainsi que nominal famille sans outbox, doublon, CAS/source/case révoqués, rollback,
réserve avant/après, continuation/absente, workCuts et refus bootstrap/B/native.
Octroi absent/révoqué, bootstrap+1/nouveau+1/retry0/rollback0/épuisement sont explicites.
Présence des documents seule ne prouve pas autorité/actualité ; aucun run autorisé.
