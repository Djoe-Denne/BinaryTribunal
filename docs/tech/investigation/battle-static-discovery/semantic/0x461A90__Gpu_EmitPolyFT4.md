# Gpu_EmitPolyFT4 @ 0x461A90

- Confiance: CERTAIN (structure + math) / LIKELY (détails flags, LUT, var_C) — solo parent: dérivation ASM + §5.6 live ; pas de V adversariale (subagent depth limit, limitation session)
- Nom catalogue: IDA conservé
- Mode: 1+V solo (A+P dans une passe ; 243 instr., >200 — escalade 2+1 impossible cette session, notée)
- Push IDB: oui, [semantic-triple 2026-10-08], pas de rename
- Preuves §5.6 parent (live IDB 2026-10-08):
  - Callees: `sub_461A30` (461ab2), dispatch indirect `funcs_461842[eax*4]` (461ade/461ae5), **`sub_461460`** (461aef, différent de sub_461220 des jumelles F3/FT3)
  - Table dispatch: idx 44/45 (`0x2C/0x2D`) @0xB7CF08 et 46/47 @0xB7D308 → 0x461A90 — famille GP0 FT4
  - 4 slots per-vertex stride 0x20 (edi = [rec+74h]) : uv +18/1C/38/3C/58/5C/78/7C ; couleurs +10/30/50/70 ; verts +0/4/+20/24/+40/44/+60/64
  - Transform: `fmul dword_B7CC00`+`fadd flt_1CA89E0` (x) / `dword_B7CC04`+`flt_1CA89E4` (y), ×4 — idem A6/A4
  - Chemin LUT (`dword_1CA8848==0`): copies `dword_1CA9EB0[byte]` + **rétrécissement UV du quad dégénéré** (461bfb test bit1 code ; 4 cmp positions égales + cmp uv égaux ; 461c4c-461c6a : +1/−1 sur u et v, var_18/var_10 ajustés)
  - bit0 `[esi+7]` → couleur var_14 low3 bytes = 0xFF (461cdb-461ce5) puis ×4 stores
  - `cmp dword_1B4780C, 2` (461d3b) puis `jz loc_461DED` (461dd8) — skip backwrite si ==2
  - Backwrite: `[ebx+7Ch] = byte var_C` ; `[ebx+80h] = dword var_C` (461dda-461de7)
  - cdecl 1 arg, épilogue `add esp,1Ch`, pushes ebx/esi/edi symétriques

## Analyse réconciliée

# Sémantique Gpu_EmitPolyFT4 @ 0x461A90 (1+V solo)

- Rôle (1 phrase) : jumelle FT4 de Gpu_EmitPolyFT3 (0x4617F0) — entrée dispatcher du quad texturé (GP0 0x2C/0x2D) : resolve record par code (`sub_461A30(code, w+0xE, w+0x16, &var_C)`), dispatch combiné couleur (`funcs_461842[key]`, key = `dword_1CA8884*2 + (code>>1&1)`, arg `pkt+4`), attache target `[rec+74h]` via **sub_461460**, écrit 4 slots per-vertex stride 0x20 (uv 2 chemins : float `1CB603C/38` si `1CA8848` posé, sinon LUT `1CA9EB0` avec rétrécissement ±1 des uv du quad dégénéré si bit1 posé + positions/uv identiques), couleur (override 0xFFFFFF si bit0) et 4 verts transformés (B7CC00/B7CC04 + offsets), backwrite `var_C` → `[rec+7Ch]/[rec+80h]` si `dword_1B4780C != 2`.
- Confiance : CERTAIN (structure + math) / LIKELY (bit0/bit1, LUT `1CA9EB0`, mult `1CB603C/38`, var_C, mode `1B4780C==2`)
- In / Out / Effets : cdecl, 1 arg stack `pkt` (FT4: header +0..7, 4 verts S16 +8..+0x23, uv bytes +0xC..+0x25). Retour non défini.
- Preuves (3-8, adresses ASM) :
  1. `461a99-461ab2` : args `sub_461A30` = &var_C, w+0xE, w+0x16, byte code+7.
  2. `461acb-461ae5` : key = `1CA8884*2 + bit1(code)`; call indirect couleur (result → var_14).
  3. `461aef call sub_461460(edi)` — target registration quad (différencié de 461220 tri).
  4. `461b04-461bb1` : chemin 1CA8848 posé — fmul 1CB603C/38, uv des 4 sommets.
  5. `461bb9-461cd2` : chemin LUT 1CA9EB0 + rétro-shrink quad dégénéré (+1/−1 uv) si bit1 & positions/uv identiques.
  6. `461cdb-461ce5, 461cf1/461d07/461d22/461d2f/461d32` : couleur (0xFFFFFF si bit0) ×4 slots +10/30/50/70.
  7. `461ce9-461dd4` : 4 verts (words +8/A, +10/12, +18/1A, +20/22) transformés → +0/4, +20/24, +40/44, +60/64.
  8. `461d3b, 461dd8-461de7` : backwrite var_C conditionnel (`1B4780C != 2`).
- Questions ouvertes : sémantique exacte bit0/bit1 du code (opaque/semi-transparence/coul blanc), LUT `1CA9EB0` (offset CLUT/texpage), rôle `sub_461460` vs `sub_461220` (target quad vs tri — prob taille de charge), mode `1B4780C==2` — à caler lots B/C.
