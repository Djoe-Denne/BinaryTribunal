# TIMrelated_0 @ 0x4076B6

- Confiance: CERTAIN
- Nom catalogue: trop large — proposition `Gfx_CreateTIMDescFromFileOrCache`
- Mode: 2+1
- A==V: n/a (2+1 ; A==B rôle file-ou-cache ; R tranche le nom)
- Push IDB: oui
- Preuves:
  - 3 xrefs code (`Gfx_CreateDrawList` ×2 si `[desc+2Ch]==0`, wrapper `sub_40780D`) ; 8 callees
  - Gate cache `83 78 28 00 74 19` : load `TextureRelated` ou `var_8=[desc+28h]`
  - Copie 3 DWORD depuis EAX (`8B 08` / `8B 50 04` / `8B 40 08`) ; `TIMrelated` push valeur `8B 45 F4 50`
  - `calloc` 0x64 ; flags/copy/upload ; `blob+10h/+14h` ; bit 5 → `tex+0CCh` ; `tex+0D0h=[desc+68h]`
  - Sibling `sub_40766C` = même alloc+flags+bind **sans** load (gate `desc+2Ch`)
- Notes parent: §5.6 vert (bytes live, 112 instr, size `0x157`). 1+P/1+V refusés (A trop large, 112 instr). Escalade 2+1. Occupancy 1+2 / queue TIM 0x10 / slot 0xD0 / GF Exists `0x44` absents (`desc` = `[ebp+14h]`). Skip rename IDA. SKIP_NODECOMP → CERTAIN. Questions ouvertes (bit 5 / `tim_mode` / `var_C` / xref runtime `sub_40780D`) hors rôle.

## Analyse réconciliée

# Sémantique TIMrelated_0 @ 0x4076B6 (réconciliation R)

- Rôle (1 phrase) : Alloue un descripteur TIM Square (`calloc` 1×0x64, `render.cpp`), **obtient** une texture fichier (`TextureRelated`) **ou** déjà cachée sur `desc+28h`, pose flags / copie deux champs, upload/refcount (`TextureRelated2`), lie `bind_id` / handle sur le blob, libère l’objet TIM `var_C`, et retourne ce blob (ou NULL).
- Confiance : CERTAIN
- Nom catalogue : trop large — proposition `Gfx_CreateTIMDescFromFileOrCache` (markdown seul ; pas de rename IDB)
  - `TIMrelated_0` / wiki « File-TIM load+upload » : fourre-tout ; le load fichier n’est pas obligatoire.
  - A `Gfx_LoadAndBindFileTIM` trop large : « Load » nie le gate cache ; « Bind » = un DWORD `blob+10h`.
  - B `Gfx_CreateTIMDescAndUpload` trop large : le sibling `sub_40766C` crée aussi un desc ; « Upload » ignore file-ou-cache + flags + copie + `TIMrelated(var_C)`.
  - Preuve callers : 3 xrefs code — `Gfx_CreateDrawList` @ `0x416EEF` (`tim_mode=0`, cases 4/5/12/13) et `0x416FD0` (`tim_mode=1`, cases 6/7/14/15) **seulement si** `[desc+2Ch]==0` ; sinon sibling sans load. Wrapper `sub_40780D` @ `0x407841` (`bind_id=0`, `tim_mode=1`, `upload_key=FFGetBufferAddress()`). GrepAI vide → vérité IDA.
  - Preuve opcodes : `83 78 28 00 74 19` (`[desc+28h]==0` → `TextureRelated`) sinon `var_8=[desc+28h]` ; alloc callee `push 64h` @ `0x4070ED` ; puis flags / copy / `TextureRelated2` / `8B 45 F4 50` → `TIMrelated`.
- In / Out / Effets : `_DWORD *__cdecl(int bind_id, int tim_mode, char *path, int *desc, int upload_key)`, `retn` C3, frame EBP `sub esp,30h`, 112 instr, size `0x157`, fin `0x40780D`. `desc` = 4e arg `[ebp+14h]` (offset de frame IDA `0x44` depuis le bas, **pas** GF Exists `+0x44`). EAX = blob TIM (`Render_sub_4070E2`) ou 0. Succès : `blob+10h=bind_id`, `blob+14h=EAX` de `TextureRelated2`, `TIMrelated(var_C)` **valeur**. Échec : `sub_41ABFD(&triple)` seulement si `desc+28h==0`, puis `au_re_CompilerDebug(blob)`, EAX=0. Occupancy 1+2 / file TIM battle stride 0x10 / slot 0xD0 / F_CHAR 0x1D0 absents. `jz`/`jnz` only.
- Preuves (3–8) :
  1. Callers live `xrefs_to` 3 `Code_Near_Call` : `0x407841` / `0x416EEF` / `0x416FD0`. `add esp,14h`. `Gfx_CreateDrawList` démarre `0x416D82` ; `C7 45 E8 00 00 00 00` @ `0x416DC7` initialise le local `bind_id` (unique store) ; les deux sites poussent ce local + `path` + `desc` + `[arg_10+6Ch]`.
  2. Callees 8 + `add esp` live : `Render_sub_4070E2` 0 (calloc `1,0x64` + `[blob+44h]=4`, TIM-desc pas GF Exists) ; `TextureRelated` 0Ch ; `Gfx_SetTIMDescFlags` 10h ; `Gfx_CopyDescFields92_68` 8 (dest=`var_8` tex, src=`var_4`) ; `TextureRelated2` 0Ch ; `TIMrelated` 4 ; `sub_41ABFD` 4 ; `au_re_CompilerDebug` 4.
  3. Cache / charge : `8B 45 14 83 78 28 00 74 19` ; load `8D 55 D0 52 E8… 83 C4 0C 8B 08 89 4D DC 8B 50 04 8B 40 08` — 3 DWORD **depuis EAX**, pas depuis `lea var_30`. Épilogue callee unique `0x41AE79–0x41AE9C` : écrit `arg_0[0/4/8]` puis `mov eax,[ebp+arg_0]` (`8B 45 08`) / `retn` unique — à **ce** site EAX==`&var_30`, reconstruction fidèle = lecture EAX.
  4. Flags / tex : `83 E0 20 85 C0 74 0A` + `C6 81 CC 00 00 00 01` (bit 5 → BYTE `tex+0xCC=1`, **pas** occupancy) ; `8B 48 68 89 8A D0 00 00 00` (DWORD `tex+0xD0=[desc+68h]`, **champ**, pas stride slot). `6A 01 E8 … 83 C4 10` = `Gfx_SetTIMDescFlags(1, tim_mode, [desc+20h], blob)`.
  5. Copy même si `tex==0` : après `83 7D F8 00 74 25` (skip **seulement** +CCh/+D0h) le flux tombe en `0x407762` puis `0x40777B` `8B 45 FC 50 8B 4D F8 51 E8` (`push blob; push tex`) `call Gfx_CopyDescFields92_68` @ `0x407783` `add esp,8`. Callee : `83 7D 08 00 74 24` / `83 7D 0C 00 74 1E` — no-op si dest **ou** src NULL. Copie interne `src+5Ch→dest+C4h`, `src+44h→dest+C8h` (DWORD TIM-desc=4, pas GF Exists).
  6. Bind / free : `89 42 10` / `89 51 14` (`blob+10h/+14h` = champs du calloc 0x64, **pas** queue 32×0x10) ; `8B 45 F4 50 E8` @ `0x4077BA` = `push [ebp+var_C]` valeur. `TIMrelated` : `cmp [ebp+arg_0],0` `jz` puis champs `+8/+0Ch` (`tim.cpp`) — objet, pas pointeur-sur-pointeur. Fail : `83 79 28 00 75 0C 8D 55 F0 52` (`lea` triple seulement ici).
  7. Wiki aligné (moteur ≠ battle queue) : `docs/tech/systems/render_textures_tim.md` entrée vraie `0x4076B6` (pas `0x4076FC` = call intérieur +0x46), callers CreateDrawList ×2 + wrapper, chaîne flags/copy/`TextureRelated2` ; `docs/tech/reference/address_catalog.md` « File-TIM load+upload ». QMD `ff8-wiki` → `battle-address-catalog.md` (hit catalogue, même EA). Distinct de la file 32×stride `0x10` @ `0x1D98220`. Wiki omet le gate `desc+2Ch` → sibling (n’ôte pas le rôle fichier/cache de **cette** fonction).
  8. Hex-Rays vs GLM : HR live copie `*v5`/`v5[1]`/`v5[2]` depuis EAX, `TIMrelated(v14)` = valeur, `v15[52]=desc[26]` = `tex+0xD0`/`desc+68h`, `v16[4]/[5]` = +10h/+14h — flux OK, notation index DWORD = piège. GLM A lit `load_out[]` et `TIMrelated((void **)&tim_to_free)` ; GLM B `TIMrelated(&tim_handle)` + `0xD0h` C invalide. Réconcilié = ASM (`loaded[i]` + `TIMrelated((void *)triple[1])`).
- Questions ouvertes :
  - Sens du bit 5 `desc[0]&0x20` (BYTE `tex+0CCh`) et du DWORD `desc+68h` → `tex+0D0h`.
  - `tim_mode` 0 vs 1 (jumptable CreateDrawList 4/5/12/13 vs 6/7/14/15) au-delà du passage à `Gfx_SetTIMDescFlags`.
  - Contenu précis de `var_C` (triple[1], objet TIM `polygon/tim.cpp`) hors le free succès / `sub_41ABFD`.
  - `sub_40780D` : 0 xref code (wrapper path-only) ; qui l’appelle à l’exécution ?
  - `bind_id` vaut 0 aux 3 xrefs live — **fait callers**, pas invariant du callee.
  - `[desc+20h]` comme mode blend (déjà ouvert chez `Gfx_SetTIMDescFlags`).

## Divergences A/B

- Rôle « charge un TIM fichier » vs « obtient une texture fichier ou cache » : **B gagne** (opcode `83 78 28 00 74 19` @ `0x4076D1` ; A décrit aussi le cache, mais le verbe premier « charge » est trop étroit).
- Nom `Gfx_LoadAndBindFileTIM` vs `Gfx_CreateTIMDescAndUpload` : **les deux trop large** → 3e `Gfx_CreateTIMDescFromFileOrCache` (callers `desc+2Ch` + opcodes `desc+28h` / calloc 0x64).
- Sibling `sub_40766C` alloc+flags+bind sans load : **B gagne** (hors rôle de CETTE fonction). Live : callees seulement `Render_sub_4070E2` + `Gfx_SetTIMDescFlags` ; stores inline `blob+10h/+14h` si `arg_8≠0`. CreateDrawList `cmp dword [eax+2Ch],0` @ `0x416E83` / `0x416F64` : ≠0 → sibling `0x416EA1` / `0x416F82` ; ==0 → `TIMrelated_0`.
- Copy appelé même si `tex==0` : **B gagne** (call site `0x407783`, bytes `8B 4D F8 51 E8` ; callee no-op `83 7D 08 00 74 24` @ `0x407640`).
- TextureRelated EAX vs `load_out[]` GLM A : **opcode gagne** (`8B 08` / `8B 50 04` / `8B 40 08` @ `0x407704`). B note juste l’invariant callee `8B 45 08` @ `0x41AE96` (EAX==`&var_30` ici) ; reconstruction = lecture EAX (HR `v5`, réconcilié `loaded`), pas `load_out[]`.
- `bind_id` toujours 0 aux 3 xrefs : **A gagne comme observation callers**, pas comme invariant callee. Live : unique store CreateDrawList `C7 45 E8 00 00 00 00` @ `0x416DC7` ; wrapper `6A 00` @ `0x40783F` ; pushes `8B 4D E8 51` @ `0x416EEB` / `0x416FCC`.
- `sub_40780D` 0 xref code : **B gagne** (`xrefs_to` vide, y compris data). Wrapper path-only ; question ouverte.
- `TIMrelated` `&local` GLM A/B vs valeur : **opcode gagne** (`8B 45 F4 50` @ `0x4077BA`). HR `TIMrelated(v14)` et C réconcilié alignés ASM.
- `desc` / occupancy / stride 0x10 / slot 0xD0 / GF `+0x44` : **A et B d’accord**, opcodes cités ; pas de divergence à trancher.
