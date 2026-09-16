# Prompt de reprise — sémantique pipeline graphique (GLM 5.3 flash en sous-agents)

> **Coller ce document dans un nouveau chat.** Lire d'abord
> [`HANDOFF_semantic-triple-review.md`](HANDOFF_semantic-triple-review.md)
> (règles inviolables, pipeline, push IDB, cadence 5 par 5). Ce prompt
> **remplace** les mentions « Grok 4.6 xhigh » et « MCP glm-decompile » de ce
> HANDOFF : le protocole d'analyse (1+V / 1+P / 2+1) est inchangé, seul le
> **moteur** change. **Périmètre restreint sur demande utilisateur
> (2026-09-15) : PIPELINE GRAPHIQUE SEULEMENT.** Init (`0x47CE10`), exit
> (`0x47CEF0`), `FFBattleModule` (`0x47CF60`) et tout le non-graphique sont
> **mis de côté** — ne pas les prendre, même s'ils figurent dans le ledger.

## Changement d'outillage (2026-09-15, obligatoire)

1. **Le MCP `glm-decompile` n'existe plus.** Gateway LiteLLM tailnet
   (`desktop-s232dqi.tail040ac4.ts.net/litellm`) morte (HTTP 404). Ne pas
   chercher `glm_decompile_asm`, ne pas tester `glm_health`, ne pas
   authentifier ce namespace. Les fichiers `c_a.c`/`c_b.c`/`c_c.c`/
   `c_reconciled.c` ne sont plus produits : on extrait le **fonctionnel**
   directement depuis l'ASM (ground truth).
2. **GLM 5.3 flash est un modèle de sous-agent.** Pour décompiler / analyser,
   le parent orchestrateur spawn un `Task` avec :

   ```text
   model : fireworks/accounts/fireworks/models/glm-5p3-flash
   subagent_type : generalPurpose
   ```

   Ce slug exact est le seul validé — ne pas essayer `glm53-flash`,
   `glm-5.3`, ni « inherit » à sa place sans demande utilisateur explicite.
3. **MCP `ida-pro-mcp`** : peut être absent du catalogue Cursor au démarrage
   (bug intermittent). S'il manque, joignable en **HTTP direct** : JSON-RPC
   `tools/call` sur `http://127.0.0.1:13337/mcp` (IDB
   `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`). Helper existant (ne pas
   committer) : `tools/_tmp_wave_review/glm_triple/ida_rpc.py` — `rpc(name,
   arguments)` + `text_of(res)`. Tool principal : `py_eval` (IDAPython ;
   retours à la ligne via `chr(10)`, **jamais** `\\n` littéral).
4. **Accessoires inchangés** : `ctx_execute` (bac à sable pour `ida_rpc.py`),
   GrepAI, QMD (`qmd search … -c ff8-wiki`), Serena.

## État au 15 sept. 2026, 20:00 (fin de session)

- **Cluster GPU PS1 : 12/12 CERTAIN, clos.** Sémantiques dans `semantic/`,
  tags IDA `[semantic-triple 2026-09-15]` poussés sur les 15 EA traités
  (12 GPU + 3 battle faits avant), IDB sauvée.
- **Ledger** [`semantic-certainty.md`](semantic-certainty.md) : CERTAIN 25,
  LIKELY 283, SKIP_NODECOMP 143.
- Derniers commits : `72ff23e` (IDB 0x40763D), `aea3cf4` (0x4980C0),
  `9d06906` (0x499EA0).

## Périmètre : fonctions du pipeline graphique interne Square

Sont **incluses** : cœur OT/paquets GPU, draw-list/TIM/TPage/CLUT, render
state interne, parsers mesh ISO, émission primitives, blit/staging texture,
swirl overlay. Sont **exclues** : vendor PC (`RenderGL_*`, `RenderDDraw*`,
`GfxDriver_*`, backend constructors, `gl*` IAT), CRT, et tout le
non-graphique (battle logic, init/exit, UI, son, GF).

### Déjà fait — sémantique CERTAIN, ne pas retoucher (19)

**Session 2026-09-15 (20:04–20:20) ajoutées :**

| EA | Nom | Instr | Mode | Résultat | Commit |
|---|---|---|---|---|---|
| `0x4178D7` | `Gfx_WalkDrawList` | 65 | 1+P | CERTAIN, confirme — traversée gardée GfxDrawList236 : stamp gen `+0x58==*(+0x34)`, setup `[+0x9C]` une fois, walk `[+0xA0]` par nœud depuis head `+0x94` NULL-terminé, cookie = retour `FFGetBufferAddress`, cdecl 2 args, 30 code xrefs (Gfx_Submit* ×20+) | `58e47a4` |
| `0x419D8F` | `TextureRelated2` | 34 | 1+P | CERTAIN, **trop large** → proposition `Texture_BindOrUploadCached` — copie `desc+0x64 → tex+0x2C`, `Texture_FindTexture` (sélecteur bits &1/&2/&4 sur `*desc`, liste cache `upload_key+0x330`), `Texture_UploadRefcountOrReuse` (refcount `node+0x18`, handle `node+0x1C`, upload `BufApp+0x50`) ; EAX = handle ou 0 ; callers `TIMrelated_0` 0x407797 + `sub_414A40` 0x414AD1 | `ea4bdc1` |

| EA | Nom | Instr | Mode |
|---|---|---|---|
| `0x40702F` | `Gfx_InitDrawListDesc` | 34 | 1+P |
| `0x4070B0` | `Gfx_SetDescFilterMode` | 9 | 1+P |
| `0x407162` | `Gfx_SetPrimBlendMode` | 86 | 1+V (V=CORRIGE) |
| `0x407586` | `Gfx_SetTIMDescFlags` | 60 | 1+P |
| `0x40763D` | `Gfx_CopyDescFields92_68` | 16 | 1+P |
| `0x4076B6` | `TIMrelated_0` → `Gfx_CreateTIMDescFromFileOrCache` | 112 | 2+1 |
| `0x45C0F0` | `Gpu_PackDrawEnvPacket` | 109 | 1+V |
| `0x45C7A0` | `OtNode24_PoolAllocLink` | 59 | 1+P |
| `0x45C8E0` | `OtNode24_PoolAllocLink_Code1` | 34 | 1+P |
| `0x45C9B0` | `Gpu_PackOtTag1_DrawOffsetE5` | 15 | 1+P |
| `0x45CA50` | `Gpu_PackOtTag1_TexpageE1` | 20 | 1+P |
| `0x45D610` | `Gpu_DrawOTagCurrent` → `Gpu_DrawOTagThunk` | 5 | 2+1 |
| `0x4980C0` | `Gfx_SubmitDisplayLists` | 78 | 1+V (V=CORRIGE mineur) |
| `0x499EA0` | `Gfx_SubmitViewportLists` | 106 | 1+V (V=ACCEPTE) |
| `0x465930` | `Gfx_SubmitTexturePageLists` | 300 | decomp existe (rapide à reprendre : sémantique seule) |

### À faire — file graphique (ordre d'adresse)

| # | EA | Nom | Instr | État | Note |
|---|---|---|---|---|---|
| 1 | `0x4178D7` | `Gfx_WalkDrawList` | 65 | **FAIT 1+P CERTAIN confirme** (commit `58e47a4`) | wiki GfxDrawList 0xEC : +52 gen, +88 stamp, +148 head, +156 setup, +160 walk (= offsets 0x34/0x58/0x94/0x9C/0xA0) |
| 2 | `0x419D8F` | `TextureRelated2` | 34 | **FAIT 1+P CERTAIN trop large** (commit `ea4bdc1`) | proposition `Texture_BindOrUploadCached` (find sélecteur bits &1/&2/&4 + refcount upload) |
| 3 | `0x41E650` | `Gfx_SetRenderState` | 28 | pack sémantique prêt — **tête de file** | dispatch shadow slot 29 + commit slot 30 |
| 4 | `0x438599` | `Gfx_ShadowSetRenderState` | 15 | decomp oui, sémantique non | `*(engine+0xA84)[type]=value` |
| 5 | `0x43B50C` | `Gfx_ShadowSetRenderState_DDraw` | 15 | decomp oui, sémantique non | miroir DDraw |
| 6 | `0x463FC0` | `Gfx_TPageDescribePixelFormat` | 126 | decomp **déjà committé** (`decomp/0x463FC0__…`) — sémantique directe | pack GLM complet (17 fichiers) |
| 7 | `0x464DB0` | `Gfx_UploadCLUTSlot` | 147 | decomp **déjà committé** — sémantique directe | pack GLM complet |
| 8 | `0x464F70` | `Gfx_AllocTexturePageSlot` | 294 | decomp **déjà committé** — sémantique directe | pack GLM complet |
| 9 | `0x465CE0` | `Gfx_SelectTexturePageDrawList` | 288 | decomp **déjà committé** — sémantique directe | pack GLM complet |
| 10 | `0x4675C0` | `TexStaging_BlitRows` | 195 | decomp oui, sémantique non | scanline `dword_204DB38` 490 DWORD sans clamp (trou borné) |
| 11 | `0x4677D0` | `TexStaging_BlitCLUTAlpha` | 196 | decomp oui, sémantique non | |
| 12 | `0x507550` | `BattleMesh_RemapPrimitiveTPageBits` | 159 | decomp oui, sémantique non | |
| 13 | `0x5099D0` | `RenderGeometry` | 118 | decomp oui, sémantique non | itère segments mesh |
| 14 | `0x50F900` | `ParseVertices` | 297 | decomp UNCERTAIN | re-review demandée |
| 15 | `0x50FDF0` | `ParsePolygons` | 634 | SKIP_CHUNK | région dédiée, 4 passes FT3/FT4→OT |
| 16 | `0x56D5F0` | `BattleSwirl_SubmitOverlayQuad` | 95 | decomp oui, sémantique non | FVF `0x1C4` |
| 17 | `0x6DA980` | `MagFx_IndexPackedNodeTree` | 64 | decomp oui, sémantique non | |
| 18 | `0x7040B0` | `Ot_EmitPolyF4_320x216` | 37 | decomp **deja committe** — semantique directe | |
| 19 | `0x595AA0` | `Ot_EmitPrim_Code24_AVSZ3_FromObj44` | 56 | decomp **deja committe** — semantique directe | attention : hang GLM deja vu (824ee65) — budget `high` si retry |
| 20 | `0x5BD460` | `Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup` | 56 | decomp **deja committe** — semantique directe | clones : traiter un seul, verifier les 4 autres par diff |
| 21 | `0x5E48A0` | `Ot_EmitPrim_Code24_AVSZ3_FromObj2C` | 60 | decomp **deja committe** — semantique directe | variante `Obj2C` |
| 22 | `0x5EF910` | `Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup2` | 56 | decomp **deja committe** — semantique directe | |
| 23 | `0x60A290` | `Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup3` | 56 | decomp **deja committe** — semantique directe | |
| 24 | `0x649740` | `Ot_EmitPrim_Code24_AVSZ3_FromObj2C_Dup` | 60 | decomp **deja committe** — semantique directe | |
| 25 | `0x5079B0` | `BattleModel_LoadEdeaBodyWithIntegratedWeapon` | — | decomp **deja committe** (`decomp/0x5079B0__...`) — semantique directe | completeness a verifier au passage |
| 26 | `0x507E20` | `BattleModel_LoadWeaponInlineZellKiros` | — | decomp **deja committe** (`decomp/0x507E20__...`) — semantique directe | idem |

Complément : `BattleUI_WriteGp0Codes_E1E5` (`16 instr`, LIKELY, decomp) —
à la frontière UI/rendu : la prendre en fin de file si le temps le permet.

### Hors périmètre (ne PAS prendre)

- `0x47CE10` `FFBattleInitSystem`, `0x47CEF0` `FFBattleExitSystem`,
  `0x47CF60` `main::FFBattleModule` — mis de côté (demande utilisateur).
- Tout `Battle*` non rendu, `EnemyAI_*`, `domain::` non graphique, GF/summon,
  son (DSound*), UI (widgets), fichiers, monde.

## Pipeline par fonction (moteur remplacé, reste du HANDOFF inchangé)

```text
parent orchestrateur
  → pack contexte (IDA py_eval : disasm / proto / callees / callers /
    globals ; QMD wiki ; Hex-Rays si dispo) → tools/_tmp_semantic_triple/<ea>/
  → choisir le mode (HANDOFF §5.2)
  → Task GLM-A : pack seul   → semantic_a.md
  → Task GLM-V : pack + A    → semantic_v.md   (défaut)
        (ou review parent 1+P si ≤80 instr. ; ou escalade 2+1 §5.5 :
         Task GLM-B aveugle → Task GLM-R réconciliateur)
  → parent vérifie ancrages live (§5.6)
  → append IDA [semantic-triple 2026-09-15] via py_eval + save_database
  → semantic/<EA>__<Name>.md + ledger si classe change
  → git add CE fichier (+ ledger) + git commit
```

Contrats A/V/B/R : **identiques** au HANDOFF §5.3–5.5 (formats
`semantic_a.md`/`semantic_v.md`/`semantic_b.md`/`semantic_r.md`, verdict
ACCEPTE | CORRIGE | ESCALADE_2+1, pas de copie du verdict de A, l'opcode
gagne). Ajouter au prompt de chaque Task : « ground truth = ASM, ne jamais
renommer, pas d'invention de library calls, ordre args cdecl poussé
droite→gauche, ja/jb unsigned vs jg/jl signed ».

Pour les anciens SKIP_NODECOMP (lignes 6-9, 18-24, 25-26) : **decomp deja produits et committes** (verifie session 2026-09-15) - semantique directe, pas de decomp a produire. Seul `0x50FDF0` (SKIP_CHUNK, ligne 15) n'a pas de pack GLM.
`decomp/<EA>__<Name>.md` (3 GLM A/B/C puis réconciliation ASM — même
mécanique de sous-agents, contrat = modèle des `decomp/` existants avec
bloc C + « Ground truth live ASM »), **puis** la sémantique 1+V.

## Règles transverses (inchangées)

- Lots de **5**, en série, jamais N+1 avant commit de N ; rapport
  `EA | mode | confiance | nom | A==V`.
- Push IDB **append only** (`set_func_cmt`, jamais `set_comments`), pas de
  rename, pas de SetType.
- Git : uniquement `semantic/<EA>__<Name>.md` (+ `decomp/` si produit,
  + ledger si classe change). Jamais `tools/_tmp_*`, `.cursor/mcp.json`,
  `glm-mcp-function-budget.md`, `nul`, HANDOFF, decomp cosmétique
  (`0x491AD0`, `0x4922B0`), obsidian-docs M.
- Commit PowerShell `git add … ; git commit -m @"semantic(battle): <EA> <nom>"@`
  (ou `decomp(battle): …` pour un decomp seul).
- Répondre en français, court.
## Première action
1. `GetDynamicTools` (vérifier `ida-pro-mcp` ; sinon HTTP direct via `ida_rpc.py`).
2. Vérifier tags IDA absents sur les 5 EA de la file (py_eval `get_func_cmt`). FAITS : `0x4178D7`, `0x419D8F` (commits `58e47a4`, `ea4bdc1`).
3. **Tête de file : `0x41E650` `Gfx_SetRenderState`** — pack sémantique déjà prêt dans `tools/_tmp_semantic_triple/0x41e650/` (packer : voir trouvailles). Puis `0x438599` → `0x43B50C` → ligne 6 et suivantes.
4. Pack : `py -3 tools/_tmp_semantic_triple/pack_semantic.py <EA>` (si pas déjà).

## Trouvailles session 2026-09-15 soir (20:04-20:22)
1. **Outil packer sémantique** : `tools/_tmp_semantic_triple/pack_semantic.py` — packe une fonction en ~3 s (réutilise pack GLM `_tmp_wave_review/glm_triple/<ea>/` : asm_clean, c_a/b/c/reconciled, meta, hints, notes ; ajoute IDA live : asm.asm, callees+protos, callers xrefs, globals, hexrays.c, meta.json ; QMD wiki via CLI ; copie `decomp.md` du livrable git). Usage : `py -3 tools/_tmp_semantic_triple/pack_semantic.py 0x41E650`.
2. **Deja committes cette session** : `0x4178D7` 1+P CERTAIN confirme (`58e47a4`) ; `0x419D8F` 1+P CERTAIN trop large, proposition `Texture_BindOrUploadCached` (`ea4bdc1`). IDB `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64` : les 2 commentaires `[semantic-triple 2026-09-15]` poussés + `save_database` OK.
3. **Decomp status corrige** : lignes 6-9, 18-24, 25-26 = decomp deja produits ET committes (`git ls-files decomp/` verifie). Le doc disait a tort `decomp manquant`. Packs GLM presents pour toutes sauf `0x50FDF0`.
4. **Gfx_WalkDrawList verifie live** : 30 code xrefs / 0 data ; offsets GfxDrawList236 confirms (+0x18 ctx, +0x34 gen, +0x58 stamp, +0x94 head, +0x9C setup, +0xA0 walk) ; wiki QMD `battle-render-pipeline-entrypoints` aligne exact ; binder unique `0x41619A` écrit +0x9C/+0xA0 par paires.
5. **TextureRelated2 verifie live** : 2 callers seulement (`TIMrelated_0` 0x407797, `sub_414A40` 0x414AD1), 0 data ; callee `0x419410` = sélecteur format bits &1 MatchPaletteStrict / &2 FormatCallback / &4 MatchEngineFormat sur `*desc`, match liste `upload_key+0x330` ; callee `0x419CBE` = refcount `node+0x18`, handle `node+0x1C`, upload callback `BufApp+0x50`.
6. **Piege packs** : `hexrays.c` pack peut etre stub erreur (param addr manquant) et `asm.asm` parfois tronque — l'analyste doit toujours re-récupérer via MCP IDA live en cas de doute (vue au `0x4178D7` et `0x419D8F`).
