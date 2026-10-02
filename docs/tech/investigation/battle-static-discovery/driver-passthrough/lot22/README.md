# Writer candidat Lot 22 (v14, build-id `0x5641`)

Fork append-only du writer v13 (`0x5640`) : **sideband état `ST09` + footer
ND08 `+2×u32` (state_epoch | state_flags)**. La source v13 baseline
(`../gfx_driver_passthrough.c`, sha `d119b436…`) reste intouchée. Contrat
complet : `../STATE_MATRIX_lot22.md` §3.

## 1. Diff v14 vs v13 (append-only)

- `GFXPT_VERSION_TEXT` = `"v14-lot22"` ; `GFXPT_BUILD_ID` = `0x5641`.
- Nouveau record **ST09** (32 o, 8×u32 LE) émis dans le ring partagé :
  kinds 1=RS set (slot 29, raw 0..25) / 2=commit descripteur (slots
  30/31/32, value=token matdesc) / 3=blend (slot 33, raw 0..4, sans
  conversion STP) / 4=target (slot 39, token opaque) / 5=invalidation
  (slots 0/1) / 6=commit de session setup (slots 43/44/45/46/47/55 ;
  value=`*(ctx+0x38)`, aux=gate `*(cookie+0xAC4)` ; slots 52/53/54/56
  exclus — commit non prouvé) / 7=scene (40/41, non invalidant).
- Footer ND08 : `+2×u32` (`state_epoch` = snapshot AVANT le forward natif
  du draw ; `state_flags` bit0 has_epoch / bit1 stage0_valid=0 [Phase D
  gate] / bit2 incomplete). Old fields byte-identiques, magic ND08
  inchangé (le build-id distingue).
- `g_stateEpoch` monotone sur toute la capture (jamais reset) ; drop
  ring ST09 → `g_stStreamBroken=1` → bit2 sur les footers suivants
  (trou d'epoch explicite, jamais d'état recyclé).
- Log flush : ligne `frame,seq=…,st=N` étendue.

## 2. Build (MSVC x86, depuis CE répertoire)

```powershell
cmd /c "call ""C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat"" x86 && cl /nologo /W3 /Ox /MT /LD gfx_driver_passthrough.c /Fe:gfx_driver_passthrough.dll"
```

`LNK1168` = DLL encore chargée (jeu en cours) → STOP.

## 3. Gate build-only (lot 22) — manuelle, car le script générique est stale

`scripts/verify_writer.ps1` (historique) échoue sur ce DLL : son heuristique
« premier `push 33h` → call » résout **LogCall** (`0x56A0`), pas DumpNode
(`0x2160`) — le comportement est identique sur le DLL v13 baseline (audit
2026-10-02) ; son `advance == 32+psize` correspond au header v7 (32 o) et
non au header v8+ (36 o) ; son harness appelle DumpNode avec 3 args sur une
signature v14 à 5 args. Réparer le script = hors périmètre (prompt §8).

Vérifications manuelles équivalentes exécutées (sorties dans la campagne) :

| # | Check | Résultat |
| --- | --- | --- |
| 1 | `dumpbin /EXPORTS` — set EXACT 14 noms (5 code + 9 forwards dotemu) | PASS |
| 2 | fopen — tout flux binaire porte `b` (1 site `ab` ; 4 sites texte CSV/log) | PASS |
| 3 | ImageBase `0x10000000` (/HEADERS) + RVAs dérivées du disasm | PASS |
| 4 | build-id `5641h` écrit dans chaque famille (ND08/TX07/TR08/ST09 — 4 sites `mov …,5641h`) | PASS |
| 5 | gardes `cmp 1000h/4000h/40000h` présentes (vcount/icount/payload) | PASS |
| 6 | harnais `harness_probe_lot22.c` (LoadLibrary d'une COPIE) : ST09 layout+epoch, footer ND08 v14 (epoch/flags/psize/advance), sentinelles 0x33/0x22/0xEE non copiées hors zones, garde vcount>4096, kind0=60 o, kind6 gate polarité | **HARNESS LOT22 OK** |
| 7 | hash du DLL buildé enregistré ; **NON déployé** (aucune copie vers un répertoire jeu) | enregistré |

Ligne de verdict rapportée : `WRITER BUILD VERIFIED, NOT DEPLOYED`.

## 4. Contenu

- `gfx_driver_passthrough.c` / `gfx_driver_passthrough.h` — fork v14 ;
- `harness_probe_lot22.c` — harnais sentinelles Lot 22 ;
- `gfx_driver_passthrough.dll` (+ .lib/.exp/.obj) — build candidat ;
- `README.md` — ce document.
