# Lot 22/23 — proposition d'ingestion ciblée, non exécutée

Cette proposition est le seul livrable de diffusion du Lot 23. **Aucune ingestion,
modification Obsidian, compilation/indexation QMD ou synchronisation wiki n'a été
effectuée.** La présence de pages existantes ne prouve pas leur fraîcheur.

## Sources proposées après stabilisation

Périmètre limité :

- `OFFLINE_lot23_2026-10-03.md` : résultats locaux, export isolé, round-trip
  build-only et refus de promotion du candidat incomplet.
- `DOSSIER_lot23_stage0_depth.md` : VA/RVA corrigés, bind **et** unbind,
  ancrages comparés sans choix d'installation, preuves statiques depth partielles.
- `LIVE_NECESSITY_lot23.md` : waivers bornées et carte **NOT AUTHORIZED / BLOCKED**.
- `lot22/repro_manifest.json` et `lot22/state_matrix.reference.json` : dépendances,
  fixtures externes par hash et diagnostic figé.
- Reçus/source hashes énumérés dans `lot23/proofs_manifest.json` : seuls les
  tests et gates effectivement exécutés, avec leurs codes de sortie réels.

La campagne et matrice Lot 22 restent des sources historiques, avec les errata
documentés dans le rapport Lot 23. Ne pas importer leur prose « committed » ou
les guards historiques comme vérité nouvelle sans ces réserves.

## Destinations possibles, à faire autoriser

Une note validation offline Lot 23, une section stage0/depth du dossier AF3DN et
une entrée courte du catalogue de preuves existant. Liens ciblés vers Lot 22/21,
sans réingestion générale, nettoyage du vault ou édition opportuniste de pages
déjà modifiées par l'utilisateur.

Ne pas ingérer le DLL ignoré, un EXE, une IDB, les objets de compilation, le dump
v13 externe ou toutes les captures locales. Les manifests désignent leurs
identités sans copier ces bins dans le vault. Les captures du harnais sont des
fixtures synthétiques générées dans Temp, pas une nouvelle campagne FF8.

## Contrôle exigé lors d'une future ingestion autorisée

1. Recalculer les hashes source et vérifier les reçus du manifeste de preuves ;
   toute divergence impose une nouvelle validation locale ou une réserve écrite.
2. Préserver les verdicts séparés : export reproductible ≠ checkout committé,
   contrat structurel ≠ association état → draw, buffers ≠ installer sûr,
   fidélité UI **PARTIAL/BLOCKED**, live **NOT AUTHORIZED**.
3. Enregistrer les hashes exacts des sources ingérées et la validation locale,
   pas seulement la date ou un lien vers un ancien rapport.
4. Vérifier ensuite la retrouvabilité et les correspondances de contenu via
   **QMD CLI** sur le périmètre autorisé. Sans contrôle d'index/source, la
   fraîcheur reste non certifiée. Aucun `qmd update`/`qmd embed` n'est autorisé
   par la reprise offline actuelle.

L'autorisation d'un hook, d'un déploiement et d'une campagne live est indépendante
de cette éventuelle ingestion documentaire.
