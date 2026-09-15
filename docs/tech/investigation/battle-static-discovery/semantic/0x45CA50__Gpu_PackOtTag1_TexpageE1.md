# Gpu_PackOtTag1_TexpageE1 @ 0x45CA50

- Confiance: CERTAIN
- Nom catalogue: confirme
- Mode: 1+P
- A==V: n/a (1+P)
- Push IDB: oui
- Preuves:
  - Feuille ; 18 xrefs / 14 funcs ; sibling `0x45C9B0` E5
  - `81 E1 FF FF FF 00` / `81 C9 00 00 00 01` : tag len=1, pas VIT
  - dfe/dtd via `neg`/`sbb` → `0x400` / `0x200`
  - arg_C chargé en DWORD puis `& 0x9FF` ; `OR 0xE1000000` → GP0 E1
  - Hex-Rays `&VIT_0_STATUS_MASK_` / `&unk_FFFFFF` = objets faux
- Notes parent: §5.6 vert (bytes live, callers/callees, EAX=pkt). Leurre IDA `VIT_0_STATUS_MASK?` = `0x01000000`. Occupancy / tag 07 / code 24 absents. Insert OT chez l’appelant. SKIP_NODECOMP → CERTAIN. Questions ouvertes (next 24 bits, `& 0x9FF` vs PSY-Q `0x1FF`, xref `0x52EF5F` hors fonction) ne changent pas le rôle.

## Analyse réconciliée

# Sémantique Gpu_PackOtTag1_TexpageE1 @ 0x45CA50 (réconciliation 1+P = A)

- Rôle (1 phrase) : Empaquette dans `pkt` un tag OT PS1 de longueur 1 (pointeur 24 bits conservé) et un mot GP0 `E1h` TPage (dfe/dtd + tpage `& 0x9FF`).
- Confiance : CERTAIN
- Nom catalogue : confirme
- In / Out / Effets : cdecl, 4 DWORD. EAX = `pkt` (jamais écrasé). `pkt[0]` = `(old & 0x00FFFFFF) | 0x01000000` ; `pkt[1]` = `0xE1000000 | (dfe?0x400:0) | (dtd?0x200:0) | (arg_C DWORD & 0x9FF)`. Pas d’insert OT / occupancy / tag 07 / code 24 / TEST AL,2.
- Preuves (3–8) :
  1. Caller : 18 xrefs code / 14 funcs (`sub_52E530`×2, `sub_52EF80`×2, `sub_5300E0`×2, `sub_5391B0`×2, `sub_518100`…) ; sibling CERTAIN `Gpu_PackOtTag1_DrawOffsetE5` @ `0x45C9B0` (même tag-1, GP0 E5).
  2. Callee : feuille (`callees` vide) ; `retn` C3 ; EAX = pkt dès `mov eax,[esp+arg_0]`.
  3. Bytes `81 E1 FF FF FF 00` / `81 C9 00 00 00 01` : `unk_FFFFFF` = masque 24 bits, `VIT_0_STATUS_MASK?` = leurre `0x01000000` (OT len=1), pas tag 07.
  4. dfe/dtd via neg/sbb (pas un shift) : `F7 DA`/`1B D2`/`81 E2 00 04 00 00` → bit10 `0x400` ; `F7 D9`/`1B C9`/`81 E1 00 02 00 00` → bit9 `0x200`.
  5. `8B 4C 24 10` charge arg_C en DWORD (type IDA `__int16` trompeur) puis `81 E1 FF 09 00 00` ; `81 CA 00 00 00 E1` ; `89 50 04`.
  6. Callers cdecl `push tpage; push dtd; push dfe; push pkt` (`0x52E673` tpage d’EAX, dfe=dtd=0 ; `0x518180` tpage=`0x20`, dfe=dtd=1) puis souvent `OtNode24_PoolAllocLink` (`0x51818A` → `g_BattleOTBase+4`) — occupancy chez l’appelant.
  7. Wiki E3c (`battle-render-pipeline-entrypoints` / catalogue) : `0x45CA50` `Gpu_PackOtTag1_TexpageE1` à côté de E5. Hex-Rays `&VIT_0_STATUS_MASK_` / `&unk_FFFFFF` = objets faux (même piège que E5) ; GLM A/B/C = même formule, ternaires `==0` vs `!=0` équivalents.
- Questions ouvertes : next 24 bits déjà posé par l’alloc OT chez les callers ; bits 12–13 (flip) exclus par `& 0x9FF` (volontaire Square vs PSY-Q `0x1FF`) ; xref `0x52EF5F` hors fonction IDA (entre `sub_52EE00` et `sub_52EF80`).
