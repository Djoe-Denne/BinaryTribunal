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

## Plan P0 — tracing live (hypothèses exécutables, à lancer sur demande)

1. **H1** : backend par défaut = DDrawAlt (0) ou DDraw (1) selon registre — vérifier `*(engine+0xBA8)`
   au boot et après CheckRegistry (0x401890).
2. **H2** : le present réel passe par slot 4 : breakpoint `0x41DF32` (`call [eax+10h]`) → récupérer
   l'EA cible, la chaîne de modules (module créateur du hwnd/surface).
3. **H3** : si D3D9 present tire : backtrace depuis `IDirect3DDevice9::Present/EndScene` — créateur =
   d3d9.dll natif, couche DotEmu/AF3DN, ou wrapper NVIDIA ; établir l'ordre par frame
   (natif ET traduit peuvent coexister dans la même frame).
4. **H4** : DirectDraw : hook `Flip`/`Blt` (vtable surface) ; GL : hook `SwapBuffers` — compteurs par frame.
5. **Sortie attendue** : une table voie→preuves (traces) + décision : backend par défaut réel du processus
   primaire, et quel passthrough le prototype `driver-passthrough/` doit intercepter.

## Réfs

- `driver-abi-spec.md` (contrat slots + present gate `engine+0xB88`)
- obsidian : [[projects/re-ff8/concepts/external-battle-renderer-architecture]] (§ Runtime Backend Provenance),
  [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] (present dispatch)
