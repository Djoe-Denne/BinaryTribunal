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

IDA name `BattleGF_LoadCallbackByMagicID`. The single resolver used by `Tick_Generic` (`0x50AA94`), `Tick_GF_Cinematic` (`0x50B3AC`), and `Tick_Special` (`0x50B91E`).

```c
int Magic_GetIDLoad(int magicID, int (**out_cb)(int)) {
    int idx = magicID - 1;                 // range-checked < 400
    Magic_ClearMemoryForTex();             // reset shared arena
    if (MagicList_TextureLoad[idx]) MagicList_TextureLoad[idx]();  // LOAD files
    *out_cb = MagicList_Logic[idx];        // return entry callback
    return Magic_TextureOFF_ToEAX1();
}
```

## File loaders (`*_FL`)

Each loader pulls exactly two files and stores the arena pointers into per-GF globals:

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

**File naming**: `mag<effect_id-1>_b.00` and `.01` — the *0-based* index. Alexander 204 -> `mag203`; Cerberus 203 -> `mag202`.

## IO_GetFile_MAGIC (0x571B80) -> davAoyLoadMagicDataPlusBuffer (0x571900)

`davAoyLoadMagicDataPlusBuffer` (src `C:\FF8\Battle\aoy\jp\dav_aoy.cpp`, IDA name `Magic_LoadTexture_IO_GetsFile`):

1. build path `"\FF8\Data\Magic\" + name`,
2. try `Archive_GetFile` (`0x51B4E0`, VFS) first,
3. else `fopen(path, "rb")` on disk, read whole file,
4. write into the **shared 1MB magic arena** `g_MagicFileArena` (`0x20DFAB8`), bump-allocated via `g_MagicArenaOffset` (`0x21DFAB8`),
5. track the alloc in `g_MagicFileAllocTable` (`0x21DFAC0`, count `g_MagicFileAllocCount` `0x21DFABC`, up to 256),
6. return arena pointer.

`Magic_ClearMemoryForTex` resets the arena per effect, so only one effect's files are resident at once. The active effect points the shared scratch `Magic_b_00` (`0x2798A68`) / `Magic_b_01` (`0x2798A6C`) at its own files in its entry; playback reads through those.

## File format

- `mag<N>_b.00` — model/geometry+texture container. Multi-section header: `u32 section_count` then `section_count+1` `u32` offsets (last = total size). `mag203_b.00`: count 4, offsets `0x18,0x2C8,0xCE80,0xDC14,0xDC14` (total 0xDC14). Consumed by `BS_CopyGeometry` / `Magic_ReadAlternativeTexture`. (Section roles not byte-decoded yet.)
- `mag<N>_b.01` — animation/scene stream interpreted per frame by the GF tick. (Encoding not byte-decoded yet.)

## Shared with magic (not GF-only)

The loader, the arena, the entry->tick contract, and the per-frame animation engine are shared by **all** effects, magic included. Routing differs by `COMMAND_TYPE_ID` in `BattleActionSequence_DispatchTick` (`0x50A790`): GFs -> `Tick_GF_Cinematic` (`0x50B2A0`), magic -> `Tick_Generic` (`0x50A9A0`), Odin/Gilgamesh -> `Tick_Special` (`0x50B830`). All call `Magic_GetIDLoad` and then invoke the resolved entry.

Evidence the *animation engine* is one shared template: `MAG_223_METEOR_SequenceTick` (`0xA8FF00`) is byte-for-byte the same as `GF_204Alexander_SequenceTick` (`0xB00310`) — same counter/parity, same camera view-matrix mirror, same 3 scene passes (`sub_A9AC00/sub_A90220/sub_A9B020` vs `sub_B0BBA0/sub_B00630/sub_B0BFC0`), same `g_GfCinematic_*` context globals, same completion return. Only per-effect subroutines and the modulo period (`au_re_bs_modulo_41` vs `_50`) differ. GF adds: random stage camera + `0x8000` takeover, geometry swap (`BS_CopyGeometry`), GF Boost, longer state sequence (10 vs 8 substeps).

## See also

- `gf_families.md` — handler shapes (entry/init/tick families)
- `gf_shared_infra.md` — shared globals, BdLinkTask
- `../reference/kernel_tables.md` — `K_GF_JUNCTIONABLE` -> magicID
- Obsidian: `projects/re-ff8/references/gf-asset-loading-and-authoring.md`
