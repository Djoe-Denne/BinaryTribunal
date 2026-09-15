# Gfx_SetTIMDescFlags @ 0x407586

- Confiance: CERTAIN
- Nom catalogue: confirme
- Mode: 1+P
- A==V: n/a (1+P)
- Push IDB: oui
- Preuves:
  - 2 callers (`sub_40766C`, `TIMrelated_0`) ; `jz` unique `desc==0`
  - `+0xC = 0x20002` ; `+8` → `0x2820E` ; `+0x24` = `sub_40742E(arg_4)` ; `+0x28 = -1`
  - Callees : `sub_40742E` `add esp,4` ; `Gfx_SetPrimBlendMode` `add esp,0Ch` (interne ≠ driver `0x41E752`)
  - void, EAX leftover ; occupancy / GF Exists `0x44` absents de ce corps
- Notes parent: §5.6 vert (bytes live). Questions ouvertes (sens bits `0x2820E`, `[src+0x20]` comme mode blend) ne changent pas le rôle. SKIP_NODECOMP → CERTAIN.

## Analyse réconciliée

# Sémantique Gfx_SetTIMDescFlags @ 0x407586 (réconciliation 1+P = A)

- Rôle (1 phrase) : Si le descripteur dest est non nul, pose les flags TIM Square aux DWORD `+8` / `+0xC`, y écrit un mode mappé (`+0x24`) et la sentinelle `-1` (`+0x28`), puis délègue le blend prim à `Gfx_SetPrimBlendMode` (interne, pas le driver PC).
- Confiance : CERTAIN
- Nom catalogue : confirme
- In / Out / Effets : `void __cdecl(int, int, int, _DWORD *desc)`. `desc==0` → no-op. Écrits : `+0xC = 0x20002` ; `+8` → `0x2820E` ; `+0x24` ; `+0x28 = -1`. EAX leftover.
- Preuves (3–8) :
  1. 2 xrefs : `sub_40766C` @ `0x40768F`, `TIMrelated_0` @ `0x407773`.
  2. Callees `0x40742E` / `0x407162` ; `add esp` 4 / 0Ch.
  3. `83 7D 14 00` / `0F 84 …` jz ; `C7 45 FC 02 00 02 00` ; `89 48 0C` ; `C7 42 08 00…` ; `83 C9 02` ; `81 C9 00 00 02 00`.
  4. `0C 04` / `0C 08` / `80 CC 02` / `80 CC 80` ; `C7 42 28 FF…` ; `89 41 24`.
  5. Wiki catalogue « Flags TIM sur desc ». Hex-Rays `131074 = 0x20002`.
- Questions ouvertes : bits de `0x2820E` ; `[src+0x20]` servi comme mode blend ; `+0x28` dest vs source TIM.
