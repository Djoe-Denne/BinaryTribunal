# PROMPT Lot 24 — candidat instrumentation stage0 v15, build-id `0x5642` (2026-10-03)

Autorisation : « On va aller sur le nouveau candidat instrumentation » —
**travail offline uniquement** : écriture du candidat, build-only, harnais
synthétique, lecteur/tests, gate dédiée. **Aucun déploiement, aucun hook
installé dans le jeu, aucun jeu/debugger, aucun live** (live reste
**NOT AUTHORIZED** ; la carte future `LIVE_NECESSITY_lot23.md` reste la porte
d'entrée, NON FERMÉE).

## 0. Build-id

`0x5642` prouvé libre ce jour : grep exhaustif du dépôt (docs/tools/obsidian/.agents)
— seules occurrences = nos documents « non réservé » + un timestamp. Builds
connus côté `ff8dump.py` : v8 `0x5638`, v9 `0x5639`, v10 `0x563A`, v10.3
`0x563D`, v11 `0x563E`, v12 `0x563F`, v13 `0x5640`, v14 `0x5641`. Aucun
`SUPPORTED` ne contient `0x5642`.

## 1. Décision d'ancrage : **option B — les deux call-sites SetTexture**

Choix tranché (DOSSIER_lot23 §3 comparait A/B sans choisir) :

- **B** : sites `0x41EF5D` (bind) et `0x41EF72` (unbind), 6 octets chacun
  `FF 90 98 00 00 00`, remplacés par `E8 rel32` + `90`. Couvre bind, unbind
  **et HRESULT** (le stub logge avant/après le call COM stdcall).
- **A (entrée `0x41EF3C`)** écartée pour ce candidat : préimage 15 octets avec
  deux `jz rel8` externes ⇒ moteur de relocalisation jcc (risque, nouvelles
  surfaces). Reporté, pas abandonné.
- **Gap accepté et documenté** : le chemin `device==0` (sortie précoce
  `0x41EF78`, aucun call device) n'est pas vu par B. Il ne porte ni call ni
  HRESULT ; restera un certain-unknown de la carte live.

## 2. Deltas format v14 → v15 (référence lecteur : build-conditional)

| Élément | v14 `0x5641` | v15 `0x5642` |
| --- | --- | --- |
| ST09 | 8×u32 (32 o) | **10×u32 (40 o)** : +`ctx_token`, +`device_token` (pointeurs bruts, opaques) |
| kinds ST09 | 1..7 | 1..7 inchangés + **kind 8** = stage0 request (type=site 1/2, value=texture, aux=stage, ctx_token=device, device_token=devVT) + **kind 9** = stage0 result (type=site, value=texture, **aux=HRESULT brut**, ctx_token=device, device_token=devVT) |
| kind2 (30/31/32) | aux=0, `commit_call_observed` | **aux = retour natif brut** du forward, status lecteur `commit_result_observed` (jamais interprété HRESULT) |
| kind6 setups 43/44/45/46/47/55 | aux=gate AC4 | value=matdesc inchangé, **aux = retour natif brut**, device_token = gate AC4 |
| footer ND08 | 11×u32 (44 o) | **17×u32 (68 o)** : + `stage0_texture`, `stage0_device`, `stage0_devvt`, `stage0_hresult` (dernier kind9 vu), + `st_emitted`, `st_lost` (frame) |
| flags footer | bit0 (1) HAS_EPOCH ; bit2 (4) INCOMPLETE=ring plein | noms existants conservés (writer L806-815) : bit0 (1) HAS_EPOCH ; **bit1 (2) STAGE0_VALID** = hook armé ET kind9 vu (triple footer fiable) ; bit2 (4) INCOMPLETE — **désormais posé aussi sur cap/overflow** (plus aucune perte muette) ; **bit3 (8) ST_LOSS** = ≥1 refus d'émission sur la frame (compteur footer `st_lost`) |
| ND08 max | 0x28170 | recompute `0x28170 + 24 = 0x28188` ⊂ garde `0x100C80` inchangée |
| DumpNode | cdecl 5 args | **cdecl 6 args** (+ `nativeResult`) — RVA/préimage nouvelles, à dériver au build |

## 3. Corrections des constats P1 (Lot 23)

1. **Cap ST09 silencieux** : tout refus **pendant la fenêtre armée** (frame
   >4096 records, cap 1024/frame, ring plein) pose désormais
   `g_stStreamBroken=1`, incrémente `g_stRingDrops` et un nouveau
   `g_stLostCount` ; footer `st_lost` + flags bit3 (ST_LOSS) de la frame.
   **Hors fenêtre / capture désarmée : refus silencieux v14** — ce n'est pas
   une perte, INCOMPLETE ne colle pas à l'idle (correction de la consigne
   initiale, décidée par le parent le 2026-10-03). Plus aucune perte muette
   en fenêtre.
2. **Contexte/device absent** : ST09 40 o porte `ctx_token`/`device_token` sur
   tous les kinds. Le lecteur peut associer par contexte **sans présumer**.
3. **kind2/kind6 non probants** : aux = retour natif brut (`commit_result_
   observed`) ; witness candidat, jamais « device success » (le HRESULT COM
   interne `[deviceVT+0x58]` reste hors d'atteinte — certain-unknown).
4. **stage0 à T_draw** : le footer ND08 embarque le triple (texture, device,
   devVT, hr) du dernier kind9 **avant** le draw (cache writer), bit2 fiabilité.

## 4. Stub et ABI (préserver tout)

`GFXPT_Stage0Stub` (naked) : entrée `[esp]=ret`, `[esp+4]=device`,
`[esp+8]=stage`, `[esp+0xC]=texture`, `eax=devVT`. Séquence : `pushad` →
logger C (kind8) → `popad` → `call [eax+98h]` (stdcall, nettoie ses 12 o) →
`pushad` → logger C (kind9, hr) → `popad` → `ret 12` (nettoie les 3 args,
contrat stdcall du site). Registres non volatils et esp **byte-exact** ;
EAX = HRESULT propagé. Loggers = `GFXPT_StEmit` (passent par ring/gardes v15).

## 5. Installer fail-closed (pas d'exécution hors harnais)

Nouvelle `GFXPT_PlaceCallSiteHook(targetVA, preimage[6], stubVA)` — plus simple
que `GFXPT_PlaceHook` (pas de trampoline VirtualAlloc : le stub fait lui-même
le call indirect) : memcmp 6 o, `VirtualProtect` RWX, écrire `E8 rel32`+`90`,
FlushInstructionCache, restaurer la protection, préimage gardée.
`Passthrough_InstallStage0Hooks()` **exporté** : boucle sur les deux sites
(`0x1EF5D`, `0x1EF72`, préimage `FF 90 98 00 00 00`) ; **armé seulement si les
deux réussissent**, sinon restauration partielle + `g_stage0Broken=1`.
`Passthrough_RestoreStage0Hooks()` **exporté** : réécriture byte-exact des
préimages, désarme. Tout échec ⇒ aucun patch résiduel, dump continue dégradé
(bit1=0). Le stub est **exporté** (`Passthrough_Stage0Stub`) : testable par le
harnais via GetProcAddress et vérifiable byte-level par la gate. Exports
totaux : 14 + 3 = **17** (9 forwards inchangés). Le dead-code v6
`GFXPT_BootPreimage` reste intouché (décision : ne pas activer, pas supprimer).

## 6. Livrables et gates offline

- `lot24/gfx_driver_passthrough.{c,h}` : fork append-only du writer v14
  (source v14 intouchée), deltas §2-§5, build-id `0x5642`, export **15**
  (14 + `Passthrough_InstallStage0Hooks` + `Passthrough_RestoreStage0Hooks`
  = 16 — recompter à l'implémentation, gate = set exact).
- `tools/af3dn_state/lot24_contract.py` (+tests) : parse v15 build-conditionnel
  (ST 40 o, footer 68 o, kinds 8/9, flags bits 1/2), sémantique
  requested(8)/result(9) (hr==0 ⇒ applied-witness, hr≠0 ⇒ requested_failed),
  association footer triple ↔ kind9 par epoch/préfixe, bit1 ⇒ perte persistante
  ; **régression v14 conservée** (0x5641 rejet croisé).
- `tools/af3dn_state/harness_lot24.c` : hôte synthétique avec les deux
  préimages à `+RVA` ; appelle l'installateur exporté ; **stub testé
  fonctionnellement** (vtable factice `[+0x98]` → fake renvoyant `0x1234`,
  compte d'appels, echo args ; canaries EBX/ESI/EDI/EBP/ESP ; assert kind8/kind9
  dans le ring, device/texture tokens, hr=0x1234, eax propagé, stack balancée,
  restoration byte-exact, fail-closed préimage corrompue) ; cap/ring v15 ;
  formats footer/ST v15.
- `tools/af3dn_state/gate_writer_lot24.py` : même rigueur que lot23 —
  build-only **NON DEPLOYED**, PE x86, set exports exact, sites build-id
  `0x5642`, préimages fonctions au build (DumpNode 6 args, stub, loggers),
  `fopen "ab"`, audits lecteur sur les 3 bins du harnais, premier build ⇒ pin
  hash candidat dans `lot24/repro_manifest.json` puis runs suivants pin strict.

## 7. Interdits et portes

Interdits : déployer, copier vers le jeu, exécuter l'installateur hors harnais
synthétique, toucher la source v14/v13, muter l'IDB, réparer
`verify_writer.ps1`, `qmd update`/`embed` sans autorisation. Porte live :
toujours `LIVE_NECESSITY_lot23.md` — cette préparation **ne l'ouvre pas** ;
elle fournit les prérequis (préimages, ownership/restauration, témoins
requested/result) exigés par la future carte.
