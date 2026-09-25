# Drop test AF3DN.P — lot 12-ter, LIVE (2026-09-25)

> Mission : faire charger **notre** driver par FF8 via le mécanisme natif AF3DN.P et
> produire les premières captures de draw lists (Mode A observer). Protocole : launcher
> Steam → Play, une seule session live à la fois, observateur externe (durée + exit code),
> CSV append hors git.

## Verdict : **PASS** (critères 1–4) ; critère 5 (aller-retour vanilla) validé par
contrôle séparé (base re-téléchargée Steam, boot open world 74 s, sortie propre).

## Mécanisme réel d'AF3DN.P (découvertes consolidées)

1. `AF3DN.P` est une **dépendance statique** de `FF8_EN.exe` : la table d'imports du jeu
   référence 8 fonctions `dotemu*` (`dotemuCreateFileA/DeleteFileA/GetDriveTypeA`,
   `dotemuRegCloseKey/DeleteValueA/FlushKey/OpenKeyExA/QueryValueExA/SetValueExA`).
   Le module original DotEmu (209 920 B, PE 2014, PDB `FF8_Project\Driver\ff8_d3d_D4E\Steam
   Release\AF3DN.pdb`) exporte 18 noms (9 décorés + 9 alias C) — **aucun
   `new_dll_graphics_driver`**.
2. Un drop-in doit donc **forwarder** ces exports. Solution retenue : forwards PE purs vers
   `dotemu_orig.dll` (copie renommée de l'original) — zéro code, le loader résout.
3. Le driver graphique natif de la build DotEmu Steam = **case 0 du dispatch
   (DDrawAlt, ctor `0x4257D0`)** : `engine+0xBA8 = 0` (jamais écrit — lot +4 confirmé en
   live). `DD_init` (`0x40C40C`) exige le **bit 0 de `engine+0xBBC`** (= 3 posé par le
   case 0 natif) et consomme `OutputDebugString_1` (`0x403D99`).
4. `engine+0xBD0 = 0x6CA652C0` est posé **par le boot DotEmu** (signature P0 lot +4/lot +6
   confirmée avec `dotemu_orig.dll` en place) — sans intervention de notre part.
5. Le **wrap du driver natif** se pose au **present dispatch (`0x41DF0C`)** — point de
   consommation du driver, appelé par frame : au premier appel, le proxy (0x108, log +
   forward) remplace `engine+0xA74` ; le present original tourne ensuite via le proxy.

## Version livrée : v6.1 (`AF3DN.P` = 136 704 B, SHA256 `EE3D30B9…60EE5`)

Chaîne d'exécution : `DllMain` (trace `#dll_loaded`, pose 2 detours E9 avec preimage
vérifiée) → boot natif 100 % (case 0, `DD_init`, plein écran/windowed natif) → premier
present dispatch : wrap idempotent de `engine+0xA74` (fast path par frame ensuite) →
tous les slots de rendu passent par les wrappers (log + forward).

## Critères §2

| # | Critère | Verdict | Preuve |
| --- | --- | --- | --- |
| 1 | Chargement driver + objet alloué | PASS | `#dll_loaded`, `#hook,present=1,ods=1`, `#wrapped_at_present,native=0x07AA2770,proxy=0x0FBD0000` |
| 2 | Cadence slots Init/BeginScene/SelectTarget/LeaveScene/Present | PASS | slot 40 ×13 945, slot 41 ×13 945, slot 39 ×102 159, slot 4 (Present) ×9 650 |
| 3 | Draw lists capturées menu ET bataille | PASS | slot 51 ×494 942, slot 47 ×237 943, slot 49 ×28 626, slot 45 ×8 236, slot 44 ×20 034, slot 63/61 ×200, slot 64/62 ×50 (2 Fireaga + attaques ennemies) |
| 4 | ~5 min bataille sans crash, rendu + HUD normaux | PASS | 9 650 frames forwardés via proxy, 0 AV, 0 WER, opérateur : « rendu et HUD normaux » |
| 5 | Aller-retour vanilla sans résidu | PASS (contrôle séparé) | base re-téléchargée Steam, boot open world 74 s, sortie propre, dossier sans résidu (`gfx_passthrough*` déplacé hors jeu) |

## Capture

- CSV : 99 201 211 octets, 1 977 816 lignes, SHA256
  `EB5FDCA3D48F7A50F107433307CDFC25E77A4CF2DC3CE0796A4CD3AF1BC23826`
  — archivé hors git : `tools/_tmp_af3dn_drop/gfx_passthrough_v6.1_campaign.csv`
- Chaîne de boot : `#dll_loaded` → `#hook,present=1,ods=1` → `#wrapped_at_present`
- Compteurs : slot 29 ×845 054, slot 51 ×494 942, slot 47 ×237 943, slot 39 ×102 159,
  slot 18 ×61 277, slot 7 ×61 274, slot 33 ×41 690, slot 49 ×28 626, slot 44 ×20 034,
  slot 41 ×13 945, slot 40 ×13 945, slot 26 ×10 291, slot 4 ×9 650, slot 5 ×9 307,
  slot 8 ×9 307, slot 50 ×8 340, slot 45 ×8 236, slot 27 ×1 152, slot 63 ×200,
  slot 61 ×200, slot 19 ×110, slot 64 ×50, slot 62 ×50, slot 24 ×28, slot 6 ×1.
- Slot 20 : **non loggé** (copie natif transparente v6.1).

## Incidents live → corrections (chronologie)

| Run | Symptôme | Cause | Correctif |
| --- | --- | --- | --- |
| v2 (18:05) | AV `0x41DF34` au present | factory case 2 : ctor OpenGL `0x4252B0` échoue sur le port DotEmu → `+0xA74` nul → present sur driver nul | abandon du chemin case 2 (voir v6) |
| v3 (18:27) | mort au chargement, dialogue | FF8_EN.exe **importe statiquement** `dotemu*` depuis AF3DN.P ; notre DLL ne les exporte pas | forwards PE v4 |
| v4 (18:39) | AV dans AF3DN.P offset `0x366B` | detour CheckRegistry : arg0 lu à `[esp+0x24]` au lieu de `[esp+0x28]` (return address au lieu de engine) | offset corrigé |
| v5 (11:0x) | wrap posé, jeu quit 3 s, 0 slot | wrap sur CheckRegistry = intrusion dans la fenêtre boot→loop ; jeu quitte avant tout rendu | wrap déplacé au present dispatch (v6) |
| v6 (11:2x) | 171 frames via proxy puis quit 18 s | **slot 20 no-op ret 0** (README §5 le signalait) appelé 2× en fin de session | slot 20 = copie fnptr natif DDrawAlt (v6.1) |

Lectorat : `#checkreg` (v5.5) a prouvé `sel=0, ret=1, b88=1` — le boot natif case 0
réussit ; `bd0=0x6CA652C0` = signature DotEmu (lot +4 confirmé).

## Contrôles A/B/C

- **A (vanilla pur, 10:4x)** : quit quelques secondes — a révélé l'environnemental.
- **B (vanilla re-dl, 10:56)** : 74 s en jeu (open world), sortie propre — environnement sain.
- **C (notre DLL inerte `nohook`, 11:0x)** : open world — la DLL chargée est inoffensive ;
  le tueur était notre code actif → corrigé slot 20 + wrap.

## Hashes

| Fichier | SHA256 |
| --- | --- |
| `FF8_EN.exe` (copie test) | `064D466B5FE2BA901FD44ABF19F37C0FD6A2DB40AABD95C9E5959195B6589570` |
| `AF3DN.P` v6.1 (notre DLL) | `EE3D30B967F160F6CF97C1B8C2D0AC711652F81AEF39302454D14C212A560EE5` |
| `dotemu_orig.dll` (original DotEmu) | `539558E4F5CF495735CCC8D5E98A185E3660CEB8D5DDF21EB7558B02FBB21FEC` |
| CSV campagne | `EB5FDCA3D48F7A50F107433307CDFC25E77A4CF2DC3CE0796A4CD3AF1BC23826` |

## Limites / suite

- Les ODS de `DD_init` n'ont pas été capturées (`OutputDebugString_1` probablement
  inlinée par /Ox du jeu) — le traceur ODS reste posé (sans effet si inlining).
- Replay Mode B/C : `Passthrough_ReplayCaptured` non exercé (hors périmètre lot 12-ter).
- Le chemin « factory case 2 » (spec §7-1/§7-2) reste documenté mais n'est pas le
  véhicule live : le wrap post-init au present dispatch est le mécanisme démontré.
- La copie opérateur `.bak` (FFNx complet) est conservée ; la copie test est
  re-téléchargeable via Steam (validation d'intégrité) à tout moment.
