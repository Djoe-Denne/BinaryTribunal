# M2 — 23 : qualification distincte des neuf régressions

## Décision et rapport à l'objectif

Le run450 s'est arrêté ORIGIN/PAIR208 et son budget inspecté1/1 est consommé ; diagnostic offline en cours, aucune deuxième invocation450. Les neuf régressions ont un contrat et un fichier distincts, conservés/relus indépendamment et typés par parent04. Elles n'utilisent ni le collecteur, ni les normalisations Error du différentiel. Ne pas bloquer ce travail indépendant prêt sur le join208.

Sous le mandat M2 §5.2/§7.1 et délégation technique, le parent autorise **une invocation non inspectée de ce fichier seul**,60s, pour observer ses neuf résultats, sans changement de cas/oracle ni seuil. Ce n'est pas une relance/subset du différentiel450 et ne peut servir à remplacer son échec. Aucun nouveau framework ou nativehelper, pas de réseau/DB/jeu/IDA.

## Préflight fermé

- Source : W/candidate/tools/ff8-harness/test/numeric-context-regressions.test.ts, byte-exact au pin `after-R4/numeric-context-regressions.test.ts` du manifeste77fc3193… ; vérifier avant le run. Cinq IDs paramétrés+quatretests propres,9attendus.
- Six modules scientifiques et supports sous le manifeste37 `984deec…` inchangés ; vérifier37pins et typing04/config. Aucun script substitué ou science reconstituée externe.
- Commande : Bun absolu pinné `--no-env-file --config=./bunfig.toml test --max-concurrency=1 --timeout=60000 ./candidate/tools/ff8-harness/test/numeric-context-regressions.test.ts`, cwd W. Aucun `--inspect`, aucun `PARENT_NATIVE_*` ni import du différentiel450.
- Environnement parent fermé neuf dédié sous W/regression-environment-r2-001 (HOME/config/AppData/temp). SystemRoot/WINDIR machine vérifiés, pas d'options/preloads/secrets hérités ; cache désactivé et logs bruts conservés.
- Une invocation60s maximum. Stop et diagnostic à échec, pas de retry automatique ni extension450. Les sources et RAW précédents restent intacts. Aucune publication/conclusion d'intégration M2 par ce seul résultat.

Script parent fini : evidence/run-numeric-regressions-r2.mjs. Reçus preflight/result et logs W/evidence/parent-regressions-r2-001.*, copie des reçus dans la mission. Aucun résultat n'est présumé dans ce rapport avant exécution.

## Résultat effectivement observé

Une invocation réalisée : exit0/sanssignal/aucuneerreuroutil,46ms côté parent. Log Bun : **9 PASS,0 FAIL,31860assertions**, neuf identités attendues présentes (cinq IDsfournis spéciaux puis quatretestsdiagnostic/context/ownership/ordre/frontière). Pas de SKIP rapporté ou comptéPASS ; aucun import du différentiel450 ni inspector.

Le parent accepte la qualification de ces **neuf régressions sur ce candidat identifié**, sources/oraclesbyte-exactsR4 et37pinsvérifiés avant lancement. Reçus `../evidence/numeric-regressions-r2-001-{preflight,result}.json`, logsbruts conservésW/evidence. Aucune relance nécessaire à sources/entrées/oracles/conditions inchangés. Ceci ne transforme pas l'échecORIGIN208 du différentiel en succès et ne clôt pas numeric/S1/M2.
