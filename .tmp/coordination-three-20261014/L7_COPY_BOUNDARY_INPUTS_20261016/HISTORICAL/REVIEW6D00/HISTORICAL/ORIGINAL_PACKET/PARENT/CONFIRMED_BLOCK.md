# L7 494b — deux P1 confirmés parent, nouvelle correction en WAIT utilisateur

Source494b8bf87fa7a5e4b3c66058869d12be765a066c8ca9882d8a6ad12d2006fcde,
**NON acceptée/NON intégrée**, absente du main. Fresh review Sol/max
task_mv9vavch_004k_uyj4yg/session ses_ebf3163b0ffeRcsdSbmtNohYLe : **BLOCK**,
travail terminé puis fermé, pas ancien contexte repris. L'exception utilisateur
c94d1e3 a bien permis une nouvelle sourceAstraMax et cette review ; elle n'autorise
pas silencieusement un correcteur supplémentaire après ce BLOCK.

## P1 RV494B-REQ-NS — besoin original contourné par namespace cohérent

simulator.ts:192–206,823–829. Parent repart de son vrai snapshot valide et L5accepté985,
pas des helpers/oracles auteur. Contrôle suppression requirement seul : Pcommité3,
C BLOCKED, conforme au correctif. Puis renommer C en C:parent-alias, recomposer
preID depuis relationId/consumer, recopier ce namespace dans source.prerequisites,
g1/selection/decisions/conflicts et retirer le requirement déclaré.

**Archive prerequisiteEvidence, requirementById/unitFingerprints, fingerprint et
source.planFingerprint restent inchangés**. Ancien besoin toujours OWN dans l'index,
nouvel ID absent. Résultat parent validateSimPlan=[] puis P3/**C-aliasCOMMITTED6**.
Le namespace de copie mutable n'est pas joint à l'archive, donc le nouveau lookup
active le fallback niveau-seul réservé au vrai manuel sans besoin original.
Incohérence détectable sans prétendre qu'un self-hash prouve l'authenticité native.
L'absence simple et les anciens contrôles passent, mais la réparation est incomplète.

## P1 RV494B-RETRY-STALE — retry réautorise une invalidation exigeant un nouveau plan

simulator.ts:894–905,934–940. Deux unités indépendantes initiales A/B, quatreworkers,
A={5,5,2},B={20,20,1},validation1,révision1. new_dependency A→B à1, arrêt réellement
modélisé confirmé à2/retrytrue : **Aattempt2 COMMITTED10 avant B22**, même plan,
manifest/contexte non remplacés. invalidate_knowledge etnew_scc reproduisent aussiA10.

Contraires parent : new_dependency+retryfalse → A CANCELLED/B22seul ; cancel ordinaire
à1+stop/retry2 → A10légal. Il faut donc distinguer autorisation de retry d'une
invalidation permanente nécessitant nouveau contexte ; stop confirmé libère des
ressources, pas une preuve de fraîcheur du plan. Pas reset générique de tous retries.
Parent compare les méthodes incident/fence/tryReserve à OLD3ea : **texte inchangé**,
jamais exécutéOLD. Défaut préexistant, pas régression attribuée au delta494b/L5budget.

## Recevabilité, preuves et limites

Reviewer typecheck0/100PASS13 606assertions et propres probes bornées (phase/union,
namespace/pipeline, G2pause, stale-retry dont vrai L5opt-in). Ses deux setups erronés
sont qualifiés, ni défauts ni PASS artificiels. Le rôlePlan n'a ajouté aucun fichier
de preuve : parent récupère via API **4rapports explicites+32inputs de tools publics**,
pas reasoning privé, puis écrit/exécute **ses propres repros EXIT0** des deux P1.
Model.Ref reviewer Sol/max relu,377pins exacts après review et après repro parent.

Fichiers .tmp/coordination-three-20261014/l7-final-review-public-reports.json et
l7-final-two-p1-parent-repros.json/script/log. Graph/plan/scénarios/contraires et
traces conservés. Parent pipeline confirme le namespace ; parent stale-retry est
manuel, le cas vrai L5opt-in supplémentaire reste preuve du reviewer, pas prétendu
rejoué par le parent. Pas DB/submit/worker/provider/IDA/live/native/science.
Gates100 etfull1030+1SKIP restent vraies, insuffisantes pour accepter ces invariants.

Bootstrap nonblind qualifié précédemment conservé, ni zéro exposition inventé ni
verdict auteur/ancien reviewer utilisé comme oracle. Tous OLD/gels/proofs/sources
restent intacts. L5accepté613218f n'est pas annulé par ces défauts du simulateur.

## WAIT choix explicite utilisateur, aucune admission corrective actuelle

Source déjàAstraMax après exception ciblée : pas fallback moins cher, reset/reprise
d'auteur/reviewer completed, nouvelle feature rebaptisée ou achat implicite.
Choix à demander : **nouvelle session fresh AstraMax cadrée sur liaison complète
du namespace archivé et invalidation/retry monotone**, repro/plan avant code,
100contrôles préservés, reviewfresh et gates parent ; ou maintenir le simulateur
gelé et poursuivre L8/gates indépendantes.

Si accord, proposer périmètre sourceSim +nouveau fichier de régressions, README/DTO
seulement si nécessité ratifiée ; pas L1–L6/L8/Store/config/anciens tests modifiés.
Pas besoin original substitué, alias blanchi, suppression de métriques/historique,
réautorisation par arrêt seul ou occupation libérée sur un simple état. Le plan
doit couvrir les classes d'invariants, pas seulement les deux chaînes du repro.

L8 poursuit son full distinct explicitement autorisé ; aucun abort des indépendants.
L7 ne sera pas câblé dans L8/simulationCLI/B sur ce BLOCK. Gapreceiptupstream,
post-L8/L9/L10 et SKIP natif restent ouverts. Question interrompue ≠ accord.
