---
title: GFX Decomp Campaign 2026-09-19 → 22
category: references
tags: [ff8, rendering, reverse-engineering, reference]
aliases: [gfx decomp campaign, campagne mag FX 68/68, lot 6 mag FX, lot 10 reste BdLink, campagne OpenCode 2026-09-19]
sources:
  - opencode://ses_f468a1076ffeHEoTylbt45tSXY
  - opencode://ses_f4508f24bffeAWE2W1u5o7VMlj
  - opencode://ses_f41f3400dffeVYHXIfI7tD4m2d
  - opencode://ses_f41bed887ffdrq55G605Tk5I4J
  - opencode://ses_f405ea302ffdu0o0j63WluxhMf
  - opencode://ses_f404bbf4affeGxjkjXCZeBfufi
  - opencode://ses_f3b40e4b7ffexBVi6kRct2Bqnz
  - ~/.local/share/opencode/opencode.db (466 sessions subagents de la campagne, couvertes par les livrables docs/tech/investigation/battle-static-discovery/)
  - docs/tech/investigation/battle-static-discovery/HANDOFF_gfx-pipeline-decomp.md
  - docs/tech/investigation/battle-static-discovery/HANDOFF_lots-post-magfx.md
summary: Campagne décomp gfx via OpenCode (09-19→09-22) — lot 5 clos, lot 6 Magic FX complet 68/68, lot 10 BdLink 6 fonctions, census traîne 108, lot 12 live provenance, incidents et reprises.
provenance:
  extracted: 0.90
  inferred: 0.08
  ambiguous: 0.02
created: 2026-09-22T12:00:00+02:00
updated: 2026-09-22T12:00:00+02:00
---

# GFX Decomp Campaign 2026-09-19 → 22

Suite et clôture de la campagne lancée le 2026-09-17 ([[projects/re-ff8/references/semantic-pipeline-sessions-2026-09]]) : cette fois exécutée par des **orchestrators OpenCode** avec sous-agents (infra décrite dans [[concepts/opencode-setup-skills-mcp]]), protocole inchangé ([[projects/re-ff8/references/semantic-triple-pipeline]]). En quatre jours : lot 5 clos, **lot 6 Magic FX complet 68/68**, lot 10 « reste BdLink » clos, census de la traîne BdLink, et lot 12 (provenance driver) en parallèle. Les 466 sessions subagents de la DB OpenCode sont couvertes par les livrables `docs/tech/investigation/battle-static-discovery/` — cette page ne distille que les décisions de campagne.

## Lot 5 + représentants lot 6 (2026-09-19) ^[extracted]

Pool de 5 subagents, une fonction par worker en contexte neuf à chaque rotation ; méthode repassée en **triple GLM 2+1** (2 décompileurs + reviewer réconciliateur, idem sémantique) avec reasoning level ajustable. Bilan de session : **24 fonctions closes** (5 en 1+V, 19 en triple 2+1), poussées IDB en append-only (tag `[semantic-triple 2026-09-19]`, commentaires glm-triple préservés) et committées.

- **Lot 5 complet** (13 fonctions transitions/swirl), tous CERTAIN : triade module init/exit/loop, runners normal/boss, phases, pacer, setup/restore viewport.
- **Lot 6, représentants Magic FX** (5) : `0x6CBF90` (MAG_112, CERTAIN), `0x6A79B0` (CERTAIN, tête réelle corrigée), `0x6A45E0` (LIKELY), `0x6A1660` (CERTAIN = **MAG_212_Timeline_Tick**, sort ID 212, livrable 1107 lignes, commit `a8b3462`).
- Index à jour : catalogue (16 lignes, EA `0x6A7A20` → `0x6A79B0` corrigée) + ledger (29 lignes semantic-triple). HANDOFF réécrit : checkpoint §0 = reprise sur les **68 EA Magic FX** restantes.

## Lot 6 Magic FX complet 68/68 (2026-09-20 → 22) ^[extracted]

Reprise après l'incident ci-dessous, avec une règle nouvelle : **« cellule = contrat, pas agent »** — pas de sous-orchestrateurs, l'orchestrator lance directement les voix. Une cellule = 1 fonction : pack → 4 voix parallèles (`c_a`, `c_b`, `semantic_a`, `semantic_b`, ground truth = `asm.asm`, `hexrays.c` en simple vérificateur) → **contrôle au sol** (4 fichiers non triviaux sur disque, sinon relance isolée de la voix sur l'autre provider) → C-R + semantic-R **contre l'ASM, jamais une moyenne** → check parent (callees/callers, strides, polarité setcc, largeur de retour, nom justifié par ≥2 preuves) → push IDB append-only + `save_database` → livrable `decomp/` + commit → catalogue + ledger → rapport compact.

| Bloc | Plage EA | Clôtures | Verdicts |
| --- | --- | --- | --- |
| A | `0x69E420`→`0x69FD50` | 17 | 8 CERTAIN / 8 LIKELY |
| B | `0x6A01B0`→`0x6A2940` | 17 | 10 CERTAIN / 7 LIKELY |
| C | `0x6A2A90`→`0x6A30C0` | 17 | 8 CERTAIN / 8 LIKELY |
| D | `0x6A3960`→`0x6A5DB0` | 17 | 10 CERTAIN / 6 LIKELY |
| **Total** | | **68** | **34 CERTAIN / 34 LIKELY** |

- Livrables : 82 commits depuis le 20/09 ; 68 commentaires IDB `[semantic-triple 2026-09-20/21/22]` + save final (`FF8_EN.exe - 9.3.i64`) ; catalogue +68 lignes ; ledger +68 lignes (9 colonnes).
- Outillage produit : `finish_cell.py` (clôture idempotente, parseur IDBCOMMENT universel), `probe_xrefs.py`, `save_now.py`, `push_4710_rev.py`, `rpc_read.py`.
- Chaînes complètes sémantisées : **MAG_212** (thunk → loader → setup → stepper → ticker → tâche enfant `0x69EF60` → helpers) ; **MAG_207 Maelstrom** (thunk → loader → setup → stepper → sous-task → callback → builder → émetteurs `0x32`/`0x3A` + builder quads `0x2E`) ; famille `0x6A1xxx`–`0x6A3xxx` (utilitaires particle/render/camera, batch vec2 normalize LZCS) ; émetteurs pipeline GTE/OT (`0x6A4710/4BA0/5120` faces/tris/quads, `0x6A5650/5700/5950/5AD0/5C90/5DB0` sous-builders).
- Reste au HANDOFF : §0/§3 à mettre à jour au **68/68** (dernier checkpoint committé à 62/68, `7b39fb4`/`d0c44af`).

## Incident : run autonome avorté (2026-09-20) ^[extracted]

Le premier run sur la file 68 (pool de **sous-orchestrateurs tournants**) n'a committé qu'**une fonction** (`0x69E5E0`, `e4f51b1`) en ~1 h. Diagnostic : **hang pur** d'une voix (opencode-go, C1/sem_a annulée sans jamais rien écrire — pas une lenteur) ; sa relance sur zai a livré le fichier attendu. Matériel préservé dans `tools/_tmp_semantic_triple/` (gitignored), IDB intacte. Correctifs retenus pour la reprise : cellule = contrat (plus de sous-orchestrateurs), clôture en chaîne shell unique (`finish_cell`), contrôle au sol des fichiers avant de continuer, relance voix isolée sur l'autre provider, plafond de voix par provider, watchdog. Leçon : un hang silencieux de voix doit être détecté par **absence de livrable sur disque**, pas par l'état de l'agent. ^[inferred]

## Lot 10 « Reste BdLink » (2026-09-20) ^[extracted]

Exécuté depuis `HANDOFF_lots-post-magfx.md`, 6 fonctions closes (1 en 2+1, 5 en 1+P), 6 commits `76f4592`…`20fd69f` :

| EA | Mode | Nom retenu | Apport clé |
| --- | --- | --- | --- |
| `0x56FE10` | 2+1, LIKELY | `BattleTask_FlyPathCameraAim_TrailFx_Step` | Vise la caméra sous bone15, chemin de vol 64 pts (stride 8), rend acteur + quads traînée dans l'OT `+0x44`, retour EAX=2 (détach) ssi compteur >0x1E |
| `0x6804B0` | 1+P, CERTAIN | `FieldCameraInterpTask_Spawn_6804B0` | Spawn du tick d'interp caméra terrain sur liste fixe `25080C0` (« Spline » du premier nom non prouvé) |
| `0x63E960` | 1+P, CERTAIN | `GFCameraScriptTask_Spawn_63E960` | Spawn de l'interpréteur caméra-script GF + écriture unique du signe miroir X `dword_24FBE78` |
| `0x65F250` | 1+P, CERTAIN | `BdLinkTask_RegisterAndBindEntry_2505438` | Registre + bind `node+0xC = *(*(table+0x64)) + arg×0x30 + 0x10` |
| `0x65E4B0` | 1+P, CERTAIN | `BdLinkTask_RegisterAndBindEntry_25053C0` | Jumeau byte-exact du précédent |
| `0x659960` | 1+P, CERTAIN | `BdLinkTask_Tick_GfDiabloPacketStream` | Tick packet-stream GF Diablo, curseur `g_BattlePacketCursor` in/out, détach si step=0 |

Le check parent a tranché 4 fois : retour `0x56FE10` = `xor eax,eax` propre (réfutation du « return unchanged ») ; polarité miroir de `0x63E960` = **−1 ssi `rand()%n==1`, +1 sinon** ; zéro du descripteur de `0x659960` à `desc+0x14` (pas `+0x1C`) ; renommage de `0x6804B0`. Contrat queue consigné au census (`battle-static-call-graph.md` § Lot 10) : Pump invoque `node+8` @`0x508434`, racine par ID 1..14, busy/completion = 0 (occupe) vs 2 (détache, bit AL) avec guards de pause, drain par-séquence. Incidents : commentaire IDA tronqué à la limite 1024 car. (remplacé par version compacte relue) ; les 6 lignes ledger ont été capturées par le commit concurrent `f47d9ef` de la session mag FX tournant en parallèle sur le repo — ledger sale en worktree au moment du commit. Risques résiduels : `0x56FE10` reste LIKELY (identité gameplay de `sub_56F9C0`, table `0xC7EFBC`, non recoupée wiki) ; attribution Diablo de `0x659960` contextuelle. ^[extracted]

## Census de la traîne BdLink (estimation) ^[extracted]

Census IDA resserré sur les fonctions **nommées** BdLink : 127 au total, 19 déjà taguées, **108 restantes** — 81 thunks ≤20 instr, 27 wrappers 21–80 instr, **zéro >80 instr** (max 58). Conclusion : ce n'est pas un lot de décompilation mais **un lot de classification**. Plan de clôture en 3 phases proposé : (A) census mécanique script IDA + clusterisation par signature structurelle, livrable réel = **table de dispatch exhaustive** liste/task-ID → handler → sémantique (le vrai contenu de U25.2) ; (B) traitement par cluster — thunks en one-liner `set_func_cmt` (convention KEEP), wrappers en 1+P avec 1 représentant CERTAIN par cluster et jumeaux validés par diff ASM (4–6 patterns réels attendus), handlers distincts nommés + contrat 1 ligne ; (C) clôture contractuelle — zéro xref non comptée vers Register/Pump, ce qui débloque U25.7. Volume estimé 1–2 jours. Corpus adjacent repéré mais **exclu du lot** : les drivers de séquence GF réels (`GF_291Pandemona_SequenceTaskDriver` 3134 instr, Diablo 2402, Quezacotl 1537) appartiennent au territoire G25.3/G28 (cinématiques GF), lot séparé. ^[extracted]

## Lot 12 / +1 — provenance driver (live, observation seule) ^[extracted]

Campagne live P0 bornée : observation du present path (DirectDraw Flip/Blt, SwapBuffers, D3D9 Present/EndScene), zéro injection/patch, copie hash-bound `064d466b…`, détach vérifié en fin, une seule session live à la fois. Constats :

- **Fenêtre A** (écrivain de `engine+0xA74`) : tranché structurellement — l'écrivain **n'est pas dans le `.text` natif** (scan complet `0x401000`–`0xB69000`, zéro `mov [reg+0xA74]`) ; suspect principal = loader DotEmu embedded (section `.bind`, 676 Ko compressé) ou shim de compatibilité Windows ; alternance ~11–14 Hz à signature stable (EAX=`0x1A4B98`).
- **Fenêtre B** (compte per-frame D3D9) : non conclusive — le scan plat `0x06C00000`–`0x70000000` a rendu 0 refs (device COM en heap bas et `d3d9.dll` @`0x70AA0000` hors plage) ; il faut passer par un bp `CreateDevice` (lot +2). Le heapscan (18 min, milliers d'aller-retours MCP) s'est détaché proprement — l'impression de script encore actif venait du badge UI d'OpenCode sur la session subagent.
- **Découverte** : `AF3DN.P` n'est pas une couche de translation mais un **renderer D3D9 complet** (shaders HLSL, tables MODE_BATTLE/SWIRL/WORLDMAP) — DotEmu a réimplémenté le renderer ; la voie d'injection officielle (factory `engine+0xBD0`, installée 2/2 boots) est confirmée. Livrable : `driver-provenance.md` (§P0/§+1, repo).

## Incidents transverses ^[extracted]

| Incident | Résolution / leçon |
| --- | --- |
| Hang pur d'une voix opencode-go (jamais rien écrit) | relance isolée de la voix sur l'autre provider ; contrôle au sol des fichiers livrés avant de continuer |
| Rate limits zai-coding-plan (429) | ≤ 2 voix zai simultanées ; quota journalier à 91 % (reset 21h57) → bascule opencode-go seule puis retour |
| ida-pro-mcp potentiellement surchargé | sleep aléatoire 10–120 s (pas de skip) devant réponse inattendue |
| Ledger sale par commit concurrent entre sessions parallèles sur le repo | relire/capturer le ledger avant commit quand deux sessions tournent |
| Commentaire IDA tronqué (limite 1024 car.) | version compacte + relecture, jamais deux fois le même commentaire |
| « Accès refusé (os error 5) » sur mise à jour Cursor (2026-09-21) | deux proxys 1MCP `node.exe` démarrés 3 s avant le nouveau binaire tenaient l'ancien `node.exe` mappé comme image exécutable — tuer les processus dont le début précède la création du fichier débloque l'installateur |

## État de fin de campagne ^[extracted]

File §0.2 **vide, lot 6 mag FX fermé**. Restent ouverts : mise à jour finale du HANDOFF §0/§3 au 68/68 ; la traîne BdLink (108, plan de classification 3 phases, décision commit par fonction vs par cluster non prise) ; le lot +2 (bp `CreateDevice` → vtable d3d9 Present) ; le territoire G25.3/G28 (drivers de séquence GF). ^[extracted]

## Liens

- [[projects/re-ff8/references/semantic-pipeline-sessions-2026-09]] — antécédent : lancement de campagne, lots 1–4, checkpoint 0x559AF0.
- [[projects/re-ff8/references/semantic-triple-pipeline]] — protocole 1+V/2+1, invariants IDB, ledger.
- [[projects/re-ff8/references/battle-static-call-graph]] — census BdLink, contrat queue du Lot 10, périmètre rewrite/U25.
- [[projects/re-ff8/references/decomp-function-catalog]] — index des livrables `decomp/`.
- [[projects/re-ff8/re-ff8]] — état d'avancement projet.
- [[concepts/opencode-setup-skills-mcp]] — l'infra OpenCode qui a exécuté cette campagne.
- [[concepts/codex-agent-orchestration]] — leçons de pools/subagents transverses (hang, rate limits).
