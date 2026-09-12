# GF / Magic Asset Loading

How a Guardian Force (and any magic effect) gets its model + animation into memory and onto the screen. This is the "data" half of a summon; see `gf_families.md` for the "code" half (handler shapes).

## Two parallel registration tables

Every effect is registered by **1-based `effect_id`** in two parallel function-pointer arrays (stride 4):

| Table | Base | Slot |
|-------|------|------|
| `MagicList_Logic[effect_id-1]` | `0xC81774` | entry/logic callback (`GF_xxx_InvokeSummonScript`, `MAG_xxx_*`) |
| `MagicList_TextureLoad[effect_id-1]` | `0xC81DB8` | file loader (`*_FL`) |

Valid range: `effect_id-1 < 400`.

| GF | effect_id | Logic | TextureLoad (`_FL`) |
|----|-----------|-------|---------------------|
| Cerberus | 203 | `0xB0C1A0` | `0xB0C170` |
| Alexander | 204 | `0xAFFCA0` | `0xAFFC70` |
| Brothers | 205 | `0xAF4520` | `0xAF44F0` |

## Resolver: Magic_GetIDLoad (0x50AF20)

IDA name `BattleGF_LoadCallbackByMagicID`. Used by 5 callers : `Tick_Generic` (`0x50AA94` → slot C4), `Tick_DefaultOrFC` (`0x50B1D4` → C4), `Tick_GF_Cinematic` (`0x50B3AC` → C4), `Tick_Special` (`0x50B91E` → C4) et `Tick_DefaultParamAFFFF` (`0x50BC56` → slot C0).

```c
int Magic_GetIDLoad(int magicID, int (**out_cb)(int)) {
    int idx = magicID - 1;                 // range-checked < 400
    Magic_ClearMemoryForTex();             // reset shared arena
    if (MagicList_TextureLoad[idx]) MagicList_TextureLoad[idx]();  // LOAD files
    *out_cb = MagicList_Logic[idx];        // return entry callback
    return Magic_GetFileArena();           // ex-Magic_TextureOFF_ToEAX1 @ 0x571B50: returns &g_MagicFileArena, not 1
}
```

## File loaders (`*_FL`) — taxonomie Wave3, pas « exactement deux fichiers »

Sur 343 loaders non nuls : 265 à un appel `IO_GetFile_MAGIC` (dont Phoenix étendu), 58 paires `magN_b.00/.01` (bijection avec les 58 entries FamilyB Logic), 17 `ret` (no-op FL : 15 TIM EXE embarqués + 2 zéro TIM slots 68/343 — le pack d’un autre slot n’est pas consommé par le FL `ret`), Tonberry slot 89 à 3 TIM (`mag089_0/1/2.tim`), Devour slot 61 à 5 TIM (`mag061_0us/1/2/3.tim` + `mag061.tim`), Cactuar slot 198 unique via `Magic_LoadTexture_IO_GetsFile_DefaultArgs @ 0x5718E0`, Phoenix slot 139 étendu (1×IO + 2×`Magic_GetFileArena` + 2×`Magic_ArenaSize_1MiB` + callback `sub_6A6360` vers `1DCD6E8`).

Exemple FamilyB (le seul cas « deux fichiers ») :

```c
int MAG_204_ALEXANDER..._FL() {            // 0xAFFC7F
    dword_2796DA4 = IO_GetFile_MAGIC("mag203_b.00");
    dword_2796DA0 = IO_GetFile_MAGIC("mag203_b.01");
}
int MAG_203_CERBERUS..._FL() {             // 0xB0C170
    dword_2796DDC = IO_GetFile_MAGIC("mag202_b.00");
    dword_2796DD8 = IO_GetFile_MAGIC("mag202_b.01");
}
```

**File naming (FamilyB seulement)** : `mag<slot>_b.00` and `.01` — the *0-based* slot index. Alexander id 204 / slot 203 -> `mag203`; Cerberus id 203 / slot 202 -> `mag202`. Hors FamilyB : `mag<slot>.tim` ou packs partagés (`mag000-049`, `mag096-099`, `mag140-158-159-258-331-332`, `mag326-329`, `mag013-073-344`, `mag333`…), voire TIM d’un slot étranger (slot 225 → `mag296.tim`).

## IO_GetFile_MAGIC (0x571B80) -> davAoyLoadMagicDataPlusBuffer (0x571900)

`davAoyLoadMagicDataPlusBuffer` (src `C:\FF8\Battle\aoy\jp\dav_aoy.cpp`, IDA name `Magic_LoadTexture_IO_GetsFile`):

1. build path `"\FF8\Data\Magic\" + name`,
2. try `Archive_GetFile` (`0x51B4E0`, VFS) first,
3. else `fopen(path, "rb")` on disk, read whole file,
4. write into the **shared 1MB magic arena** `g_MagicFileArena` (`0x20DFAB8`), bump-allocated via `g_MagicArenaOffset` (`0x21DFAB8`) — or `AllocateMemory` on the heap path,
5. track the alloc in `g_MagicFileAllocTable` (`0x21DFAC0`, count `g_MagicFileAllocCount` `0x21DFABC`, up to 256) **only on the heap path** (`a2==0`; the arena path is never tracked),
6. return arena (or heap) pointer. `Magic_LoadTexture_IO_GetsFile_DefaultArgs @ 0x5718E0` (`name,0,0,0`) is the only heap caller (Cactuar).

`Magic_ClearMemoryForTex @ 0x571870` zeroes the arena per effect (`rep stosd 0x40000`, offset←0, leak-check on residual alloc entries), so only one effect's files are resident at once. The active effect latches its files into the indexed table `g_MagicFileChunkTable @ 0x2798A68` (`[0]`=`.00`, `[1]`=`.01` a.k.a. `Magic_b_01`, indexed beyond — FamilyB `0x8Exxx–0xBxxxxx` only, never the generic `0x50xxxx` engine); ticks/consumers read `table[i*4]` (sentinel `0xFF` in helpers).

## File format

- `mag<N>_b.00` — model/geometry+texture container. **Fixed DWORD header, NOT a C0M-style count+offsets** (`[0]=0`, `[5]=0x30`, `[1]==[7]` on all fixtures; `mag203_b.00` is 73444 bytes, head `00…C8…74…`). File-relative pointers consumed by FamilyB inits: `+0x04/+0x10/+0x18` → scene binds (`MAG_331_Magic00Init @ 0x8E00F0`, slot 330 / effect_id 331), `+0x14` → TIM/alt table (`Magic_ReadAlternativeTexture @ 0xB664A0`), `+0x20` → camera resource (`BattleCamera_BindResource`, dispatch case 1), `+0x24` → table for `sub_4A29A0` (case 2). `+0x0C` lu par `sub_B657E0` (clos) ; `+8` sans lecteur FamilyB isolé (ouvert). No `BS_CopyGeometry` on mag.00.
- `mag<N>_b.01` — animation/scene stream with **four tables, none of them `BattleEffectScript_Interpreter @ 0x504BB0`** (that VM drives actor/C0M-H5 scripts via `0x50DB40` — link refuted). MAG_331 (slot 330): (i) **OBJ0** `funcs_8E61E7 @ 0x1852708` (13 utiles, `[obj+0x18]`, 23 sites) ; (ii) **PARTICULE** `funcs_8E3BB7 @ 0x1852894` (low-byte, ~96, 2 sites `0x8E3BB7/0x8E3BDC`) ; (iii) **STREAM16** `funcs_8E96EC @ 0x1852A98` (`s16&0x1FF`, ~236/328-alloc/512-arch, 4 sites des passes ±) ; (iv) **DRAW** `dword_18528F4` (`[obj+0x1C]`). Alexander stream = `funcs_B0BC5C @ 0x18729C0` (`s16&0x1FF`), objet = `0x1872630`. Bind local 8-case (`([ptr+0x4A]>>12)-1` → `jpt @ 0x8E53C0` / Alexander `GF_204Alexander_BindDispatch @ 0xB07830`). Bootstrap : premier IP **positif** (`obj0[0]` → `seqCtx+0x94`). Chunk opcode 6 : lecture `[0,127]` (`&0x7F`), `&0x3F` = file-id preload ; A2 **mutable** (`Op178_SetSeqCtxA2 @ 0x8E55E0`, STREAM16 idx 178, 58 clones) ; défaut `[seqCtx+0xA2]=0` (BSS/calloc + word `0xF000` @ `0x5E3CA1`/`0x648B9B`). `.01+0x74` = curseur `seqCtx+0x74` layout-dépendant, pas un champ header. Objects stride 256 from `.01+[.01+0x1C]` (`dword_27973E8` = current object); stream cursor `g_MagVm_IP @ 0x2797450`. Stream opcodes 33/43/49 = `Op33_SeqPtrBind` / `Op43_PlaySE` / `Op49_SubmitTIM` (alias PH9 Op162/172/178).

## Shared with magic (not GF-only)

The loader, the arena, the entry->tick contract, and the per-frame animation engine are shared by **all** effects, magic included. Routing differs by the sequence-type byte `payload[1]` (`0x1D280C5`) in `BattleActionSequence_DispatchTick` (`0x50A790`) — not the domain `COMMAND_TYPE_ID @ 0x1D27AD9` : GF cinematics (`0x26`/`0xF4`/`0xFE`, sauf paramA 15/70) -> `Tick_GF_Cinematic` (`0x50B2A0`), Odin/Gilgamesh `0xF5` (+`0xEC`) -> `Tick_Special` (`0x50B830`), le reste via le défaut (`0xFFFF`/`+6==0`/`+2`) vers `Tick_Generic`/`Tick_DefaultOrFC`/etc. All call `Magic_GetIDLoad` and then invoke the resolved entry (F7/F1/ED/EE réutilisent le C4 sticky sans load local).

Evidence the *animation engine* is one shared template: `MAG_223_METEOR_SequenceTick` (`0xA8FF00`, SHA `0af51636…`) and `GF_204Alexander_SequenceTick` (`0xB00310`, SHA `be9bc791…`) share size `0x215`, counter/parity, camera view-matrix mirror, 3 scene passes and `g_GfCinematic_*` globals — same FamilyB gabarit, **not** byte-identical (Wave3 : l’ancienne mention « byte-for-byte » est fausse). Meteor appelle `sub_A95CD0`, pas la table Alexander `dword_187281C` (réservée à `0xB06E00`). Only per-effect subroutines and the modulo period (`au_re_bs_modulo_41` vs `_50`) differ. GF adds: random stage camera + `0x8000` takeover, geometry swap (`BS_CopyGeometry`), GF Boost, longer state sequence (10 vs 8 substeps).

## See also

- `gf_families.md` — handler shapes (entry/init/tick families)
- `gf_shared_infra.md` — shared globals, BdLinkTask
- `../reference/kernel_tables.md` — `K_GF_JUNCTIONABLE` -> magicID
- Obsidian: `projects/re-ff8/references/gf-asset-loading-and-authoring.md`
