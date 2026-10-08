# Gpu_DrawOTag @ 0x45D080

- Confiance: CERTAIN (rÃ´le/contrat/nom ; composant Â« miroir de 0x45C870 Â» = hypothÃ¨se croisÃ©e hors pack)
- Nom catalogue: confirmÃ© (â‰¥2 preuves hors nom IDA)
- Mode: 1+V (A 2026-09-17 blind + V adversariale CORRIGE rÃ©conciliÃ©e)
- A==V: CORRIGE (2 impasses corrigÃ©es par V)
- Push IDB: oui, [semantic-triple 2026-10-08], pas de rename
- Preuves Â§5.6 parent (live IDB 2026-10-08):
  - callee `sub_45D050` @0x45D050, `Gpu_BeginPrimitivePass` @0x460C20, `Gpu_EndPrimitivePass` @0x460CE0, `Gpu_DrawOTagWithDispatchTable` @0x45D310 existent
  - xrefs_to 0x45D080: unique code `0x45d615` (caller `Gpu_DrawOTagCurrent`), pas de DATA
  - `45d0a3 cmp edx, 4000h` / `45d0aa jge` (garde capacitÃ© signÃ©e) ; `45d118 mov dl, [esi+7]` (code GP0 = octet 7 du packet) ; `45d202 mov al, g_PrimitiveWordStride[edi]` ; `45d217 sub ecx, eax` / `45d219 lea esi,[esi+eax*4]` / `45d224 jg` (sous-boucle mot-par-mot) ; `45d2c3 add esp, 10h` (2 calls Ã— 2 args)
  - division noeud = 0x18 (magie 2AAAAAABh/sar 2, jamais *24) ; terminateur 0xFFFFFF ; strides dÃ©codÃ©s en nombres
- Notes parent: document A dÃ©gradÃ© (fragments tronquÃ©s) â†’ rapport depuis la rÃ©conciliation V (E1..E5 intÃ©grÃ©s). Hex-Rays/wiki du pack dÃ©faillants (erreurs outil), ne contredisent rien.

## Analyse rÃ©conciliÃ©e

# SÃ©mantique Gpu_DrawOTag @ 0x45D080 (rÃ©conciliation 1+V = V)

- RÃ´le (1 phrase) : drain d'une ordering table PSX construite dans `g_OtNodePool` â€” rÃ©solution de tÃªte, garde capacitÃ©, parcours des nÅ“uds 24-bit, marche du packet mot-par-mot avec dispatch par code GP0 via deux tables, re-Ã©mission opaque/semi-transparenÑe sous gate, puis reset du pool scratch par-frame.
- Confiance : CERTAIN
- Nom catalogue : confirmÃ© (`Gpu_DrawOTag`, conservÃ©)
- In / Out / Effets : cdecl, 1 arg stack `unsigned int ot_head`. Retour EAX 32 bits : 0 si abandon (validation externe nulle), sinon ancienne valeur `dword_1CA89A4` chargÃ©e en Ã©pilogue.
- Comportement :
  1. Compte les nÅ“uds restants `(g_OtNodePoolCursor - g_OtNodePool)/0x18` (magie `2AAAAAABh`+`sar 2`) ; si â‰¥ 0x4000 (capacitÃ© 0x60000 octets) â†’ sortie sÃ¨che via Ã©pilogue.
  2. TÃªte : `ot_head == -1` â‡’ dÃ©faut lu puis re-mÃ©morisÃ© dans le global adhÃ©sif `dword_1B47808` (mÃ©morisation inconditionnelle) ; tÃªte 0 â‡’ saut direct au bloc de re-Ã©mission.
  3. Parcours des nÅ“uds 0x18 octets dans `[g_OtNodePool, g_OtNodePoolCursor[` (bornes non signÃ©es `jb`/`jnb`) ; hors pool â‡’ validation externe `sub_45D050` (nul â‡’ abandon, retour 0), flag `[record+4]=1`, suivant = `[noeud]` direct.
  4. En pool : L = `*noeud[0]` ; tag = `L>>24` mÃ©morisÃ© dans `dword_1CA89B0` (ce tag est le **compte de mots du packet**, pas un index de dispatch) ; suivant = `(noeud[0x16]<<24) | (L & 0xFFFFFF)` ; terminateur `L & 0xFFFFFF == 0xFFFFFF` (confirmÃ© aux deux sites, in-pool 45d234-45d23e et externe 45d268-45d276).
  5. Marche mot-par-mot du packet : code GP0 u8 = `[packet+7]` (45d118) ; setup d'Ã©tat selon `noeud[0x14]` bit0 (B7CC00/04, `1CA89FC`, B7CC1C = 10h/0Dh) ; dispatch via `g_SoftwarePrimDispatch[u8]` (@0xB7DC18) et `g_TexturePageDirtyDispatch[u8]` (@0xB7D708) sous portes `dword_1CA8A0C` (bits 0/1), `byte_B7CD28[code]`, `dword_B7CC24`, `dword_1CA8850` ; call polymorphe Ã  45d1fb (texture-dirty si arrivÃ©e directe, software sinon) ; avance : stride = `g_PrimitiveWordStride[code]` dwords (dÃ©faut 1), `count -= stride`, `packet += stride*4`, re-dispatch tant que count > 0 (`jg`, signÃ©).
  6. Si `dword_B7CC24` posÃ© : `World_loadTextureVRAM_updateAnim`, puis re-Ã©mission de `ot_head` via `Gpu_DrawOTagWithDispatchTable` avec `g_GpuPrimDispatchOpaque` puis `g_GpuPrimDispatchSemiTransparent`, chaque pass encadrÃ© par `Gpu_BeginPrimitivePass`/`Gpu_EndPrimitivePass`, Ã©tat `B7CC20` 1â†’0â†’1.
  7. Reset final : `g_OtNodePoolCursor = g_OtNodePool` (pool scratch par-frame) ; `dword_1CA89A4` (si nonzero), `dword_1CA8850`, `dword_1CA89B4`, `dword_1CA89AC` Ã  0 (plus `dword_1CA8880 = 0` en entrÃ©e 45d0b4).
- Preuves (3-8, adresses ASM live) :
  1. `45d087-45d0aa` : division par 0x18 (magie 2AAAAAABh/sar 2/shr 1Fh) + garde `cmp edx,4000h`/`jge` (signÃ©e, compteur â‰¥ 0).
  2. `45d118 mov dl,[esi+7]` + indexation `g_SoftwarePrimDispatch[edi*4]`/`g_TexturePageDirtyDispatch[edi*4]` â€” dispatch par **code GP0 [packet+7]**, pas par tag OT (corrigÃ© E1).
  3. `45d202 mov al, g_PrimitiveWordStride[edi]` / `45d20c mov eax,1` / `45d217 sub ecx,eax` / `45d219 lea esi,[esi+eax*4]` / `45d224 jg 45D111` â€” sous-boucle interne mot-par-mot (E2).
  4. `45d232-45d24a` : terminateur `0xFFFFFF` puis `(noeud[0x16]<<24)|(L&0xFFFFFF)` â€” chainage 24 bits miroir de l'insertion 0x45C870 (E3 : miroir = hypothÃ¨se hors pack).
  5. `45d24f-45d261` : chemin externe `sub_45D050`, abandon si 0 (retour EAX=0), flag `[record+4]=1` (E4 : retour 0 sur abandon).
  6. `45d280-45d2c6` : gate `dword_B7CC24`, `World_loadTextureVRAM_updateAnim`, re-Ã©missions opaque/semi via `Gpu_DrawOTagWithDispatchTable` encadrÃ©es des two@0x460C20/0x460CE0, `add esp,10h`.
  7. `45d2d1-45d2f6` : reset Ã©pilogue (curseur pool + 4-5 globals).
  8. Verification parent : unique xref code `Gpu_DrawOTagCurrent` @0x45d615.
- Questions ouvertes : sens exact du flag bit0 `noeud[0x14]` cÃ´te dispatchers ; sÃ©mantique complÃ¨te de `sub_45D050` (validation externe) ; Â« miroir 0x45C870 Â» Ã  conclure lors de sa close (lot A, 37 instr.).
