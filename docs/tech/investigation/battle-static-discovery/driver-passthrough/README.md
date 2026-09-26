# Prototype DLL — driver graphique passthrough « observer Mode A » (lot 12)

> Prototype injectable `type 2` pour `FF8_EN.exe` (`064d466b…`, base `0x400000`, x86).
> Mode : **observer** — le backend natif OpenGL (ctor `0x4252B0`) reste le seul
> moteur réel ; la DLL crée un objet proxy 0x108 qui log chaque slot appelé,
> forwarde vers le natif, et capture les draw lists (slots 43–64).
> Spec contraignante : [`../driver-abi-spec.md`](../driver-abi-spec.md) (§1 cycle de vie,
> §2 config 36 bytes, §3 objet 66 DWORDs, §4 convention, §5 table des slots,
> §6 chaîne draw-list, §7 activation).

## 1. Fichiers

| Fichier | Contenu |
| --- | --- |
| `gfx_driver_passthrough.h` | ABI publique : typedefs de slots (signatures dérivées du disasm, EA d'evidence en commentaire), config 36 bytes, struct de capture, prototypes exportés. |
| `gfx_driver_passthrough.c` | Factory `new_dll_graphics_driver`, wrappers log+forward, capture/replay, `DllMain` flag-only. |

## 2. Build (MSVC, x86)

Depuis *x86 Native Tools Command Prompt* (ou `vcvarsall.bat x86`) :

```bat
cl /nologo /W3 /Ox /MT /LD gfx_driver_passthrough.c /Fe:gfx_driver_passthrough.dll
dumpbin /exports gfx_driver_passthrough.dll
```

- C pur, aucune dépendance hors CRT static (`/MT`) et `kernel32`/`user32` — pas de CRT DLL
  à distribuer.
- Les exports sont posés par pragma linker (`/EXPORT:new_dll_graphics_driver=_new_dll_graphics_driver`),
  donc le nom exporté est **non décoré** : `GetProcAddress(hMod, "new_dll_graphics_driver")`
  fonctionne tel quel. Vérifier avec `dumpbin /exports` (fallback : fichier `.def` avec le
  même nom non décoré).
- Le .c est du C MSVC simple (déclarations en tête de bloc, pas de C99 requis).

## 3. Activation

### 3.1 Contrainte (spec §7)

`Gfx_LoadExternalBackendFactory` (`0x409805`) a **zéro caller statique** : le chemin type 2
n'est jamais emprunté nativement. Le lanceur doit poser la config **avant le boot graphics**.

### 3.2 Procédure

1. Placer `gfx_driver_passthrough.dll` à un chemin lisible par le process (LoadLibraryA).
2. Avant que `CheckRegistry` (`0x401890`) n'appelle `Gfx_InitializeSelectedBackend`
   (`0x40942E` via call @`0x401905`) :

```c
typedef int (__cdecl *PFN_LoadExternalBackend)(GFXPT_ExternalBackendConfig36* cfg, void* engine);

GFXPT_ExternalBackendConfig36 cfg;
memset(&cfg, 0, sizeof(cfg));
cfg.backendType   = 2;                          /* DOIT valoir 2 (spec §2) */
cfg.dllName       = "C:\\...\\gfx_driver_passthrough.dll";
cfg.factoryExport = "new_dll_graphics_driver";
/* cfg.reserved[6] : copiés tels quels vers engine+0xBB0 (passthrough config) */

((PFN_LoadExternalBackend)(void*)0x409805)(&cfg, engine);   /* base 0x400000 */
```

   Effets (`0x409805`, triple decomp existant) : `engine+0xBA8 = 2`,
   `qmemcpy(engine+0xBB0, cfg, 0x24)`, `LoadLibraryA`, `GetProcAddress`,
   `engine+0xBC8=1`, `engine+0xBCC=hModule`, `engine+0xBD0=factory`.
   Alternative équivalente : écrire directement `engine+0xBA8=2` + `engine+0xBD0=factory`
   après avoir résolu l'export soi-même (spec §7.1).

3. Le boot natif appelle ensuite `0x40942E` → case 2 → `factory(engine)`
   (call `[ebp-8]` @`0x40951D`) → la factory construit le proxy → **slot 0 Init immédiat**
   (call `[driver]` @`0x409572`) → suite boot natif (`sub_418C6E`, set_viewport `0x41E070`,
   isGetDrawBuf `0x41E170`, `sub_41DF96`, present dispatch `0x41DF0C`, `sub_408E90`).
4. `engine+0xB88` doit être non-nul pour que le present (slot 4) tire (gate @`0x41DF22`).
5. Shutdown : fn `0x409670` appelle slot 1 (proxy → forward natif → fclose CSV)
   puis `FreeLibrary(*(engine+0xBCC))` @`0x40971A`. La DLL se décharge proprement
   (aucun travail dans `DllMain`, flag only).

### 3.3 Variables d'environnement (lues hors DllMain)

| Variable | Effet |
| --- | --- |
| `FF8_PASSTHROUGH_LOG` | Chemin du CSV (append). Absente → logging `OutputDebugStringA` seul. |
| (replay) | `Passthrough_SetReplayLive(1)` depuis un outil attaché — pas d'env ; défaut = dry-run. |

Format CSV (une ligne par slot appelé) : `seq,slot,arg0,arg1,arg2,arg3,ret` (`%p`).

## 4. Ce que fait la DLL (design)

1. **Factory** : appelle le ctor natif OpenGL (`0x4252B0`, `void* __cdecl(void* engine)`)
   pour créer le driver natif, le garde en static (`g_native`), alloue son propre objet
   0x108 (`VirtualAlloc`, zero-fill) rempli de wrappers, et retourne **uniquement le proxy**.
   L'engine le stocke en `engine+0xA74` ; l'objet natif n'est jamais exposé.
2. **Wrappers** : chaque slot wrappé log (`seq,slot,args,ret`) puis forwarde vers le slot
   équivalent de `g_native` si non-nul, sinon `return 0` (no-op). Convention : `__cdecl`,
   forward de la pile d'args reçue telle quelle (les positions d'engine dérivées du disasm
   sont documentées par typedef dans le .h — pour plusieurs slots l'engine n'est PAS le
   premier argument : slots 5/7/18 (dernier), 8 (2e), 27/28/30/31/32/33/35/39/40 (2e)).
3. **Slots 16/17/42** : fnptrs natifs copiés tels quels (pas de wrapper, pas de log) —
   comportement strictement identique au natif.
4. **Slots 9–14** (+0x24..+0x38) : état inline, zero-init. L'engine les écrit directement
   (isGetDrawBuf `0x41E168` copie le vec4 clear-color vers driver+0x28..+0x34 AVANT d'appeler
   le slot 8) — le proxy les reçoit naturellement, rien à maintenir côté DLL.
5. **Capture draw-list** : slots 43–64 loggent + copient 24 octets/node dans un ring
   (8192 nodes, 256 captures), avec `gen` (`*(*(list+0x34))`) et `stamp` (`*(list+0x58)`)
   lus défendus SEH (mêmes champs que les guards de `Gfx_WalkDrawList 0x4178D7`).
   Session = (slot, ctx, gen) ; ring plein → `dropped++` (dégradation silencieuse).
6. **Replay** : `Passthrough_ReplayCaptured()` — dry-run par défaut (valide + compte) ;
   en mode live, ré-émet les nodes capturés via les fnptrs natifs 43–64.

## 5. Limites (Mode A — observer)

- **Aucune suppression du present natif** : le slot 4 forwarde le present GL natif
  (`RenderGL_Present 0x439CF3` → `SwapBuffers` GDI32). La DLL ne remplace aucun rendu,
  n'injecte aucun contenu, ne supprime aucune frame : elle est transparente.
- **Pas de backend alternatif** : tout le rendu reste natif ; le proxy ne fait qu'
  observer + forwarder. Backend natif réel de la build DotEmu Steam = **DDrawAlt
  (case 0, ctor 0x4257D0)** — le ctor OpenGL 0x4252B0 (case 3) échoue en live sur
  ce port (run 2026-09-23 18:05).
- **Slots no-op obligatoires** (return 0, log seulement) :
  - slot 21 : wrapper engine `0x41B06B` partiellement analysé (call indirect non résolu) ;
    Alt-only → atteignable sous proxy DDrawAlt (slot natif non-null) mais non exercé au menu.
- **Slot 42** : hors plage 18–41 et absent de la liste « =0 » → choix conservateur :
  copie transparente du fnptr natif `0x439000` (comportement préservé, non loggé).
- **Slots 15/34/36/37 = 0** (miroir des ctors natifs) : 36 est un override que le wrapper
  engine `0x41E803` retombe sur le slot 35 ; 34 est un hook optionnel NULL-guarded
  (wrapper `0x41E7AD`) ; 37 libre ; 15 inerte.
- **Alt-only sous proxy GL** (slots 21–24, 65) : slots natifs NULL → no-op `return 0`
  (invariant spec §4 : jamais NULL fnptr si l'engine peut les appeler). Le slot 65 est
  NULL-guarded côté engine (`0x4097B6`).
- **Replay différée complète hors proto** : la re-émission live utilise le ctx capturé
  (peut être stale) et des copies de nodes (le `next = *(void**)node` pointe vers la copie).
  La reconstruction d'un `GfxDrawList` synthétique (0xEC : +0x18 ctx, +0x34 genptr,
  +0x58 genstamp, +0x94 head, +0x9C setup, +0xA0 walk) est l'étape suivante (Mode B/C).
- **Mono-thread supposé** : pas de locks (le rendu FF8 est mono-thread) ; l'observer
  lui-même n'est pas thread-safe.
- **Coût CSV** : `fprintf`+`fflush` par appel loggé (robustesse au crash > perf). Les slots
  43–64 (draw lists) et 29/30 (RS) sont à forte fréquence : attendre des CSV volumineux.
- **Base EA** : les EAs sont des constantes nommées (base `0x400000`) ; le code calcule
  `base + (EA - 0x400000)` via `GetModuleHandleA(NULL)`, donc un hôte relocalisé reste
  correct tant que les octets à ces EAs sont ceux de la build cible.
- **Pas de free** de l'objet proxy (le cycle natif n'en libère pas non plus) ; la DLL
  reste chargeable/déchargeable proprement (shutdown `0x409670` → FreeLibrary).

## 6. Traces vers le spec (per-slot)

Chaque wrapper du .c porte une ligne commentaire `slot N — <wrapper engine EA> : call ... , add esp,N`
renvoyant à la table du spec §5. Résumé des signatures dérivées (push droite→gauche,
cleanup `add esp,N` sur le site d'appel indirect) :

| Slot | Signature dérivée | Evidence (call site, cleanup) |
| --- | --- | --- |
| 0 | `(engine)` | `[eax]` @0x409572, esp+4 |
| 1 | `(engine)` | `[edx+4]` @0x4096F2, esp+4 |
| 2 | `(a0)` | `[edx+8]` @0x41DED4, esp+4 |
| 3 | `(a0)` | `[edx+0xC]` @0x41DF02, esp+4 |
| 4 | `(engine)` | `[eax+0x10]` @0x41DF32, esp+4 |
| 5 | `(a0,a1,a2,engine)` | `[edx+0x14]` @0x41DFE0, esp+0x10 |
| 6 | `(engine)` | `[edx+0x18]` @0x41DFB0, esp+4 |
| 7 | `(x,y,w,h,engine)` | `[eax+0x1C]` @0x41E106, esp+0x14 |
| 8 | `(clearColorVec4, engine)` | `[ecx+0x20]` @0x41E1A5, esp+8 |
| 18 | `(a0,a1,a2,engine)` | `[edx+0x48]` @0x41E646, esp+0x10 |
| 19 | `(a0)` | `[edx+0x4C]` @0x419ED8, esp+4 |
| 22/23/24 | `(a0,a1)` (Alt-only) | @0x419F57 / @0x419F9F / @0x417E39, esp+8 |
| 25 | `(a0..a4)` | @0x41EA61 (2e site @0x40828A), esp+0x14 |
| 26 | `(a0..a5)` | `[ecx+0x68]` @0x41E9FC, esp+0x18 |
| 27/28 | `(a0, engine)` | @0x418815 / @0x41EA99, esp+8 |
| 29 | `(type 0–25, value, engine)` | `[ecx+0x74]` @0x41E67E, esp+0xC |
| 30 | `(a0, engine)` | `[eax+0x78]` @0x41E79B, esp+8 |
| 31 | `(a0, engine)` (3 sites) | @0x41E6C1 / @0x41E6F5 / @0x41E71D, esp+8 |
| 32 | `(a0, engine)` | `[eax+0x80]` @0x41E745, esp+8 |
| 33 | `(blend 0–4, engine)` | `[eax+0x84]` @0x41E770, esp+8 |
| 35 | `(a0, engine)` | `[eax+0x8C]` @0x41E7F6, esp+8 |
| 38 | `(a0, a1)` | `[eax+0x98]` @0x41E93A, esp+8 |
| 39 | `(a0, engine)` | `[eax+0x9C]` @0x41E965, esp+8 |
| 40 | `(a0, engine)` | `[eax+0xA0]` @0x41E990, esp+8 |
| 41 | `(engine)` | `[edx+0xA4]` @0x41E9B7, esp+4 |
| 43–64 | `(ctx, node, arg)` | spec §6 (prouvé par Gfx_WalkDrawList 0x4178D7) |
| 65 | `(engine)` | `[eax+0x104]` @0x4097C6, esp+4 |

## 7. Réfs

- `../driver-abi-spec.md` — contrat slots (source de vérité).
- `../driver-provenance.md` — provenance du present (IAT, matrice backend).
- `../../decomp/0x409805__*.md`, `../../decomp/0x40942E__*.md` — triples init.

## 8. v7 — Dump mémoire des draw lists (lot 13, 2026-09-25)

### 8.1 Principe

- Extension additive de v6.1 : chaque wrapper slot 43–64 capture **au vol** le node visité
  (appelé **par node** par `Gfx_WalkDrawList 0x4178D7`, ordre = ordre de draw exact). Copie
  SEH bornée dans un ring RAM 64 Mo ; **aucune IO dans le detour draw**.
- **Sidecar** `gfx_passthrough.dump` à côté de la DLL (même mécanisme `GetModuleFileNameA`
  que le CSV), contrôlé **au present dispatch uniquement** : présent → arme les 16
  prochains frames (`seq..seq+15`), auto-suppression, flush append vers
  `gfx_passthrough_dump.bin` + ligne par frame dans `gfx_passthrough_dump.log`.
- Gardes : node non nul, `vcount ≤ 4096`, `icount ≤ 16384`, record ≤ 256 Ko,
  4096 records/frame, ring 64 Mo (BSS demand-zero). CSV v6.1 inchangé. Slot 20 fnptr natif intact.

### 8.2 Format binaire (contrat piné, contrat v7 du `.c` §332+)

Enregistrements auto-descriptifs LE, pas d'en-tête global : `u32 magic 'ND07'; u32 slot;
u32 seq; u32 ctx; u32 node_addr; u32 geom_kind (0/1/2); u32 fails; u32 payload_size
(= octets après ce champ : node[24] + payload); u8 node[24]; payload : kind2 = u32 vcount;
u32 icount; u16 idx[icount]; u16 pad[icount&1]; u8 fvf[vcount*32]`. Record total = 32 + payload_size.

### 8.3 Closure node→géométrie (IDB + capstone, hash PE `064D466B…9570`)

| Slots | Impl | Lecture |
|---|---|---|
| 48/49/50 | `0x43E24A` | direct : vcount@+0x0C, verts@+0x14, icount@+0x18, idx@+0x20 (TRIANGLELIST, FVF 0x1C4) |
| 51/60 | `0x43E356`/`0x43E692` | VB batch : remaining@+0x08, verts@+0x14, idx@+0x20, ids@+0x28 (u8/groupe), geom=+0x2C, vcount=*(geom+0x3C)×rem, icount=*(geom+0x40)×rem |
| 57/58/59 | `0x43E5E9` | direct (FVF 0x1E2) |
| 63/64 | `0x43E540` | direct (LINELIST) |
| 43–47, 52–56, 61/62 | setup | node jamais lu → geom_kind 0 |

Slots 43–64 sont appelés `(ctx, node, cookie)` ; le node est **l'arg_1**. Le natif 51/60
avance ses curseurs en registres locaux (pas de writeback du node, vérifié disasm).

### 8.4 Décodeur offline

`tools\_tmp_af3dn_drop\decode\` — `ff8dump.py info|render`, `selftest.py` (PASS 28/28),
`raster.py` (rasteriseur software, zéro API graphique). PNG painter-order, fill plat
DIFFUSE, alpha<8 skippé, `--wire`. CSV `2.13 Go` (41,1 M appels) hors git : hash
`1EAB485F0E0139565545334A278CA8B056CA3A3F44EBCADE3FB4B33433F8E2C9`.

### 8.5 Anomalie campagne 25/09 (fermée — cause racine = flush mode texte)

Le dump `.bin` de la campagne sous-comptait `payload_size` de **2 o par record contenant un
octet `0x0A`** : `fopen(binPath, "a")` = mode TEXTE (CRLF expansion). Preuves : ReadProcessMemory
du jeu en cours (anneau RAM contrat exact) vs le même record sur disque (LF expansés) ;
reproduction in vitro ; harnais sur le DLL déployé (g_dumpWrite conforme). Correctif :
`fopen(binPath, "ab")` (v7.1 `F7A9B39B…E4F`). Le décodeur absorbe les 4 dumps historiques
(resync + realign tail + reconstruction idx quad-strip) ; **les dumps futurs passent `--strict`**
(resync = échec bloquant). Les records bataille hors gardes (vc 19482) venaient de l'image
bootée 13:47 (build drift gardes, image morte) — l'image `53464B47`+ ne peut pas les produire.
Détails : `decode\_audit\DumpNode_decomp_reconcile.md`.

## 9. v8 — Capture texture (lot 14) : TX07 miroir VRAM

### 9.1 Principe

Extension additive du dump v7 : en plus des records ND07 (draw nodes), chaque frame armé
émis **UN record TX07 = snapshot du miroir VRAM complet** (1024×512 u16 = 0x100000 o),
émis au premier node walk texturé de la frame (slots 48–50/57–59/63–64 direct,
51/60 VB, dédup par pulse). Le miroir contient **toutes les pages texture ET tous les
CLUTs** (fenêtre CLUT VRAM à `clut_word << 5` u16, cf. `sub_45B920` = ptr + id CLUT).

### 9.2 Format TX07 (contrat piné)

`u32 magic 'TX07' (0x37305458); u32 build (0x5638); u32 seq; u32 clut_now (dword_1CA89B8);
u32 vram_base (ptr dword_1CB602C); u32 sys_clut_base (0x1B47818); u32 m_B7DB44 (flag RGB555
swap); u32 page_probe (*(texinfo+0x10) du premier node texturé — diagnostic décodeur);
u8 vram[0x100000]` — record total 0x100020. ND07 : l'en-tête gagne un 9e u32 `build`
(0x5638) à l'offset 0x20 (contrat v7 36 o). TX07 n'entre pas dans l'ordre painter.

### 9.3 Closure texture (idb, decomp — provenance lot 14)

Chaîne : `texinfo = *(node+0x2C)` (= `geom` pour 51/60), `page = *(texinfo+0x10)` (record
`sub_4223B8` +0x2C), guard natif `*(page+0x14)`. Bias UV appliqué **au vol** par
`sub_409C6E` (U@+0x18, V@+0x1C, stride FVF 0x1C4) → les UV dumpés sont post-bias, le
décodeur calcule directement pixel. Layout VRAM : page_x = (tpage&0xF)«6, page_y = ((tpage»4)&1)«8,
vramOff = (page_y+y)«10 + page_x + (x » (2−mode)) — 4bpp (mode 0) / 8bpp (1) / RGB555 (2),
pitch 0x800 B/row, page = 256×256 texels. Détail complet : `driver-abi-spec.md` §6.2.

### 9.4 Décodeur v2

`ff8dump.py` : lit ND07 (36 o + build) et TX07 (0x100020), sampling texture point
(`--texture`, `--tpage`, `--texmode` 0/1/2 — 4bpp/8bpp/16bpp RGB555), CLUT lu du miroir
à `(clut_now & 0x7FFF) << 5` u16, modulate DIFFUSE α<8 skip, selftest étendu (60 checks).
v8 dump only (v7 = historique, le parseur refus clean avec hint).

## 10. v9 — ids texture par node (ND08) + ligne CLUT système (TX07)

### 10.1 ND08 : footer texture des records kind2 (lot 15)

**Ce que l'analyse noise-render a établi** : « tpage/mode/clut vivent AU-DELÀ de la
copie 24 o du node » — la capture v7 copie le node pointer-free (24 o) et n'a NI la
chaîne texture (texinfo `*(node+0x2C)` → tpage/mode) NI l'identité de palette du
record slot (`*(u16*)(ctx+0x448)`, lecture WORD 66h-prefixed). Sans ça, le grain
16 couleurs (chaque groupe d'id plaque SA sous-palette) est indéchiffrable. v9
APPOSE donc un **footer texture aux records geom_kind==2 uniquement**, par
extension additive du payload piné v7/v8 (aucun champ reculé, aucun rewrite) :

- **Magic** : tout record kind2 passe au magic **`'ND08'` (0x3830444E, ASCII LE)** ;
  kind 0/1 restent `'ND07'` — rejet décodeur propre (kind2 à magic ND07 =
  anomalie historique 25/09, resync). Hdr inchangé : 9 × u32, **build 0x5639**.
- **`payload_size` = 24 (node) + (8 + idx + pad + fvf) + footer**, footer =
  **16 + ⌈id_count/4⌉·4 + 4** : u32 tpage, u32 mode, u32 clut, u32 id_count,
  u8 ids[id_count] (pad u32), u32 dropped_ids (toujours présent, en fin).

| Champ | Source | Slots |
| --- | --- | --- |
| `u32 tpage` | `*(u32*)(texinfo+0x20)` — SEH, 0 si fail | tous kind2 |
| `u32 mode` | `*(u32*)(texinfo+0x14)` (0=4bpp, 1=8bpp, 2=16bpp) — SEH, 0 si fail | tous kind2 |
| `u32 clut` | `*(u16*)(ctx+0x448)` — SEH dword, masqué `& 0xFFFF` | tous kind2 |
| `u32 id_count` | 0 (ids absents) / `min(remaining, 255)` (cap, sans bit d'overflow) | directs / 51·60 |
| `u8 ids[id_count]` | stream d'ids TEL QUE CONSOMMÉ par le walk natif (`ids = *(u8**)(node+0x28)`, 1 octet PAR GROUPE (`0x43E419`/`0x43E725`), remaining = `*(s32*)(node+0x08)`) — copie SEH UNIQUE ≤ 256 o, pad zéro | 51·60 |
| `u32 dropped_ids` | gcount si gcount > 255, sinon 0 | tous kind2 |

`texinfo` : dedicate SEH read de `*(node+0x2C)` dans DumpNode pour les slots
directs (48/49/50/57/58/59/63/64 — indépendant du holder TX) ; pour 51/60,
texinfo = geom = `*(node+0x2C)` (déjà lu pour perV/perI). **« 16-color grain »
= sous-palette par id groupe** : la row CLUT système (2048 o) porte 64
sous-CLUT de 32 o = 16 couleurs (`sub_45B920`), le stream d'ids sélectionne la
sous-palette de chaque groupe. Échec du stream ids → **id_count=0 +
`hdr.fails++`** (bloc mis à zéro, style idx/fvf) ; échecs tpage/mode/clut
→ champ 0 NON fatal (style `page_probe` TX07).
Budget ND08 max recomputé : 36 + 24 + (8 + idx 32 768 + fvf 131 072) +
footer 276 = **164 184 o (0x28158)** ⊂ `GFXPT_DUMP_MAX_NODE_BYTES`.

### 10.2 TX07 : payload + `sys_clut_row[2048]` (record 0x100820)

`GFXPT_Tx07Hdr` : **8 × u32 INCHANGÉS** (la row est du payload, pas un champ
d'en-tête — l'en-tête PINÉ v8 reste byte-exact). Le payload devient
`u8 vram[0x100000]; u8 sys_clut_row[2048];` → record **0x100820**
(+0x800 sur v8 0x100020). `sys_clut_row` = copie de
**`&unk_1B47818 + 2048 * ((clut_now & 0x7FFF) >> 6)`** — `unk_1B47818` est une
**base statique littérale** : `GFXPT_HostEA(GFXPT_EA_SYS_CLUT)` (0x1B47818)
**EST** l'adresse réelle de la table, et la fenêtre CLUT d'un id vit dans la
row `clut>>6` (`sub_45B920` : base + 2048*(clut>>6) + 32*(clut&0x3F), le
terme 32*(clut&0x3F) pointe DANS la row copiée). Échec SEH de la copie →
2048 o à zéro + `g_txSehFails++` (non-fatal, record émis ; **1 ODS par
fenêtre max**, `g_txSysWarned`). Le **miroir VRAM reste copié à l'identique**
(source pixels valide ; sa grille d'échantillonnage n'a besoin de la CLUT
système que pour la **résolution de palette**, pas la lecture pixel).
Garde : `GFXPT_DUMP_MAX_NODE_BYTES` recalé **0x100C80** (record TX07
0x100820 + marge 0x460, marge v8 conservée ; ND08 max 164 184 o ⊂ cap).
Ring 64 MiB : 0x100820/record → **63 records TX co-résidents max** ; TX
reste 1/frame — aucune pression ; ND08 ≤ 4096 records × ~200 B médian, fits.

### 10.3 Provenance (aucun offset inventé)

Offsets non dérivés du v8 : `texinfo+0x14` (mode), `texinfo+0x20` (tpage),
`ctx+0x448` (clut WORD), `node+0x28` (ids, déjà prouvé par l'analyse NB ids
v7 `0x43E419`/`0x43E725`), `&unk_1B47818 + 2048*(clut>>6)` (`sub_45B920`,
decomp 0x464DB0 — cf. `driver-abi-spec.md` §6.2-C). Champs BSS :
dword_1CB602C / dword_1CA89A8/1CA89B8 / dword_B7DB44 inchangés (v8).

## 11. v10 — TR08 (textures TIM bataille)

### 11.1 Principe

Nouveau record **`'TR08'` (0x38305254)** = **ressource texture TIM bataille**,
**UN par texobj unique PAR FRAME**, émis au **premier node walk texturé qui le
référence, AVANT le ND08 de ce node** — même point d'émission que TX07 (tête de
`GFXPT_DumpNode`, slots 48–50/57–59/63–64 + 51/60 ; ordre flux :
TX07 → TR08 → ND07/ND08). Le **texobj `T` = `*(texinfo+0x10)`**
(`texinfo = *(node+0x2C)`) — la **VALEUR du pointeur** (le même champ déjà posé
en `page_probe` TX07) sert de clé de dédup (table per-frame `g_resSeen[64]`,
reset au pulse à côté de `g_frameTxEmitted`) ET de clé de match avec le footer
ND08 (§11.3). Cap **≤ 32 TR08/frame** (log `,tr=N`) ; ring-space style TX07
(drop + 1 ODS par fenêtre d'armement). Ne participe pas à l'ordre painter ND08
(mapping décode-side `footer.texobj ↔ TR08.texobj`).

### 11.2 Format TR08 (contrat piné)

Chaîne IDB (`sub_407EB4` → `sub_4221E6` → `sub_421C41`) : `palMgr M = *(T+0xA0)`
(`M[3]` = `T+0xAC` = `*(u32*)(M+12)` = nombre de palettes) ; le **CLUT brut** est
un tableau **u32 PAR COULEUR, toutes les sous-palettes consécutives** (palette
`i` commence à `raw + 4*entries*i`) ; les pixels sont **1 o/texel** (`w*h` à
`T+0xD8`). Adressage palette moteur : palette `i`, couleur `j` =
`raw[4*(entries*i + j)..+4]` — **l'octet 3 de chaque u32 = bit de transparence
PSX (STP)**.

| Champ | Source |
| --- | --- |
| `u32 base` | `magic 'TR08' (0x38305254); u32 build (0x563A); u32 seq; u32 texobj (VALEUR T)` |
| `u32 w` / `u32 h` | `*(T+0x3C)` / `*(T+0x40)` |
| `u32 pal_entries` | `*(T+0x5C)` (256 pour 8bpp, 16 pour 4bpp) |
| `u32 pal_count` | `*(u32*)(M+12)`, `M = *(T+0xA0)` — **cap 32** (saturé) |
| `u32 pixel_size` | `w*h` — **cap 65536** (256×256) |
| `u32 clut_size` | `pal_count*pal_entries*4` — **cap 32768** |
| `u8 pixels[pixel_size]` | copie SEH de `*(T+0xD8)` (1 o/texel) |
| `u8 raw_clut[clut_size]` | copie SEH de `*(T+0x60)` (u32/couleur, BRUT) |

En-tête 10 × u32 = **40 o** ; **record total = 40 + pixel_size + clut_size ≤
98 344 o (0x18028)** ⊂ `GFXPT_DUMP_MAX_NODE_BYTES` (0x100C80, inchangé — le
record max effectif du flux reste TX07 0x100820). Échec SEH d'**UNE** des
copies (pixels OU CLUT) → **aucun record du tout** (règle « la valeur seule »,
style TX ; `g_txSehFails++`), le texobj étant marqué vu avant la copie (style
`g_frameTxEmitted` : pas de retentative). Lectures de chaîne/`T` illisibles →
tentative suivante (texobj non marqué) ; `pal_count` illisible (`palMgr`
lisible) → 0 (`clut_size` 0, pixels seuls) ; `w*h` > 65536 ou `clut_size` >
32768 → skip garde (`guards=N` du log flush).

### 11.3 ND08 : footer + `texobj`

Le footer ND08 (kind2) gagne **UN u32 APPEND après `dropped_ids`** :
`u32 texobj = *(texinfo+0x10)` (la VALEUR `T` ; 0 si la lecture échoue —
non-fatal, style `page_probe`). Magic **`'ND08'` inchangé**, build **0x563A**
(le décodeur distingue v9/v10 par le build id déjà parsé) ; tous les champs v9
gardent leur offset. Footer v10 = **24 o de champs u32**
(tpage/mode/clut/id_count/dropped_ids/texobj) + ⌈id_count/4⌉·4 o d'ids →
record ND08 max = **164 188 o (0x2815C)** ⊂ cap.

### 11.4 Provenance (aucun offset inventé)

`T+0x3C/+0x40/+0x5C/+0x60/+0xA0/+0xAC/+0xD8` — chaîne texture battle TIM
`sub_407EB4` → `sub_4221E6` → `sub_421C41` (IDB, ground truth close 2026-09-26) ;
`*(T+0xA0)+12` = pal_count ; le CLUT brut est u32/couleur (palette `i` à
`raw + 4*entries*i`, octet 3 = PSX STP) ; pixels 1 o/texel à `T+0xD8` ;
`texinfo+0x10` = champ `page_probe` déjà prouvé v8 (TX07).
### 11.1 Correction v10.3 (chaîne TIM confirmée live)

\*(texinfo+0x10)\ = le BACKEND (pas les données). La vraie chaîne (prouvée par sonde
ReadProcessMemory live + rendu final) :
\ackend = ctx[0x3C] ? ctx[0x68] : ctx[0x38]\ → \11 = *(backend+20)\ →
\T = *(v11+152)\ = l'objet DONNÉES : w@T+0x3C, h@T+0x40, entries@T+0x5C,
clutBuf@T+0x60 (u32/couleur, byte3 = STP), pixels@T+0xD8 (1 o/texel),
palMgr = \*(v11+0xA0) → palCount = *(palMgr+12).
Le footer ND08.texobj = T ; le sous-palette du groupe g = raw_clut + 4*entries*ids[g].
Résultat : terrain de bataille rendu en VRAIE texture (voir CAMPAIGN_lot14 §5.2).

## 12. Lot 15 — fermetures offline (2026-09-26)

Détails complets : `driver-abi-spec.md` §6.3, `CLOSURE_sky-path.md`, `CLOSURE_walkdirect-texture-chain.md`.

1. **LUT fermée** : ordre `bytes 0,1,2 = R,G,B` confirmé par canari couleur (effet battle13
   ORANGE en RGB vs BLEU en BGR ; `../captures` `battle13/LOT15_effect_AB.png`). Zéro changement
   décodeur — la LUT « résiduelle » du lot 14 était un faux problème (le miroir alpha-stagé est
   déjà contourné par le raw_clut TR08).
2. **Caméra fermée** : coords screen-space finales ; 640×480 → ×1,25 (Steam) ; le décalage
   perçu = resize NEAREST du side-by-side + comparaison de moments différents (fenêtre armée =
   16 frames identiques en pause). Protocole : F12 PENDANT la fenêtre. Preuves :
   `LOT15_upscale_pair.png`, `LOT15_final_rgb_up800.png`.
3. **Ciel fermé (c)** : composé dans la VRAM émulée `0x1B47818` (GP0 fill `0x4623A0`,
   MoveImage, sprites) → RT1 → présenté sans aucun slot 43–64 ; les passes dispatch convergent
   vers `Gfx_WalkDrawList` donc un poly ciel serait capturé. Clear = noir. Piste v11+ : dump
   du buffer `0x1B47818` (1 Mio).
4. **Walk-direct fermé statiquement** : `node → +0x38 → +0x14 → +0xA0 → [M+0x40][idx*0x48]
   → texobj = *(E+0x38)` (`0x422056`/`0x422065`) ; `*(texinfo+0x10)` hors jeu. Sonde
   ReadProcessMemory live OBLIGATOIRE avant de coder le footer v11 (E+0x38 vs E+0x3C).
5. **Blend v2** : blend 50 % des tris `8 ≤ alpha < 250` implémenté dans les rendus A/B
   (382 tris/frame battle13) — neutre sur terrain statique, à juger sur fireaga (v11).
