# Rapport campagne — lot 13 : dump draw lists v7 + décodage PNG (2026-09-25)

Image : AF3DN.P v7 (build `2E417A66…357B` à la boot 13:47 ; build corrigé `53464B47…8960` déployé 16:19 après sortie).
Process : `FF8_EN.exe` pid 10308, spawn 13:47:59, mort 16:19:52 (volontaire), **0 AV / 0 WER**.
Observateurs : `ff8_watch4.ps1` (spawn+modules+900 s), `ff8_watch5.ps1` (exit code).
Déploiement drop-in : inchangé vs v6.1 (`AF3DN.P` + `dotemu_orig.dll`, forwards `dotemu*` 8 noms).

## Timeline

| t | événement |
|---|---|
| 13:47:59 | boot natif 100 % (case 0 DDrawAlt, AF3DN.P + dotemu_orig chargés) |
| 13:50 | menu → sidecar posé → **dump menu 16 frames** (seq 9720–9735) |
| ~15:39 | bataille → sidecar → **dump baseline 16 frames** (seq 509230–509245, 78 rec/frame) |
| 16:11 | Fireaga → sidecar → **dump fireaga 16 frames** (seq 546501–546516, 337–447 rec/frame, ~385 Ko/frame) |
| 16:19:52 | sortie propre (exit code vide = volontaire) |

## Critères PASS/FAIL

| # | Critère | Verdict | Preuve |
|---|---|---|---|
| 1 | Dump menu décodé, primitives cohérentes | **PASS** | 160 records, 10/frame, 0 fail/drop/overflow, slots 45×2+47×3+50×2+51×3/frame ; 54 tris/frame ; bbox x[0..640] y[16..462] |
| 2 | Frames bataille ≠ menu | **PASS** | densité ×8 (78 vs 10 rec/frame) ; fireaga ×5–8 (337–447) ; 17 114 / 70 951 tris |
| 3 | PNG reconnaissable | **PASS (menu exact, bataille/fireaga avec artefacts documentés)** | menu : bandeau + 3 barres + curseur ; fireaga : explosion radiale dorée + terrain volcanique + UI/HP — artefacts (triangles parasites, NaN) imputés au writer déployé, cf. §Anomalie |
| 4 | 0 AV / 0 WER | **PASS** | sortie volontaire, aucun WER, 0 fail SEH dump, 0 drop ring |
| 5 | Perf | **PASS** | pas de stutter signalé pendant la session ; flushes par frame ~0,4 Mo max (fireaga) |

## Anomalie (writer de l'image déployée) — qualifiée, contournée, corrigée

- Symptôme : records slot 51 multigroupes (`remaining>1`) avec **+2 o non déclarés** (fvf blob copié
  `[verts-2, verts-2+vc*32+2)` d'après bytes réels, préfixe u16 = `last_idx+1` du stream ids),
  et en bataille des records **hors gardes** (vc 19482/ic 29184 avec fails=0) que le build
  courant refuse. Le `.log` du writer (bytes déclarés 4380/frame) diverge du fichier (4384/frame).
- Cause racine : **drift de build** — l'image bootée ≠ l'état final de la source ; le build
  courant (audit disasm : `shl edi,5`, psize/advance même variable, gardes intactes) ne
  reproduit pas l'incident. NB : l'assertion « .text du rebuild identique à l'image déployée »
  de l'audit intermédiaire est **circulaire** (le fichier `2E417A66` a été écrasé avant la
  comparaison) ; la preuve retenue est empirique (gards contournées + split log/fichier dans les captures).
- Contournement : décodeur resync + realign tail + reconstruction idx quad-strip
  (`tools\_tmp_af3dn_drop\decode\ff8dump.py`, selftest PASS, 4 fichiers historiques parsés).
- Correctif : build propre `53464B47…` déployé (jeu mort, hash vérifié). **À faire à la
  prochaine boot : dump menu de re-vérification — chaîne strictement valide attendue (0 resync).**

## Livrables & hashes

| artefact | taille | SHA256 |
|---|---|---|
| `captures\menu.bin` | 70 144 | `D11044B726FDBE68323B4D1D6770C67F4241FAA435028AB591F9AB6C57677291` |
| `captures\battle_base.bin` | 1 647 430 | `BA5E603D42C3C05A67EEF2A95E7DCBEBF703A0B0EF9269AE18291285BE5A624A` |
| `captures\fireaga_only.bin` | 2 042 867 | `C34ED67AD6E870D103EBE74FA5A8491E74676D04FC1DA523CF051E1987347FD4` |
| `captures\dump_v7_cumulative.bin` | 6 877 620 | `F01D03FDAA218D0ACCCC388EC0DA7A01199606DDCBB643A8B93E2BE6302E0C44` |
| `captures\gfx_passthrough_v7_campaign.csv` | 2 137 292 690 | `1EAB485F0E0139565545334A278CA8B056CA3A3F44EBCADE3FB4B33433F8E2C9` |
| logs (`menu/battle_base/fireaga.log`) | 1 184 / 2 416 / 3 680 | cf. `git log` du lot |
| DLL corrigé déployé | 142 848 | `53464B477C58F39D3ACF39BC3C1438DB15291B080A7669B11BA347EEEB888960` |

PNG : `captures\png_menu\frame_0097xx.png` (16) + `captures\png_fireaga\frame_54650x.png` (6).
CSV 2,13 Go **non commité** (copie hash-bound campagne, comme v6.1). Résidus jeu : nettoyés (0).

## Leçons process

1. Hasher le DLL déployé **après** copie + logguer un identifiant de build dans chaque record (1 u32 header) — le drift « déployé ≠ cru déployé » est la vraie leçon.
2. Le decodeur passe en mode **strict** pour les dumps futurs (resync = échec bloquant) ; resync uniquement pour les 4 fichiers historiques du 25/09.
3. « Copier avant le forward natif » : durcissement défensif optionnel (fige node+0x08/0x14/0x2C).
