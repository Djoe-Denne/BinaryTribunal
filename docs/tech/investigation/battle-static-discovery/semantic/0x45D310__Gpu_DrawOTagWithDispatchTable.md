# Gpu_DrawOTagWithDispatchTable @ 0x45D310

- Confiance: CERTAIN (structure + loop + dispatch) / LIKELY (floats record, sub_460B20)
- Nom catalogue: confirmé (≥2 preuves hors nom IDA : appelé 2× par 0x45D080 avec tables opaque/semi ; dispatch_table[code] codée B7CF08/B7D308)
- Mode: 1+V solo (A = dérivation parent + Hex-Rays live, §5.6 live ; pas de V séparée — subagent depth limit)
- A==V: n/a (solo)
- Push IDB: oui, [semantic-triple 2026-10-08], pas de rename
- Preuves §5.6 parent (live IDB 2026-10-08):
  - Callees: `sub_45D050` (45d31c, 45d4b9), `sub_460B20` (45d337), indirect `dispatch_table[code]` (45d458-45d464), + global stores
  - callers cites: 2× `0x45d2a3` (opaque) et `0x45d2be` (semi) depuis 0x45D080, `add esp,10h` (2 appels × 2 args)
  - stride: no `lea/shl multiplié simplifié` — `g_PrimitiveWordStride[code]` enregistré, default 1 (45d47c/45d480), `add esi?edi`, *4
  - polarity: `jb`/`jnb` unsigned pool bounds ; `jg`/`jle` signed compte/count ; setcc absent (CLS: `sets al` absent ici)
  - retour: EAX hérité (rec via sub_45D050, ou 0xFFFFFF terminateur) — pas AL/AX
  - itemisés: `dword_1CA8A08/89B0/89A4/89BC`, float `flt_1CA882C` (accumulation), table `dispatch_table[alu]` = 0xB7CF08 (opaque) / 0xB7D308 (semi)
- Notes parent: decomp livré → `decomp/0x45D310__Gpu_DrawOTagWithDispatchTable.md`.

## Analyse réconciliée

# Sémantique Gpu_DrawOTagWithDispatchTable @ 0x45D310 (1+V solo)

- Rôle (1 phrase) : walker OT paramétré par table de dispatch (jumelle 0x45D080) : valide la tête via `sub_45D050`, pose le setup scale/offset selon `[node+14h]` bit0 (B7CC00/04, B7CC1C=10h/0Dh, 1CA89FC), masque le bit1 semi-transparence sur GP0 0x20/0x28 si `dword_1CA8880`, et appelante-par-packet `dispatch_table[GP0[u8 @pkt+7]]` (0xB7CF08 opaque / 0xB7D308 semi) avec avance mot-par-mot stride `g_PrimitiveWordStride[code]`, puis float accumulation per-frame `flt_1CA882C`.
- Confiance : CERTAIN (structure/loops) / LIKELY (floats record, role `sub_460B20(0x10000)`)
- In / Out / Effets : cdecl, 2 args stack `ot_head, dispatch_table` (caller cleanup add esp,10h). Retour EAX hérité (rec ou 0xFFFFFF).
- Preuves (3-8, adresses ASM live):
  1. `45d31c-45d32c` : record ebx = `sub_45D050(ot_head)`, sortie si nul.
  2. `45d332-45d367` : `sub_460B20(0x10000)` ; `flt_1CA882C = (2*[rec+0xC]-2)*[rec+0x18]`.
  3. `45d435-45d443` : mask bit1 (0xFD) si mode 0x20/0x28 + `dword_1CA8880`.
  4. `45d445-45d464` : `dispatch_table[code]` call indirect arg packet, porté aussi par écrire gates `dword_1CA8A0C` bit0 / `byte_B7CD28[code]`.
  5. `45d46f-45d496` : stride/dword advances, dt count (`jg` signed).
  6. `45d4aa-45d4b4` : chainage 24 bits `next = (node[0x16]<<24)|(L & 0xFFFFFF)`, terminateur 0xFFFFFF (45d4a8).
  7. `45d4be-45d505` : chemin externe — `dword_1CA89BC = (head - rec[0x24])>>2` ; `[rec+0x8]`→1CA89A4 ; float accumulation conditionelle `SameRec? flt_1CA882C : flt_1CA882C + var_4`.
- Questions ouvertes : sémantique record sub_45D050 (pool fields +0x8/+0xC/+0x18/+0x24 — LIKELY "node record externe" (big struct)...) ; role sub_460B20 (0x10000) ; mode dword_1CA8880 (mask) — prob "per-frame semi-toggle".
