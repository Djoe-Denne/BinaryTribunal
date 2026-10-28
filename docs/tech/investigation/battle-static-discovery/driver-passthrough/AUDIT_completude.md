# AUDIT — complétude géométrique & palette battle13 (lot 16, offline 2026-09-27)

> Source : dump v10.3 `battle13.bin` (STRICT PASS, 0x563D), frame 8 (seq 2976).
> Réf opérateur : `battle13\refs\ref_battle13.jpg` (800×600).
> Question lot : où vit la géométrie des 3 persos + du corps du monstre, et pourquoi les
> couleurs sortent « en négatif » / fausses ?

## 1. Verdict géométrie : H1 CONFIRMÉE — tout est dans les records slot-51 VB

Coverage map flat-color (chaque slot une couleur, `LOT16_cov_all.png`) + rendu ciblé
(`LOT16_persos_monstre.png`, `LOT16_entities_with_ids.png`) :

- **Monstre** : 21 records slot-51 v≥60 (texobj 04BE60/04CE70), bbox (62..328, 228..396) —
  ailes/corps/queue complets, texturés turquoise
- **Perso 1 (gauche, Zell)** : 13 records (texobj 04DE70), x≈322-340, y≈122-188
- **Perso 2 (milieu, Squall)** : 17 records (texobj 04EEC0), x≈357-403, y≈144-217
- **Perso 3 (droite, Irvine)** : 13 records (texobj 04FEE0), x≈456-501, y≈144-218
- slot-49 restent : curseur ciblage (12v) + HP bars (2 records) + OVale 96v = fragment
  d'effet au sol — PAS les entités
- Les fonts/UI : 043E10/045870/046730/046BC0 (textes, HP dorés, Start bar)

Toutes les entités bataille sont donc déjà capturées depuis le lot 14 ; le lot 15 avait
cherché les persos du mauvais côté (slots directs au lieu du VB batch).

## 2. Bibliothèque de textures extraites (contrôle opérateur)

`tools\_tmp_af3dn_drop\captures\lot16_texture_library\` :
- `tex_<id>_pal00_<pc>.png` / `tex_<id>_avg_<pc>.png` — 11 texobj uniques × 2 rendus
- `ALLPAL_04BE60/04CE70/04DE70/04EEC0/04FEE0.png` — TOUTES les palettes (p00-p31) de
  chaque texture entité
- `TEXOBJ_MAP` (validation opérateur 27/09) :

| texobj | contenu | entité |
|---|---|---|
| 043E10 / 045870 | fontes (pal5 = HP barre DORÉE ✓ réf) | UI |
| 046730 / 046BC0 | UI francaises (Miss, Chiffres, Start) | UI |
| 049E20 / 04AE40 | rochers | décors |
| **04BE60 / 04CE70** | écailles organiques bleu-cyan (seuls p00/p02 remplis) | **monstre** |
| **04DE70** | short/muscles/visages blonds | **Zell** (gauche) |
| **04EEC0** | pantalon brun ceinture-banches p00, p02 = doré | **Squall** (milieu) |
| **04FEE0** | visages/uniforme, p00/p02/p04 bleus | **Irvine** (droite) |

## 3. Verdict couleurs : PAS un négatif — décalage & couche de modulation manquante

Constats (opérateur + vérifications croisées) :

1. **Pantalon brun correct / ceinture bleue sur p00** (04EEC0) : pas une inversion
   globale — **certaines entrées exactes, d'autres décalées**. p00 et p02 ne partagent
   que 21/256 couleurs (palettes radicalement différentes ; p02 = version dorée surblown).
2. **Seuls les ids 0/2/4 sont référencés** par les groupes (`ids[]` footer, 1290 groupes) ;
   p05+ noires = capacité non utilisée (le `pal_count=32` n'est pas un usage).
3. **Le doré corps du monstre n'existe dans AUCUNE palette TL08** (balayage exhaustif
   battle11-14, 88 palettes entités + fonts ; seuls hits = fontes pal5 = HP bars, et
   04EEC0 p02 = Squall doré).
4. L'unpack 4bpp est réfuté (nz structure en nibble ; pixels = 1 o/texel 8bpp confirmé).
5. `bytes3 = 0x7F` (STP half-transp) sur 510/8192 entrées : les entités utilisent le
   blending PSX half-transparency.

**Conclusion** : la couleur finale = **couche de modulation D3D manquante** (texture ×
facteur de teinte — state D3D TEXOP/MODULATE ou couleur de lumiène ambiante non capturée).
La texture turquoise × un modulate doré chaud ≈ rendu doré de la réf ; le « décalage »
0910 l'où la ceinture bleue ≈ sous-modulation partielle. C'est un champ à CAPTURER (v12 :
state D3D du draw = stage colorop/arg/modulate + light ambient), non dérivable du dump
actuel. (RÈGLE : zéro offset inventé — capture de l'état réel, pas d'inférence.)

## 4. Proches tickets lot 16 → v12

- v12 footer additionnel (slots 51/60 en priorité + directs) : `u32 pal_idx` (déjà EA-prouvé
  0x43e10f-112) **+ capture de l'état blend modulate du draw** (à EA-citer en IDB avant codage :
  SetTexture/set-render-state sur les objets listés de `sub_41EF7A` → dériver le champ exact).
- Décodeur v3 : modulation `texel × modulate` (déjà diffuse fait) + le NOUVEAU champ une
  fois capturé.
- Démonstration dorée possible offline : re-réssyer `tex × gold-modulate` (0xD56A00, alpha
  50 %) pour valider l'hypothèse visuellement (preuve à produire comme LOL test A/B).

## 5. Tests opérateur (plans)

- Vérifier visuellement l'hypothèse modulate doré sur le monstre (rendu candidat × 0xD56A00)
- Si convaincant → v12 capture le champ exact ; sinon → diagnostic IDB (colorop)

## 6. Revue opérateur 27/09 (suite) — le « négatif » = palette système VRAM

Contrôle opérateur sur la bibliothèque + grilles : **BGR confirmé par l'opérateur** pour les
entités ; monstre cuivré (inversion) « esthétique mais pas la réf » ; couleurs jamais justes
dans les rendus TIM-layout.

**Découverte palette système (offline, balayage miroir complet)** : les palettes du
monstre vivent dans la bande CLUT **système du miroir VRAM** — région cid 0x1DA0-0x1E02
(13 hits ≥45 % or au pic 87 %). Rendu avec 0x1DA0/0x1DFF/0x1E00/0x1E02 :

- Couleurs CORRECTES enfin : corps beige-tan-or (opérateur : « 0x1DA0 le plus proche des
  couleurs »), tailles/impacts cohérents
- **MAIS le mapping UV est faux** (motif quadris rayés répétés sur chaque fragment ;
  fragments isolés = fins lames/frondes, pas des surfaces du corps)
- Pattern d'indices raw = (3k+2, 3k+1, 3k) triangles inversés consécutifs — structure
  PSX FT3 par 3 verts, pas le quad-strip (2,1,0,3,1,2) du lot 13

**État des deux problèmes et pistes fermeables** :
1. **Palette** : la source juste = les bandes CLUT système du miroir VRAM (région
   0x1DA0-0x1E02 pour le monstre) — le writer TR08 capture un CLUT d'objet TIM qui n'est
   pas la palette active. Alternatives : (i) re-évaluer les bandes système comme source
   pour chaque groupe ids[g]×base : plusieurs strides testés sans fermer ; (ii) IDB :
   trouver où les bandes système sont écrites pour les entités battle (chaîne
   sub_407EB4/BlitCLUTAlpha) ; (iii) capture v12 du buffer palette réellement bindé.
2. **UV mapping** : fragments en lame + quadris = la géométrie lue ne se combine pas en
   surfaces closes ; suspects : (a) les records contiennent des tris isolés PSX FT3
   (熵 fragment = un tri ; 96 verts = 32 tris = 32 fragments « lames »), il faudrait
   assembler via les données de LISTE ENGINE si disponibles ; (b) les UV encodent
   un tiling/atlas spécifique ; (c) ordre index inversé (3k+2,3k+1,3k) vs tris direct.

## 7. Livrables visuels de session (hors git)

- `LOT16_cov_all.png`, `LOT16_cov_51.png`, `LOT16_cov_49.png` — coverage maps par slot
- `LOT16_tr08_thumbs.png`, `lot16_texture_library\` (22 PNG + ALLPAL ×5 + CHECK ×4)
- `LOT16_monster_palette_grid.png` (288 vignettes), `LOT16_monster_isolated.png`
- `LOT16_perm_all.png` (6 permutations canaux), `LOT16_mirpal_all.png` (4 palettes miroir)
- `LOT16_group_pair2.png` (v2 fix + réf), `LOT16_vflip_pair.png` (v-flip + réf)
- `LOT16_stride_all.png` (3 strides base 0x1DA0)
- `LOT16_entities_with_ids.png` (composite avec ids[] réels)
- `LOT16_monster_A_notint.png`, `_B_gold.png`, `_C_inverted.png` (modulation tests)

## 8. Ordre des canaux et fausse piste swizzle (27/09, contrôle opérateur)

- **BGR confirmé par l'opérateur** pour les catégories entités (canari : la texture
  `04BE60` re-rendue en BGR devient un atlas monstre cohérent : membrane d'aile, tête
  cornue, plastron écailleux, corps beige, écailles turquoise). La conséquence immédiate :
  **la bibliothèque et les ALLPAL ont été ré-émises en BGR** ; le canari précédent
  « RGB pour le TR08 terrain » reste valable pour la famille terrain/UI (gris neutres) —
  les femmes TIM entités sont stockées BGR. Implémentation décodeur : swap R/B selon
  familles ou uniformément en BGR avec la palette des bandes système.
- **Fausse piste éliminée (recherche opérateur, 27/09)** : pas de swizzle 8×8/16×16
  pour les textures battle. Types battle = **TIM PSX standard LINÉAIRE** uploadé VRAM,
  portant **TPage + CLUT + UV 8 bits par face** ; mieux : largeur TIM exprimée **en mots
  16 bits** (8bpp = 128 mots pour 256 texels). Le swizzle ne concerne que les FMV (MDEC,
  DCT 8×8). La routine PC identifiée `sub_507400` = allocation VRAM + patch
  TPage/CLUT. Fermeture IDB déléguée (CLOSURE_tim-vram-tpage.md attendue).
- Troubles persistants après le BGR : mapping UV déformé (fragments en lames, motif
  quadris) ; verdict en attente de la closure IDB (a/b/c du paiement TPage).
- Confirmation de test rapide opérateur : le monstre cuivré par inversion RGB (§
  LOT16_monster_C_inverted) = artefact de test, **pas** la mécanique moteur (retrait).

## 10. Post-recherche opérateur (27/09 soir) : UV 2013, PAI C-A-B, BGR à deux niveaux

Recherches opérateur (FFNx PR #852 Myst6re 2025, FF8UltimateEditor, docs battle model) :

1. **UV table PC 2013** : `mapping[n] = n/256` avec `0→1/256` et `255→254/256` (clamp internaute
   bizarre). FFNx corrige en `n/255`. → Le décodeur doit offrir AMBEDDE modes (`EXACT 2013`)
   vs `CORRECTED`.
2. **Ordre UV par triangle battle = C, A, B physiquement** (faces rangées C A B, pas A B C) —
   l'association naïve UV0→vertex0 fausse les faces.
3. **BGR à deux niveaux** : TIM CLUT PSX 16 bits = `STP | B5 | G5 | R5` (bits bas = R) ;
   conversion PC buffer 32 bits = **BGRA**. Les deux « BGR » coexistent — distinguer.

4. **Constat live (essais LOT17)** : les UV-rotations (6 permutations) + palettes système
   0x1DA0/0x1E00 ne sortent quu toujours le même monstre bleu ou or selon le canal-swap —
   la lecture **champ-fort = R** (convention BGR555 utilisée) donne corps beige-tan/or,
   la lecture **PSX standard r=bits0-4** donne le bleu. Famille cuivré notée correcte pour
   la présence de « piel », l'attribution exacte des sous-bandes reste ouverte.

5. **Arbitrage de fin de lot** : es mêmes palettes système/offline sans closure IDB = le
   mapping UV reste le problème central (la proper id g CLUT relation peut être plus
   précise). Tous les essais offline de rotation/linearisations sont conservés en preuve
   (LOT17_*). Le travail IDB artisanal (sub_507400 / writer des bandes CLUT système /
   relation ids[g] → base) = le lot 17.

## 11. État de reprise lot 17 (après fermeture `c9ad02d`)

- **Committés** : `be9890f`, `d72e959`, `8ba42b6` (lot 15+16 : closures LUT/caméra/ciel,
  walk-direct, textures extraite⊐, audit completude + revues)
- **Décodeur** : `ff8dump.py` BUILD_ID 0x563E + selftest PASS
- **Texture library** : `lot16_texture_library\` complet (BGR)
- **Fermé par `c9ad02d`** : chaîne DAT→TIM 8bpp→VRAM→draw, absence d'offset TPage
  dans les UV, normalisation par fenêtre W/H, et relation acteurs↔bandes CLUT système.
- **Restent UNPROVEN** : W_window effectif de battle13, correspondance byte-exacte des
  cid offline avec les rangées du miroir, writers runtime du bias, backend actif.
- **Prochaine étape** : décodeur v3 offline selon
  `PROMPT_lot17-texture-window-clut-decoder.md`; aucune v12 n'est requise pour appliquer
  la formule fermée.
- La demande utilisateur reste prioritaire en session : ne PAS spawn de v12 sans une
  liste d'EA validée (règle « zéro offset inventé »).

## 12. INGEST session complète — découvertures, trous, questions ouvertes

> **Exécution offline lot 17 (2026-09-27)** : voir
> [CAMPAIGN_lot17_offline_2026-09-27.md](CAMPAIGN_lot17_offline_2026-09-27.md).
> Les chaînes statiques ci-dessous sont conservées. Le nouveau contrôle distingue
> les `ids[]` locaux du cache PC des indices de bandes de staging : 13 bindings
> cache↔VRAM vérifiés sur 16 frames remplacent l'assimilation directe `g=id/2`
> pour les footers capturés. Les UV float sont préservés ; `/255` battle13 reste
> indisponible faute d'UV u8 et de packet fenêtre. Le candidat W=256 retrouve
> les couleurs et motifs attendus, sans transformer W en mesure live.

> Document de référence consolidé demandé par l'opérateur (2026-09-27). Dépendances :
> `CAMPAIGN_lot15_2026-09-26.md`, `CAMPAIGN lot 14`, `AUDIT_completude.md` §1-11,
> `CLOSURE_*.md`, commits `be9890f`, `d72e959`, `8ba42b6`, `aaf5e34`, `c9ad02d`.

### 12.1 Découvertures (toutes prouvées, classées par confiance)

**Architecturales (fortes, IDB-prouvées + live)** :
1. Le ciel/fond battle est composé dans la VRAM émulée `0x1B47818` par des primitives
   VRAM (GP0 0x02 fill `0x4623A0` avec gardes 640×480, 0x80 MoveImage, sprites 0x64-0x7F)
   → RT1 → présenté SANS aucun slot driver 43-64. Les deux passes dispatch convergent
   vers `Gfx_WalkDrawList` (`0x460D26` jmp SubmitTexturePageLists, `0x460CB6` call) —
   un poly ciel serait donc capturé ; il ne l'est jamais. Clear battle = noir.
2. Slots driver 48/49/50 = impl réel `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4`
   @0x43E24A (ctor DDrawAlt 0x4257D0, +0xC0/+0xC4/+0xC8) — **aucun bind, aucun accès
   matdesc**. Les draws directs héritent de l'état D3D courant. `sub_43E0E2` = slot 55
   (piège d'étiquette, trap documenté).
3. Le champ `matdesc+0x14` (texobj) est structurellement mort côté Alt pour les ctx
   directs — prouvé live (48/48 records slot 49 texobj=0 avec v11 in-detour).
4. slots 43-47 : slot 44/43 = setups géom; slot 46/47 = `sub_441581(matdesc, cookie)`
   (commit RS), le 46 ajoute la palette-resolve `sub_407EB4`.
5. Chaîne bind des entités = setup 46/47 → `sub_407EB4` → slot 25 `sub_4365FF` →
   `sub_41ED69` → upload `sub_42022C` / bind `sub_41EF3C` → `SetTexture` via
   `call [deviceVT+0x98]` (vtable idx 38 D3D9).
6. Le miroir TX07 (1 Mio/frame) contient TOUTES les textures battle (persos tpages
   10-15, ciel 16-17, terrain 18-20, effets 27-30) — capturées depuis le lot 14.

**Mappings & textures (merci opérateur)** :
7. Mapping texobj↔entité battle13 **fermé par contrôle opérateur** :
   04BE60/04CE70=monstre ; 04DE70=Zell ; 04EEC0=Squall ; 04FEE0=Irvine ;
   043E10/045870=fontes (pal5 = HP bars dorées de la réf ✓) ; 046730/046BC0=UI ;
   049E20/04AE40=terrain rocheux.
8. **Ordre canaux palette entités = BGR** (à deux niveaux) :
   (a) TIM CLUT PSX 16 bits = `STP | B5 | G5 | R5` (bits 0-4 = R par convention PSX) ;
   (b) buffer PC 32 bits = **BGRA** (B=byte0, G=1, R=2, A=3) ; (c) selon la
   lecture palette-système, le champ-fort (bits 10-14) donne des **couleurs chaudes**
   (convention « BGR » de lecture swap utilisée = correcte empiriquement).
9. **Palettes ACTIVES du monstre = bandes CLUT système du miroir VRAM**
   (région cid 0x1DA0-0x1E02, hits « or » 87 %) — pas le CLUT du timbuffer T+0x60 ;
   les couleurs finalement justes pour la famille (beige-tan-or) sont ces bandes.
10. **Toutes les textures battle = TIM PSX standard LINÉAIRE** (pas de swizzle 8×8,
    fausse piste écartée par recherche opérateur). `sub_507400` est désormais fermée comme
    `BattleModel_AllocateTexturePagesAndPatchTPage` : relocation VRAM, stage CLUT et patch
    des références primitives (`c9ad02d`).
11. Le `c0m*.dat`/`dXc*.dat` = fichiers battle : TIM + par face UV u8 + CLUT PSX +
    TPage PSX, **UV physiquement rangées C,A,B** (≠ A,B,C naïf). Cet ordre d'indices est
    indépendant de la normalisation par fenêtre et n'explique pas les lames restantes.
12. **UV PC 2013** : si le packet texture-window est présent,
    `u_final=u8*(1/W)` et `v_final=v8*(1/H)` ; sans packet, fallback LUT
    `clamp(n,1,254)/256`. FFNx corrige la normalisation historique en `/255` ; le décodeur
    conserve donc deux modes comparatifs sans remplacer la formule W/H par un `/256` fixe.
13. La géométrie des persos/monstre est dans les records **slot-51 VB batch**, jamais
    dans les directs — audit H1 confirmé. Monstre : 21 records tierra (62..328,
    228..396) ; 3 colonnes de persos à x≈322-340 (Zell), x≈357-403 (Squall),
    x≈456-501 (Irvine).
14. Coverage maps disponibles par slot (constat visuel : seulement la zone entité
    jamais couverte par d’autres chaînes).
15. `ids[]` footer ND08 : les valeurs 0/2/4 ne sont pas des strides. Pour l'acteur
    `g=(ptr-g_BattlePresentationActors)/156`, `id=2g` désigne son premier slot CLUT ; les
    acteurs 0/1/2 occupent chacun 1024 octets de staging, uploadés sur les deux rangées
    `y=0xE0+2g` et `y+1` du miroir VRAM.

**Livrable op automatique (validation opérateur)** : dossier complet
`lot16_texture_library\` ré-émis en BGR (`tex_*.png` 11 × 2 + `ALLPAL_*.png` ×5),
(**un seul point noir** ALLPAL_04BE60.png regénéré jaugé BGR/validate
opérateur), **toutes ces pièces sont hors git (captures convention)**.

### 12.2 Trous restants lot 17 (UNPROVEN)

La fermeture `CLOSURE_tim-vram-tpage.md` retire les anciens trous TPage, layout 8bpp et
`ids[g]`-comme-stride. Il reste quatre vérifications courtes :

1. **W_window effectif de battle13** : attendu 128, à confirmer par lecture seule de la
   valeur `*(u32*)(pkt+4)` consommée par `sub_45BC60` @0x45BC65 (pas des octets de code).
   Ce n'est pas une valeur statiquement prouvée.
2. **Correspondance byte-exacte** entre les cid offline `0x1DA0-0x1E02` et les rangées
   `0xE0+2g` du miroir, à contrôler avec `y=0xE0+2g`.
3. **Writers runtime de `ctx+0xBF8/0xBFC`** : le bias est OFF par défaut
   (`ctx+0xBF4=0` @0x40A00A), mais ces writers doivent être cités si la modulation UV est
   activée.
4. **Backend actif** pendant la campagne (DDrawAlt vs GL) : à identifier pour la
   provenance, sans impact sur la formule UV commune.

### 12.3 Décodeur v3 — ordre des actions

1. Maintenir le décodage BGR déjà validé par la bibliothèque.
2. Pour les records issus des UV u8, appliquer W/H par record : `W=256-(v&0x1F)*8`,
   `H=256-((v>>5)&0x1F)*8`, clamp à 256, puis `u=u8/W`, `v=v8/H`. Un W=128 explique
   un facteur ×2 par rapport à `/256` ; ne pas ajouter ni retrancher d'offset TPage. Si un
   replay consomme les UV float finaux du slot 51, les préserver sans seconde normalisation.
3. Pour chaque acteur `g` (0/1/2), lire sa bande système de 1024 octets depuis le miroir
   TX07 aux rangées `y=0xE0+2g` et `y+1`, via la formule de `sub_45B920`. Dans le miroir,
   ce sont deux segments de 512 octets séparés par le stride de rangée 0x800.
4. Produire côte à côte les modes UV **EXACT PC 2013** et **CORRECTED /255**, sans que le
   mode corrigé écrase la sortie exacte.
5. Si la famille de couleurs reste correcte mais la géométrie texturée non, utiliser la
   lecture live W_window et l'effet tile/page comme discriminants ciblés.

### 12.4 Livrables documentés (produits de la session)

- **Commits** : `be9890f` (offline lot 15 : closures LUT/caméra/ciel, decomp ×6),
  `d72e959` (lot 15 live : v11 + closures walk-direct 3 fichiers + v12 candidat),
  `8ba42b6` (lot 16 audit: géométrie fermée H1 + bibliothèque + modulate écart),
  `aaf5e34` (lot 16 post : BGR double-niveau + bandes CLUT système + UV C-A-B),
  `c9ad02d` (lot 17-ready : chaîne TIM→VRAM→TPage, fenêtre UV, bandes CLUT par acteur).
- **Visuels** (`captures/lot14, lot15, lot16/`, hors git) : coverage maps, planches
  palettes, grille de 288 rendus, bibliothèque BGR, paires vs repères, essais
  erfolgreich lot 17 (uv-rot, strides, per-record).
- **Docs** : `AUDIT_completude.md` §1-12 (cette femme), `CLOSURE_sky-path.md`,
  `CLOSURE_walkdirect-texture-chain.md`, `CLOSURE_walkdirect-cookie-chain.md`,
  `CLOSURE_walkdirect-bind.md`, `CAMPAIGN_lot15_2026-09-26.md`,
  `CLOSURE_tim-vram-tpage.md`, `driver-abi-spec.md` §6.3, `README.md` §12,
  `PROMPT_lot16-completude-geometrie.md`, `PROMPT_lot17-texture-window-clut-decoder.md`.
- **Script tools** : `ff8dump.py` (0x563E), `_probe_lot15_walkdirect.py`,
  `lot15_ab.py`, test scripts de session (birds du lot16/17 inline).
