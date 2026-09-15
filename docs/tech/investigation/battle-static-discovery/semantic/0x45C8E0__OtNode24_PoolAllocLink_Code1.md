# OtNode24_PoolAllocLink_Code1 @ 0x45C8E0

- Confiance: CERTAIN
- Nom catalogue: confirme
- Mode: 1+P
- A==V: n/a (1+P)
- Push IDB: oui
- Preuves:
  - Feuille ; 249 xrefs / 139 callers ; sibling `0x45C7A0` (WORD +14h=0 + SXY)
  - `jnb` cap `0x60000` ; `add eax,18h` curseur
  - Zéros +4..+10 ; pas `1CA8A50` / `TEST CL,8` / `[pkt+7]`
  - `66 C7 40 14 01 00` WORD +14h=1 ; BYTE +16h = `old_head>>24`
  - Tag `(pkt[0] & 0xFF000000) | (old_head & 0xFFFFFF)`
  - GLM C store BYTE flags=1 : l’ASM est un WORD (zéro +15 aussi)
- Notes parent: §5.6 vert — `73 48`, `66 C7 40 14 01 00`, `83 C0 18`, aucun hit SXY. 6 callers écrasent EAX. SKIP_NODECOMP → CERTAIN.

## Analyse réconciliée

# Sémantique OtNode24_PoolAllocLink_Code1 @ 0x45C8E0 (réconciliation 1+P = A)

- Rôle (1 phrase) : Alloue un nœud OT 24 o (stride `0x18`) dans le pool PC, y zéro +4..+10 (pas de cache GTE SXY), pose WORD +14h=1, pousse le nœud en tête de `*p_ot` et écrit le tag OT PS1 24 bits dans pkt[0].
- Confiance : CERTAIN
- Nom catalogue : confirme
- In / Out / Effets : cdecl, 2 DWORD (`p_ot`, `pkt`). EAX = curseur bumpé `node+0x18` si succès. Occupancy 1+2 absente.
- Preuves (3–8) :
  1. 249 xrefs / 139 funcs ; sibling CERTAIN `0x45C7A0`.
  2. Feuille.
  3. `cmp ecx, 60000h` / `jnb` unsigned ; `add eax, 18h`.
  4. Wiki : WORD[+14]=1 ; pas de copie SXY.
  5. Zéros DWORD +4..+10.
  6. `66 C7 40 14 01 00` ; `shr edx,18h` ; BYTE +16h.
  7. Tag masque `0xFFFFFF`. Hex-Rays `unk_FFFFFF` objet (faux).
- Questions ouvertes : sens du flag 1 côté callers ; EAX ignoré sur l’échantillon.
