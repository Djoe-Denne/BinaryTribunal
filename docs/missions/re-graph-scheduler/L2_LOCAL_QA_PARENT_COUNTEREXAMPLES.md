# L2 — QA locale : contre-exemples reproduits par le parent

2026-10-14. **NON ACCEPTÉ** ; revue `l2-local-qa` toujours en cours au constat, pas clôture ni preuve native. GelL2 manifest `b881a7f00d311709cbbdf94b8ed75fc4630d034086f1420344831dbad0b465f0` inchangé.

## Fusion blanchissant un record malformé

Module réel gelé graph-normalize.ts:76–92, `buildGraphSnapshot`. Fixture locale L1 `test/fixtures/graph/ff8-chunks-tails/content.json`, contrôle `validateGraphSnapshot=[]`.

Construire `GraphParts` avec `artifacts=fixture.binaryArtifacts`, `scopeDescription=fixture.scope.description ?? 'Local fixture QA'`, les collections/config/versions de la fixture. Copier son arête valide en `good` puis `bad` de même identité/relation/sites, poser seulement `bad.schemaVersion=99` et `bad.extra='unexpected'`.

- `edges=[good,bad]` : **ACCEPTÉ**, outputedge.schemaVersion1 et outputvalidator `[]`.
- `edges=[bad,good]` : **REFUSÉ**, enum schemaVersion et additionalProperties de $.edges[0].

Le contrôle de shape/version est seulement appliqué au document final ; des déclarations ignorées par fusion disparaissent. Exiger validation de chaque entrée avant fusion. **Nuance imposée** : la collection brute de sites peut dépasser64 pour être shardée par le normalizer ; ne pas masquer ce défaut en interdisant les entrées129sites ni changer le cap64 du transportL1. Distinguer le contrat d'ingestion brut de la sortie stricte, si une API/type est nécessaire proposer au parent.

La première probe parent avait oublié le mapping GraphParts.artifacts et levait un TypeError dans les deux ordres : **ce n'était pas une reproduction**. Appel corrigé ci-dessus réellement exécuté, source/périmètre non modifiés, aucune panneMCP/fallback inférée.

## Site de code hors limites de sa fonction source

Module réel graph.ts:401–407, `validateGraphSnapshot` : module/site/xref concordent mais pas l'appartenance au caller.

Fixture same module ; source `H:0xC000`, boundaries explicites `[0xC000,0xC040)` entry et `[0xC200,0xC240)` tail ; destination `H:0xC100`. Arête tail_jump à site0xC208 initial valide. Déplacer site vers **0xC108 dans la destination**, ajuster provenance.siteRva à0xC108 et recalculer normalizedFingerprint via vraie primitive `fingerprintWithout`.

Résultat parent : **validator=[]** malgré site hors des deux boundaries source. La concordance des chaînes/digest n'établit pas ce cross-invariant. Guard sur sites instruction/code et frontières connues ; ne pas imposer par analogie une limite caller aux DATA/callbacktables globales ou aux imports purs. Cas inconnu à traiter explicitement fail-closed selon couverture, pas invention de boundaries.

## Routage et suite

Model.Ref auteur source `l2-graph-r3`, session `ses_ec9ab7ef2ffeYbplaGQYWuPDLf`, relu via client public : **openai/gpt-6.1-sol/high**, worktree propre. Task correctif créé **`task_mv80pik5_004b_c0kha5` L2-FIX-MAX**, correcteur attendu **Sol max** donc effort renforcé, dépend de review finale `task_mv80a96u_003t_7t7cbp`. **Pas encore dispatché**, aucun slot artificiellement occupé et gel non muté. Auteur ancien idle/ready : shutdown demandé sans abort de travail existant, historique/gel préservés.

Autres gaps signalés par reviewer restent à qualifier contre le contrat avant admission au correctif (artifactmodule/byteagreement/revisions/caches), pas automatiquement confirmés par le parent. QA pure données locales, aucun process/IDA/network/extraction/modification ; tests verts antérieurs ne valent pas acceptance.
