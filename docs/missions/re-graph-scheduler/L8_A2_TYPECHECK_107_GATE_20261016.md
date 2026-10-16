# L8 A2 — typecheck puis 107 ciblés, accès/ACK et GO final distincts

Parent contrôle l'écriture2sources :client620c690b/16526B,graph-engine1b305b78/54464B,
9artefacts843588B/822checks784cheminsreadonly exacts,16runtime365416B pinnés. Les
12hunks changés sont relus contreA–E, y compris guardprivé du refusoverC dansappend.
Imports/SQLlittéraux inchangés ;parseAST sansdiagnostic **n'est pas typecheck**.
Nouveau test47/70857679 et13autresruntime/60old intacts ;candidat nonexécuté/nonGREEN.

Lire décision+BASELINE+parentverification, hash/conditions/rôleACK puis attendre
**GO FINAL TC_THEN_107_ONLY**. Transfert ne vaut pas permission d'exécuter.

## Deux étapes autorisables en série, sans correctif sur l'élan

1. DepuisOWN/tools/ff8-harness : UNE `bun run typecheck`, borne120s. Conserver
   logs/start/end/PID/exit/durée. Si nonzero/timeout : STOP, pas tests, fix ni rerun.
2. Seulement si typecheckexit0 : UNE invocation, global≤180s :
   `bun test --timeout 30000 test/graph-integration/pipeline.test.ts test/graph-integration/engine.test.ts test/graph-integration/protocol.test.ts test/graph-integration/authority.test.ts test/graph-integration/recovery.test.ts test/graph-integration/cli.test.ts test/graph-integration/body-pause-regressions.test.ts`

60anciens+47nouveaux=107 est une attente de corpus, PAS un résultat ni un oracle
imposé. Rapporter vrais comptes/assertions/fichiers/PID/exit/durée et qualifier les
échecs. Tout rouge/drift/setupincorrect → HOLD avecpreuves, pas source/testpatch,
réinterprétation du contrat ou relance automatique. Temps naturel communiqué avant
collecte ;borne de ces seuls enfants n'autorise pas tuer un process tiers.

## Exécution isolée et seules fixtures propres

Sources2/13runtime/test47/60old/helpers/copies historiques deviennentreadonly sur
cegate. ChildTEMP/TMPneuf OWN/.tmp/L8_A2_CORRECTIVE_20261016/FOCUSED-<fresh>/temp,
opencode prêt,LOCALAPPDATA/config inchangés. Guardintegrationréelabsent/inchangé,
pas import d'un vieuxrapport/script deprovenance ou portvrai/FF8/Ensemble/LLM.

SQLite/APIs pub/CLIoffline **des tests nommés** seulement :retoursmkdtemp NEUFS
`LOCALAPPDATA/Temp/opencode/l8-central-v2-*` du fixture-driver readonly. Siblings
config/texte/output neufs sousces retours restent propres au test ;pasSQLdirect,
fixture-driver modifié/intercepté, delete manuel ou ouverture ancienneDB.

Registrycumulatif157257B/SHA11607270d18e115b56306336f351ddbfe7d6fd5c12d859954d5ebe0302f08b3e
copié AVANT puis seulementappend par helper ;préfixeexact/tail/finaldigest qualifiés.
AnciennescopiesRED/full/index immuables ;le livecumulatifappendé change sonhash,
pas faux«tousancienshashesidentiques» sur ce chemin explicitementmutable.
Garder DB/sidecars/receipts encoreprésents, closesréelles/perclose etpostexit SHA,
réservationssansDB licites notées séparément. Pas énumération d'anciensTemp.

Les2seedsC du **RED original**460fb7d2(cohérent)/282bf344(incohérent) restentFERMÉS/
SCELLÉS :aucunecopie/reopen/SQL/checkerC autorisés ici. Le test107 peut recréer ses
labels seed mais,si leclientcorrigéfonctionne,leurs nouvellesDB serontcohérentes ;
ne JAMAIS utiliser le nom«MUTATED_BASELINE» d'une nouvelleDB comme preuve d'incohérence.
CheckerC futur doit viser lescopies explicitementautorisées desDEUXoriginauxRED.

## Livraison / suite

Conservergelruntime16+nouveau dossierpreuves/logs/manifests/protectedpinsprépost et
registrytail exacts, résultats nonnative qualifiés. Une GREEN107 ouvre seulement
la gateparent suivante, pas certification des races/complexité/autorité duhost.
CheckerCdistinct, fulluniqueexclusif, freshreviewindépendante runtimecomplet et
gatesparent avant intégration restent requis. Pas full/autres invocations ciblées/
benchmarks100k/probesannexes/Git/install/sous-agent/inbox/live/science/native.
L7PLANstatique indépendant peutcontinuer, aucun test/codageL7 déduit de ce GO.
