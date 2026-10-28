# L5 allocation — nouvelle revue indépendante avant intégration

Candidat Astra max livré, task `task_mv9k1ikn_0000_bo44nq`, source planner
**985e5ead945ac742a7df5370c0009b2e8f1aab357286ad2cb67b3cf01c858988**,
84 699B ; nouveau test **8d02cbec8c7cd8a4f3d8d5a766d18716f9a0bcd370f95fcad74509a4cdff3edb**,
39 066B. Aucun autre source changé, ancien planner.test.ts byte-exact.
Manifest auteur bb50a722c7475a742522ecbdd2e8dfbc99e7a326d93a73945dc36142fa687200.
Le manifest déclare un fingerprint d'ensemble ; parent scelle le JSON et chacun de
ses fichiers par SHA256 sans supposer une recette non spécifiée de ce fingerprint.

Parent vérifie les deux sources,14 preuves,487 inputs (486+1 décision),306 autres
ROOT et4 DB retenues1 388 544B sans WAL/SHM restants. Il réexécute lui-même le vieux
planning complet sur le nouveau module : byte-exact au gel3073, digest
8f5a36ff063a30ca16fafee89236b8e67ba7d9c79172e838274fd7ee0888d7c8.
Les sources étaient gelées par manifeste dans ROOT auteur, pas dans un sous-dossier
FROZEN inexistant ; le parent construit maintenant une copie de revue immuable.

Auteur typecheck0,143PASS/13 583 assertions (65 anciens+78 nouveaux), full870PASS/
1SKIP/74 305 assertions,871 tests/22files. **Pas acceptation ou preuve du reviewer.**
Le full auteur n'inclut pas QA60 intégré plus tard en main ni maintenance non commit.

## Portée de review

Fresh reviewer distinct, code complet planner + nouvelle entrée/branches partagées
et compatibilité legacy. Ancien source accepté37723edf fourni sous OLD pour diff/
sondes, pas de re-review numérique L2/L3 ou de nouvelle preuve native. Ne pas se
limiter aux tests auteur ou faire un simple auto-hash comme oracle.

Lire PARENT/PLAN_GO.md, USER_GO et CLARIFICATIONS complets : ils bornent les choix
ratifiés, pas le verdict. Axes adversariaux :

- Opt-in propre admissionBudgetMode, pas activation par nom préfixé ; vieilles
  policies même préfixées sans nouveaux champs byte-exactes, getters/prototypes/
  proxies/non-JSON ne fournissent pas de données, aucun freeze/mutation d'inputs.
  Version new mode ≤32UTF16, suffixe1..6, BMP/astral, aucun cap UTF8 confondu.
- Contexte courant indépendant complet vs allocation, tous champs/versions/SHAs/
  epoch/cycle/graph et manifest liés ; pas copie de l'entrée comme preuve runtime.
  Missing/extra/unknown/stripping/rehashed mismatches doivent échouer proprement.
- S scientifique inchangé, C commun=max(S,caps possédés), N=3 par fonction possédée
  pour profil1-exécution, T=C×N sûr. Unknown n'est pas0, N connu reste connu, scopes
  non possédés non facturés ; caps admissibles hors fermeture permis/non facturés.
- Vrai prix T AVANT fermeture/sélection, callee partagé compté une fois, SCC/selfloop
  indivisibles, unit/total exact±1/overflow, pas fragment de root ou prix S puis rehashC.
- Cohérence/readiness/relecture en nouveau mode avec contexte obligatoire, tables/
  ensembles/C/N/T/total/identités/versions/FP contrôlés. L'export assertAdmissionBudgetBinding
  ne prétend pas remplacer le triple binding ou une attestation scientifique.
- Nouvelles empreintes plan/sidecar/binding mais IDs fonction/unité/sous-intent/
  famille/conflit stables ; ancien holder RUNNING/QUARANTINED ne disparaît pas.
- Vrai L6 readonly : validation schéma/types, freeze/reopen du plan+sidecar+binding,
  budget body canonicalUTF8 C−1/C/C+1 dans prepareAdmission, oversize avant outbox/
  événement/submit. Pas casts/SQL fabriquant l'autorité ni padding scientifique.

L'entrée est une **allocation limitée**, pas une garantie que tout R légal tient.
L8 n'est pas intégré et son codec contient des textes/propositions non bornés :
13590 n'est jamais une borne universelle. L8 devra dériver le contexte des vrais
inputs, mesurer le body final, imposer N=1 durable malgré token/génération/passes,
reprendre/rejouer strictement et gérer retry du même body sans nouveau budget.
Les compteurs L5 seuls n'imposent pas N dans le host. T n'est pas le trafic réseau.
Les lecteurs L8 stricts nécessiteront une branche prospective ; ce lot ne les modifie pas.

## Exécution et autorité

Typecheck +143 contrôles des deux fichiers planner, puis propres petites probes
(oracles entiers/fermeture/comptage ou différentiel OLD, pas recopie de l'algorithme).
Pas de full/QA60/100k/native par défaut : ledger9MB non transféré. Dépendances
préinstallées readonly sous le module explicite, aucun install.

Les4 DB auteur préparées sont des **fixtures** binaires, consultables readonly et
hashées avant/après, jamais oracle indépendant ou vraie DB Ensemble. Probes L6
propres possibles sous Temp/opencode/l5-budget-review-* avec namespace unique,
handles fermés/fichiers conservés, pas delete manuel. Les143 tests ciblés conservent
leurs nouvelles DB, les hooks full re-policy/runtime ne sont pas à exécuter ici.
Interdits : autre WT/source parent non fourni, source/test/project writes, Git,
réseau/submit/LLM/IDA/live, DB privée, sous-agent/inbox/team_results/suppression.

Rendu borné ACCEPTABLE/BLOCK, findings path:line et repros propres/code/compte,
pins et limites. Parent garde jugement/gates/intégration ; vieux reviewer completed
jamais réactivé. Aucun GO L8, §17 global, L9/L10 ou autorité native/scientifique.
