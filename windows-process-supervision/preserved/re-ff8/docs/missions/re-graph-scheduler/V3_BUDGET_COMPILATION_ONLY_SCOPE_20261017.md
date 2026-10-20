# Budget V3 — une compilation library seulement, gate parent

Parent seul, après review source reçue. Préflight puis FINALGO distinct pour une
invocation csc installée/pinée du framework64 déjà admis. Deux sources exactes
0944a3bb/d94776e2, copies readonly dans nouveau root TEMP/opencode/BMC-0944a3bbf9.
Aucun ancien root/log/artefact modifié ou relu hors pins explicitement déjà admis.

Flags : /noconfig /nologo /nostdlib+ /target:library /platform:x64 /debug- /optimize-
/codepage:65001 /langversion:5, quatre références framework explicitement pinées.
Tous argvpaths Win32. Sortie out/BudgetedEvidenceTests.dll, jamais load/import/
Assembly/Reflection/Add-Type/RunAll/test. Pas de runnerEXE dans cette tranche.

60s compilation/120s global maximum, un seul processcompiler original, pas retry.
Capture stdout/stderr bruts sans texte d'exception arbitraire en receipt ; sortie
anormale, timeout, log overflow/drift ou erreur → HOLD, conserver tous bytes acquis.
Log cap agrégé262144B ; outputsroot max8MiB qualifiés après processus terminal,
pas garantie filesystem hostile. En cas d'overflow/capture incomplète, pas PASS.

Parentlauncher doit être déjà propre, sansclear : absence casefold NODE_OPTIONS,
BUN_OPTIONS, FF8_ENSEMBLE_SOURCE, DOTNET_STARTUP_HOOKS, APPDOMAIN_MANAGER_ASM/TYPE,
préfixes COR_/CORECLR_/COMPLUS_. Env original copié, TEMP/TMP seuls overrides locaux.
Pins entrée/compiler/configs/références, main275 et exclusivité requalifiés avantGO.
Ne pas réutiliser le launcherworker dont NODE_OPTIONS était présent.

Root neuf avec OWNER et sous-dossiers inputs/out/temp ; aucun cleanup automatique.
Lire uniquement headersMZ/PE/CLI comme données après compilation ; hash final et
taille, codeexit naturel/logs/durée/conditions sont preuves de cesbytes compilables,
pas de sûreté du module ni validation native. Reçus parent hors code source.

0JobAPI/fixture/runtime/FF8/IDB/full44/DB/cacheprojet/port/dispatch/intégration/power.
Autonomie utilisateur autorise cette décision courante, pas des exceptions de gate.
