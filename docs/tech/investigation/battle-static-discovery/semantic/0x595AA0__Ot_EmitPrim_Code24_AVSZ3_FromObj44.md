# Ot_EmitPrim_Code24_AVSZ3_FromObj44 @ 0x595AA0

- Confiance: LIKELY (solo parent : dérivation ASM + §5.6 live ; structure CERTAIN, formule slot OT à partir de [obj+3Ch]/[obj+40h]/[obj+50h] non résolue)
- Nom catalogue: IDA conservé ; nom sémantique proposé `Ot_EmitTriPacket_AVSZ3_FromObj44` (packet 0x20 octets, profondeur AVSZ3, obj = source +0x44)
- Mode: 1+V en solo (spawn impossible : subagent depth limit) — A = dérivation parent, contre-vérification §5.6 ; V adversariale remplacée par §5.6 live (limitation session, notée)
- Push IDB: oui, [semantic-triple 2026-10-08], pas de rename, pas de SetType
- Preuves §5.6 parent (live IDB 2026-10-08):
  - Callees résolus: `GteState_Set3Pairs_1CA8A10` (595aba), `camRelated_0` (595abf), `SetsomeDword` (595aee), `Gte_AVSZ3` (595af3), `GteState_GetToPtr_1CA8A2C` (595b18), `OtNode24_PoolAllocLink` (595b2c)
  - `add esp, 24h` à 595b31 — 9 pushes settés par callee-args (3+3+1+2), nettoie en un bloc (cdecl caller cleanup)
  - `add esi, 20h` à 595b34 — pas packet 32 octets (8 dwords) ; `mov [edi+44h], esi` avance le curseur packet de l'obj
  - `dword [esi] = 07000000h` (code byte b3 = 07) ; `or ecx, 24000000h` à 595acd sur le mot +4
  - `sar edx, cl` / `lea ecx, [eax+edx*4]` à 595b26..595b28 — p_ot = [obj+3Ch] + ((to_ptr >> [obj+40h]) * 4) (formule à préciser)
  - xrefs_to 0x595AA0 : 5 sites code (0x595722, 0x5958fe, 0x595a6a, 0x595bff, 0x595c22) — famille sibling uniquement
- Notes parent: famille dup : A8/A10/A11/A12 = changement de fields `+0x44`/`+0x2C` source / tag header à diff ASM (livre séquentiellement).

## Analyse réconciliée

# Sémantique Ot_EmitPrim_Code24_AVSZ3_FromObj44 @ 0x595AA0 (1+V réduit)

- Rôle (1 phrase) : fabrique un paquet triangle 32 octets dans le buffer courant de l'objet (curseur `[obj+44h]`), charge ses 3 sommets dans le GTE (`GteState_Set3Pairs_1CA8A10` + passe caméra), pose le depth via `Gte_AVSZ3`, copie les mots +6 des 3 vertices, chaîne le paquet via `OtNode24_PoolAllocLink` à un slot OT calculé, et avance le curseur de 0x20.
- Sémantique structurelle CERTAIN ; interprétation du champ [obj+50h]/[obj+40h] (slot OT) = LIKELY, poursuite ouverte.
- In / Out / Effets : cdecl, 4 args stack `p_v0, p_v1, p_v2, p_obj` (caller cleanup). Retour non défini par l'ASM (EAX hérité de l'allocateur ; les callers de la famille le consomment différemment).
- Preuves (3-8, adresses ASM):
  1. `595ab6 mov esi, [edi+44h]` — packet buffer courant de l'obj.
  2. `595ad3 or ecx, 24000000h` ; `595ae8 dword [esi]=07000000h` — en-têtes de paquet (code byte3=07, flag 24 aux mots +4).
  3. `595aba call GteState_Set3Pairs_1CA8A10` (3 ptrs sommets) ; `595abf call camRelated_0` — binds GTE clears.
  4. `595af3 call Gte_AVSZ3` — moyenne-of-3 sommets (depth).
  5. `595b18 call GteState_GetToPtr_1CA8A2C` (ToF) ; `595b26/595b28` compute slot.
  6. `595b2c call OtNode24_PoolAllocLink(p_ot, pkt)`;`595b31 add esp,24h`.
  7. `595b34 add esi,0x20` ; `595b37 mov [edi+44h],esi` — curseur avance.
- Questions ouvertes : formule slot OT (edi+3C/40/50) — prob pending chaos du pattern ; à caler avec la close du lot C/B (tables).
