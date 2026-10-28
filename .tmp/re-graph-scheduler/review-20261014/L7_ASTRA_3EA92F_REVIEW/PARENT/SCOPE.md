# L7 Astra 3ea92f — nouvelle review indépendante avant intégration

Nouvelle source92 418B/SHA3ea92f5a7750dd278a8b496caf066153efbe0940b33761d8e9ad0cd97db8a031,
testG2 a1416c25…b4d130 et README9833a46a…294d0c, trois paths seulement après ac82.
Auteur Astra max task task_mv9m9894_0015_cjacy0 livré/fermé, sources uncommitted
conservées, pas merge ni intégration. Nouveau reviewer fresh Sol max distinct de
tous auteurs/reviewers terminés ; **indépendant non aveugle**, pas reprise d'un
ancien contexte. Anciennes analyses ne valent pas preuve du nouveau candidat.

Parent vérifie3sources/12preuves/447inputs/328readonlyROOT/raw99/54anciens tests,
10DBfixtures2 936 832B conservées. Auteur76focused/928full1SKIP ne sont pas une
acceptation. Son L5 est OLD377 ; le paquet de review utilise le **L5 accepté985**
et les dépendances du main actuel, avec overlay explicite simulateur non accepté.
OLD contient du code ac82 pour diff seulement, pas ses dépendances exécutables.
Rapport/gates auteur et vieilles reviews non transférés comme oracle.

## Portée complète mais bornée au module et à son delta

Lire PARENT/ASTRA_PLAN.md, RECEIPT_POLICY.md, BINDING_DECISION.md. Ils définissent
des choix parent, pas verdict. Vérifier le vrai source et produire propres probes,
pas recopier les helpers/oracles/tests auteur ou prendre leurs compteurs pour preuve.

- G2 worklist : un waiter reparké K2 restitue l'opportunité K1 ; tickets ne sont
  pas holdings. Permuter ordre hashedkeys/FIFO/arrivées/annulation/STALE/pause/
  capacité indisponible ; pas perte de réveil, double enqueue, infinite spin ou
  libération prématurée. Pas fermeture transitive ; ancien holder reste opposable.
- Multiholders internes famille/attempt/token/external index immuables : new_conflict
  conserve tous détenteurs réellement actifs/réservés jusqu'à vrai done/stop,
  fencing/expiry/STALE non libératoires ; stop partiel,3holders,oldcallbacks/retry,
  mêmes familyId externes/claims qui se chevauchent comme inventaire incohérent
  **diagnostiqué et bloquant**, jamais une autorisation de ressources incompatibles.
- Receipts : vrai ordre de force/niveau>= du L5 sur domaine cohérent, hashes/rev/
  producteur/null/readback/effect exacts. **Divergence explicite exigée** pour
  receipt niveau2/fixture-only : L5 ancien/nouveau true mais SIM refuse avant
  satisfaction, aucun relabel/faux receipt. Gap upstream OPEN, pas fermé par le SIM.
- Binding requirements strict pour external_satisfied et branche unresolved ;
  obligation locale altérée reste non satisfaite au runtime, producteur indépendant
  avance sans exception globale. Les54 assertions existantes restent byte-exactes,
  pas de besoin inventé ou substitué pour blanchir un mismatch.
- Unresolved : vrai record kind **indirect_call** sans relation d'appel indexée,
  pas «DATA» comme certains raccourcis historiques parent le disaient. Provenance
  exported-unresolved-prerequisite version1 liée à l'export/consumer/unité/snapshot,
  pas raw id reconstruit. Citation retirée d'une vraie relation, ID/type/consumer/
  requirement/receipt/provenance/FP altérés restent refusés. Hash cohérent n'est
  qu'une copie liée au record fourni, jamais authenticité native/scientifique.
- observe : SimObservation versionnée, profondément détachée/gelée sans store live
  ni aliases. Intervalles closed+open additifs au frontier traité, changement de
  raison/annulation/fin/occupation tardive exacts ; snapshots répétés/intercalés
  ne changent ni état, compteurs fermés, décisions/traces futures ni ancien DTO.
- Regressions transverses : ressources v2/unknown/empty/accountquota restent
  conservatrices≠packing famille L5, sans downgrade v2→v1 ; attribution attempt/
  token/worker et vrai DAG local+G1/minorants/makespan/rework inchangés. K×W et
  coût de scans/worklist/holders honnêtes, pas near-linear100k universel.

Faire des scénarios réels petits normalizer→L5 avant la boucle SIM ; aucun appel
planner/clustering/LLM dans la boucle. Une petite probe **nouveau mode allocation
L5 accepté** vérifie que conversion/binding ne blanchissent pas des exports ni ne
revendiquent N durable host. Les CLI/régimeB/L8 runtime ne sont pas dans ce lot.

## Gates, preuves et interdits

Typecheck puis cinq fichiers : simulator.test.ts,simulator-corrective.test.ts,
simulator-g2-review-regressions.test.ts sous test/simulator ; benchmarks.test.ts,
simulator-corrective.test.ts sous test/benchmarks.76 attendus, pas auto-acceptés.
Bench10k/K16–64 existants, pas100k/full imposé. Puis petites probes propres bornées
en mémoire. Les données parent des cinq contre-exemples peuvent guider les inputs,
pas fournir l'oracle. Versions OLD/current et comportements permis explicités.

Pas DB SQLite/création/privée/Ensemble/IDA/live/dispatch réel/réseau/LLM/Git/install,
sous-agent/inbox/team_results ou suppression. Pas modification source/test/projet.
Preuves de probes dans dossier explicitement fourni seulement. Déps préinstallées
readonly dans le module. Ledger9MB absent : pas full/native QA global revendiqués.
Source/paquet hashés avant/après, rendre ACCEPTABLE/BLOCK scoped, path:line/repros
propres, codes/comptes/limites. Parent seul intégrera après ses gates.
L5 receipt upstream, N durable L8, post-L8/L9/L10 et unique SKIP réel restent ouverts.
