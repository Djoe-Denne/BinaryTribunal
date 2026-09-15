# OtNode24_PoolAllocLink @ 0x45C7A0

- Confiance: CERTAIN
- Nom catalogue: confirme
- Mode: 1+P
- A==V: n/a (1+P)
- Push IDB: oui
- Preuves:
  - Feuille ; 2006 xrefs / 1077 callers ; sibling `0x45C8E0`
  - `jnb` cap `0x60000` ; `add eax,18h` curseur (pas le nœud)
  - `BYTE [pkt+7] & 0xFC` ; `jb 20h` / `ja 3Ch` ; `TEST CL,8` quad vs tri SXY
  - `66` WORD +14h=0 ; BYTE +16h = `old_head>>24`
  - Tag `(pkt[0] & 0xFF000000) | (old_head & 0xFFFFFF)`
  - GLM C / Hex-Rays faux sur le retour (`cursor-0x18`, `++result`)
- Notes parent: §5.6 vert — opcodes live `0F 83` / `F6 C1 08` / `66 89 50 14` / `83 C0 18`. 8 callers ignorent EAX (écrasent). Occupancy absente. SKIP_NODECOMP → CERTAIN (decomp existe).

## Analyse réconciliée

# Sémantique OtNode24_PoolAllocLink @ 0x45C7A0 (réconciliation 1+P = A)

- Rôle (1 phrase) : Alloue un nœud OT 24 o (stride 0x18) dans le pool PC, y copie le cache GTE SXY (quad ou tri selon le code GPU du paquet), le pousse en tête de `*p_ot` et écrit le tag OT PS1 dans pkt[0].
- Confiance : CERTAIN
- Nom catalogue : confirme
- In / Out / Effets : cdecl, 2 DWORD (`p_ot` = tête OT, `pkt` = paquet GP0). EAX = curseur bumpé `node+0x18` si succès, curseur inchangé si pool plein (`jnb`). Écrit `*p_ot`, pkt[0], `g_OtNodePoolCursor`, nœud +0 (pkt*), +4..+10 (SXY ou 0), WORD +14h=0, BYTE +16h. Occupancy 1+2 / 0xD0 / 0x1D0 / +44h absents.
- Preuves (3–8) :
  1. Callers IDA live : 2006 xrefs / 1077 funcs + `add esp,8` ; sibling `0x45C8E0`.
  2. Callees : feuille.
  3. `cmp ecx, 60000h` / `jnb` unsigned ; `add eax, 18h`.
  4. Wiki : nœud OT 0x18, cap 0x60000, EAX = nouveau curseur.
  5. `mov cl,[esi+7]` ; `and ecx,0FFFFFFFCh` ; `TEST CL,8` (`F6 C1 08`).
  6. WORD +14h ; BYTE +16h ; masque `0xFFFFFF` sur le tag.
  7. Hex-Rays / GLM C se trompent sur EAX (nœud vs curseur).
- Questions ouvertes : callers échantillonnés n’utilisent pas EAX comme nœud ; le high byte du tag est déjà dans pkt[0].
