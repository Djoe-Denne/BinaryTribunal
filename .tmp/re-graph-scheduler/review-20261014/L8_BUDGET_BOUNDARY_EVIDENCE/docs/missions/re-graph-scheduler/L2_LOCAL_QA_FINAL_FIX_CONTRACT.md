# L2 — rapport QA final et contrat de correction Max

2026-10-14. Task QA `task_mv80a96u_003t_7t7cbp`, session fraîche Sol Max
`ses_ec5e6c9f0ffexTRNcZ4CoD8MH0`. Verdict final **BLOQUANT**. Gel L2
`b881a7f00d311709cbbdf94b8ed75fc4630d034086f1420344831dbad0b465f0`,
32/32 empreintes inchangées avant/après. Les anciens rapports/probes restent
conservés ; voir `L2_LOCAL_QA_PARENT_COUNTEREXAMPLES.md` pour les six défauts
RV2MAX et les deux reproductions du parent.

## Sept contre-exemples QA finale

- **NQA-01 P1** : graph-normalize.ts:76–90,130–131. Doublon même arête/sites,
  seconde déclaration schemaVersion99 + extra : ordre good/bad blanchi, inverse
  refusé. Valider toutes les déclarations avant fusion ; conserver ingestion
  brute >64 sites, sortie transport plafonnée à64.
- **NQA-02 P1** : capabilities.ts:80–85,208. Snapshot node.schemaVersion99
  rehashé refusé par validator/cached mais public evaluateCapabilities produit
  un fact. Même guard de contrat sur toutes les entrées publiques.
- **NQA-03 P1** : capabilities.ts:149–155,179–182 ; graph.ts:513–526. Même
  relation active + shard invalidated/retired contradictoire : helper rejette,
  les deux APIs capacités filtrent d'abord et produisent un fact. Concilier
  tous les shards avant tout filtre, aussi pour propagation.
- **NQA-04 P1** : graph.ts:401–407. Fixture chunks/tails, site tail_jump
  C208→C108, provenance adaptée et rehash : site dans le callee, hors chunks
  caller C000–C040/C200–C240, admis. Lier sites instruction/code au caller
  quand bornes connues, distinguer DATA/tables et imports purs. QA a vérifié
  44 534 sites instruction stockés sans exception hors chunks ; pas extraction.
- **NQA-05 P2** : graph.ts:315–328,487–490. extractorHash='z'×64, provenance
  d'artefact d'un autre module, knowledgeRevision=-0 admis/cacheables. Sha256
  hex minuscule64, artifact module binding et nombres canoniques obligatoires.
- **NQA-06 P2** : graph-normalize.ts:80–83,103–109,723–726. Repacking64 en
  deux records32 generated IDs, inversion change ID/fingerprint malgré union
  identique ;65/129 stables. Deux declarations indirectes closed_static mêmes
  terminal D000/noms alpha,beta inversées changent node.name/fingerprint. Pas
  first-wins : identité issue de l'union canonique ; attributs incompatibles
  diagnostic fail-closed ou règle canonique explicitement approuvée.
- **NQA-07 P2** : graph-normalize.ts:366–380,417–424,458–486. Citation PE
  0x460860, frozen hash réel710c0af8… vs pe hash='b'×64, count0 et boolean
  historique true : concordant avec hashes effacés/null. Rejeter contradiction
  locale ; des identifiants cohérents ne constituent toujours pas accord des
  octets PE. L'ancien RV2MAX-03 (octet gel changé, hashes internes recomputés,
  ancien boolean PE conservé) reste exigence distincte.

## Décisions parent imposées à L2-FIX-MAX

1. Task existante `task_mv80pik5_004b_c0kha5`, auteur source Sol **high** natif
   confirmé ; nouveau correcteur Sol **max**, own4 seulement graph.ts,
   graph-normalize.ts, capabilities.ts, graph-extract.test.ts. Gel initial intact.
2. Union des exigences NQA01–07 et RV2MAX01–06, pas seulement des deux probes
   parent. Vérifier versions magic/inventaire indirect et comptes/classifications
   des493sites ; checksum seul n'établit pas ces invariants.
3. Chronologie locale : révisions entières sûres, >=0, sans -0 ; apparition
   <= révision snapshot, retrait >= apparition connue, retrait <= snapshot.
   Valeurs absentes restent absentes ; aucune migration implicite des historiques.
   Une API de futur retrait programmé demanderait un contrat distinct : ne pas
   inférer cette sémantique des champs du snapshot historique v1.
4. Une positive byteAgreement exige preuve liée aux octets exacts, chunk coverage
   et source/root attendus ; boolean historique + hash auto-recalculé insuffisant.
   Si ces preuves ne sont pas disponibles offline, exporter unknown avec diagnostic
   plutôt que fabriquer concordant ; conserver divergences quatreEA en quarantaine.
5. Le transport strict L1 ne change pas. Guard brut interne à forme/version/proofs
   strictes sauf taille collection de sites non bornée avant sharding autorisé.
   Plan approuvé : id=="" peut rester le sentinel **interne déjà existant** de
   génération, pas idundefined/type invalide ; sortie L1 idnonvide obligatoire.
   Nouvelle API publique ou mécanisme d'autorité : proposition au parent avantwrite.
6. Les sources stockées, fixtures, manifests et contrôles positifs doivent rester
   intacts. Pas config/L1/central/registre/Git/IDA/live/install/newdeps. Rapporter
   typecheck/tests focused/full, hashes source et dépendances, décision/probe pour
   chaque défaut ; nouvelle revue fraîche puis gates parent avant acceptation.

Plan writer approuvé par parent. Dépendances locales préparées sans installation :
node_modules junction READONLY vers main, package/lock byte-identiques ; raw98 et
TRANSFER_MANIFEST **original** depuis l2-graph-r3, SHA manifest
`79790bef2ea8c38d64ab8e18c4578e1b8593958aa689da88c2466063c5b177d5`.
98/98size/hash contrôlés contre manifeste original ET les sources stockées main.
Aucun manifeste d'autorité fabriqué, aucune extraction/revalidation native.

## Portée des contrôles positifs QA

22 fixtures acceptées/4 refusées ; schéma strict180keywords/rules comparé à oracle
indépendant sur3000 mutations seed13716466 +17cas ciblés ; relations/provenance
multi-module, propagation0/1/3 et caches clones/invalidation exercés. 98 JSON bruts
hashés contre run01 ; adaptation7582nodes/30620records/105objects/509unresolved
valide mais reste PARTIAL/selfLoopsPreserved=false/oraclefalse. Aucun PASS native,
aucune promotion scientifique/L8/G4/G6/G7 et aucun test auteur complet inféré.
