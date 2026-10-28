# L4 — revue bloquante et correction autorisée

Mission `re-graph-scheduler-20261013`, 2026-10-13. **NON ACCEPTÉ avant corrections + re-review.**

Rapport indépendant récupéré via API publique de la session possédée `ses_ec9813eb4ffe2OAUOiUNTF9p4l`, appel `team_message(to:lead)` dans message `msg_1368779e7001NG6JjPPCxXboja` ; aucune lecture DB/raisonnement interne. Reviewer a vérifié les trois SHA initiales avant/après, aucune édition, tests19 verts ne couvrant pas les attaques. Sources initiales checkpointées parent **d15a642**, branche L4 uniquement, non intégrée main.

## Défauts et décisions parent

- **P1 cannot-link** : semantic-index716–795/429 : unions DATA/lexical/must/structure peuvent laisser endpoints cannot dans même communauté et déclarer satisfied/PASS. Vérification finale toutes vues, réparation explicite ou diagnostic fail-closed/adoptedfalse ; oracle sur communauté rendue.
- **P1 NaN embeddings** :630–652/881–891/403 : vecteur NaN longueur1 accepté, ready/multiview/fusion. Finite/nonzero/dimension/cosine/cache/exceptions à valider ; copies défensives. Désaccord top1 vs lexical **n'est pas un gain qualité** ; metric renommer, measuredGain null sans oracle indépendant. Adapter déclaré trusted-local ne prouve pas automatiquement implémentation/tokenizer réellement gelés.
- **P1 delta** : lineage139–157/464 : schemaVersion99, revisions négatives, preuves malformed rehash admis ; unvalidated aussi admis pour progression. Validation stricte schéma v1 puis invariants/trust ; distinguer forme transport de delta scientifique admissible.
- **P2 shards** :354–370/412 : même relation en8shards gonfle degrés/deps/hubs. Canonical relation+union preuves avant comptages et multivue, tests64/65/512.
- **P2 modularité** :905–931 reconstruit partition et donne Q.5 sur1edge/1community au lieu0 ; calculer sur partition rendue avec oracle indépendant, hubs/contraintes compris.
- **P2 comparison** : lineage211–243 omet kernel/context/coverage/coût. Deltas sidecar/stabilité scientifique distincte de membership/contentId.
- **P2 hiérarchie** :657–686 cross-module produit module fictif et références pendantes/IDs tronqués12hex. IDs fullhash, module≠subsystem, intégrité/reload toute référence.
- **Gate adoption** : état seul MIGRATABLE ne prouve pas quiescence/release. Ajouter preuve autoritative liée unité/snapshot/tentatives/claims ; absence de preuve/refus/workerStillExecutable/leaseHeld → pas de migration, y compris READY/BLOCKED. Préserver contexte d'exécution dans clones ; L8 vérifiera réel L6.
- **P2 Known rationnel** : assignCommunityLineage accepte conductance.5 invalide schéma entier. Unknown dans document, rationnels sidecar lossless ou refus explicite, pas arrondi inventé.
- **Performance/lineage** : remplacer edges.find/nodes.find/rescansE par index ; benchmark pipeline entier1k/10k avec E/degrés/SCC, pas seulement lexical. Version algorithmVersion/ties précédents stables. Fusion≥3 : diagnostic non-adopté et liste complète sidecar, pas troncature silencieuse, aucun changement L1 implicite.

Task **L4-FIX `task_mv71p2r6_004h_rfvlmr`**, auteur L4 existant sur propre contexte/GrokHigh/worktree, mêmes trois fichiers own. Reviewer arrêté avant reprise, typecheck/gates/nouvelles empreintes/re-review requis ; aucun central/schema/package/config/IDA/Git worker.
