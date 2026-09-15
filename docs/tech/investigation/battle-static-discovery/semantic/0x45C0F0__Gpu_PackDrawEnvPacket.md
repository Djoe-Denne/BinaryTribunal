# Gpu_PackDrawEnvPacket @ 0x45C0F0

- Confiance: CERTAIN
- Nom catalogue: confirme
- Mode: 1+V
- A==V: oui
- Push IDB: oui
- Preuves:
  - Feuille ; 47 xrefs / 30 funcs ; EAX=`env`
  - Tag 8/5 selon BYTE `[env+18h]` ; masque 24 bits (`unk_FFFFFF` leurre)
  - GP0 E3/E4/**E5**/E1/E2 ; fill `or ch,2` = code 02 (pas 24)
  - clip.w `mov di` ; E2 `sar edx,3` ; Hex-Rays `env==-12` = `lea +0Ch`
  - Insert OT chez l’appelant (`g_BattleOTBase+44h` = seau, pas GF Exists)
- Notes parent: §5.6 vert (bytes live, aucun `E8` dans le corps). Wiki omet E5 — trou doc. SKIP_NODECOMP → CERTAIN. Occupancy 1+2 absente.

## Analyse réconciliée

# Sémantique Gpu_PackDrawEnvPacket @ 0x45C0F0 (réconciliation 1+V = A, V=ACCEPTE)

- Rôle (1 phrase) : Empaquette un DRAWENV-like PSY-Q (offsets bruts, pas RECT Win32) dans un nœud OT : tag longueur 8 ou 5 selon BYTE `isbg`, puis GP0 E3/E4/E5/E1/E2 et fill `02` optionnel.
- Confiance : CERTAIN
- Nom catalogue : confirme
- In / Out / Effets : cdecl 2 DWORD, feuille, `retn` C3. EAX = `env`. `packet[0]` = `(old & 0x00FFFFFF) | (isbg ? 0x08000000 : 0x05000000)`. `packet[1..5]` = E3, E4, E5, E1, E2-ou-0. Si `isbg` : `packet[6]` = `0x02BBGGRR`, `packet[7]`/`[8]` = DWORD XY/WH. Pas d’insert OT.
- Preuves (3–8) :
  1. 47 xrefs code / 30 funcs ; feuille ; EAX=`env`.
  2. `8A 58 18` ; `81 C9 … 08` / `81 CA … 05` ; `81 E1 FF FF FF 00`.
  3. E3 `[esi+4]` ; E4 `or 0xE4000000` ; E5 `0xFFFCA000<<11` ; E1 `0xE1000000` ; E2 `sar edx,3`.
  4. `66 8B 78 04` clip.w unsigned ; `8D 78 0C` / `85 FF` (pas env==-12).
  5. `80 CD 02` fill code 02 ; GF_277 lie OT **après** (`83 C0 44` + `OtNode24_PoolAllocLink`).
  6. Hex-Rays `&unk_FFFFFF` objet faux ; GLM A `>>` E2 rejeté.
- Questions ouvertes : `test edi,edi` seulement si `env==0xFFFFFFF4` ; `& 0x9FF` vs `0x1FF` ; 4 xrefs orphelins ; wiki omet E5.
