# Note — Backend provenance (voie du present réel), lot 12

> Partie statique fermée contre l'IDB (sondes 2026-09-20). Le tracing live (P0) reste ouvert —
> campagne `live-validator` sur demande explicite uniquement. Question ouverte n°1 du doc renderer.

## Ce qui est prouvé statiquement

### IAT de `FF8_EN.exe` (13 modules)

- **DDRAW** : `DirectDrawCreate`, `DirectDrawEnumerateA` — la voie DDraw nativement importée.
- **OPENGL32** : 61 entrées GL/WGL (`wglCreateContext`, `wglMakeCurrent`, `wglGetProcAddress`,
  `glDrawElements`, `SwapBuffers` côté chaîne GL…).
- **GDI32** : `SwapBuffers` importé depuis GDI32 (chaîne wgl historique) — la voie present GL.
- **Aucun import D3D9 statique** (pas de d3d9.dll, d3dx9, D3D8/D3D11 dans l'IAT).
- Autres : KERNEL32, ADVAPI32 (registre), EAX (son), binkw32, DINPUT, MSACM32, WINMM, USER32, ole32,
  **AF3DN** (shim DotEmu : `dotemuCreateFileA` etc. — redirection syscalls, hors rendu).

### Chemins present par backend (matrice driver, spec §5)

| Backend | Slot 4 (+0x10) | Chaîne present |
| --- | --- | --- |
| GL (3) | `RenderGL_Present 0x439CF3` | `SwapBuffers` (GDI32) |
| DDraw (1) | `RenderDDraw_Frame 0x43C761` | lock/blt/unlock + present |
| DDrawAlt (0) | `RenderDDraw_Present 0x40B50E` | present direct |
| DLL (2) | fourni par la factory | ce que la DLL implémente |

Dispatch : `Render_FramePresent_Dispatch 0x41DF0C` — `driver = *(engine+0xA74)` ;
si `*(engine+0xB88) != 0` : `call [driver+0x10](engine)`. Appelé par la boucle engine, jamais par
`FFBattleModule 0x47CF60`.

## Ce qui reste ambigu (module presence ≠ provenance)

Le processus analysé charge aussi `d3d9.dll`, `d3dx9_29.dll` et le user-mode driver NVIDIA D3D9.
Ce n'est **pas** la voie native (absente de l'IAT) : couche de compatibilité/overlay (translation
DirectDraw→D3D9, wrapper NVAPI, ou injecteur externe). La présence seule ne prouve pas la voie active.

## Résultats P0 — session live 2026-09-21 (observation seule, process détruit par crash en fin)

Evidence : `evidence/2026-09-21T18-12-00_BACKEND_PROVENANCE_STEADY_001.json`
(hash EXE `064D466B5FE2BA901FD44ABF19F37C0FD6A2DB40AABD95C9E5959195B6589570` en tête, PID 17572,
openworld, attach debugger observation-only, restore byte-exact vérifié sur `0x41DF32`).

| Hyp | Verdict | Preuve |
| --- | --- | --- |
| H1 | **CONFIRMÉ + découverte** | steady-state : `engine=0x9274D60` (global `0x1A79D88`), `+0xBA8=0` (DDrawAlt), `+0xBC8=0`, `+0xBCC=0`, gate `+0xB88=1` ; **`+0xBD0=0x5F7B52C0 ≠ 0`** — la factory du shim AF3DN.P est installée en runtime (attendu 0 côté statique) |
| H2 | **CONFIRMÉ + découverte provenance** | bp `0x41DF32` hit réel : driver `0x9282670`, **slot4 = `0x5F7B1BF0` = AF3DN.P** (base `0x5F7B0000`) — PAS `RenderDDraw_Present 0x40B50E` ; stack `0x41DF32 ← sub_5699AA+2C1 (0x569C6B) ← boucle engine ← BaseThreadInitThunk` |
| H3 | PARTIEL | stack translation présente : d3d9 `0x62DF0000`, d3dx9_29, nvd3dum, DCIMAN32, dwmapi/dxgi + Steam overlay/nvspcap ; per-frame Present D3D9 non prouvable sans hook (interdit ici) |
| H4 | INCONCLUSIF | boucle de comptage interrompue par crash |
| H5 | INCONCLUSIF | attach tardif impossible (jeu déjà lancé) — steady-state seul |

### Découverte structurante

La build DotEmu (AF3DN.P) **exécute déjà le chemin type 2** : le shim installe sa factory en
`engine+0xBD0` et le driver object actif (`0x9282670`) pointe entièrement dans AF3DN.P
(`0x5F7B0000`) — la table statique des ctors (`0x40C40C`/`0x40B50E`…) n'est **pas** celle du runtime.
La voie du present réel = **shim DotEmu via slot 4**, pas DirectDraw direct. Le prototype
`driver-passthrough/` devra donc chaîner vers ce driver runtime (ou au-dessus du shim), pas vers
les ctors statiques.

### Incident

Crash `c0000005 @0x41DF34` (2 octets après le site dispatch) pendant la boucle de comptage —
signalé : `engine+0xA74` a lu un driver alterné (`0x1A4B98`, slot4 NULL) au hit suivant
→ `call [NULL+0x10]`. Restore byte-exact vérifié (preimage==postimage), stale bp résiduel supprimé.
Cause exacte (race du shim vs pause debugger) non tranchée. **Opérateur : relancer FF8_EN.exe
(hash identique) avant tout retest** ; re-run H4/H5 sur nouvelle session.

### Fenêtre 2 — 2026-09-22 (openworld, process frais, observation seule)

Evidence : `evidence/2026-09-22T00-00-00_BACKEND_PROVENANCE_WINDOW2_002.json` (hash identique en tête,
PID 21816, restore byte-exact vérifié, process vivant au detach).

- **Alternance reproduite 2/2 sessions** : `engine+0xA74` alterne entre le driver object AF3DN.P
  (`0x6DE2770` frais / `0x9282670` hier) et une valeur fausse **`0x1A4B98`** (région basse Wow64, slots
  NULL) → `call [0x1A4BA8]` → `c0000005` = cause exacte du crash d'hier (fault à `0x41DF34`).
- **Tranché en statique** : pas de second engine — le dispatch `0x41DF0C` n'a que 3 call sites
  (`0x409630` init, `0x4096BC` shutdown, `0x569C6B` main loop `sub_5699AA` avec `var_AC34` =
  retour `FFGetBufferAddress` = même container engine). L'alternance est donc un **état intermittent du
  champ `engine+0xA74` lui-même**.
- **Écrivain périodique ~7.5 Hz** : watchpoint 4 octets sur `engine+0xA74` (3 hits / 0.27 s) — valeur
  écrite constante = driver correct ; registre de travail du hit = `0x1A4B98`. Module écrivain **non
  identifié** (EIP readback stale — KERNELBASE) ; suspect n°1 : shim de compatibilité (apphelp/AcLayers
  DirectDraw) ou path interne AF3DN.P. Lot +1 : watchpoint avec stack capturée synchronisée.
- **Conséquence architecture (spec §7/§9)** : le driver actif est **maintenu par un écrivain externe** —
  un set runtime de `engine+0xA74`/`+0xBD0` serait réécrit à ~7.5 Hz. La voie **launcher-safe** (config
  posée avant boot graphics `0x401890`) est confirmée comme la seule robuste.
- **H3 statique AF3DN.P** : PE32, base fresh `0x6C590000` (hier `0x5F7B0000` — ASLR par boot) ; imports
  d3d9 = 1 réf (`Direct3DCreate9`), **Present/EndScene absents** → appel COM vtable (IDirect3DDevice9,
  Present idx 17) → lot +1 : bp vtable d3d9 du device créé par AF3DN.P + comptage Hz.
- **Factory shim reproductible** : `engine+0xBD0 = AF3DN base+0x52C0` sur 2/2 boots.
- H4 (taux) : voie du present confirmée per-frame (hit 0), taux exact non mesuré (stop sur première
  alternance, par design). H5 : inatteignable (boot passé) — réserver un lancement sous debugger.

Lot +1 proposé : watchpoint+stack propre (identifie l'écrivain), bp vtable d3d9 Present (idx 17) pour
le compte per-frame, fenêtre battle-transition optionnelle (uniquement si l'écrivain reste inconnu).

### Procédure set runtime backend=2 (documentée, non exécutée — lecture seule)

Préconditions vérifiées : global engine ptr `0x1A79D88` stable ; dispatch present = `call [eax+10h]`
@`0x41DF32` gated `+0xB88` ; boot = `CheckRegistry 0x401890` (2e call-site `0x409778` non analysé).
Procédure complète (suspend render thread → `0xBA8=2` → `0x409805(cfg36, engine)` → `0xBC8=1`,
`0xBCC=HMODULE` → `0xA74=driver` → slot 0 init @`0x409572` → restore snapshot 66 DWORDs + état 9–14,
ne jamais écrire `0xB88`) dans le champ `h6_set_runtime_backend2.procedure_reversible_documented`
de l'evidence window1. **Risque HIGH** : re-Init backend en plein openworld (gate armé pendant
l'init → double present) — et la fenêtre 2 ajoute : l'écrivain périodique réécrirait le champ de toute
façon → **la voie launcher-safe (config avant boot graphics `0x401890`) est la seule recommandée**.

## Réfs

- `driver-abi-spec.md` (contrat slots + present gate `engine+0xB88`)
- obsidian : [[projects/re-ff8/concepts/external-battle-renderer-architecture]] (§ Runtime Backend Provenance),
  [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] (present dispatch)
