# Review indépendante du helper Job — source seulement, pas qualification Win32

Nouvelle sous-tâche de re-graph-scheduler, pas L9global ni intégration. Reviewer
Plan/SolMax frais NONBLIND, disjoint de l'auteur. Le parent a vérifié la livraison
4fichiers71085B et gelé les bytes ;aucune compilation/exécution n'est acquise.

FIRST HOLD :ACKpublic seulement avant paquet/GO accès. Après GO accès seul :
lire contrat/binding/manifest/receipt/pins complets, ACK puisHOLD ;audit attend
GOstatique distinct. Source gold = JobRunner.cs70957212 et wrapper100e329a,
pas les assertions du design9ca22a88 ou du manifesteeb0f6990.

## Attaques de source requises

- Parser data-only :duplicates, types, overflow, limites, Unicode/surrogates/NUL,
  canonicalité/ancêtres/paths, argv CRTWindows et envUTF16 exact sans réécriture.
  Request invalide doit être refusée avant root, aucune eval/fallback/shell.
- ABI/.NETFrameworkPS5.1x64 :layouts/offsets/tailles/flags/PInvoke/retours/erreurs,
  compatibilité de source avec le compilateur PROPOSÉ non encore qualifié.
  Distinguer erreur statique établie et prédiction de compilation non exécutée.
- Ownership :logs CREATE_NEW, NUL et whitelist STARTUPINFOEX stdio seuls ;job neuf
  anonyme/nonhéritable/no-breakaway/limites+readback. Allocation/libération mémoires,
  attributelist et handles dans toutes les branches. Pas accès ou kill étranger.
- CREATE_SUSPENDED→assign→associationvérifiée→uniqueResume ;refus/nestedJob ne
  doit jamais reprendre root nonconfiné. Root handle+creationtime doit être
  conservé ;OpenProcess des PID observés, réutilisation PID et vérifications
  d'association doivent rester bornés et sans action destructrice par PID.
- Quiescence :rootexit ET queryActive0/listvide cohérents, erreurs API/données
  incohérentes/limitespolling=>HOLD ;root0 ou fermeturelog seul ne suffit pas.
  Polling n'est pas inventaire de tous les enfants rapides :ne pas convertir
  une limite déclarée en BLOCK si aucune garantie correspondante n'est revendiquée.
- Timeout/exception :stop seulement job possédé ou root NOUVEAU encore suspendu,
  délai de cleanup monotone, aucun succès/libération fictive si arrêt non prouvé.
  KILL_ON_CLOSE filet≠observationréussie ;closefails/écriture résultatpartielle et
  codes de sortie doivent rester visibles. QUIESCENT seul≠testsPASS/root0.
- Wrapper Add-Type et résultat :aucune autorisation par simple paramètre warning ;
  compilationfuture/gates/outillage/temp explicites, jamais bundle/OSJob exécuté
  pendant cette review. Job≠FS/réseau/provider sandbox et B01/B02 ne sont pas résolus.

## Livrable

ACCEPTABLE_SOURCE_SCOPED | BLOCK | UNCERTAIN,3–8ancrages C#/PS path:line,
contre-exemple request/branche et invariant opposable pour chaque BLOCK. Hypothèse
statique≠repro. Même ACCEPTABLE laisse obligatoires compilation puis qualification
inoffensive indépendante et GO séparés ;ne pas ajouter ou retirer silencieusement
les garanties du scope auteur. Proposer quelques cas discriminants avant toute
future exécution. Aucun correctif du code autorisé au reviewer.

Rapport public Plan si refus d'écriture, sans bypass ;seul proofdir nommé sinon.
Ne pas importer/parserparcompilateur/évaluer les sources ;lectures texte/hashs et
calculs statiques dans ContextMode seulement. Si référenceAPIautoritaire manque,
escalader au parent au lieu d'inventer ou de sonder l'OS.

## Interdits

Pas Add-Type/csc/PowerShellchild/nativeJobAPI/fixture/compiler/test/processus de
produit/DB/cache/TEMP/runtime/port, sourcefix/projet/git/install/LLMexterne/sousagent/
FF8/IDA/live/native science. Pas contexte auteur privé/autreOWN/main/ancienDBcache/
ctx_search/index/inbox/board/results/autre session ;provenances≠accès. Déclarer
toute exposition publique bootstrap, jamais blind/packet-only non prouvé.
Verdict indépendant, aucune clôture L9global/L10/main ou permission full44.
