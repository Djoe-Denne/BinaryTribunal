# Prompt — 14 fonctions chunk (>600 instr.) — un sous-agent Grok 4.6 par fonction

> Coller tel quel dans un **nouveau chat Grok 4.6** (parent).
> Première action : lancer les **14** `Task` en parallèle, puis t’arrêter.
> Campagne **distincte** du triple GLM (`HANDOFF_glm-triple-review.md`)
> et de R1. Ici : **pas de GLM**, **pas de push IDB**, **pas de commit**.

Tu es l’orchestrateur. Tu ne décompiles pas. Tu lances **un sous-agent
par fonction** ci-dessous, modèle **`cursor-grok-4.6-xhigh` uniquement**
(aucun autre slug). Les 14 partent **dans le même tour**, en parallèle.
Ne poll pas : lance et attends les notifications de fin.

## Autorisations (override R1 pour cette campagne)

Chaque sous-agent **a le droit** de :

- lire tout le repo (`docs/`, wiki `obsidian-docs/`, skills) ;
- utiliser **tous les MCP en lecture** : IDA (`disasm`, `lookup_funcs`,
  `callees`, `xrefs_to`, `stack_frame`, `basic_blocks`, `get_bytes`,
  `get_string`, `decompile` **en vérif seulement**), GrepAI, Serena
  (jamais `activate_project`), context-mode `ctx_search` / `ctx_fetch`
  si besoin ;
- lancer `qmd search` / `qmd get` (`-c ff8-wiki`) — lecture seule ;
- **écrire uniquement** le fichier MD de sa fonction (voir chemin).

Chaque sous-agent **n’a pas le droit** de : `SetType`, `set_func_cmt`,
`rename`, `patch`, `patch_asm`, `save_database`, `qmd update` / `embed`,
commit / push, toucher un autre dossier que le sien, écraser
`glm.md` / `grok.md` / `resolved.md` déjà présents (GetText).

Hex-Rays (`decompile`) = **vérificateur après coup**, jamais la source
du C. Ground truth = `disasm` Intel + labels IDA (`loc_`, `def_`, `jpt_`).

## File (14) — une ligne = un `Task`

| # | EA | Nom IDA | Instr | Dossier |
|---|---|---|---:|---|
| 1 | `0x50FDF0` | `ParsePolygons` | 634 | `0x50fdf0__ParsePolygons` |
| 2 | `0x51B4E0` | `Archive_GetFile` | 642 | `0x51b4e0__Archive_GetFile` |
| 3 | `0x681630` | `GF_277Carbuncle_SequenceTaskDriver` | 670 | `0x681630__GF_277Carbuncle_SequenceTaskDriver` |
| 4 | `0x5106E0` | `sub_5106E0` | 743 | `0x5106e0__sub_5106E0` |
| 5 | `0x50E510` | `BS_DispatchStageById` | 821 | `0x50e510__BS_DispatchStageById` |
| 6 | `0x504BB0` | `BattleEffectScript_Interpreter` | 1088 | `0x504bb0__BattleEffectScript_Interpreter` |
| 7 | `0x550070` | `sub_550070` | 1118 | `0x550070__sub_550070` |
| 8 | `0x48D200` | `domain::BattleAction_GetText` | 1280 | `0x48d200__BattleAction_GetText` |
| 9 | `0x48FE20` | `domain::BattleAction_ResolveAndApplyDamage` | 1308 | `0x48fe20__BattleAction_ResolveAndApplyDamage` |
| 10 | `0x4FDD90` | `presentation::BattleSubmenu_StateMachine` | 1369 | `0x4fdd90__BattleSubmenu_StateMachine` |
| 11 | `0x4ADDB0` | `domain::BattleDrawMenu_StateMachine` | 1408 | `0x4addb0__BattleDrawMenu_StateMachine` |
| 12 | `0x4D7410` | `sub_4D7410` | 1922 | `0x4d7410__sub_4D7410` |
| 13 | `0x487DF0` | `domain::EnemyAI_VM_ExecuteScript` | 2447 | `0x487df0__EnemyAI_VM_ExecuteScript` |
| 14 | `0x4F02F0` | `not_used_sub_4F02F0` | 7392 | `0x4f02f0__not_used_sub_4F02F0` |

Chemin unique par fonction (déjà gitignoré, **à côté** des dumps vague) :

`tools/_tmp_wave_review/<dossier>/chunk.md`

Le dossier `0x48d200__BattleAction_GetText` **existe déjà** (`glm.md`,
`grok.md`, `resolved.md` incomplets). Le sous-agent GetText écrit
**seulement** `chunk.md`. Ne pas toucher aux trois autres.

## Prompt à coller dans **chaque** `Task` (adapter EA / nom / dossier)

Copie ce bloc 14 fois. Change uniquement les 4 champs `<<…>>`.
`description` : `chunk <NomCourt>`. `model` : `cursor-grok-4.6-xhigh`.
`subagent_type` : `generalPurpose`. `run_in_background` : `true`
si le parent est en multitâche, sinon `false` et lance les 14 quand même
dans **un seul** message (14 appels `Task` parallèles).

---

Réponds en français. Tu es un seul sous-agent. Périmètre : **une**
fonction FF8 PC battle.

- EA : `<<EA>>` (requête IDA **par VA**, jamais le nom `domain::` seul)
- Nom IDA : `<<NOM>>`
- Instr attendues : `<<N>>` (confirmer via `disasm` / `include_total`)
- Livrable **obligatoire** : écrire (créer le dossier si besoin)

`c:\Users\djden\source\repos\retro-eng\re-ff8\tools\_tmp_wave_review\<<DOSSIER>>\chunk.md`

Repo : `c:\Users\djden\source\repos\retro-eng\re-ff8`
IDB : `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`
IDA MCP : `project-0-re-ff8-ida-pro-mcp` (`GetDynamicTools` avant d’appeler)
PE SHA-256 : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`

Mission : reconstruire le **C fidèle à l’ASM live** (Intel + labels IDA).
Pas de GLM. Hex-Rays = vérif après, pas une entrée. Si la fonction est
trop longue pour un `disasm` unique, **pagine** par régions naturelles
(prologue / dispatch / passes / handlers) et concatène dans **un** MD.

À packer avant d’écrire le C :

1. `lookup_funcs` + `disasm` (paginer, `include_total`)
2. `stack_frame` + `callees` (+ `add esp` des calls) + 2–5 `xrefs_to`
3. Docs : `docs/tech/systems/` (surtout `render_*.md` pour la géométrie),
   `docs/tech/investigation/battle_loop_render_pipeline_entrypoints.md`,
   `qmd search "<nom ou EA>" -c ff8-wiki -n 5 --files` puis `qmd get`
4. Checklist : strides `lea`/`shl` en nombres ; polarité `setcc` /
   `ja` vs `jg` ; `add esp` = args cdecl ; retour AL vs EAX ; jump
   table sans cases inventées ; stores à la bonne largeur.

Interdit : muter l’IDB, rename, patch, `save_database`, `qmd update`,
commit, écraser `glm.md`/`grok.md`/`resolved.md`, décompiler une autre
fonction que `<<EA>>` (les callees se **citent**, on ne les réécrit pas).
Serena : pas d’`activate_project`. PowerShell : `py -3`, pas de `head`.

Pièges connus (ne pas « corriger » l’ASM pour coller au nom) :
- `F_CHAR` stride **0x1D0**, slot **0xD0** (Hex-Rays `__int16*` ment)
- `ParsePolygons` : 4 passes ctx+`8/A/C/E`, index `lea ebx,[esi+edx*8]`,
  FT3 32 o / `0x24000000` / tag `0x07000000` ; FT4 40 o / `0x2C` / `0x09` ;
  verts projetés 8 o ; unique caller `RenderGeometry` `0x5099D0`
- `GetText` `0x48D200` : vague 12 sept. **UNCERTAIN** (plages 450–529 et
  710–1049 non paginées) — tu dois paginer **tout** le corps
- Noms catalogue menteurs ailleurs : décrire les opcodes

Format de `chunk.md` :

```markdown
# <<NOM>> @ <<EA>>

- Instr (live): N
- Palier: chunk
- Régions paginées: [EA start–end, rôle]
- Callers: …
- Callees: …
- Push IDB: non (campagne lecture + dump)
- Notes: <strides, polarités, trous restants>

## C

```c
…listing complet, ou un bloc par région avec un commentaire d’adresse…
```
```

Quand le fichier est écrit, ton message final = chemin + `Instr (live)`
+ 5 lignes max (ce que fait la fonction, 1 trou s’il en reste). Pas de
roman. Si MCP IDA down : écris quand même `chunk.md` avec `STATUS: BLOCKED`
et ce qui manque.

---

## Après les 14

Tableau : EA | `chunk.md` oui/non | instr live | 1 phrase.
Ne **pas** pousser l’IDB. Ne **pas** committer (`tools/_tmp_wave_review/`
est dans `.gitignore`). Si un sous-agent rate, relance **celui-là**
seul, même prompt.

## Références parent (ne pas les déléguer à relire en entier)

- Skill IDA / pièges : `docs/tech/investigation/battle-static-discovery/HANDOFF_glm-triple-review.md` §2, §8, §10
- Budget : `docs/tech/investigation/battle-static-discovery/glm-mcp-function-budget.md` (table « Hors un appel »)
- Géométrie : `docs/tech/systems/render_animation.md` §3 (`ParsePolygons`)
- Entrypoints : `docs/tech/investigation/battle_loop_render_pipeline_entrypoints.md` (table RenderGeometry / ParsePolygons)
