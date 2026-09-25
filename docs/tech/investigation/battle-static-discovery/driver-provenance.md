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

### Lot +1 — 2026-09-22 (fenêtres A/B — ingéré par l'opérateur)

Evidence : `evidence/2026-09-22T01-00-00_BACKEND_PROVENANCE_LOT1_002.json` (hash en tête), ingestion
faite par l'opérateur. Faits fermés réutilisables :
- Écrivain `engine+0xA74` : **absent du .text natif** (scan complet `0x401000–0xB69000`, zéro
  `mov [reg+0xA74]`) ; suspects = loader DotEmu embedded (section `.bind` VA `0x27C2000`, raw 676 Ko
  compressé) ou shim Windows (apphelp/AcLayers).
- **FF8_EN.exe embarque `.dotemu` VA `0x27C1000`** (496 B = strings `dotemuCreateFileA`/`dotemuReg*`
  seuls) + `.bind` (676 Ko) : le loader DotEmu est embedded dans le binaire.
- **AF3DN.P n'est pas une translation** : renderer D3D9 complet HLSL (strings `shaders\vert.hlsl` /
  `pixel.hlsl`, tables MODE_BATTLE/SWIRL/WORLDMAP) — DotEmu a réimplémenté le renderer.
- Device d3d9 : non localisable par scan mémoire plat (fenêtre 2 + heapscan plat = 0 refs) ;
  122 holders d3d9 runtime-patchés dans FF8 .text (les thunks DotEmu) = piste lot +3.

### Lot +2 — 2026-09-22 : incident + faits fermés (fenêtre B statique)

Evidence : `evidence/2026-09-22T02-00-00_BACKEND_PROVENANCE_LOT2_003.json` (hash en tête).

- **Incident (escalade)** : tentative watchpoint **HW via `py_eval`** (`suspend_process` +
  `dbg_continue`) → **deadlock du serveur IDA-MCP** (timeouts > 10 min), jeu suspendu
  (`Responding:False`), detach non complété, DR registers possiblement armés → crash d'IDA → restart
  IDA + re-attach process neuf (PID 21680, boot 13:46). **Contrainte tooling pour la suite :
  watchpoint HW via `py_eval` = interdit** (deadlock serveur avéré) ; capture synchronisée = 100% bp
  software, ou HW breakpoint posé par l'opérateur dans le GUI IDA (stack visible dans l'UI, pas de
  serveur HTTP impliqué).
- **Fenêtre B statique fermée** : **zéro** `call [reg+disp]` COM vtable dans le .text d'AF3DN.P pour
  Present (idx 17 = +0x44) / EndScene (+0xA8) et voisins → le present n'est pas un appel COM direct
  côté AF3DN.P : il passe par les **thunks IAT runtime DotEmu** (`call [0x10027044]`, `[0x10027098]`,
  `[0x10027228]`, `[0x10027278]` — table d'imports patchée par le loader `.bind` embedded).
- Écrivain `engine+0xA74` : toujours non identifié (4 voies bloquées par le deadlock) ; re-statique
  confirmée : **zéro** `mov [reg+0xA74]` dans le .text natif 0x401000–0xB69000. Suspect n°1 : loader
  `.bind` (676 Ko compressé embedded) ou shim Windows.
- Lot +3 : mapping statique de la table d'imports AF3DN.P (Capstone sur disque, sans debugger) +
  les 122 holders runtime-patchés FF8 .text → compte per-frame via bp software sur le site résolu ;
  écrivain = HW breakpoint GUI opérateur.

### Lot +3 — 2026-09-22 (statique thunks + alternance 3/3)

Evidence : `evidence/2026-09-22T04-00-00_BACKEND_PROVENANCE_LOT3_004.json` (hash en tête). PID 21680,
boot 13:46 — 3e boot, valeurs re-calculées : engine `0x6D94D60`, AF3DN.P base fresh `0x6C9A0000`,
`+0xBD0=0x6CA152C0` (factory shim ≠ 0, **3/3 boots** — signature stable du boot DotEmu).

- **Fenêtre A statique** : les 4 thunks du slot 4 présent d'AF3DN.P résolus via pefile —
  `0x10027044`=ReleaseSemaphore, `0x10027098`=GetCurrentProcess, `0x10027228`=_ftime64,
  `0x10027278`=GetForegroundWindow — **aucun n'est d3d9** : le call COM Present n'est pas visible dans
  le fragment slot4 ; il passe par les helpers internes AF3DN.P (`0x12A0`/`0xF870`/`0x23298`) ou par le
  loader `.bind` compressé. Le compte per-frame D3D9 reste ouvert (lot +4 : bp sur les candidats
  runtime-patchés les plus forts, ex. `0x70c28100`/`0x70c18101`).
- **Alternance 3/3 boots reproduite** (8 hits bornés, 3 s) : hits alternés EAX=`0x1A4B98`/slots NULL
  aux positions 1 et 4, driver correct ailleurs — sans crash live cette fois (gate `+0xB88` non armé au
  moment des alternances, probablement). La **race** : l'écrivain périodique (~11-14 Hz) bascule le
  champ pendant que le dispatcher lit/appelle — le crash du 2026-09-21 = cette course alignée. C'est
  un défaut de la build DotEmu (double-writer sur `engine+0xA74`), pas un artefact de notre instrumentation.
- État final : detach OK, 0 bp, preimage==postimage, process vivant.

### Lot +4 — 2026-09-22 : VERDICT-B — pas d'écrivain du champ, alternance = argument du dispatch

Evidence : capture Cheat Engine (opérateur, "Find what writes" sur `engine+0xA74` → **zéro hit**) +
échantillonnage read-only `ReadProcessMemory` **1 236 139 lectures @ ~309 kHz sur 4 s** : le champ est
resté **constamment** `0x6D82770` (0 alternance, 0 erreur de lecture). Le jeu (PID 4348, boot 4,
copie Steam hash-bound ✓) : engine `0x9294D60`, factory shim `+0xBD0=0x6CA152C0` (≠0, **4/4 boots**).

- **Les "hits watchpoint" des fenêtres 2/+1 étaient des artefacts de l'API debug IDA** (events
  backlog, readback EIP stale — le lot +2 l'avait noté) : il n'y a **pas d'écrivain périodique** du
  champ pendant le jeu.
- **L'alternance `0x1A4B98` au dispatch vient de l'argument `arg_0`** : le dispatch est parfois appelé
  avec un objet ≠ engine principal → `GetBufApp(arg_0) = *(arg_0+0xA74) = 0x1A4B98` (une valeur sans
  rapport avec un driver, région basse Wow64) → `call [0x1A4BA8]` = crash. Le crash du 2026-09-21 =
  **appel du dispatch avec le mauvais objet**, pas une course double-writer.
- Tranchage restant (pur statique, sans jeu) : `FFGetBufferAddress` (retourné dans `var_AC34` du main
  loop `sub_5699AA`) — retourne-t-il parfois un objet secondaire ? BP software avec capture `arg_0`
  possible si la statique est ambiguë.
- Ce verdict **ne change pas** la conclusion provenance (present = AF3DN.P via slot 4, 4/4 boots pour
  la factory shim) ni la recommandation launcher-safe : le risque du set runtime reste le re-Init
  mid-game, et le champ reste gouverné par le chemin boot DotEmu.

### Lot +5 — 2026-09-22 : synthèse finale P0 (closure)

- **`sub_5699AA` décompilé (main loop)** : `v15 = FFGetBufferAddress()` appelé **une seule fois avant
  la boucle** (`if (!v15) v15 = app_log_();` fallback relink, puis `FFSetBufferAddress(v15)`), et
  `Render_FramePresent_Dispatch(v15)` @`0x569C6B` est appelé **avec `v15`, fixe pour toute la session**.
- Conclusion en chaîne : arg_0 fixe + `*(engine+0xA74)` stable (CE + échantillonnage 309 kHz) ⇒
  `EAX` au dispatch devrait être le driver à **tous** les hits. Les valeurs `EAX=0x1A4B98` lues au bp
  sont donc des **readbacks de registres faux** (même mécanisme que le readback `EIP` stale du lot +2 :
  les registres lus après un événement debugger provenaient d'un autre thread/context).
- **Le crash du 2026-09-21** : réel (WER, process mort) mais **survenu pendant l'instrumentation**
  (bp + readbacks + detach en course) — sa cause exacte reste **INCONCLUSIVE** : course réelle du shim
  DotEmu possible, artefact debugger tout aussi possible. À reprendre un jour uniquement avec un
  outillage à readbacks fiables (debugger externe type WinDbg, ou le mode debug de Cheat Engine).
- **Bilan P0** (question n°1 du doc renderer, ferme la campagne) :
  1. Voie du present : **AF3DN.P (renderer D3D9 réimplémenté par DotEmu) via slot 4** —
     `Render_FramePresent_Dispatch 0x41DF32` → `[driver+0x10]` → présent AF3DN.P, 4/4 boots.
  2. Chemin d'activation : **launcher-safe** (config 36B posée avant boot graphics `0x401890`) —
     la factory shim installée en `engine+0xBD0` est la signature du boot DotEmu (4/4).
  3. Le champ `engine+0xA74` est **stable** en jeu ; pas d'écrivain CPU (CE + 309 kHz).
  4. Hors périmètre natif (anatomie du shim) : compte per-frame D3D9 exact, cause de crash exacte.

### Lot +6 — 2026-09-22 : REQUALIFICATION — le "shim" analysé = FFNx installé sur la copie opérateur

Cross-ref externe (`ffnx-driver-reference.md`, livrable agent — repo FFNX `b341cf13`) + preuve disque
sur la copie opérateur Steam : **`AF3DN.P` (209 920 B) + `FFNx.toml` + `FFNx.log` + `FFNx.pdb` (129 Mo)
+ `shaders/FFNx.*.frag/vert`** présents à côté de `FF8_EN.exe` — FFNx est installé (install février 2026,
`renderer_backend = 4` = Direct3D12).

- **Toute la chaîne live "AF3DN.P" des lots P0 = FFNx**, pas un shim DotEmu : le renderer HLSL D3D9
  constaté au lot +1 = les shaders FFNx ; l'alternance/crash du 21/09 = comportement de l'installation
  FFNx de l'opérateur, pas du backend natif vanilla.
- FFNx active son driver par **usurpation du module** (`eax.dll` FF8 2000/Remastered, `AF3DN.P`
  Steam 2013) puis `ffnx_inject_driver` écrit `current_gfx_driver=2` + `create_gfx_driver=factory`
  directement dans l'engine (`src/common.cpp:3706-3712`) — laissant **le chemin type 2 natif du jeu
  s'exécuter** : mécanisme équivalent à notre spec §7, sans la config 36B.
- **Cross-validation de sources** : FFNx et Aali exportent tous deux `new_dll_graphics_driver(void*)`
  (FFNx `src/common.cpp:3097` + `misc/FFNx.def:37` ; Aali `src/common.c:1861`) ; la struct
  `ff8_gfx_driver` de FFNx = **66 DWORDs** (`src/ff8.h:946–1011`, état inline +0x24/+0x28) — conforme
  à notre build DotEmu, alors que la table Aali (Eidos 1.2) fait 0x100 ; slots 43–64 nommés
  (flat/smooth/textured/paletted × 2D/3D/lines), slot 33 = blend 0–4, slot 29 = RS bitmask, 40/41 =
  pile de scenes. **EAs croisés identiques** (`0x41E070`, `0x45D610`, `0x465CE0`) → les sources FFNx
  correspondent à notre binaire.
- Divergences restantes (slots 16/34/37/5/6) : statut « à trancher au decomp », aucune transposée
  aveuglement.
- **Bilan P0 requalifié** : la provenance native du jeu (métadonnées : chemin type 2 natif, contrat
  ABI) reste fermée et confirmée par deux implémentations publiques indépendantes. La voie du present
  **dans la copie opérateur** = FFNx D3D12 via ce chemin type 2. Les mesures "backend" des lots P0
  portent sur l'installation FFNx de l'opérateur, pas sur le backend natif vanilla — le backend natif
  du jeu (sans mod) reste non mesuré (DDrawAlt/DDraw/GL selon registre).

### Procédure set runtime backend=2 (documentée, non exécutée — lecture seule)

Préconditions vérifiées : global engine ptr `0x1A79D88` stable ; dispatch present = `call [eax+10h]`
@`0x41DF32` gated `+0xB88` ; boot = `CheckRegistry 0x401890` (2e call-site `0x409778` non analysé).
Procédure complète (suspend render thread → `0xBA8=2` → `0x409805(cfg36, engine)` → `0xBC8=1`,
`0xBCC=HMODULE` → `0xA74=driver` → slot 0 init @`0x409572` → restore snapshot 66 DWORDs + état 9–14,
ne jamais écrire `0xB88`) dans le champ `h6_set_runtime_backend2.procedure_reversible_documented`
de l'evidence window1. **Risque HIGH** : re-Init backend en plein openworld (gate armé pendant
l'init → double present) — et la fenêtre 2 ajoute : l'écrivain périodique réécrirait le champ de toute
façon → **la voie launcher-safe (config avant boot graphics `0x401890`) est la seule recommandée**.

### Lot +7 — 2026-09-25 : DROP TEST AF3DN.P LIVE — capture Mode A réussie (v6.1)

Rapport : `driver-drop-test-af3dn-2026-09-25.md`. Protocole launcher + observateur externe.

- **AF3DN.P = dépendance statique** de FF8_EN.exe : 8 imports `dotemu*` (dumpbin /imports).
  L'original DotEmu (209 920 B, PE 2014, PDB `ff8_d3d_D4E`) exporte 18 noms — drop-in
  impossible sans forwards PE vers `dotemu_orig.dll` (copie renommée de l'original).
- **Correctifs live** : ctor OpenGL 0x4252B0 échoue sur ce port (case 3) ; backend réel =
  **DDrawAlt (case 0, ctor 0x4257D0)** ; DD_init exige BBC bit 0 (=3) ; detour arg0 =
  `[esp+0x28]` (ret+pushad+pushfd) ; **slot 20 no-op = fatal** (mort après 2 appels) →
  copie natif sub_420917.
- **Wrap retenu** : au present dispatch (`0x41DF0C`), appelé par frame — CheckRegistry
  inviolée (le detour sur CheckRegistry tuait le boot post-init, run v5). Capture :
  9 650 frames, **draw lists 43–64** (slot 51 ×494 942, 47 ×237 943, 44 ×20 034, 49 ×28 626,
  45 ×8 236, 63/61 ×200, 64/62 ×50), RS slot 29 ×845 054. CSV 99,2 Mo
  (`tools/_tmp_af3dn_drop/gfx_passthrough_v6.1_campaign.csv`,
  SHA256 `EB5FDCA3…BC23826`).
- Hashes : DLL `EE3D30B9…60EE5` ; exe `064D466B…` (inchangé) ; `dotemu_orig.dll`
  `539558E4…` (= manifest Steam). Vanilla pur (contrôle A/B) : sain après re-dl Steam.

## Réfs


- `driver-abi-spec.md` (contrat slots + present gate `engine+0xB88`)
- obsidian : [[projects/re-ff8/concepts/external-battle-renderer-architecture]] (§ Runtime Backend Provenance),
  [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] (present dispatch)
