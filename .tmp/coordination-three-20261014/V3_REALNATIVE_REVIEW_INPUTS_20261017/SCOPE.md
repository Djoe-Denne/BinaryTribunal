# Review ciblée RealNative — implémentation Win32 réelle vs plan approuvé

Fresh reviewer indépendant, disjoint de v3-realnative-r1 et de tous les
auteurs/reviewers V3. NONBLIND déclaré. Objet : les 4 livrables gelés de
V3_REALNATIVE_OUTPUT_20261017 (RealNative.cs e58eef0c/15934B, RunnerReal.cs
8e8bb623/20530B, DESIGN.md 0cf2057a/13435B, MANIFEST.json 06a1b8bf/4065B) contre
le PLAN approuvé + arbitrages (PARENT/REALNATIVE_PLAN.md) et le noyau gelé
re-hashé parent 6/6 (GuardianCore 7d4d2c66, ABI1 bb4758cc, KernelObserver
a419fc42, HostLauncher 1cc9cca0, WriterLedger 67e9b21c, BudgetedEvidence
0944a3bb).

Vérifier (minimum) :

- Les 14 membres : chaque implémentation conforme à la décision du plan ET à la
  consommation noyau source:ligne citée (PointerBytes/LayoutsMatch sans Win32 ;
  CreateJobObjectW/SetInformationJobObject classe 9 144B 0x2208/8/4GiB SANS flag
  0x4 ; QueryInformationJobObject readback BRUT fail-close hors 144/0x2208/8/4GiB
  — jamais « corrigé » ; GetHandleInformation égalité exacte (0,0,1,1,1)/job
  0/root 0 ; sonde 122 + UpdateProcThreadAttribute 0x20002 + CreateProcessW
  0x80404 + STARTUPINFOEX 112 + STARTF_USESTDHANDLES, Created installé même si
  nettoyage raté ; Assign ×1 sans retry ; IsProcessInJob ordre process→job sans
  forçage ; ResumeThread prior==1 seul, autre prior retourné avec error 0 ;
  WaitControl slices ≤100ms error 87 sans appel, mapping 0/258/0xFFFFFFFF ;
  TerminateJobObject/TerminateProcess owned 0xE0000001 ×1 sans retry, appelés
  PAR LE NOYAU SEULEMENT ; CloseHandle par outcome, CloseAttempted avant, pas de
  retry, borrow → InvalidBorrow avant appel).
- Interdits : ZÉRO OpenProcess/DuplicateHandle/IOCP/compteur driver dans
  RealNative ; accounting-48/PID-list-72 ABSENTS de RealNative (restés dans
  KernelObserver gelé :14-32, classes 1/3) ; aucune classe du noyau
  réimplémentée ; IGuardBorrowSource non touché.
- RunnerReal : harnais PARENT-ONLY (sentinelle self-exit→Environment.Exit(0)
  avant tout Job ; 8 CreateNew ; events/pipes flags exacts ;
  new GuardianCore(new RealNative(), new KernelObserver(), new
  GuardianStopwatchClock()) ; CoLocatedGuardianHost jamais construit ; stdout =
  FAITS bornés ; exit 0/QUIET jamais un PASS ; jamais TerminateJobObject par le
  harnais ; préconditions slice-2 publiées) — vérifier par LECTURE que son
  exécution par le parent est sûre et bornée (pas de réseau, pas d'écriture hors
  le répertoire de cas, pas de boucle infinie).
- DESIGN.md : sous-gates slice-2 + préconditions + NOT_PROVEN publiés
  (last-close, D-process, multi-process, budget cross-process, lease, reparse,
  matrice S/D/G-loss, readback 0x2208 tant que non exécuté, stderr inconnu).
- MANIFEST : statuts exacts, self-hash exclu.
- C#5 strict partout (pas d'interpolation, pas de ?., pas d'async) ;
  conventions Check/RunAll ; cohérence inter-fichiers (RealNative implémente
  EXACTEMENT le seam consommé — signature par signature ; RunnerReal utilise
  HostLauncher/TryReadBack correctement).
- Tout appel Win32 absent du plan mais présent dans le code = contraire à
  justifier (aucun ajoute hors plan sans déclaration).

Verdict : ACCEPTABLE_SOURCE_SCOPED | CORRIGE | BLOCK, 3–8 ancrages
source:ligne, contraires précis, limites, plus petit travail suivant. Rapport
PUBLIC team_message ; aucun fichier ; re-hash début ET fin. Anti-saturation :
partiels par livrable autorisés avant verdict final consolidé ; ne finis JAMAIS
un tour sans message public. Interdits : compile/transpile/test exécuté/
Bun.test/run natif/Job/Process RÉEL/DB/git/IDB/board-write/indexquery/
délégation/changement de modèle/autre OWN. Bootstrap NONBLIND déclaré.

Après acceptation parent : slice 2 = compile winexe + exécution RunnerReal par
le parent (gate séparée, préconditions du plan). Ce verdict n'est ni le compile
ni la qualification ni un PASS hôte. Modèle : cursor/grok-4.7 Grok 4.7 Extra
High, spawn fresh, Model.Ref vérifié.
