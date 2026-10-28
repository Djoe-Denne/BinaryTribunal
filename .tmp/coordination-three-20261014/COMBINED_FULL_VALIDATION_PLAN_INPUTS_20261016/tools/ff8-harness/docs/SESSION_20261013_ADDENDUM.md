# Addendum d'ingestion — 2026-10-13

Complément chronologique à `SESSION_20261013.md`, sans modifier les faits du
snapshot précédent. Pas de nouveau canary, déploiement, IDB ou commit/push.

## Vérifications ajoutées après demande d'ingestion

- `parent-integrity.ts verify` : exit 0, **79 fichiers inchangés** : 31 fichiers
  globaux protégés et 48 evidence/scripts canary. Les sources immuables sont
  conservées et le plugin global n'a pas été déployé.
- Mémoire Serena écrite puis relue :
  `re-ff8/harness-strict-canary-and-role-sharing-20261013`, sur projet partagé
  `retro-eng`. Contient les limites du canary et le statut partiel de l'extension.
- GrepAI : catalogue de 14 outils, **aucun write-memory**. Index root `retro-eng`
  confirmé (6527 fichiers, 63990 chunks, 857.9 MB). Recherche root explicite
  fonctionne et retrouve des sources du harnais ; retrieval des nouvelles notes
  non confirmé. `grepai status` voit le watcher partagé PID 40468, alors que
  `grepai watch --status` CLI cherche un autre état local : cette différence ne
  justifie pas une reconfiguration ou un redémarrage. Notes Markdown durables,
  pas de prétendue mémoire GrepAI créée via une API inexistante.
- CLI Obsidian absent du PATH. Vault FF8 confirmé par la collection QMD locale,
  sans toucher la configuration globale pointant sur TextureToneVariations.
- Index QMD : maintenance `update`/`embed` interdite par directive parent ;
  ingestion de fichiers et fraîcheur de recherche restent deux résultats séparés.

## Gates complets post-correction UTF8

Premier gate `ensemble-utf8-final-1` : typecheck KO `TS2769` dans le test ajouté
par le parent, car l'élément `snapshot.messages[0]` pouvait être undefined selon
le type strict. Pas d'échec runtime ou scientifique ; log conservé. Assertion
non-null explicite ajoutée, sans changement de la politique de stockage.

Deuxième gate `ensemble-utf8-final-2` : **1439 PASS, 0 FAIL** sur 101 fichiers,
typecheck/build/lint exit 0. Il valide l'état générique incluant la correction
de budget UTF8 et son nouveau test. Le précédent chiffre 1438 décrivait bien
l'état avant cette correction. Evidence parent :
`.tmp/re-role-sharing-20261013/gates/ensemble-utf8-final-{1,2}/results.json`.

L'audit FF8 du bulletin et le test croisé restent en cours/non validés au point
de cet addendum. Les nombres de tests génériques ne prouvent pas un pilote
natif FF8, la sémantique d'une fonction ou les permissions IDA de production.
