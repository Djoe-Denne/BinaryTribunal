# OtNode24_AllocHeadInsert @ 0x45C870

- Confiance: CERTAIN (1+P : A blind 2026-09-17 + §5.6 live parent 2026-10-08, pas de V)
- Nom catalogue: IDA `OT_InsertPrimitive` conservé dans l'IDB ; nom dérivé `OtNode24_AllocHeadInsert` documenté (classe famille `OtNode24_*` : 0x45C7A0 `OtNode24_PoolAllocLink`, 0x45C8E0 `OtNode24_PoolAllocLink_Code1`). Rename IDB non appliqué (règle de vague : pas de rename sans preuve forte + décision catalogue)..
- Mode: 1+P (37 instr. ≤ 80)
- A==V: n/a (1+P)
- Push IDB: oui, [semantic-triple 2026-10-08] (pas de rename, pas de SetType)
- Preuves §5.6 parent (live IDB 2026-10-08):
  - `45c87d cmp ecx, 60000h` / `45c883 jnb` unsigned — refus si (cursor − pool) ≥ 0x60000 (= 0x4000 nœuds, cohérent garde 45D080)
  - `45c8a6..45c8a5` writes arg_8/arg_C/arg_10/arg_14 → +4/+8/+C/+10 ; `45c8aa mov word ptr [eax+14h], 0` ; `45c8b4 shr edx, 18h` / `45c8b7 mov [eax+16h], dl` — octet haut de l'ancienne tête stocké à +0x16
  - `45c8c5-45c8d2` : update chaîne `*p_prevWord` = (top8 conservé) | (low24 ancienne tête) via `xor/xor 0xFFFFFF/xor`
  - `45c8cf add eax, 18h` ; `45c8d5 mov g_OtNodePoolCursor, eax` — EAX retour = node+0x18 (nouveau curseur)
  - xrefs_to 0x45C870: ~260 sites code (0x47324f..0xB5E68A), pas de xref DATA
- Notes parent: caller cleanup = cdecl (`retn` sans imm16, 3 pushes ebx/esi/edi dépilés symétriquement 45c8c0/c8d4/c8da) ; 6 args stack arg_0..arg_14.

## Analyse réconciliée

# Sémantique OtNode24_AllocHeadInsert @ 0x45C870 (réconciliation 1+P = A + §5.6)

- Rôle (1 phrase) : alloue un nœud OT 24 octets (stride 0x18) dans `g_OtNodePool` si la capacité le permet, remplit ses 6 champs à partir des args, chaîne l'ancienne tête à 24 bits dans le mot de chaînons visé et en tête de `*p_ot` ; retour EAX = nouveau curseur pool.
- Confiance : CERTAIN
- Nom catalogue : IDA `OT_InsertPrimitive` conservé ; dérivé `OtNode24_AllocHeadInsert` confirmé (≥2 preuves hors nom IDA : stride/garde cohérentes avec le driver `Gpu_DrawOTag`, ~260 callers d'insertion)
- In / Out / Effets : cdecl, 6 args stack `p_ot, p_chainWord, d0, d1, d2, d3` (poussés droite→gauche, caller cleanup). Retour EAX 32 bits = `node+0x18` (nouveau `g_OtNodePoolCursor`) ; si capacité pleine → aucun effet, curseur inchangé.
- Comportement :
  1. Garde : `(g_OtNodePoolCursor − g_OtNodePool) ≥ 0x60000` (`jnb`, non signé) → sortie sèche (pas d'écriture).
  2. Remplissage : `node+4=d0`, `node+8=d1`, `node+0xC=d2`, `node+0x10=d3`, `word node+0x14 = 0` (flags dispatch reset), `node+0 = p_chainWord`.
  3. Chaînons : `old_head = *p_ot` ; `node+0x16 = old_head>>24` (octet haut) ; `*p_ot = node` ; `*p_chainWord` = (top8(*p_chainWord) conservé) | (low24(old_head)) — chaînage miroir du walker 0x45D080 (suivant = `(n[0x16]<<24)|(L&0xFFFFFF)`, terminateur 0xFFFFFF).
- Preuves (3-8, adresses ASM live) :
  1. `45c870-45c883` : lecture curseur/base, `sub ecx, offset g_OtNodePool`, garde `0x60000` unsigned.
  2. `45c885-45c8a5` : copies 6 arguments → champs du nœud fraîchement alloué (arg offset [esp+N],displays prologue 3 pushes).
  3. `45c8a8-45c8b7` : `*p_ot` (edi) ; `old_head = *edi` ; `node+0x16 = old_head>>24` ; `*edi = eax` (tête = nœud).
  4. `45c8c0-45c8d2` : `esi = *p_chainWord` ; masquage `xor ebx,ecx / and ebx,0xFFFFFF / xor ebx,esi` → injection low24(old_head) top byte préservé.
  5. `45c8cf-45c8d5` : bump curseur + mémorisation.
  6. Cohérence famille: sibling 0x45C8E0 (CERTAIN 1+P, `WORD +14h=1` vs ici `WORD +14h=0`) et 0x45C7A0.
- Questions ouvertes : désignation exacte des payloads d1..d4 côté callers (émission primitives FT3/FT4) à trancher au fil des workers (lot F stage).
