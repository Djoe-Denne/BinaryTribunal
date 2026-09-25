---
title: "[LOT 12-TER] Drop Test AF3DN.P — Campagne Live 2026-09-25"
category: references
tags: [ff8, rendering, reverse-engineering, reference]
aliases: [drop test AF3DN.P, campagne live 2026-09-25, lot 12-ter driver, AF3DN.P v6.1]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-drop-test-af3dn-2026-09-25.md
  - docs/tech/investigation/battle-static-discovery/driver-provenance.md
  - docs/tech/investigation/battle-static-discovery/driver-abi-spec.md
  - tools/_tmp_af3dn_drop/gfx_passthrough_v6.1_campaign.csv
summary: >-
  Drop test live AF3DN.P (lot 12-ter) - hooks boot, wrap du present 0x41DF0C, 9 650
  frames capturees, draw lists et render states logges, retour vanilla sans residu.
  PASS criteres 1-4 et 5.
provenance:
  extracted: 0.92
  inferred: 0.08
  ambiguous: 0.00
created: 2026-09-25T00:00:00+02:00
updated: 2026-09-25T00:00:00+02:00
---

# [LOT 12-TER] Drop Test AF3DN.P — Campagne Live 2026-09-25

> Source primaire (repo, commitee `50419da`) : `driver-drop-test-af3dn-2026-09-25.md` — cette page est le miroir distillé pour le vault Obsidian. Objectif de campagne : faire charger **notre** DLL (v6.1, 136 704 B) par le jeu via le mécanisme natif `AF3DN.P` et capturer un jeu de représentation moteur complet en mode observation ("Mode A observer"), sans modifier le rendu natif.

## Verdict : PASS

- Critères 1–4 : PASS (charge + alloué + hook au present, cadence des slots de scène intacte, draw-lists menu **et** battle capturées, ~5 min de combat stable, rendu et HUD normaux).
- Critère 5 : PASS — validé par **contrôle séparé** (va-et-vient vanilla) : base re-téléchargée Steam, boot open-world 74 s, sortie propre sans résidu.

## 7 Découvertes structurantes ^[extracted]

1. **`AF3DN.P` = dépendance statique de `FF8_EN.exe`** — la table d'imports du jeu référence 8 fonctions `dotemu*` (voir [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] et [[projects/re-ff8/references/external-gfx-driver-sources]]). L'original DotEmu (209 920 B, PE 2014, PDB `FF8_Project\Driver\ff8_d3d_D4E\Steam Release\AF3DN.pdb`) exporte 18 noms (9 décorés + 9 alias C) et **aucun** `new_dll_graphics_driver`. Un drop-in doit donc fournir ces exports : solution retenue = **forwards PE purs** vers `dotemu_orig.dll` (copie renommée de l'original DotEmu), zéro code propre dans la DLL, le loader résout la chaîne.
2. **La factory type-2 n'a pas servi au véhicule live** : le boot natif de la copie parchée démarre toujours sur le **backend natif case 0 (DDrawAlt, ctor `0x4257D0`)**. `engine+0xBA8)` reste 0 (valeur d'usine, non ré-écrite), `engine+0xB88` = 1 après boot. Le ctor OpenGL (`0x4252B0`, case 3) **échoue en live** sur ce port (AV au present `0x41DF34` — run v2 : `+0xA74` reste null → present sur driver null).
3. **`DD_init` (`0x40C40C`) exige le bit 0 de `engine+0xBBC` = 3** (posé par le case 0 natif ; lot 12 `DD_init`). Sans ce bit : `retour 0` silencieux → le jeu quitte sans message (run "dead boot", fenêtre opencode-2 session 2026-09-25, tentative "wrap CheckRegistry" / "hook boot" v5 au lieu du present).
4. **`engine+0xBD0` = `0x6CA652C0` est un simple marqueur openc side** : posé par le boot DotEmu standard (valeur présente avec la seule `dotemu_orig.dll`, sans la nôtre). Ce n'est pas un proxy/point d'ancrage, c'est un état du jeu à读取 post-boot par l'outil d'observation. Renforce le lot 12 : géré par DotEmu, pas par FFNx, [confirmé live avec les contre-preuves v5.5] (ref. lot 12 : emulator flag, jamais re-écrit en jeu).
5. **`engine+0xA74` du driver = point d'accroche post-init idéal (wrap "idempotent")** : méthode retenu = **wrap au présent `Render_FramePresent_Dispatch` (`0x41DF0C`)** et définition idempotente par lecture re-croisée sur 3 hits consécutifs (run v6, 171 frames). Le détournement de `CheckRegistry` (`0x401890`) est abandonné : il fallait rester **hors** de la fenêtre boot → loop (run v5 : quit 3 s taux 0 présente, rendu natif conservé, run v6.1 : trampoline 0x41DF0C coupé → fenêtre noire — le present 0x41DF0C [trampoline dans les runs antérieurs] est le bon point d'attache, pas l'init). AVant run v6.1, run v6 wrap at present à `0x41DF32` AV dans notre module — déplacé / durci au sous-ensemble run v6.1, hook posé via `OutputDebugString_1` (`0x403D99`) — détecté et fixé par le fichier .watch-pass (le hook à `0x41DF0C` est le point d'attache retenu).
6. **Le "no-op slot 20" est fatal en live** : run v6 = **171 frames puis quit 18 s** (mort après 2 appels — dry-run du README au run v6.1). Correctif v6.1 : copie du fnptr "slot 20" à chaud via buffer alloué au stockage/modifié, call sign-converted (`@sub_420917`).
7. **La fenêtre de tolérance à l'erreur d'environnement (copie de test) est *obligatoirement* saine via re-dl Steam** : le "vanilla de contrôle" a montré **quit environnemental 74 s** jusqu'à re-téléchargement de la base Steam (exit 53 du dry-run vanilla pur). La copie re-dl Steam →boot sain sur la copie d'observation avec **notre DLL en mode passif** ("no-hook build" run C) : confirme que tous les crash des runs v2–v5/C viennent de notre code actif, jamais de la cohabitation DLL passive (sain). Toujours re-télécharger la base Steam avant une nouvelle campagne liveAF.

## Instruments : launcher + observateur

Le protocole de campagne : launcher Windows (Steam plaçant `AF3DN.P` avec forwards), observateur externe (résumé 9 650 frames, draw-cap, slot-pulse 43-64), hooks boot via detours **E9Triple** (2 detours posés dans `DllMain` avec preimage vérifiée), l'accroche au **present dispatch** au premier appel (fast-path ensuite), logging CSV append-only des slots.

**Version livrée : v6.1** (`AF3DN.P` = 136 704 B, SHA256 `EE3D30B9…60EE5`).

Chaîne d'exécution : `DllMain` (trace `#dll_loaded`, pose 2 detours E9 avec preimage vérifiée) → boot natif 100 % (case 0, `DD_init`, plein écran/windowed natif) → premier present dispatch : wrap idempotent de `engine+0xA74` (fast path par frame ensuite) → tous les slots de rendu passent par les wrappers (log + forward).

## Critères PASS ^[extracted]

| # | Critère | Verdict | Preuve |
| --- | --- | --- | --- |
| 1 | Chargement driver + objet alloué | PASS | `#dll_loaded`, `#hook,present=1,ods=1`, `#wrapped_at_present,native=0x07AA2770,proxy=0x0FBD0000` |
| 2 | Cadence slots Init/BeginScene/SelectTarget/LeaveScene/Present | PASS | slot 40 →13 945, slot 41 →13 945, slot 39 →102 159, slot 4 (Present) →9 650 |
| 3 | Draw lists capturées menu ET bataille | PASS | slot 51 →494 942, slot 47 →237 943, slot 49 →28 626, slot 45 →8 236, slot 44 →20 034, slot 63/61 →200, slot 64/62 →50 (2 Fireaga + attaques ennemies) |
| 4 | ~5 min bataille sans crash, rendu + HUD normaux | PASS | 9 650 frames forwardés via proxy, 0 AV, 0 WER, opérateur : « rendu et HUD normaux » |
| 5 | Aller-retour vanilla sans résidu | PASS (contrôle séparé) | base re-téléchargée Steam, boot open world 74 s, sortie propre, dossier sans résidu (`gfx_passthrough*` déplacé hors jeu) |

## Chronologie des itérations live (v2 → v6.1) ^[extracted]

| Run | Symptôme | Cause | Correctif |
| --- | --- | --- | --- |
| v2 (18:05) | AV `0x41DF34` au present | factory case 2 : ctor OpenGL `0x4252B0` échoue sur le port DotEmu → `+0xA74` nul → present sur driver nul | abandon du chemin case 2 (voir v6) |
| v3 (18:27) | mort au chargement, dialogue | FF8_EN.exe **importe statiquement** `dotemu*` depuis AF3DN.P ; notre DLL ne les exporte pas | forwards PE v4 |
| v4 (18:39) | AV dans AF3DN.P offset `0x366B` | detour CheckRegistry : arg0 lu à `[esp+0x24]` au lieu de `[esp+0x28]` (return address au lieu de engine) | offset corrigé |
| v5 (11:0x) | wrap posé, jeu quit 3 s, 0 slot | wrap sur CheckRegistry = intrusion dans la fenêtre boot→loop ; jeu quitte avant tout rendu | wrap déplacé au present dispatch (v6) |
| v6 (11:2x) | 171 frames via proxy puis quit 18 s | **slot 20 no-op ret 0** (README §5 le signalait) appelé 2× en fin de session | slot 20 = copie fnptr natif DDrawAlt (v6.1) |

**Contrôles A/B/C** ^[extracted] :

- **A (vanilla pur, 10:4x)** : quit quelques secondes — a révélé l'environnemental (base Steam).
- **B (vanilla re-dl, 10:56)** : 74 s en jeu (open world), sortie propre — environnement sain.
- **C (notre DLL inerte `nohook`, 11:0x)** : open world — la DLL chargée est inoffensive ; le tueur était notre code actif → corrigé slot 20 + wrap.

Lectorat : `#checkreg` (v5.5) a prouvé `sel=0, ret=1, b88=1` — le boot natif case 0 réussit ; `bd0=0x6CA652C0` = signature DotEmu (lot +4 confirmé).

## Capture : draw lists et render states ( Mode A observer ) ^[extracted]

CSV rendement : 99 201 211 octets, 1 977 816 lignes, archivé **hors git** à `tools/_tmp_af3dn_drop/gfx_passthrough_v6.1_campaign.csv` (SHA256 `EB5FDCA3D48F7A50F107433307CDFC25E77A4CF2DC3CE0796A4CD3AF1BC23826` — consigné dans [`obsidian-docs/.manifest.json`]).

Compteurs complets par slot : slot 29 (Gfx_SetRenderState) → 845 054, slot 51 → 494 942, slot 47 → 237 943, slot 39 → 102 159, slot 18 → 61 277, slot 7 → 61 274, slot 33 → 41 690, slot 49 → 28 626, slot 44 → 20 034, slot 41 → 13 945, slot 40 → 13 945, slot 26 → 10 291, slot 4 (Present) → 9 650, slot 5 → 9 307, slot 8 → 9 307, slot 50 → 8 340, slot 45 → 8 236, slot 27 → 1 152, slot 63 → 200, slot 61 → 200, slot 19 → 110, slot 64 → 50, slot 62 → 50, slot 24 → 28, slot 6 → 1. **Slot 20 pas loggé** (copie native transparente v6.1).

Chaîne de boot : `#dll_loaded` → `#hook,present=1,ods=1` → `#wrapped_at_present`.

## Implications architecture (suite) ^[inferred]

- La **voie drop-in (dotemu dropin)** est démontrée à l'échelle : collecter les traces complètes (draw lists 43–64, render states 0–25, forward succès, 9 650 frames) fournit le profil by-pass réel des slots natifs de rendu qu' [[projects/re-ff8/concepts/external-battle-renderer-architecture]] veut reconduire (hot reinstall de l'objet driver par `engine+0xA74` wrapper, per-frame).
- L'accroche **au present dispatch** (`0x41DF0C`) exclusive de [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] — l'ordonnance frame → present est centralisée, un seul hook par-frame suffit à la capture complète du pipeline de présentation.
- Ce n'est **pas la spec §7-1/§7-2** (type-2, voie launcher-safe, config 36B avant boot `0x401890`) qui est déployée en live — le retour vanilla (contrôle A/B) reste le référentiel de mesure. La spec §7-1/7-2 reste le contrat d'architecture ; ce test montre en revanche que le return-attendu (`AF3DN.P` de DotEmu = drop win32 des apps) marche en pratique sans le type-2.

## Limites / suite

- Les ODS de `DD_init` n'ont pas été capturées (`OutputDebugString_1` probablement inlinée par /Ox du jeu) — le traceur ODS reste posé (sans effet si inlining).
- Replay Mode B/C : `Passthrough_ReplayCaptured` non exercé (hors périmètre lot 12-ter).
- Le chemin « factory case 2 » (spec §7-1/§7-2) reste documenté mais n'est pas le véhicule live : le wrap post-init au present dispatch est le mécanisme démontré.
- La copie opérateur `.bak` (FFNx complet) est conservée ; la copie test est re-téléchargeable via Steam (validation d'intégrité) à tout moment.

## Provenance evidences (hashes)

- `FF8_EN.exe` (copie test) SHA256 `064D466B5FE2BA901FD44ABF19F37C0FD6A2DB40AABD95C9E5959195B6589570` — hash EXE inchangé d'une campagne live à l'autre (ancre Post-P0 / lot 12).
- `AF3DN.P` v6.1 (notre DLL) SHA256 `EE3D30B967F160F6CF97C1B8C2D0AC711652F81AEF39302454D14C212A560EE5` — 136 704 B.
- `dotemu_orig.dll` (original DotEmu) SHA256 `539558E4F5CF495735CCC8D5E98A185E3660CEB8D5DDF21EB7558B02FBB21FEC`.
- `gfx_passthrough_v6.1_campaign.csv` (99 201 211 octets, 1 977 816 lignes) SHA256 `EB5FDCA3D48F7A50F107433307CDFC25E77A4CF2DC3CE0796A4CD3AF1BC23826` — consigné dans le manifest du vault, fichier brut hors git (immutabilité garantie).

## Related

- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] — la matrice driver natif (slots 0–25, present dispatch).
- [[projects/re-ff8/references/external-gfx-driver-sources]] — le contrat factory, la comparaison FFNx/Aali, la provenance live de la copie opérateur.
- [[projects/re-ff8/references/gfx-decomp-campaign-2026-09-19-22]] — l'historique de campagne decomp/live dont le lot 12 (+ live provenance) est le socle.
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]] — l'architecture cible servant à interpréter les traces.
- [[projects/re-ff8/references/battle-loop-takeover-feasibility]] — la preuve du takeover per-frame (structuration de la fenêtre boot→loop).
