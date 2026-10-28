# Fixture83 — INITIAL + T1 (non exécuté)

Sources : DRAIN18–68/128–162/296–337, EXECUTION_ENVELOPE223–249, QA_MATRIX132–161.
S1 : PreparationObservationT0146–154, CandidateRef/DrainEntry/GenerationHead227–259.
Types publics inchangés. transition-fixtures.ts contient formes privées/attentes,
pas seal/binding/autorité native/run. Produit82/DB82 intacts.

## Bloquant : borne préparation MANQUANTE

DRAIN31–44 exige que les stages/préparations consomment des compteurs root bornés,
conservés après restart/remplacement. Les seules bornes identifiées sont
activationPolicy.maxActivationAttempts/maxCandidateReplacements (S1:171/1230–1250,
EXECUTION_ENVELOPE216–221 ; fixture auteur213 : 2/1). Elles ne définissent PAS
maxPreparedOrigins ni comment une préparation initiale consomme un plafond.
Ni 2, ni 1, ni 1+replacement ne sont une autorisation de préparation.

Policy/counter préparation restent UNKNOWN/null.
**prepareInitial = HOLD AVANT origine/pointeur/compteur/event ; T1 sans cette
préparation durable = HOLD.** Fermer explicitement source/plafond/unité/provenance
et compteur existant root avant code consommateur. Proposition à ratifier : une
origine durable nouvelle consomme une unité de préparation, zéro remplacement et
zéro ActivationAttempt ; retry exact zéro. Aucun budget C/N/T physique/logique
recrédité ou relevé. Les exemples de succès ci-dessous sont CONDITIONNELS à cette
fermeture, aucun booléen ne contourne le HOLD.

## Préparation et attente T1, sans réécrire T0

Nouvelle fille avant seal à partir du parent A réellement retenu : même mission/
lineage/root et sources root/activationPolicy byte-exacts, ordinal+1, parentId exact.
Sources scientifiques conservées ; mission/knowledge différents de T0=>HOLD,
pas update du candidat. Host fournit T0/provenance retenus indépendamment,
pas demande selfhashée. Refs envelope/run/candidat après qualification future.

Choix local de projection (à ratifier avec ces inputs) : avant préparation (h,c,q),
après préparation (h,c+1,q+1). Le CAS initial exige pointeur candidat NULL ; insérer
origine PREPARED + run + T0 + record pré/post + pointeur candidat et event ensemble.
Le head.revision actif reste h ; candidateRevision avance pour ce changement de
contrôle. Toutes écritures concurrentes comparent aussi candidateRevision/pointeur/
barrière, pas seulement h. SourceMission/activePlan/knowledge/inventory et ledger
L5/pool ne changent pas. Compteur préparation distinct sous la borne manquante.

Ce choix conserve T0.headRevision=h et observedEventSequence=q : aucune réécriture.
Le record privé de préparation lie son postimage déterministe (h,c+1,q+1).
T1 compare les attentes T0 pertinentes ET cet exact postimage, pas une lecture
rafraîchie. Son unique event préparatoire explique q→q+1 ; autre mouvement exige
nouvelle préparation autorisée, pas tolérance arbitraire. DRAIN302–309 impose CAS
T0 sans nouveau head d'activation ;327–337 réserve h→h+1 à T1. Aucun texte lu
n'impose h→h+1 aussi à T0. Si un autre contrat exige cet incrément, STOP/arbitrage
avec citation avant code, ne pas bricoler T0. Doublon préparation relit ses refs
sans nouveau compteur/event ; candidat différent quand pointeur occupé refuse.

## Autorité/cuts privés

resolveTransitionA(caseRecordRef) : handle purpose=request-drain DISTINCT du
bootstrap/controller, lié par registre privé à l'objet DB/connexion, issuer/case
revision, candidat/parent A/préimage-postimage/T0/sourceRefs/owner/controllerFence.
Les IDs de connexion JSON ne prouvent rien. Relire records/sources/révocations
indépendants au consommateur ; cohash/authorizationKind/ref caller seuls refusés.
Case T1 ne peut servir à T2. B/public/native et recyclage bootstrap => HOLD.

EngagedFamilies et InventoryAtCut sont BoundDocument fermés, triés par tuples/
slotKey/executionId/poolId. Ils incluent TOUTES réservations actives, même sans
outbox, lease/fences, origin/run/plan/unit refs, slots A/B/R engagés/dépensés/brûlés,
images/pins/outboxes/claims et refs observations/Q/sourcecaps existantes. Leur
enumerationRef provient du host et est revérifiée contre les collections OWN
complètes au même cut ; COMPLETE caller ne suffit pas. UNKNOWN/null => HOLD,
jamais []. Absence de Q dans un set complet de records n'est PAS preuve Q.
Physique = copie/ref de la projection ledger82 auditée, acquisition/current/cuts
exacts ; pas autre calcul de remaining, pas inventaire parallèle auto-authentifié.
Inventaire local T1 n'est pas inventaire final publications/readback/S3 ni drain fini.

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
Leur attente effective demeure HOLD préparation tant que sa borne manque.
