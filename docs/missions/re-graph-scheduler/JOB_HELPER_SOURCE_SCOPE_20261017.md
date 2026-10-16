# Helper JobObject Windows — auteur source seulement, aucune compilation/exécution

Sous-travail borné de re-graph-scheduler, pas FF8/live/IDA. Préparation de B03,
indépendante de B01/B02 et sans grant de filesystem sandbox. Aucun fichier central
L8, source301/test/oracle/configuration/modèle/politique existant n'est à modifier.
Modèle choisi explicitement SolMAX :risque Win32 lifecycle/handles/confinement.

FIRST HOLD :ACK public seulement avant paquet piné et admission parent. GO accès
seul ensuite, lecture complète/pins/rôle ACK puisHOLD ;GO source distinct. Pas
héritage auteur/reviewer ni contexte privé. Seul le parent délègue/intègre/commit.

## Livrables après GO source

Dans le seul dossier neuf .tmp nommé par le parent :JobRunner.cs,
Invoke-JobRunner.ps1, DESIGN_AND_FIXTURES.md, MANIFEST.json. Implémentation minimale
lisible (~500lignes C# cible, pas framework général), aucune dépendance à installer.
PS5.1 x64/.NETFramework existant seulement proposé, aucun Add-Type/csc exécuté.
Si cette route n'est pas correcte avec les APIs disponibles, escalader sans fallback.

## Contrat fonctionnel et sûreté à dériver dans le code

- Request JSON data-only :exécutable absolu et argv séparés, cwd, blocenv explicite,
  limites et paths de logs parentpossédés. Refuser ambiguïtés/type/path/overflow,
  sortir avant root sur request invalide. Aucune interprétation de commande shell,
  Invoke-Expression, fallback, téléchargements, recherche ou ouverture d'ancien PID.
- CreateJobObjectW neuf anonyme/nonhéritable, KILL_ON_JOB_CLOSE sans breakaway ;
  ActiveProcessLimit8 et commit4GiB à qualifier sur x64, pas RSS «garantie».
  Appels/retours/Win32Error tracés. Aucun processus préexistant assigné.
- CreateProcessW CREATE_SUSPENDED, environnementUnicode copié fourni inchangé,
  commande Windows quote/escaping exacte, cwd absolu ;pas CREATE_BREAKAWAY_FROM_JOB.
  Logs neufs exclusifs et NULstdin ;whitelist STARTUPINFOEX des SEULS handles
  stdio hérités, jamais Job/process/thread/parenthandles non intentionnels.
- Assigner au Job et contrôler association AVANT ResumeThread, une fois seulement.
  Parent reste hors du nouveau job. NestedJob/permission failure=>refus explicite ;
  terminer/attendre uniquement le root SUSPENDU que ce launcher vient de créer,
  jamais kill par nom, PID retrouvé ou un tiers. Pas de lancement nonconfiné.
- Lifecycle root+descendants :completionport si utilisé, métadonnées PID+creationtime
  et snapshots QueryInformationJobObject cohérents. Root0 seul ne suffit pas ;
  root terminé ET ActiveProcesses0/list vide pour QUIESCENT. Notifications sont
  bornées, toute perte/erreur doit rester visible, pas zéro inventé.
- Deadline monotone ;timeout/erreur :TerminateJobObject de CE job seulement,
  wait borné30s pour root et job0. Si incertain :HOLD/unproven, pas succès/libération
  fictive. Closing du dernier handle avec kill-on-close est filet, pas preuve
  qu'une observation de quiescence a été acquise. Dispose sans fuite des propres
  handles et logs dans chaque branche, ycompris refus avant resume.
- Résultat JSON distingue naturalrootexit, forcedtermination, API/refusal/timeout,
  job0 observé et limites de télémétrie. Écritures uniquement logs/result de la
  requête neuve. Aucune inspection/désérialisation/SQL/delete de DB/cache/source.

## Validation source puis future qualification séparée

Ne compiler/importer/exécuter AUCUN livrable. Livrer analyse des layouts Win32x64,
chaque ownership/cleanup de handles, états d'échec, quoting/env, limites de preuve.
Proposer fixtures futures inoffensives :root-enfant-petit-enfant, root0 avantchild,
timeoutchild, refus avantresume/marker absent, breakawayrefusé, fermetureparent,
stdoutstderr volumineux et arguments Unicode/quotes ;pas les lancer. Toute fixture
doit être indépendante du code qu'elle teste et rester prospective.
Le parent fera review indépendante puis GO compilation/qualification DISTINCT.

## Interdits

Pas API Job/native appelée, processus fixture/compilateur/Add-Type/PowerShell child,
TSC/build/test/probe/CLI produit, image/runtime/TEMP/cache/DB/port/Worker créé.
Seuls nouveaux fichiers source/docs et scratch normal ContextMode de texte permis.
Pas ancienDB/cache/main/autreOWN/sourceprojet/ctx_search/index/inbox/board/results,
autres sessions/Git/commit/install/LLMexterne/sous-agent/IDA/live/FF8/native science.
Le helper ne résout pas B02 et ne prouve ni sécurité réseau ni arrêt provider/host.
Ambiguïté ou refus d'outil :HOLD parent, pas contournement ou question utilisateur.
