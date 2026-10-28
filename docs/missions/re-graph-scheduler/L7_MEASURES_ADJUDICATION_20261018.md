# L7 mesures — lecture bornée du DTO capturé

Adjudication fresh GLM/max,7/7pins125050B exacts au début/fin,aucun run3.
DTO SHA37d558d8… déjà capturé le17/10 ; premier run exit0 mais capture perdue
par bug du script parent,receipt porte run2. Aucun gain natif/produit déduit.

- Walltime driver observé245.2087ms/90000ms,receiptprocess274ms distinct.
- RSSprocess43569152–82870272B,heapafter1042344–12901143B,120snapshots nonnuls.
  Pas mémoire pic/retained de profiler ni mémoire produit/native.
- 8cas=2tailles1000/10000×4seeds(0,1,12648430,4294967295),3bras24replays,
  chacun1warmup+5mesurés:24warmups/120reps. Timings0.0611–3.0392ms mesurés.
- Completions toutesN; makespan1k3833–4042 et10k38530–39073 sont TICKS
  SYNTHÉTIQUES déterministes, jamais durées réelles ou gains de politique produit.
- Les3bras ne varient que l'ordre;24/24hashes FNV32 noncrypto égaux avant/après,
  compteurs identiques warmup+mesurés. Cela n'est pas une preuve crypto/native.
- Edges2890/28915:8/8tripleégalité dérivé/généré/ancre, rôle analytique
  cross-check-only-not-observation, jamais une mesure machine.
- CPU/profilagepic/infosmachine absents du DTO et non inférés. CaptureSHA
  disponible au niveau parent, malgré absence de ces métadonnées dans le DTO.
-100k exclu,aucun argv/env/flag pour le réactiver;baseline native/produit NOT_RUN.

Sources: `.tmp/mission-v2-20261018-continuous/l7-measures-adjudication/inputs/`:
run-capture.txt JSONpaths budget,replays,cases,invariants,unavailableMeasurements;
measures-driver.ts:285,469,552,647,673,803,838-842,973-989,1016-1020,1085-1094;
PARENT_RUN_RECEIPT.json. Rapport source recevable, pas acceptance globale L7/L8,
science,battle,FF8,L9/L10. Parent conserve les faits et leurs limites.
