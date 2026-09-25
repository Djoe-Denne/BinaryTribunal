# Session lot 13 — dump draw lists + décodage PNG (2026-09-25, ~11 h)

Dossier de session pour ingestion vault. Source de vérité : commits git `2c6d9e9`, `a3440c5`, `2cdd083`, `bca0d94` + rapport `driver-drop-test-af3dn-v7-2026-09-25.md` + `_audit\DumpNode_decomp_reconcile.md`.

## 1. Ce qui a été construit

- **DLL v7 (AF3DN.P)** : capture mémoire des draw lists **par node au vol** (slots 43–64 wrappés, appelés PAR NODE par `Gfx_WalkDrawList 0x4178D7` en `(ctx, node, cookie)` — ordre de capture = ordre de draw exact, painter's algorithm). Ring RAM 64 Mo BSS, flush append au present dispatch (zéro IO dans le detour), sidecar `gfx_passthrough.dump` à côté de la DLL (armé 16 frames, auto-supprimé), gardes SEH + caps (vcount≤4096, icount≤16384, record≤256 Ko, 4096 rec/frame), CSV v6.1 intact, slot 20 fnptr natif intact.
- **Closure node→géométrie** (IDB + capstone, hash PE jeu `064D466B…9570`) : slots 48/49/50 = walk direct `0x43E24A` (vcount@+0x0C, verts@+0x14, icount@+0x18, idx@+0x20, FVF 0x1C4) ; 51/60 = VB batch `0x43E356`/`0x43E692` (remaining@+0x08, verts@+0x14, idx@+0x20, **ids u8/groupe @+0x28**, geom=+0x2C, vcount=*(geom+0x3C)×rem, icount=*(geom+0x40)×rem) ; 57/58/59 direct FVF 0x1E2 ; 63/64 linelist ; setups 43–47/52–56/61–62 = node jamais lu. Le natif 51/60 consomme en curseurs LOCAUX sans writeback du node (vérifié disasm).
- **Décodeur offline** (`tools/_tmp_af3dn_drop/decode/`) : `ff8dump.py info|render` (parser ND07 auto-réparateur : resync borné + realign-tail + reconstruction idx quad-strip PSX `(2,1,0,3,1,2)` par groupe), `raster.py` (rasteriseur software zéro API : fill plat DIFFUSE, alpha<8 skippé, clip, `--wire`), `selftest.py` (28/28 vérifications pixels), `--strict` (resync = échec bloquant, exit 3).
- **Observateurs** : `ff8_watch4.ps1` (spawn+modules+900 s), `ff8_watch5.ps1` (attach live + exit code).

## 2. Campagne live (25/09 13:47–16:19, pid 10308) + re-vérifications

| Dump | seq | contenu | verdict |
|---|---|---|---|
| menu (9720–9735) | 16 fr | 10 rec/fr, 54 tris/fr, bbox x[0..640] y[16..462] | PASS — PNG bandeau+3 barres+curseur |
| bataille baseline (509230–509245) | 16 fr | 78 rec/fr, 17 114 tris | distinct du menu ✔ |
| Fireaga (546501–546516) | 16 fr | 337–447 rec/fr, ~385 Ko/fr, 70 951 tris | explosion radiale dorée + terrain + UI/HP ✔ |
| re-vérif v7.1 (765–780) | 16 fr | **STRICT PASS : 0 resync**, 80 kind2/0 implausible, fichier = 16×4 380 exact | **writer fermé** |

0 AV / 0 WER sur toutes les sessions ; sorties volontaires ; pas de stutter signalé.

## 3. Cause racine de l'anomalie « +2 » (FERMÉE)

`fopen(binPath, "a")` = **mode TEXTE** : chaque `0x0A` des données devient `0D 0A` sur disque (+2 o par record contenant un LF). Preuves : ReadProcessMemory du jeu en cours (anneau RAM = contrat exact, magic suivant à +1324, zéro préfixe) vs le même record sur disque (1326/1326 identiques avec LF expansés) ; repro in vitro (0 LF→+0, 8 LF→+8) ; harnais sur DLL déployé (g_dumpWrite +1324 conforme, sentinelles non copiées) ; décomp réconciliée DumpNode (`_audit/DumpNode_decomp_reconcile.md` — copie `shl edi,5` exacte, src node+0x14, aucun writeback). La corrélation « remaining>1 » était indirecte (seuls les multigroupes ont des mots idx scratch avec LF). Le « préfixe u16 `22 00` » = le dernier mot idx (34) poussé hors zone par les insertions. Fix : `fopen(binPath, "ab")` — **v7.1 `F7A9B39B…E4F`**.

Anomalie distincte : records bataille hors gardes (vc 19482/ic 29184, fails=0) = **image bootée 13:47** (drift de build sur les gardes ; image morte ; `53464B47`+ ne peut pas les produire — vérifié harnais + disasm gardes @0x1BF7/0x1BFF/0x1C66).

Scratch idx post-walk (0x43E356 réécrit partiellement ses indices pendant le draw) : absorbé par reconstruction quad-strip ; durcissement optionnel = capture avant forward natif.

## 4. Livrables & hashes (copie hash-bound hors git pour CSV/cumulative)

- DLL v7.1 déployé : `F7A9B39B5CD2194916D2F47608CAD1E2D5D66AEA1607FCBA7E965D1FC20ECE4F` ; v6.1 backup : `EE3D30B9…60EE5`
- `captures\menu.bin` `D11044B7…7291` (70 144) ; `battle_base.bin` `BA5E603D…A24A` (1 647 430) ; `fireaga_only.bin` `C34ED67A…47FD4` (2 042 867) ; `dump_v7_cumulative.bin` `F01D03FD…0C44` (6 877 620) ; `strict_final.bin` `20AB295E…7756` (70 080) ; `reverify.bin` `4294DD77…E2A1` ; `mixed_append.bin` (jonction CRLF structurale — preuve du bug flush sur les en-têtes)
- CSV campagne v7 : 2 137 292 690 o, `1EAB485F0E0139565545334A278CA8B056CA3A3F44EBCADE3FB4B33433F8E2C9` (41,1 M appels slots — hors git, hash-bound)
- PNGs : `png_menu\` (16), `png_fireaga\` (6), `png_strict\` (16)
- Docs : README passthrough §8, `driver-abi-spec.md` §6.1 (confirmations live), rapport campagne

## 5. Leçons process (transverses)

1. Hasher le DLL déployé **après** copie + logguer un **build-id u32 dans chaque record** — le drift « déployé ≠ cru déployé » est la vraie leçon (l'image 13:47 ≠ tout build ultérieur).
2. **Purger `.bin`/`.log` entre triggers** : les appends croisés + CRLF corrompent structurellement les en-têtes (preuve mixed_append).
3. Décodeur `--strict` par défaut pour les dumps futurs ; resync réservé aux 4 fichiers historiques.
4. Le flush disque à chaque présent (jusqu'à ~400 Ko/frame) ne stutte pas ; la copie SEH bornée ne casse rien.
5. Protocole launcher/observateur/observateur-exit rodé — réutilisable tel quel.

## 6. Roadmap propositions 1–5 (pour continuation — lot 14+)

1. **v8 : capture textures** (RECOMMANDÉ, prochain lot) — le layer manquant. Closure node+0x2C → geom+0x10/+0x28 → page texture → VRAM/CLUT (ground truth IDB : `0x465CE0` Gfx_SelectTexturePageDrawList, `0x43E24A` texinfo, `0x43E356`). DLL v8 : copie SEH page (≤128×256 4/8bpp ≈ 32 Ko) + CLUT (≤256 entrées), dédup par adresse intra-frame, record texture auto-descriptif `TX07` + build-id. Décodeur v2 : point sampling + palette → PNG pixel-fidèle. Prompt dédié : `PROMPT_v8-texture-capture.md`.
2. **Étape B : replay backend moderne** — renderer D3D11/Vulkan standalone consommant les dumps (le software a prouvé la pipeline géométrie ; GPU = textures + blend). Livrable : frame FF8 rendue par le backend moderne, diff vs capture.
3. **Formalisation sémantique** — triples 1+V pour `0x43E356`/`0x43E692` (VB batch) : l'audit `_audit/DumpNode_decomp_reconcile.md` sert de base ; ferme les fonctions dans l'arbre IDA/wiki avec le lot 13 en evidence live.
4. **v7.2 durcissement** — capture avant forward natif (fige node+0x08/0x14/0x20/0x2C, supprime la reconstruction idx) ; build-id u32 par record ; purge .bin/.log par trigger.
5. **Housekeeping wiki** — ingest evidence de cette session (FAIT) ; wiki-scribe : README §8 + abi-spec §6.1 → FF8ModdingWiki (Battle/TechnicalReference).

## 7. Pointeurs

- Rapport : `driver-drop-test-af3dn-v7-2026-09-25.md` ; prototype : `driver-passthrough/` (README §8 = opérationnel) ; décodeur : `tools/_tmp_af3dn_drop/decode/` ; audit : `decode/_audit/` (harnais, décomp DumpNode, probes).
- Spec ABI : `driver-abi-spec.md` §6/§6.1/§8 ; decomp walker : `decomp/0x4178D7__Gfx_WalkDrawList.md` ; consumer : `decomp/0x43E24A__RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4.md`.
- ABI v7 contract in-code : `gfx_driver_passthrough.c` l.332+ (format ND07, closure, gardes).
