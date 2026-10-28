# L8 — ancre durable CycleRecord.graph

2026-10-15, réponse parent à l'escalade du propriétaire L8, même tâche et tranche A.
**Proposition additive approuvée sous les conditions ci-dessous**, aucun changement
de Store, schéma L1, MissionConfig ou permission d'exécution réelle.

## Champ exact autorisé dans domain.ts

CycleRecord reçoit un champ optionnel `graph` :
`{version:'l8-frozen-cycle-v1', runFingerprint, preparedFingerprint, planFingerprint,
snapshotId, partitionId, knowledgeRevision}`. Les empreintes sont de vraies SHA256
canoniques ; IDs et revision respectent les bornes existantes et correspondent
exactement au GraphRun/prepared/plan/snapshot persistés et à mission/cycle.

Ce marqueur route/interdit des chemins d'exécution ; il n'est **jamais** autorité
scientifique, attestation parent, preuve de quiescence ou simple auto-certification.
Les APIs nouvelles restent dans les fichiers L8 déjà approuvés.

## Lecture et protection legacy

Parent a relu Store.load/commit et Engine.begin/tick/pause/resume : Store recharge
le snapshot, CAS la révision et protège tout cycle frozen par égalité canonique.
Engine.begin renouvelle la lease avant tick. La garde doit donc précéder aussi
l'attach/acquisition/renouvellement legacy, pas seulement le switch de tick.

- Snapshot durable frais via Store public, pas un cache ou une variable en mémoire.
- Tout champ graph **présent** (y compris null/malformé/version inconnue) interdit
  l'entrée legacy attach/tick/pause/resume avant lease/control/client I/O. Ne pas
  utiliser sa truthiness pour laisser un marker invalide devenir du legacy.
- Le chemin graph explicite vérifie strictement forme/version/binding complet et
  refuse marker orphelin ou incompatible. Aucun contournement public allowGraph
  ouvrant ensuite le dispatch legacy. Pas d'ouverture GraphStore sur un simple
  chemin legacy pour rechercher un marqueur, pas de SQL privé.
- Les anciens snapshots sans champ restent inchangés et legacy-compatible.
  Ne jamais ajouter/retirer ce champ à un cycle **déjà frozen**, ni migrer une
  campagne historique ou remplacer un plan actif implicitement.

## Ordre, crash et concurrence

Un journal de préparation peut précéder l'unique Store.commit du cycle ancré, mais
avant ce commit seul du **préparatoire non activant** est autorisé : aucune admission,
claim/lease d'unité ou substitution de plan actif. À l'entrée graph, vérifier les
états legacy réels : actif, outbox/control pending ou ambigu → refus, pas de booléen
de quiescence fourni par le caller. Capture/CAS et fences empêchent un ancien
contrôleur de soumettre sur un snapshot antérieur à l'ancre.

Après le commit ancré, seulement la projection du plan d'origine peut être terminée
idempotemment puis réservée/admissible via les APIs acceptées. Crash avant/après
chaque côté : recharger les bytes/fingerprints/temps d'événement d'origine, jamais
replanifier, régénérer les IDs ou modifier un payload pour fabriquer un retry.
Orphelin purement préparatoire + révision legacy changée = conflit fail-closed,
pas conversion automatique. Réponse Store perdue = relire l'ancre/projection exacte,
pas ajouter un deuxième cycle. Deux contrôleurs : un seul ancrage/admission légaux.

Tests requis : reopen legacy sur cycle graph (zéro renouvellement/contrôle/submit),
marker null/extra/malformed/unknown version, anchor/prepared/plan mismatch, ancien
snapshot non marqué inchangé, crash entre journal/ancre/projection, commit perdu,
concurrence/révision stale, anciens intents/outbox non quiescents et immutabilité.

Si cette frontière n'est pas réalisable avec les APIs readonly, escalader avant
extension, aucun cast/SQL/migration de convenance. Tranche B et simulateur historique
restent derrière leurs GO séparés. Les premières gates pipeline auteur ne sont
pas une acceptation du code ni une preuve native.
