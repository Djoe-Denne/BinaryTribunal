# Extraction parent-curatée du rapport public v3-composed-review-r1 — 2026-10-17

Le rapport public intégral vit dans le DB team (message de v3-composed-review-r1,
session ses_eb682d8f3ffesaTiSmKoI0A1Lh). Cette extraction ne retient que ce dont
l'auteur des corrections a besoin ; ni amplifiée ni réinterprétée.

VERDICT : ACCEPTABLE_SOURCE_SCOPED — GuardianCore (4 fichiers) et KernelObserver
(4 fichiers) conformes, au périmètre source, à draft2 bb69e0ad / ABI1 bb4758cc /
scopes f8611364 / frontière 084e847c / budget 0944a3bb : aucune divergence ABI,
corrections #1-#5 respectées, surfaces natives conformes, assemblage candidat
isolé sans collision. 4 contraires précis NON bloquants (C1-C2 liage de tests G,
C3 coin fail-closed G, C4 précision DESIGN). Pins 21/21 revérifiés au début ET en
fin de Phase 2 (manifest 72f31cd4…, frontière MATCH). Rien compilé/exécuté/écrit ;
aucune tâche/gate/qualification fermée ; 0008 intouché.

CONTRAIRES PRÉCIS (non bloquants) — TEXTE INTÉGRAL du rapport :

C1 Tests G #3 : les branches EvaluatePair !admissionSealed (GuardianCore.cs:329),
witness.Sequence>=permit.Sequence, witness.Elapsed>permit.Elapsed et
permit.Elapsed>elapsed (333-334) ne sont falsifiées par aucun test : Decide fixe
admissionSealed=true (GuardianCore.Tests.cs:98) ; tous les fixtures ont
witness<permit (102-103, 123-124). Les retirer ne ferait échouer aucun des 18
tests (non exécutés). Sémantique liée seulement en intégration (admission unique
139-141 ; refs racine fermées avant paire 135, 403 ; pas de paire normale avant
racine terminale 208).

C2 Tests G budget : GuardianCore.Tests.cs:275 est une tautologie littérale
(96*192==18432 && 18432<24576 && 192<=8192) sans référence à
GuardianMemoryEvidence.CapacityBytes (GuardianCore.cs:355) ni à
CaseBudgetV3.GuardianEvidence/GuardianResultCapacityBytes (BudgetedEvidence.cs:127,
129). Sous-cap <= cap de slot n'est lié ni par le code (HostComplete 303-304
compare aux const de G) ni par un test ; vrai seulement par inspection des pins
gelés.

C3 Coin G fail-closed : l'arrêt de la racine seule exige !assigned
(GuardianCore.cs:735). Si Assign=TRUE puis IsProcessInJob member=FALSE (700), un T
jamais repris et hors de J n'est visé ni par TerminateJobObject ni par
TerminateProcess → attentes cleanup épuisées → HoldQuarantined, J tenu, T suspendu
survit. Cas noyau contradictoire, aucune fausse libération ; conforme à la
politique DESIGN.md:94-97 mais non couvert.

C4 Doc #4 : droits publiés pour S/D (SYNCHRONIZE, DESIGN.md:46), mais pas ceux
tenus sur les handles de création J/T (accès créateur implicite ; DESIGN.md:78-79
et 86-87 ne les énoncent pas).

ANCRES CONCERNÉES (du rapport intégral) :

A2 GuardianCore.cs:651-713 — #4/handles : héritage S/D=0, stdio=1 (653) ; J
anonyme NULL SA (1040) + héritage J=0 (658) ; limites 0x2208/8/4GiB (219,
1046-1048) relues exactes 144B (321-322) ; T suspendu 0x80404 (1100), HANDLE_LIST
0x20002 = 3 stdio (1084-1087) ; assign unique (690-694) ; IsProcessInJob (698-700)
; relecture limites (701) ; ResumeThread unique, prior==1 (703-709) ; requêtes
initiales 3/4 (662, 696, 701 ; plafond 630). Aucun DuplicateHandle/OpenProcess/IOCP
(DllImports 1163-1206). Lié Tests.cs:71-87, 153-175.

A4 GuardianCore.cs:328-349 — #3 : identité par référence (330-331) ; séquence
pair==permit et witness<permit (333-334) ; deux succès, erreurs nulles (336-337) ;
tailles 48 et 8≤list≤72, list≥8+8n (338-340) ; comptes ≤8, assigned==inList,
total monotone (341-344) ; quiescence seulement si Active=0 ET Assigned=0 ET
InList=0 (348-349), sinon Pending. Paire rejetée = HOLD permanent, jamais
retentée (802-803, 830-831) ; crédits 4096/300 débités avant l'appel (788-790,
749-751). Lié Tests.cs:99-129, 215-224.

A8 GuardianCore.cs:300-317 vs BudgetedEvidence.cs:122-133 — budget : seulement
des const publiques gelées (SlotCount 8, CapturedStreams 114688 ; Total 262144 et
chunk 4096 liés Tests.cs:86) ; réserve 18432=192x96 (355) ≤ GuardianEvidence 24576
(127), 192 (382) ≤ GuardianResult 8192 (129) ; preuves en mémoire seulement.

Constantes recalculées OK : 0x2208=0x8|0x200|0x2000 (0x2a08/0x3208 breakaway
refusés, Tests.cs:81-82) ; 144=64+48+32 ; STARTUPINFOEX 112=104+8 ; accounting 48
(offsets 36/40) ; PID 72=8+8x8 ; 120=48+72 ; 18432=96x192 ;
0x80404=0x4|0x400|0x80000.

PLUS PETIT TRAVAIL SUIVANT (du rapport intégral) :
1) Requis, parent, séparé : GO compile de l'assemblage candidat isolé ABI1 +
   BudgetedEvidence + GuardianCore + KernelObserver (tests compilés, non
   exécutés), task_mvc44d90_000c, liage dependsOn par le parent.
2) Recommandé avant qualification, non bloquant pour la compile : correction G
   pinée TESTS+DESIGN seulement — cas falsifiants EvaluatePair ; remplacer
   Tests.cs:275 par des assertions liées aux const ; énoncer les droits J/T.
   Décision parent sur C3. Review ciblée selon portée.
