
Tâche task_mvbme3sg_002i_56jgvm. Ancrages relatifs à inputs/JOB_FIXTURE_REVIEW_20261017/ :
1. SOURCE/Invoke-One.ps1:101–136 : manifest externe et trois pins ; parcours statique Case2/Run valide ⇒ HOLD avant lecture binaire/lancement ; Case8 intercepté également. Exit0/JSON HOLD n'est pas PASS.
2. SOURCE/Invoke-One.ps1:139–192 : Prepare prospectif seulement, chemins/pin EXE vérifiés, root neuf/CREATE_NEW, budget32KiB. L'argument d'acquittement n'est pas autorité ; réservation exclusive externe reste précondition, pas garantie anti-course hostile.
3. SOURCE/Fixture.cs:95–138 : CLI/nonce/root/case bornés, OWNER lié ; parent PID+création contrôlés après rétention de handle, observation sans kill.
4. SOURCE/Fixture.cs:187–269 : marqueurs CREATE_NEW plafonnés avant écriture ; enfants limités aux modes ASCII du même EXE, arbre fixe ≤3. Borne marqueurs3×32768=98304B, pas quota global.
5. SOURCE/Fixture.cs:235–254 : oracle Mainargs/env réellement lus, sans recopier le quoting helper ; littéraux stdout/stderr calculés textuellement à31B chacun. exiting signifie intention seulement.
6. SOURCE/Fixture.cs:272–314 : barrière child-ready puis attente du handle parent/exit0 effectivement observé ; enfant reste ensuite2s. Le futur observateur doit encore établir les exits/quiescence externes.
7. SOURCE/Fixture.cs:35–45 : watchdog propre14s après startup classe/CLR ; aucune preuve wallclock host15s. Compatibilité cscFramework examinée seulement, non compilée.
8. SOURCE/QUALIFICATION_PLAN.md:137–151 : raw préservés ; QUIESCENT/jobZero helper ne deviennent jamais oracle indépendant ; absence preuve ⇒ HOLD.
Aucun autre défaut bloquant établi dans ce périmètre ; raisonnement statique et calculs de texte, aucune repro dynamique. Gaps connus inchangés : cap256KiB/helper64MiB, observer/Job0, case6handle, case8référence, Assign/nestedJob NOT_ACQUIRED.
Les12payloads121060B et reçu2752B sont inchangés avant/après (reçu ba685106 ;4sources069bf451/e0a8baa5/6bcb4ea4/11ec6339). Bootstrap public déjà déclaré, pas claim blind/packet-only. Helper consulté comme interface seule, pas re-review. Rapport public Plan,0fichier écrit ;0compile/DLLread-load/APIJob/fixture/test/runtime/DB/Git/native. Ce verdict n'autorise ni préparation/compilation/run, ni hôte qualifié/full44/L9/L10/main/intégration. HOLD.
