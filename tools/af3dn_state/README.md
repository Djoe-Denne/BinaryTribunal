# Pack offline `tools/af3dn_state` (lots 17 / 21 / 22)

Snapshots **byte-identiques** (copie, jamais déplacement) des modules decode
vérifiés dans le workflow `tools/_tmp_af3dn_drop/decode/` : oracles
immuables `render_lot17.py` et `ff8dump.py` (sha figés dans le manifeste
Lot 22), plus `analyze_lot22_state.py`, `lot17_texture_window.py`,
`raster.py`, `texture.py`, `render_lot21.py`. Les trois suites de tests sont
des copies adaptées pour les chemins de fixtures et le refus d'une baseline
absente (pas de suite complète verte par skip). Aucun import
implicite du workspace d'origine : chaque fixture
réelle est résolue uniquement via une variable d'environnement dédiée
(`fixture_paths.py`), jamais par une recherche du workspace.

## Commandes (depuis la racine du dépôt)

```powershell
# Suite synthétique (38 tests, aucune ressource externe requise)
python -B tools/af3dn_state/run_offline.py --mode synthetic

# Suite complète (42 tests) : les 3 fixtures externes sont obligatoires,
# hashées contre le manifeste ; tout échec ou skip => FAIL
python -B tools/af3dn_state/run_offline.py --mode full `
    --baseline-v13 <gfx_passthrough_dump.bin> `
    --baseline-historical <battle13.bin> `
    --reference-image <20260929172809_1.jpg> `
    [--receipt PATH]
```

`--mode synthetic` filtre exactement les quatre tests d'intégration réels
(historique lot17 ; `Lot21IntegrationTests.test_v13_strict_capture_and_outputs`
; les deux tests de `test_lot22_state.py` lisant le dump v13 :
`test_14_strict_v13_parse_counts` et
`test_extra_build_id_v13_dump_rejected_by_candidate_reader`) pour lancer
exactement les 38 tests synthétiques.

## Ressources externes (full = 42 tests + 3 ressources)

- `--baseline-v13` : dump v13 `build 0x5640` (Lot 20) — hash attendu dans
  `repro_manifest.json` (`external_fixtures`, clé `v13`) ;
- `--baseline-historical` : capture battle13 (Lot 14, build `0x563D`) —
  clé `historical` ;
- `--reference-image` : visuel de jeu pour le composite pair Lot 21 —
  clé `reference`.
- Le runner exige ces arguments CLI et lie ensuite les trois variables
  `AF3DN_V13_BASELINE`, `AF3DN_HISTORICAL_BASELINE`, `AF3DN_REFERENCE_IMAGE`
  utilisées par les tests. Il ignore les anciennes valeurs de l'environnement.
  Défaut quand rien n'est fourni : sentinelle inexistante
  (`<AF3DN_FIXTURE_UNSET>`), **jamais** une recherche workspace.

## Critères de PASS

- `full` : 42 tests exécutés, zéro échec, zéro erreur, zéro skip, puis
  comparaison du diagnostic recalculé offline `analyze_v13()` avec le JSON de référence
  figé `state_matrix.reference.json` (`reference_diagnostic` du manifeste).
  Un statut `FULL_LOCAL_PASS` ne survient jamais par skip ; absent =>
  `BASELINE_MISSING` (exit 2), hash divergent => `BASELINE_HASH_MISMATCH`
  (exit 2).
  C'est le point d'entrée du verdict complet ; un lancement unittest brut
  sans les ressources requises échoue également, au lieu de les skipper.
- `synthetic` : 38 tests exécutés ; tout échec, erreur ou skip => FAIL
  (l'absence d'une ressource ne produit jamais de PASS).
- Hashes vérifiés **avant** tout import du paquet puis re-vérifiés en fin de
  course (`package_files`, `reference_diagnostic`, fixtures si liées) ;
  divergence => `PACKAGE_HASH_MISMATCH` (exit 2) ou FAIL (exit 1). Les chemins
  des modules réellement importés sont contrôlés, pas seulement un inventaire
  des fichiers présents.
- `--receipt PATH` écrit un reçu JSON statut/mode/tests/skips/exit_code/
  `diagnostic_match`/hashes/modules/versions (refuse d'écraser un fichier
  existant) ; l'orchestrateur peut aussi consommer le JSON sorti sur stdout.

## Dépendances transitive des snapshots

Python 3.12+, `numpy==2.2.2`, `Pillow==11.2.1` (`requirements.txt`). Tout est
offline (stdlib + numpy + Pillow), conforme au manifeste Lot 22
(`dependencies`) : aucun build, aucun appel shell externe, aucun réseau.

## Limites (restent valides)

- Diagnostic figé : `state_matrix.reference.json` est la référence ; toute
  divergence de `analyze_v13()` est un FAIL, pas une mise à jour silencieuse.
- Candidat v14 `NOT DEPLOYED` ; la preuve de checkout reste séparée ; fidélité
  UI `PARTIAL/BLOCKED`, exécution live `NOT AUTHORIZED`. Le pack ne pilote
  jamais de jeu ni de writer.
- Manifeste et hash final de verrouillage sont écrits par l'orchestrateur
  après ce livrable ; ce README n'a pas à les figer.

## Lot 23 : audits séparés du snapshot historique

`lot23_contract.py` est le point d'entrée d'audit strict du candidat `0x5641`.
Le snapshot `analyze_lot22_state.py` est conservé pour reproduction, **pas**
promu comme preuve d'un état appliqué par contexte. Une capture structurellement
acceptée reste incomplète : ST09 ne porte pas le contexte/device, le cap peut
perdre des événements sans flag, et stage0/applied sont indisponibles.

```powershell
python -B -m unittest discover -s tools/af3dn_state -p test_lot23_contract.py -v
python -B -m unittest discover -s tools/af3dn_state -p test_gate_writer_lot23.py -v
python -B tools/af3dn_state/lot23_contract.py <capture_candidate.bin>
```

`gate_writer_lot23.py --candidate <DLL_0x5641> --receipt <nouveau_recu.json>`
vérifie le hash candidat **avant** toute compilation/charge. Il compile seulement
le harnais x86 avec MSVC 2022, charge une copie dans un processus synthétique et
écrit ses résultats dans `%LOCALAPPDATA%/Temp/opencode/lot23-writer-*`. Il ne
recompile pas le writer, refuse `AF3DN.P` comme entrée et n'a aucune option de
déploiement/live. Le script générique historique n'est pas utilisé. Le résultat
build-only ne ferme pas les lacunes état → draw ni une gate post-copie.

`stage0_offline.py` fournit uniquement des expériences sur bytes/bytearrays et
des tokens synthétiques. Dépendance optionnelle : `capstone==5.0.6`
(`requirements_stage0.txt`, distincte des dépendances P0). Aucun installer,
assemblage exécutable, detour de production ou nouvelle instrumentation writer.

```powershell
python -B -m unittest discover -s tools/af3dn_state -p test_stage0_offline.py -v
```

La reproduction native requiert Windows, MSVC x86/SDK et le DLL externe exact.
Les hashes des captures natives générées sont propres au run (tokens pointeurs
opaques) ; on reproduit le contrat, les counts et les assertions, pas les adresses
du harnais d'un ancien processus.
