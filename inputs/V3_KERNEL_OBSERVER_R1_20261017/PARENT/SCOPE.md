# Core V3 — deux auteurs disjoints, GO source séparés, zéro exécution

Contrat draft2 + ABI1 physique + V3_CORE_ABI1_SOURCE_BOUNDARY font foi. Fresh
build/SolMax par rôle, même équipe/capacité5. Chacun reçoit paquet/hash/receipt,
ACK réel des conditions puis GO source distinct. Aucun sourcecentral/anciengel,
IDB/FF8/JobAPI réel, compile/tests/import/native/runtime/Git/install/délégation.

## G — guardian core, task_mvc42woi_0006_kj3b51

Quatre nouveaux fichiers disjoints : GuardianCore.cs, GuardianCore.Tests.cs,
DESIGN.md, MANIFEST.json. C#5/.NETFramework4.x, source seulement. Implémenter
réellement créationJ/limites+flags/readback/créationT suspendu/assign/membership/
reprise/arrêt possédé et machine d'état bornée. Non pas un wrapper autour de
l'ancien JobRunner.Run(string), ni placeholders de la branche privilégiée.

G possède J/T-thread/T-process et inventorie les handles reçus. Implémente
IGuardBorrowSource avec référence CaseIdentity exacte, kind et état live ; un seul
thread contrôle l'owner. Ne ferme jamais pendant borrow/query ; rootwait/exit puis
fermeture de toutes références root avant paire de queries. J conservé jusqu'au
terminal/readbackACK ou outcomeHOLD explicitement non libéré. Erreur/HOLD ne saute
pas l'arrêt ; capwriter ne peut empêcher cleanup. Observer injecté IGuardKernelObserver,
aucune duplication de son implémentation native de query dans GuardianCore.

Hostbindings S/D/lease/stdio/launchintent/pins sont des objets internes validés par
le futur launcher trusted, jamais rawhandlesJSON/capabilities réouvertes parPID.
Le core doit refuser MissingHostBinding AVANT toute API si binding absent/nonvalidé.
Décrire précisément ces préconditions et les types supplémentaires locaux ; pas
prétendre avoir implémenté/qualifié le launcher ou capture S. Escalader toute nécessité
de changer l'ABI partagée plutôt que livrer une version divergente. Pas brokerIOCP.

Evidence contrôle en mémoire bornée uniquement, pas Write/Console arbitraire sur
chemin d'arrêt. ModuleBudget0944a3bb fourni readonly comme dépendance EN REVIEW,
non présumé correct ; ne pas le modifier. Détail de tous writers même mémoire dans
DESIGN, catégories uniques ; aucune revendication budgethost tant que ledger/wiring
S/D/capture/fixtures n'est fermé. Rootexit witness issu des originaux, pas driverBool.

Tests SOURCES seulement : erreurs de phase/empreinte/epoch/limites, fauxzéros/stale,
rootrefs nonlibérées, HOLDetcleanup, budgets cumulés/délais, borrow fermé/inadmissible.
Mocks ne prouvent pas Win32, ni fermeture native ou vraie quiescence. Ne pas exécuter
ces tests ni créer un Job pour les écrire. Manifestes/risques/conditions puisHOLDreview.

## O — observer kernel, task_mvc42woi_0007_28drf0

Quatre nouveaux fichiers dans un AUTRE output : KernelObserver.cs,
KernelObserver.Tests.cs, DESIGN.md, MANIFEST.json. C#5, implémenter
IGuardKernelObserver.ObserveRoot/CapturePair exactement contre ABI1 readonly.
Source independent de G ; ne reçoit pas GuardianCore ni ses tests/résultats.

Native surface limitée : WaitForSingleObject/GetExitCodeProcess sur rootborrow,
QueryInformationJobObject sur Jqueryborrow, GetLastWin32Error et allocation mémoire
fixe nécessaire au marshalling. Aucun create/assign/duplicate/close/terminate/native
write/debug API. Pas NULLjob/currentjob implicite, PID reopen ou inventaire lifetime.
IntPtr.Size8 requis. Struct accounting/layout et bufferPID8 entrées dérivés des refs
officielles, ReturnLength/bounds/header/status validés ; error immédiatementcapturée.
Pas augmenterbuffer/retry interne ou convertir ERROR_MORE_DATA en succès vide.

Retourne champs/codes/sizes/identity/sequence bornés, pas une décision de libération.
Paire non atomique, le core doit imposer rootterminal/refsreleased/admissionsealed.
Respecter permit et refidentity, emprunt seulement live au moment de l'appel ;
sourceG est responsable de sérialiser la fermeture. Invalidborrow→échec explicite,
pas appelAPI sur numéro arbitraire. Ne pas copier un zéro ancien depuis cache.

Tests SOURCES de parsing/predicates/layout/tailles/erreurs/waits via seams purement
mémoire documentés. Pas PInvoke exécutée, .NETprobe ou reflection test. Attendus
numériques/contrats indépendants, aucun résultat généré par l'implémentation testée.
Code helper pur supplémentaire dans ces seuls4fichiers si nécessaire ; ne pas
modifierABI. Escalader incompatibilité contractuelle. Livrerpins/limites puisHOLD.

## Gates communes

Préserver SOURCE oldJobRunner et fixtures historiques, jamais réarmer leurséchecs.
Après deux livraisons : reviewcomposée indépendante fraîche + reviewbudget acquise,
parentcompileGO séparé. Pas qualification tant que launcherS/driverD/captureavantRead/
ledger globalwriters absent. Pas accepter la mission depuis un composant compilable.
Toutes lectures/calculs ContextMode avec garde préémission<2800B, pasindexquery/
inbox/board/autreOWN ; bootstrapNONBLIND public déclaré sans claimpacket-only.
