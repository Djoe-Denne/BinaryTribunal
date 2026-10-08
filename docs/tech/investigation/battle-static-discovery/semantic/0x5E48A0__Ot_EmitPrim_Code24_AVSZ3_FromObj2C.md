# Ot_EmitPrim_Code24_AVSZ3_FromObj2C @ 0x5E48A0

- Confiance: LIKELY (solo parent : dérivation ASM + §5.6 live ; structure CERTAIN, formule slot OT non résolue — même caveat que 0x595AA0)
- Nom catalogue: IDA conservé ; nom sémantique proposé `Ot_EmitTriPacket_AVSZ3_FromObj2C` (jumelle 0x595AA0, source obj décalée)
- Mode: 1+P en solo (60 instr. ≤ 80 ; V adversariale remplacée par §5.6 live — limitation session)
- Push IDB: oui, [semantic-triple 2026-10-08], pas de rename
- Preuves §5.6 parent (live IDB 2026-10-08):
  - jumelle 0x595AA0 : même chaîne de callees (`GteState_Set3Pairs_1CA8A10`, `camRelated_0`, `SetsomeDword`, `Gte_AVSZ3`, `GteState_GetToPtr_1CA8A2C`, `OtNode24_PoolAllocLink`)
  - Champs obj décalés: curseur pkt `[obj+2Ch]` (5e48b6), header mots `[obj+18h]/[obj+1Ch]/[obj+20h]` (5e48c4-5e48e8), slot OT `[obj+24h] / cl=[obj+28h] / to_ptr->[obj+38h]` (5e492c-5e4937)
  - `dword [esi] = 7000000h` (5e48f7), `or ecx, 24000000h` (5e48df) ; matches + `sar edx, cl` / `lea ecx,[eax+edx*4]`
  - `add esp, 24h` (5e4940) ; `add esi, 20h` (5e4943) ; `mov [edi+2Ch], esi` (5e4946) — stride 32 octets, cdecl 4 args
- Notes parent: filtrage différent du header : `[esi+0x14] = [edi+20h] & 0x1FFFFFF` ; `[esi+4] = ([edi+20h] & 0x2000000) | [edi+1Ch] | 0x24000000`.

## Analyse réconciliée

# Sémantique Ot_EmitPrim_Code24_AVSZ3_FromObj2C @ 0x5E48A0 (1+P)

- Rôle (1 phrase) : jumelle de 0x595AA0 — fabrique un paquet triangle 32 octets dans le buffer courant de l'objet (curseur `[obj+2Ch]`), 3 sommets → GTE → caméra → profondeur `Gte_AVSZ3`, mots +6 des 3 vertices copiés, slot OT calculé (`[obj+24h] + ((to_ptr >> [obj+28h]) * 4)`), chaînage `OtNode24_PoolAllocLink`, curseur +0x20.
- Confiance : LIKELY (structure CERTAIN ; formule slot OT à préciser comme 0x595AA0)
- In / Out / Effets : cdecl, 4 args stack `p_v0, p_v1, p_v2, p_obj` (poussés droite→gauche, caller cleanup `add esp,24h`). Retour non défini par l'ASM (EAX hérité de l'allocateur).
- Preuves (3-8, adresses ASM live):
  1. `5e48a6 mov esi, [edi+2Ch]` — buffer courant de l'obj  (famille obj-source à +0x2C).
  2. `5e48df or ecx, 24000000h` ; `5e48f7 dword [esi]=7000000h` — même en-tête de paquet que 0x595AA0.
  3. `5e48ba call GteState_Set3Pairs_1CA8A10` ; `5e48bf call camRelated_0` ; `5e48fd call SetsomeDword(esi+18h, esi+10h, esi+8)` — tetrads triés en esi+18h/+10h/+8h (AVSZ3/GTE stores).
  4. `5e4902 call Gte_AVSZ3` — depth tri (moyenne des 3).
  5. `5e4927 call GteState_GetToPtr_1CA8A2C` ((écrit to-ptr GTE dans [obj+38h]) `[obj+38h]`) ; `5e4935 sar edx, cl` avec `cl=[obj+28h]`, `eax=[obj+24h]` — calcule le slot.
  6. `5e493b call OtNode24_PoolAllocLink(p_ot, pkt)`;`5e4940 add esp,24h` — chainage OT.
  7. `5e4943 add esi,20h`;`5e4946 mov [edi+2Ch], esi` — curseur avance.
- Questions ouvertes : formule slot OT (edi+24/28/38) — même perspective ouverte que 0x595AA0 (structure cert., sens LIKELY). .
