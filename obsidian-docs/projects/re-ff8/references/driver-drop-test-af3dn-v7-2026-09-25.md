---
title: "[LOT 13] AF3DN.P v7 — Dump Draw Lists + Décodage PNG (2026-09-25)"
category: references
tags: [ff8, rendering, reverse-engineering, runtime-memory]
aliases: [lot 13 dump draw lists, AF3DN.P v7, dump v7 draw lists, decodage PNG draw lists, ND07]
sources:
  - docs/tech/investigation/battle-static-discovery/notes-lot13-session-2026-09-25.md
  - docs/tech/investigation/battle-static-discovery/driver-drop-test-af3dn-v7-2026-09-25.md
  - docs/tech/investigation/battle-static-discovery/driver-abi-spec.md
  - tools/_tmp_af3dn_drop/captures/menu.bin
  - tools/_tmp_af3dn_drop/captures/battle_base.bin
  - tools/_tmp_af3dn_drop/captures/fireaga_only.bin
  - tools/_tmp_af3dn_drop/captures/strict_final.bin
  - tools/_tmp_af3dn_drop/captures/mixed_append.bin
summary: >-
  Lot 13 - DLL AF3DN.P v7 capture les draw lists par node (ND07) au present dispatch,
  decodeur offline + raster software produisent des PNG menu/bataille/Fireaga.
  Cause racine +2 fermee : fopen mode texte (CRLF). Re-verif v7.1 STRICT PASS.
provenance:
  extracted: 0.90
  inferred: 0.08
  ambiguous: 0.02
created: 2026-09-25T00:00:00+02:00
updated: 2026-09-25T20:00:00+02:00
---

# [LOT 13] AF3DN.P v7 — Dump Draw Lists + Décodage PNG (2026-09-25)

> Miroir distillé pour le vault. Sources primaires (commits `2c6d9e9`, `a3440c5`,
> `2cdd083`, `bca0d94`) : `notes-lot13-session-2026-09-25.md` (dossier de session,
> roadmap 1–5), `driver-drop-test-af3dn-v7-2026-09-25.md` (rapport campagne),
> `driver-abi-spec.md` §6.1. Cette page cite l'EA et le livrable, ne duplique pas
> les livrables — voir [[projects/re-ff8/references/battle-address-catalog]] et la
> série decomp/semantic du repo.

> Note : une coquille `campures` a existé dans le frontmatter lors de la première
> écriture ; elle a été corrigée dans la même session (sources ci-dessus =
> chemins canoniques). Le manifest considère les chemins canoniques.

## 1. Ce qui a été construit ^[extracted]

- **DLL v7 (AF3DN.P)** : capture mémoire des draw lists **par node au vol** (slots
  43–64 wrappés, appelés PAR NODE par `Gfx_WalkDrawList 0x4178D7` en
  `(ctx, node, cookie)` — l'ordre de capture = l'ordre de draw exact, painter's
  algorithm). Ring RAM 64 Mo BSS, flush append au present dispatch (zéro IO dans le
  detour), sidecar `gfx_passthrough.dump` à côté de la DLL (armé 16 frames,
  auto-supprimé), gardes SEH + caps (vcount ≤ 4096, icount ≤ 16384, record ≤ 256 Ko,
  4096 rec/frame). CSV v6.1 intacte, slot 20 fnptr natif intact.
- **Closure node→géométrie** (IDB + capstone, hash PE jeu `064D466B…9570`) :
  slots 48/49/50 = walk direct `0x43E24A` (vcount@+0x0C, verts@+0x14, icount@+0x18,
  idx@+0x20, FVF 0x1C4) ; 51/60 = VB batch `0x43E356`/`0x43E692` (remaining@+0x08,
  verts@+0x14, idx@+0x20, **ids u8/groupe @+0x28**, geom=+0x2C,
  vcount=*(geom+0x3C)×rem, icount=*(geom+0x40)×rem) ; 57/58/59 walk direct FVF 0x1E2 ;
  63/64 linelist ; setups 43–47/52–56/61–62 = node jamais lu.
  Consumer des détails : [[projects/re-ff8/references/battle-render-pipeline-entrypoints]],
  livrables `decomp/0x4178D7__Gfx_WalkDrawList.md` et
  `decomp/0x43E356__RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB.md`.
- **Décodeur offline** (`tools/_tmp_af3dn_drop/decode/`) : `ff8dump.py info|render`
  (parser ND07 auto-réparateur : resync borné + realign-tail + reconstruction idx
  quad-strip PSX `(2,1,0,3,1,2)` par groupe), `raster.py` (rasteriseur software zéro
  API), `selftest.py` (28/28 vérifications pixels), `--strict` (resync = échec
  bloquant, exit 3).
- **Observateurs** : `ff8_watch4.ps1` / `ff8_watch5.ps1` (spawn + attach + exit code).

## 2. Campagne live (25/09 13:47–16:19, pid 10308) + re-vérifications

| Dump | seq | contenu | verdict |
|---|---|---|---|
| menu (9720–9735) | 16 fr | 10 rec/fr, 54 tris/fr, bbox x[0..640] y[16..462] | PASS — PNG bandeau+3 barres+curseur |
| bataille baseline (509230–509245) | 16 fr | 78 rec/fr, 17 114 tris | distinct du menu ✔ |
| Fireaga (546501–546516) | 16 fr | 337–447 rec/fr, ~385 Ko/fr, 70 951 tris | explosion radiale dorée + terrain + UI/HP ✔ |
| re-vérif v7.1 (765–780) | 16 fr | **STRICT PASS : 0 resync**, 80 kind2/0 implausible, fichier = 16×4 380 exact | **writer fermé** |

0 AV / 0 WER sur toutes les sessions ; sorties volontaires ; pas de stutter signalé.

Logs par frame (`*_frame.log`) : menu 10 rec/fr constant (4 380 o/fr), bataille 78
rec/fr (98 508 o/fr), Fireaga 337→447 rec/fr (345 556 → 385 000 o). Les logs
`reverify`/`mixed_append` (seq 1983–1998, 2729–2744) documentent les appends croisés.

## 3. Cause racine « +2 » (FERMÉE) ^[extracted]

`fopen(binPath, "a")` = **mode TEXTE** : chaque `0x0A` des données devient
`0D 0A` sur disque (+2 o par record contenant un LF). Le contrat v7 est rétabli
avec la copie binaire :
- **Anneau RAM = contrat exact** (RPM in-game : magic suivant à +1324, zéro préfixe) ;
- même record sur disque = 1326/1326 avec les 2 LF expansés ;
- repro in vitro : 0 LF → +0, 8 LF → +8 ;
- harnais sur DLL déployé : `g_dumpWrite` +1324 conforme, sentinelles non copiées ;
- décomp réconciliée DumpNode (`_audit/DumpNode_decomp_reconcile.md`, copie
  `shl edi,5` exacte, src node+0x14, aucun writeback).

La corrélation « remaining>1 » était indirecte (seuls les multigroupes ont des mots
idx scratch avec LF). Le « préfixe u16 `22 00` » = le dernier mot idx (34) poussé
hors zone par les insertions — **aucun champ natif intercalé**. Fix :
`fopen(binPath, "ab")` — **v7.1 `F7A9B39B…E4F`**.

**Anomalie distincte (drift de build)** : les records bataille hors gardes
(vc 19482/ic 29184, fails=0) viennent de l'**image bootée 13:47** (`2E417A66` ;
l'image `53464B47…` ne peut pas les produire — gardes vérifiées au disasm).
La corrélation « remaining>1 » était indirecte ; l'image morte est la cause de ces
records hors gardes.

Scratch idx post-walk (`0x43E356` réécrit partiellement ses indices pendant le
draw) : absorbé par la reconstruction quad-strip ; durcissement optionnel =
capture avant forward natif.

## 4. Livrables & hashes ^[extracted]

| artefact | taille | SHA256 | whereabouts |
|---|---|---|---|
| DLL v7.1 (fix flush binaire) | 142 848 | `F7A9B39B5CD2194916D2F47608CAD1E2D5D66AEA1607FCBA7E965D1FC20ECE4F` | repo (passthrough/gfx_driver_passthrough.dll) ✅ vérifié |
| DLL v7 déployé (gardes-intactes) | 142 848 | `53464B477C58F39D3ACF39BC3C1438DB15291B080A7669B11BA347EEEB888960` | image bootée 13:47 ; **absent du repo** (hash-bound statique, comme la CSV) |
| DLL v6.1 backup | 136 704 | `EE3D30B967F160F6CF97C1B8C2D0AC711652F81AEF39302454D14C212A560EE5` | repo (`build\FF8PassthroughDriver.dll`) ✅ vérifié |
| `captures\menu.bin` (70 144) | | `D11044B726FDBE68323B4D1D6770C67F4241FAA435028AB591F9AB6C57677291` | copie vault `_raw/lot13…` ✅ vérifié |
| `captures\battle_base.bin` (1 647 430) | | `BA5E603D42C3C05A67EEF2A95E7DCBEBF703A0B0EF9269AE18291285BE5A624A` | copie vault `_raw/lot13…` ✅ vérifié |
| `captures\fireaga_only.bin` (2 042 867) | | `C34ED67AD6E870D103EBE74FA5A8491E74676D04FC1DA523CF051E1987347FD4` | copie vault `_raw/lot13…` ✅ vérifié |
| `captures\strict_final.bin` (70 080) | | `20AB295E16FB4946FB58B7891A9AC48B80D9BFD54F9FA52F2E87FDF7500F7756` | copie vault `_raw/lot13…` ✅ vérifié |
| `captures\reverify.bin` (70 144) | | `4294DD77D73DCF6028BB10B2FF527F46F61DBA87FCD78234A92F7B5EF0E92A1B` | copie vault `_raw/lot13…` ✅ vérifié |
| `captures\mixed_append.bin` (140 448, preuve CRLF structurale) | | `66C4CEF1ED878D59402AADBA29A9884188DCFC767BF6312087E0EF2BC150D4A3` | copie vault `_raw/lot13…` ✅ vérifié |
| `captures\dump_v7_cumulative.bin` (6 877 620) | | `F01D03FDAA218D0ACCCC388EC0DA7A01199606DDCBB643A8B93E2BE6302E0C44` | hash-bound **sur place** `tools\_tmp_af3dn_drop\captures\` — non copié (6,8 Mo) |
| CSV campagne v7 (2 137 292 690) | | `1EAB485F0E0139565545334A278CA8B056CA3A3F44EBCADE3FB4B33433F8E2C9` | hash-bound sur place — non copié (2,13 Go) |
| logs (menu/battle_base/fireaga…) | 1 184–3 680 | cf. manifest | copies vault `_raw/lot13…` ✅ |
| PNG menu (16) / fireaga (6) / strict (16) | | hash uniques listés ci-dessous | copies vault `_raw/lot13…` ✅ |

PNGs : 7 hashes uniques :
`4dd46262…c8b01` (menu = 16 frames identiques ×2 séries menu/strict, contenu
pixel-identique — menu statique), puis 6 frames Fireaga toutes distinctes :
`c562faec…7b68e` (546501), `5f6232a0…2bc343` (546502), `fd60b1bd…5b0629a` (546503),
`91497189…c8edea` (546504), `5459f7f2…c83c064b` (546505), `53c30e91…2c69c` (546506).
Catalogue complet dans [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot13]].

## 5. Leçons process (transverses) ^[extracted]

1. Hasher le DLL déployé **après** copie + logger un **build-id u32 dans chaque
   record** — le drift « déployé ≠ cru déployé » est la vraie leçon (l'image
   13:47 ≠ tout build ultérieur).
2. **Purger `.bin`/`.log` entre triggers** : les appends croisés + CRLF corrompent
   structurellement les en-têtes (preuve `mixed_append.bin`).
3. Décodeur `--strict` par défaut pour les dumps futurs ; resync réservé aux
   4 fichiers historiques du 25/09.
4. Flush disque à chaque présent (jusqu'à ~400 Ko/frame) : **pas de stutter** ;
   la copie SEH bornée ne casse rien.
5. Protocole launcher/observateur/observateur-exit rodé — réutilisable tel quel.

## 6. Suite — voir la roadmap

Les **propositions 1–5 pour la continuation (lot 14+)** sont tracées dans
[[projects/re-ff8/concepts/battle-backend-roadmap]] — la page d'entrée pour les
prochains lots.

## Related

- [[projects/re-ff8/references/driver-drop-test-af3dn-2026-09-25]] — le drop test
  lot 12-ter (mécanisme d'attache au present dispatch, v6.1).
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] — la chaîne
  frame et la matrice driver/slots.
- [[projects/re-ff8/references/external-gfx-driver-sources]] — la spec ABI en
  lien (driver-abi-spec §6/§6.1/§7.5/§8), le contrat factory.
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]] — l'architecture
  cible consommant les dumps.
- [[projects/re-ff8/references/gfx-decomp-campaign-2026-09-19-22]] — l'historique
  de campagne decomp/live dont le lot 12 est le socle.
- [[journal/2026-09-25]] — les journaux de toutes les sessions du jour.
