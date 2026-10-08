# sub_45CEE0 — walker OT debug (g_SoftwarePrimDispatch seul) @ 0x45CEE0

- Confiance: CERTAIN (structure 1:1 sur 0x45D080, un seul dispatcher)
- Nom catalogue: IDA `sub_45CEE0` conservé ; nom dérivé `alt_DrawOTag_SoftwareDispatchOnly` documenté (annot live IDB : walkers-overlay B65xxx)
- Mode: 1+P solo (95 instr., dérivation + §5.6 live)
- Push IDB: oui, [semantic-triple 2026-10-08], pas de rename (chaînage figurativement vide ; C-B-A)
- Preuves §5.6 parent (live IDB 2026-10-08):
  - xrefs_to: 5 sites code, tous @0xB65xxx (0xB65A16, 0xB65AE3, 0xB65CF6, 0xB65F21, 0xB66214) — overlay/debug, pas de DATA
  - callee `sub_45D050` @0x45D050 (45d01a)
  - `test/jz` 45cf11 reset `dword_1CA8880 = 0` ; stride `g_PrimitiveWordStride[code]` (defaut 1)
  - `jg` signé count vs `jb/jnb` unsigned pool bounds — polarité cohérite
  - destructor de chainage : `(n[0x16]<<24)|(L & 0xFFFFFF)` + terminateur `0xFFFFFF` — miroir exacte de 0x45D080/0x45D310
  - cdecl 1 arg, 4 pushes symétriques, retn sans imm16
- Notes parent: decomp livré → `decomp/0x45CEE0__sub_45CEE0.md`.

## Analyse réconciliée

# Sémantique sub_45CEE0 (alt_DrawOTag_SoftwareDispatchOnly) @ 0x45CEE0 (1+P solo)

- Rôle (1 phrase) : walker OT alternatif (debug/overlay B65xxx) — version allégée de 0x45D080 : garde capacité 0x4000, reset `dword_1CA8880=0`, parcours des nœuds 0x18 (chaînage 24 bits, terminateur 0xFFFFFF), setup scale/offset selon `[node+0x14]` bit0, dispatch GP0 **directement** via `g_SoftwarePrimDispatch[code @pkt+7]` (seule table, sans texture-dirty ni re-émission ni float acc), avance mot-par-mot stride `g_PrimitiveWordStride[code]`, chemin externe `sub_45D050` + flag `[rec+4]=1`.
- Confiance : CERTAIN
- In / Out / Effets : cdecl, 1 arg stack `ot_head`. Retour non défini (void sémantique, EAX hérité de sub_45D050/0xFFFFFF).
- Preuves (3-8, adresses ASM live): cf. decomp doc, points 1-8.
- Questions ouvertes : les 5 callers B65xxx (module overlay/debug) — à qualifier au lot F/workspace ; diffère dence `dword_1CA8880=0` vs le sem-fic ciblé (prob reset du mask mode) — LIKELY.
