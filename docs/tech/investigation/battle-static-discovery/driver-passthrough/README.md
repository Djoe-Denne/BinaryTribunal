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
