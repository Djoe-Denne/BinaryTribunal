# Gpu_PackOtTag1_DrawOffsetE5 @ 0x45C9B0

- Confiance: CERTAIN
- Nom catalogue: confirme
- Mode: 1+P
- A==V: n/a (1+P)
- Push IDB: oui
- Preuves:
  - Feuille ; 24 xrefs / 22 callers ; sibling `0x45CA50` E1
  - `81 E1 FF FF FF 00` / `81 C9 00 00 00 01` : tag len=1, pas VIT
  - WORD X/Y `66 8B` + `AND 0x7FF` (pas `movsx`)
  - `((Y|0xFFFCA000)<<11)|X` → GP0 E5
  - Hex-Rays `&VIT_0_STATUS_MASK_` / `&unk_FFFFFF` = objets faux
- Notes parent: §5.6 vert. Leurre IDA `VIT_0_STATUS_MASK?` = `0x01000000`. Occupancy / tag 07 / code 24 absents. SKIP_NODECOMP → CERTAIN.

## Analyse réconciliée

# Sémantique Gpu_PackOtTag1_DrawOffsetE5 @ 0x45C9B0 (réconciliation 1+P = A)

- Rôle (1 phrase) : Empaquette dans `pkt` un tag OT PS1 de longueur 1 (pointeur 24 bits conservé) et un mot GP0 `E5h` Drawing Offset à partir de X/Y 11 bits.
- Confiance : CERTAIN
- Nom catalogue : confirme
- In / Out / Effets : cdecl, 2 DWORD. EAX = `pkt`. `pkt[0]` = `(old & 0x00FFFFFF) | 0x01000000` ; `pkt[1]` = `((Y | 0xFFFCA000) << 11) | X`. Occupancy 1+2 absente.
- Preuves (3–8) :
  1. 24 xrefs / 22 funcs ; sibling E1 `0x45CA50`.
  2. Feuille ; EAX = pkt.
  3. Bytes `81 E1 FF FF FF 00` / `81 C9 00 00 00 01`.
  4. `VIT_0_STATUS_MASK?` leurre pour `0x01000000` (len OT=1), pas tag 07.
  5. `66 8B 51 02` / `66 8B 09` + `AND 0x7FF`.
  6. `OR 0xFFFCA000` / `SHL 0Bh` → GP0 E5.
  7. Hex-Rays objets aux immédiats.
- Questions ouvertes : next 24 bits déjà posé par l’alloc OT chez tous les callers ; X/Y signés côté appelant.
