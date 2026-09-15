# TextureRelated2 @ 0x419D8F

- Confiance: CERTAIN
- Nom catalogue: trop large (+ proposition : `Texture_BindOrUploadCached`)
- Mode: 1+P
- A==V: n/a (1+P)
- Push IDB: oui
- Preuves:
  - ASM live `419da0`/`419da6` : `cmp [ebp+tex],0` / `cmp [ebp+upload_key],0` ; `jz loc_419DE2` (74 40 / 74 3A) → early-out retour `var_8`=0
  - `419dae–419db1` : `mov edx,[ecx+64h]` ; `mov [eax+2Ch],edx` — copie DWORD `desc+0x64 → tex+0x2C` pré-find
  - `419dc0` : `call Texture_FindTexture` + `add esp,0Ch` — cdecl 3 args (desc, tex, upload_key) → `var_4`
  - `419dd7` : `call Texture_UploadRefcountOrReuse` + `add esp,0Ch` — (desc, tex, var_4=find_result) ; EAX → `var_8` retourné
  - Callee `0x419410` : lit `*desc` bitfield sélecteur (`&1` MatchPaletteStrict, `&2` FormatCallback, `&4` MatchEngineFormat + fallback), match liste `upload_key+0x330`, retour handle `+0xC`
  - Callee `0x419CBE` : lookup node par tex (`sub_424DF2`), `node+0x18 > 0` → `++refcount`, retour `node+0x1C` ; sinon refcount=1 + upload callback `BufApp+0x50` `(0, tex, find_result)`
  - Callers : `TIMrelated_0 @ 0x407797` (cmp EAX,0 ; jz fail ; stocke bind_id `TIM-desc+0x14`) et `sub_414A40 @ 0x414AD1` (stocke `[ecx+0x14]`) — 2 code xrefs seulement, 0 data
  - Wiki battle-address-catalog 0x419D8F = « true entry; Find + refcounted upload » aligné
- Notes parent: §5.6 vert (2 xrefs code live = callers cités, offsets/callees/add esp exacts). 34 instr ≤80, A CERTAIN → 1+P. `hexrays.c` pack = stub erreur, ASM live prime. Nom catalogue `TextureRelated2` informatif zéro → trop large, proposition `Texture_BindOrUploadCached` (markdown seul, pas de rename).

## Analyse réconciliée

- Rôle (1 phrase) : Entrée de liaison texture mise en cache pour le pipeline graphique battle — copie le champ moteur `desc+0x64` vers `tex+0x2C`, résout la texture en cache via sélecteur de format (`Texture_FindTexture`), puis upload référencé ou réutilise le handle existant (`Texture_UploadRefcountOrReuse`), retourne le handle (0 si `tex==0` ou `upload_key==0`).
- Confiance : CERTAIN
- Nom catalogue : trop large (proposition `Texture_BindOrUploadCached`) — corps = find-then-refcount-upload, pas générique.
- In / Out / Effets :
  - In : `desc` (ptr, jamais null-checké), `tex` (ptr objet texture, clé de match), `upload_key` (ptr contexte, liste cache à `+0x330`).
  - Out : EAX = handle texture uploadé/réutilisé, ou 0.
  - Effets : DWORD `desc[+0x64] → tex[+0x2C]` ; refcount `node+0x18` incrémenté ou upload frais via slot driver `BufApp+0x50`, handle stocké `node+0x1C` (dans callee).
- Preuves : cf. liste ci-dessus (8 preuves A, vérifiées parent live).
- Questions ouvertes :
  - Sens exact champs `desc+0x64` / `tex+0x2C` (format ? flags bind ?) — offline indéterminable.
  - `upload_key+0x330` = tête liste cache, structure à confirmer.
  - `desc` passé à `0x419CBE` mais `a1` inutilisé dans corps visible — résiduel ?
