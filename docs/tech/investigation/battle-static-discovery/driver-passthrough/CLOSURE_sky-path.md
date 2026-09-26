# CLOSURE lot 15 — Chemin du ciel/fond battle (battle13) — driver-passthrough

- IDB: FF8_EN.exe base 0x400000, ouverte via ida-pro-mcp (disasm/decompile/py_eval/xrefs_to). Ground truth = IDB uniquement.
- Portée: closure ciel/fond battle pour la DLL passthrough (capture limitée aux slots driver 43–64, Gfx_WalkDrawList 0x4178D7).
- Hypothèses du lot: (a) rendu via tables dispatch GPU = chemin non-43–64 ; (b) clear-color slot 8 + gradient ; (c) autre.
- Verdict: **(c) AUTRE — le fond/ciel est composé dans le framebuffer PSX émulé (VRAM 0x1B47818 → RT1) par des primitives VRAM (GP0 0x02 fill, 0x80 MoveImage, sprites 0x64–0x7F) et présenté par un chemin RT1→écran qui ne déclenche aucun draw slot 43–64.** (a) est *réfutée au niveau du flush* (les polys issus des tables finissent dans `Gfx_WalkDrawList`, donc capturables) ; (b) est *réfutée par la couleur* (clear battle = vec4 {0,0,0,1.0} NOIR).

## 1. Preuves (EA + 1 ligne disasm chacune)

| # | EA | Extrait | Sens |
|---|----|---------|------|
| 1 | `0x47D071` | `call Gpu_EnableOTagHostPass` | main::FFBattleModule force `dword_B7CC24=1` **chaque frame battle** (setter `[0x45B580-0x45B58B]`, une instruction `mov dword_B7CC24,1`) |
| 2 | `0x47D100` | `call sub_45B590` | clear `B7CC24=0` — branche focus-loss uniquement (`IsWindowNOTActive`@0x47D0BB → jz 0x47D10A ; is_sleeping jz 0x47D067) ; `FFBattleExitSystem` set=1 @0x47CF3E à la sortie |
| 3 | `0x45D29D` / `0x45D2B8` | `call Gpu_DrawOTagWithDispatchTable` | `Gpu_DrawOTag` ré-émet l'OT : passage **opaque** (`g_GpuPrimDispatchOpaque 0xB7CF08`) puis **semi** (`g_GpuPrimDispatchSemiTransparent 0xB7D308`), `World_loadTextureVRAM_updateAnim` @0x45D288, `dword_B7CC20` 1→0→1 @0x45D293/0x45D2B3/0x45D2CB |
| 4 | `0x460D26` | `jmp Gfx_SubmitTexturePageLists` | `Gpu_EndPrimitivePass` (0x460CE0) : pass opaque (B7CC20=1) → soumission de **toutes** les listes TPage via `Gfx_WalkDrawList` (0x465930 : walks `dword_1CB6030/34` sous RT1, `dword_1CCFD44/48/4C` sous RT0, banques 0x44C/0x470) |
| 5 | `0x460CB6` | `call Gfx_WalkDrawList` | `Gpu_FlushCurrentDrawList` : la liste courante `dword_1CA9A88` (pass semi) est marchée par le même `Gfx_WalkDrawList 0x4178D7` → slots 43–64 |
| 6 | `0x46114B` / `0x46118D` | `call GfxDriver_SelectRenderTarget` | `sub_461100` (appelée par `sub_461A30` si `!B7CC20`) : primitives `code&2` (texturés, sprites 0x64–0x7E) → **RT1** ; autres → **RT0** + `Gfx_SetRenderState(2,1)` |
| 7 | `0x4623C7..0x462456` | `mov dx,[ecx+8]` / `cmp dx,280h` / `cmp si,0F0h` / `lea esi,ds:1B47818h[ecx*2]` / `rep stosd` / `add esi,800h` | handler `g_GpuPrimDispatchOpaque[0x02]` (0x4623A0) : GP0 FillRect remplit la **VRAM émulée 0x1B47818** (garde w≥640 && h≥240, bornes 1024×512) — **aucun appel driver, aucun slot 43–64** |
| 8 | `0x47CF8D..0x47CFA5` | `mov [esp+var_1C],0` / `mov [var_18],0` / `mov [var_14],0` / `mov [var_10],3F800000h` → `call isGetDrawBuf` | clear battle slot 8 (wrapper 0x41E168 : `call dword ptr [ecx+20h]` @0x41E1A5, vec4 → buf+0x28..0x34) : le vec4 = **{0,0,0,A=1.0} NOIR opaque** — le slot 8 n'est pas le ciel bleu |
| 9 | `0x462E80` | `call sub_45BB00` | handler `[0x80]` MoveImage de la table opaque : copie VRAM→VRAM (composition de tuiles, ex. backdrop), thunks E1–E7 → famille 0x45BAxx–0x45BC60 |

Lecture : le clear peint du noir (#8) ; les draws polys (monstres, HUD, effets) transitent par `Gfx_WalkDrawList` (#4/#5) = slots 43–64 wrappés. Or l'observation lot 15 est : slots capturés **sans** backdrop ciel. Le seul constituant plein-écran prouvé hors draws est la composition VRAM (#7, #9) + présentation RT1 (#6) — chemin non wrappé. (Inférence marquée en §5 : l'EA du blit final RT1→RT0 n'est pas encore isolée.)

## 2. Table code→handler — g_GpuPrimDispatchOpaque 0xB7CF08 (53 entrées non-null / 256)

| Code | Handler | Nom IDA |
|------|---------|---------|
| 02 | 0x4623A0 | sub_4623A0 (GP0 FillRect VRAM — cf. decomp livrable) |
| 20,21 | 0x460F20 | Gpu_EmitPolyF3 |
| 24,25 | 0x4617F0 | Gpu_EmitPolyFT3 |
| 28,29 | 0x461340 | sub_461340 |
| 2C,2D | 0x461A90 | Gpu_EmitPolyFT4 |
| 30,31 | 0x4615D0 | sub_4615D0 |
| 34,35 | 0x461E00 | sub_461E00 |
| 38,39 | 0x4616C0 | sub_4616C0 |
| 3C,3D | 0x462030 | sub_462030 |
| 40,41 | 0x462470 | sub_462470 |
| 48,49 | 0x462610 | nullsub_964_cronos_used |
| 4C,4D | 0x462620 | nullsub_965_cronos_used |
| 50,51 | 0x462630 | sub_462630 |
| 58,59 | 0x462700 | nullsub_966 |
| 5C,5D | 0x462710 | nullsub_967 |
| 60,61 | 0x462720 | sub_462720 |
| 64,65 | 0x462AA0 | (sans nom — sprite 0x64) |
| 68,69 | 0x462990 | sub_462990 |
| 70,71 | 0x462A80 | nullsub_968 |
| 74,75 | 0x462E40 | (sans nom — sprite 0x74) |
| 78,79 | 0x462A90 | nullsub_969 |
| 7C,7D | 0x462E60 | (sans nom — sprite 0x7C) |
| 80 | 0x462E80 | (sans nom — thunk sub_45BB00, MoveImage) |
| A0 | 0x462E90 | nullsub_970 |
| C0 | 0x462EA0 | nullsub_971 |
| E1 | 0x462EB0 | (sans nom — thunk au_re__sprintf_3, texpage) |
| E2 | 0x462EC0 | (sans nom — thunk sub_45BC60) |
| E3 | 0x462ED0 | (sans nom — thunk sub_45BA30) |
| E4 | 0x462EE0 | (sans nom — thunk sub_45BA60) |
| E5 | 0x462EF0 | (sans nom — thunk sub_45BAD0) |
| E6 | 0x462F00 | (sans nom — thunk sub_45BB00-ish) |
| E7 | 0x462F10 | (sans nom) |

## 3. Table code→handler — g_GpuPrimDispatchSemiTransparent 0xB7D308 (49 entrées non-null / 256)

| Code | Handler | Nom IDA |
|------|---------|---------|
| 22,23 | 0x460F20 | Gpu_EmitPolyF3 |
| 26,27 | 0x4617F0 | Gpu_EmitPolyFT3 |
| 2A,2B | 0x461340 | sub_461340 |
| 2E,2F | 0x461A90 | Gpu_EmitPolyFT4 |
| 32,33 | 0x4615D0 | sub_4615D0 |
| 36,37 | 0x461E00 | sub_461E00 |
| 3A,3B | 0x4616C0 | sub_4616C0 |
| 3E,3F | 0x462030 | sub_462030 |
| 42,43 | 0x462470 | sub_462470 |
| 4A,4B | 0x462610 | nullsub_964_cronos_used |
| 4E,4F | 0x462620 | nullsub_965_cronos_used |
| 52,53 | 0x462630 | sub_462630 |
| 5A,5B | 0x462700 | nullsub_966 |
| 5E,5F | 0x462710 | nullsub_967 |
| 62,63 | 0x462720 | sub_462720 |
| 66,67 | 0x462AA0 | (sans nom) |
| 6A,6B | 0x462990 | sub_462990 |
| 72,73 | 0x462A80 | nullsub_968 |
| 76,77 | 0x462E40 | (sans nom) |
| 7A,7B | 0x462A90 | nullsub_969 |
| 7E,7F | 0x462E60 | (sans nom) |
| E1–E7 | 0x462EB0–0x462F10 | (sans nom — mêmes thunks que table opaque) |

Remarque : pas de 0x02 (fill), 0x80, 0xA0, 0xC0 dans la table semi — le fill/MoveImage ne vivent que dans la table opaque ; codes 0x40–0x7F semi en paires (0x42/43 etc.).

## 4. Ancrage v11 (observation, sans coder)

1. **`sub_461100` @0x46114B** — `GfxDriver_SelectRenderTarget(1, engine)` quand une primitive `code&2` change de liste (pass semi). Condition d'entrée : `list != dword_1CA9A88 && (prim_code & 2) != 0 && dword_1CA9A84 != 0`. C'est le point où les polys texturés entrent dans RT1 (framebuffer PSX) : y observer les draws capturés = reconstituer le rendu DANS RT1, mais pas le contenu initial de RT1 (le fond).
2. **`Gfx_SubmitTexturePageLists` 0x465930** — marche des listes RT1 (`dword_1CB6030/34`) puis compositing `SetBlendMode(4)+SelectRenderTarget(0)` final : le compositing RT1→RT0 se joue entre ces deux anchors.
3. **Primitives VRAM** — `g_GpuPrimDispatchOpaque[0x02]` 0x4623A0 (fill ≥640×240) et `[0x80]` 0x462E80 (MoveImage) : anchors directs de la composition du fond en VRAM ; jamais visibles dans les slots 43–64.
4. **Clear slot 8** — `isGetDrawBuf` 0x41E168 (`call [ecx+0x20]` @0x41E1A5) : non wrappé ; en battle il pousse du noir (0x47CF8D–0x47CFA5). Le slot 8 reste un anchor obligatoire pour reproduire l'état initial du RT.

## 5. Inférences marquées (non prouvées, à clore lot 16)

- L'EA exacte du **blit final RT1→RT0/écran** n'est pas isolée : aucun draw slot 43–64 ne la porte (sinon le ciel serait capturé) ; candidats = EndScene/Present du driver hors slots, ou un chemin dédié. C'est l'angle mort principal.
- La source VRAM du backdrop battle13 (fichiers BG → tuiles VRAM via `World_loadTextureVRAM`/TPDirty `sub_45B920`+`sub_4649A0`) est établie au niveau famille mais l'EA du compose BG reste à tracer.
- Le rôle exact des sprites 0x64–0x7F (0x462AA0/0x462E40/0x462E60, sans nom) dans la composition du fond : non décompilé ce lot (hors budget).

## 6. Conséquence capture

Le fond noir de la capture battle13 = absence du compositing RT1→RT0 (et du contenu VRAM initial de RT1) dans la DLL : capturer les slots 43–64 ne suffira jamais ; il faut observer RT1 (ou ses constituants VRAM/clear) — cf. §4.
