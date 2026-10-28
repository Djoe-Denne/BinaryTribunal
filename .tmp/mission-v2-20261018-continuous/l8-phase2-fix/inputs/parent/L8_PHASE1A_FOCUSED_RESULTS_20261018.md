# L8 phase1A — transfert et QA focalisée du main

**Qualification offline focalisée recevable :107pass,0fail,714assertions,7fichiers.**
Invocation nouvelle unique sur snapshot byte-exact du main,sortie naturelle0,
64476ms côtéwrapper/63.67s Bun. Pas le107PASShistorique réutilisé comme résultat.

## Preuves et périmètre

-16pins runtime365568B exacts,diff4préimages revu Vfresh ACCEPTABLE_TRANSFER_SCOPED.
  V vérifie12/243images horsallowlist sur ses octets;parent vérifie toutes243,
  pas une prétention de Vrehashindépendant des231nonprojetées.
- Main tsc0 avant4438ms/après5131ms,zérodiagnostic;pas de suitefull.
- Snapshot260textuels:258gardésaprèstransfert+2schémastransport nonexécutables,
  copies distinctes ordinaires,aucun node_modules/junction/install. Garde main
  ETsnapshot260exacts avant/après. Aucun sourcesfix ou réessai pendantrun.
-7paths nommés graph-integration;stdout/stderr bruts retenus/SHAe0b86d69… et
  4fda24e7…;Bunconfigexplicite,sansenvfile/preload/concurrent/watch/réseau.
- Registre snapshot neuf274lignes,178réservationsdont96DBréellementcréées,
  82réservationssansDB conservées (répertoires préparatoires ou afterAll,
  pas desDBprésumées). Inventaire physique scratch:96artefactsDB24743936B,
  tousregistrés,derniersreceiptsclose/hash exacts,aucunWAL/SHM/journal résiduel.
  Aucun nettoyage:96DB+receipts/logs/registry/caches et dossiers vides retenus.
- LOCALAPPDATA/TEMP/TMP/caches child dédiés sousTemp/opencode;registre historique
  main et DBpréexistantes non touchés. TaskIds historiques inscrits par lehelper
  sont labelsémetteur,non claims sur des tâches étrangères.

## Limites

Ports/transports synthétiques,SQLite/threadlocal réel seulement. Pas FF8/IDA/
bridge réel,run01/live/G5-G7,full44,QAglobaleL7/L8,L9/L10 ou adoptionB/C3-C5.
Sur échecdesynchronisation le code ne prouve pas fermeturethreadinconditionnelle;
ce run s'est terminé naturellement et les fichiersréels ont étéinventoriés.
Cela ne devient pas un oraclequiescence universel du produit/native.

Receipt `.tmp/mission-v2-20261018-continuous/l8-focused-test-receipt.json`,
SHA80256839c3fb9218e87dad013829ff2d05f18f0874282fdef8a572f957954298.
Snapshot exact/root/argv/binaireBun,pins,captures,DBs et chemins de receipts y
sont détaillés. Gate L8_FOCUSED_TEST_GATE.md et adjudicationV restent conservées.
Suite:transportv3 sourceV+QAindépendante puis contratruntimeB/C3-C5 avantcode,
sans attendre un GO utilisateur administratif.
