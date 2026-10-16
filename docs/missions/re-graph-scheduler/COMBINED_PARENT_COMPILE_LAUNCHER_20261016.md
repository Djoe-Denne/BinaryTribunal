# Tranche compile — launcher parent distinct, aucun waiver d'environnement

## Échec de précondition du worker conservé

Le lecteur/launcher ContextMode du worker L8 rapporte NODE_OPTIONS présent,
nonvide/72caractères, mentionnant require/import/preload. Origine et contenu du
loader non établis ;aucun chemin déréférencé ou exception « infrastructure »
inférée. FF8_ENSEMBLE_SOURCE/BUN_OPTIONS absents selon sa vue JS, APPDATA uniques
et exacts. Le worker a arrêté avant compilateur/run/dist/cache, sans effacer ou
modifier de variable. Son erreur préalable de comparaison d'un SHA complet à un
préfixe était une erreur du lecteur, pas drift des inputs ni échec de compilation.
**Pas d'ACK vert ni GO worker**, malgré l'accès effectif aux pins de l'image.

## Décision prospective : exécution par le parent, worker toujours HOLD

L'autonomie de continuation autorise le parent à conduire cette validation.
Le même superviseur et le même MCP ContextMode sont conservés, sans nouveau
harness/provider/modèle ni changement de configuration. Le parent utilise son
launcher Bun existant ;il ne demande pas au worker de contourner son STOP.
Le launcher parent vérifie ses propres préconditions dans le processus effectif,
jamais par un digest comparé entre sandboxes. Aucune variable retirée, pas de
NODE_OPTIONS vide substitué ou de loader accepté implicitement.

Préflight21:45:49.733Z, PID47996 :execPathBun piné, FF8_ENSEMBLE_SOURCE,
NODE_OPTIONS et BUN_OPTIONS strictement absents casefold, autorités APPDATA uniques
et exactes ;1 175 pins image/source/reçus/plan/outillage/main vérifiés. Run/dist
toujours absents, aucune compilation. Le HOLD worker reste vrai ;son environnement
n'est ni « réparé » ni déclaré sûr par la propreté du processus parent.

## Contrat et sûreté conservés

COMBINED_PARTIAL_TC_BUILD_GATE_20261016.md/JSON281f60de restent byte-exacts et
définissent image, argv/cwd, cinq overrides enfants et bornes. Cet avenant change
**seulement l'identité du launcher** :parent seul, pas le modèle du worker ou son
ownership d'auteur. Après reçu FINALGO distinct/réservation/rechecks :une TC
Node→TS --noEmit, puis une BUILD Bun gardée seulement si TC naturel0/pins/env
conformes ;180s/120s,deadline300s. Aucun test/bundle exécuté, port/DB/cleanup.

Le script parent piné est parent-partial-compile-20261016.ts, SHA
91efe193658f8854aa52ae3b4a56af55742d77b10219fcacf22a1ab259496bde.
Il répète les préconditions/pins/ownership/guard avant spawn, garde les handles
enfants possédés, logs bruts et snapshots ;refus/rouge/drift/timeout=>HOLD sans
fix/rerun. L'observation de descendants est bornée, pas audit système universel.
Timeout éventuel ne prouve pas quiescence des descendants ;aucun kill étranger.

Fin naturelle/libération avant collecte, puis artefacts/caches raw conservés.
Le reçu de préflight et le futur FINALGO/réservation/résultats restent sous
.tmp/coordination-three-20261014/, pas assimilés au reçu helper du contrat2.

B01/B02/B03 full demeurent bloquants ;aucune exception de rétention ou suppression,
sourcefix, migration de harness ou configuration globale. Même TC/build verts
ne valent ni non-régression complète, ni L9/L10/native/intégration/main acceptés.
