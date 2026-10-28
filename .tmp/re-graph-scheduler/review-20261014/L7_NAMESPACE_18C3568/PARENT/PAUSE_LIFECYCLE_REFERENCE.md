# L7 — plan ciblé ratifié avec frontières pause/lifecycle

Même task task_mv9si4oj_003p_veyhvi, fresh Astra max
ses_ebf78f8d5ffedb0W7RDtlrlmOR, exception utilisateur c94d1e3.
Plan reçu, trois familles re-dérivées et contrôles contraires conservés.
**Plan ratifié sous les conditions ci-dessous**, après lecture/hash/ACK puis
message final parent avant écriture. Pas acceptation du futur code.

## Deux paths uniquement

OWN/tools/ff8-harness/src/simulator.ts ; nouveau
test/simulator/simulator-final-review-regressions.test.ts. Preuves sous
OWN/.tmp/l7-final-fix-20261015/. Pas README/publicDTO/schema modifiés. Les76
contrôles, autres11runtime, helpers/oracles/benchmarks, inputs382, anciens gels,
L5accepté985 et tout L1–L6/L8/Store/config restent readonly. Nouvelle nécessité
hors ces paths → parent avant extension. Garder le source3ea dans le gel input.

## Besoin original et lifecycle

Ratifié : si l'evidence exportée connaît un requirement original pour cet ID,
exiger besoin déclaré présent et canonically exact, puis vérifier l'artefact
effectivement produit. Lookup own-only, pas héritage fournissant un faux besoin.
Retourner non-satisfaction locale, sans throw global arrêtant le producteur et
sans utiliser l'original comme besoin de remplacement. En absence **réelle** de
besoin original manuel, conserver le fallback niveau-seul historique ; un besoin
déclaré reste contrôlé. Binding external/unresolved/receipt guards inchangés.

Gardes ciblées ratifiées : start seulement cycle pré-admission PENDING/BLOCKED/
RETRYABLE ; wait seulement cause légale dans la phase courante ; place sur famille
active non fenced ; réévaluation du consommateur au commit seulement dans le cycle
pré-admission. Parent a vérifié aussi le callback producteur : hashneed altéré et
cancel/invalidate Cà0 font actuellement CANCELLED/STALE→BLOCKED à3, tandis que le
contrôle besoin intact garde l'état. Cela appartient au même invariant lifecycle.

**Pas de garde terminale générique devant tout process(event)** : done/stop/
releaseJob doivent toujours traiter l'occupation réelle encore vivante. Pas reset
de tokens/retry/claim/releases/historique ; annulationà1 garde1tick fermé, à0garde0.
Un ancien callback ne ressuscite jamais un consommateur terminal/fenced.

## Priorités de pause ratifiées, métriques et scheduling séparés

Un seul waitReason/unité/[début,fin), occupation des jobs séparée :
- dépendance non satisfaite en PENDING/BLOCKED/RETRYABLE → dependency ;
- VALIDATING active → validation continue, pas paused ;
- READY → paused pendant l'union des pauses, priorité temporaire sur ses causes
  d'admission resource/quota/barrier/conflict, y compris hors ready-heap ;
- RESERVED/RUNNING → paused uniquement avec tâche DAG-ready réellement admissible
  selon rolesParallel (en séquentiel, aucun job actif). Jobs seuls/prédécesseurs/
  response_lost sans admission admissible : pas paused ;
- fenced/non-dispatchable/terminal → aucun nouveau wait.

Reclassifier aux frontières **effectives** de l'union et aux transitions pertinentes,
pas dans observe/finalize. Le paused() courant teste déjà l'union par les incidents :
conserver cette sémantique. Pauses contiguës/overlap et plusieurs événements au même
tick ne créent aucune micro-fenêtre de dispatch, double pause ou fin prématurée.

Sauvegarder/restaurer l'ancienne cause d'admission seulement si encore légale dans
la phase courante ; un nouveau READY peut revenir en resource puis être requalifié
au même tick. Ne pas ressusciter une cause stale après terminal/validation/fencing.
**La raison métrique n'est ni waitingKey ni wakeTicket/holding** : park/unpark,
ordre FIFO/multiclé, readyCount/queueVersion et tickets restent dans les mécanismes
existants. Aucune réservation/libération comme effet de classification. À la
reprise, les candidats légalement réveillés doivent effectivement rejoindre la
réévaluation existante : tester libération de clé/capacité/barrière pendant pause,
consommateur prêt pendant pause, repark K1→K2 et absence de ressource au retour.

Scan O(V) par frontière effective accepté, pas par tick/observation ; calculer le
booléen d'union une fois par scan, documenter aussi coût du prédicat sur Ppauses et
scans de transitions. Pas promesse near-linear universelle. Commentaires/rapport
peuvent qualifier ce coût sans changer publicDTO ; si README devient faux, escalader.

## Tests puis gates

GO RED autorisable avant source delta : nouveau fichier seulement contre3ea encore
exact, log/code avec FAIL attendus qualifiés, pas «PASS» inventé. Puis correctif,
typecheck, cinq fichiers historiques76 attendus **inchangés** +nouveaux tests et
repros indépendants. Cas qabsent/hash/champs/manuels, cinq manifestations +callback,
phases/causes, pauses union/à0/exactbounds/observations et occupations tardives,
conflits/quota/ressources/barrières, stale callbacks et ordre permuté ; oracles
d'intervalles explicites, pas algorithme/source employé comme oracle.

Attentes de contrôle : RUNNING pause[2,3) et jobs seuls → paused0 à6, occupation12 ;
VALIDATING démarréeà2 → validation4 à6, paused0 ; contrôles READY réellement retenus
comptent la vraie union. Garder G2/ressourcesv2conservatrices/DAG/CP/attribution,
receipts et provenance, DTO détaché et replay. Rapport readonly pins avant/après.

Après focused/typecheck verts : gel intermédiaire puis **réservation/GO full
distinct**, aucune DB/full avant cette autorisation. Tous artefacts conservés,
codes/comptes/SHA réels ; fresh review indépendante et gates parent après livraison.
Pas Git/install/réseau/LLM/dispatch réel/IDA/live/DB privée/sous-agent/inbox/delete.
L8écriture bornée continue indépendamment, pas de B/simCLI ou science/native déduit.
