# Lot 17 — décodeur texture-window et bandes CLUT acteurs

> **Lot exécuté offline** : [résultats et correctif au mapping des IDs](CAMPAIGN_lot17_offline_2026-09-27.md).
> Ce brief reste l'état d'entrée. Les `ids[]` du cache PC sont locaux au texobj :
> ne pas les confondre avec les indices de staging `id=2g`. Le rapport contient
> les bindings vérifiés, les rendus, les tests et les limites de la capture.

> Brief de reprise actualisé après la fermeture `c9ad02d` (2026-09-27).
> Ground truth : `CLOSURE_tim-vram-tpage.md` et ses trois decomp associées.
> Le lot commence par l'adaptation offline du décodeur. Les sondes live listées comme
> UNPROVEN ne sont pas lancées par ce brief.

## 1. Objectif

Corriger le rendu texturé battle13 à partir des dumps existants en appliquant la vraie
normalisation UV par fenêtre et les bandes CLUT système propres aux acteurs. Produire une
comparaison côte à côte du comportement PC 2013 exact et du mode corrigé `/255`.

## 2. Établi — ne pas refaire

- La bibliothèque BGR est validée et reste la base du décodeur.
- La chaîne modèles battle est fermée :

  ```text
  DAT → TIM 8bpp
      → 0x507400 BattleModel_AllocateTexturePagesAndPatchTPage
      → 0x507550 BattleMesh_RemapPrimitiveTPageBits
      → 0x505E30 enqueue type-1
      → 0x505D20 FlushToVram (CLUT puis image)
      → 0x45BD30 copyblockToVRAM
      → miroir VRAM 0x1B47818
      → page-slots → draw
  ```

- Le draw battle ne lit ni le buffer TIM local ni une TPage objet. La TPage sélectionne le
  page-slot ; aucun offset TPage n'est ajouté aux UV.
- Avec un packet texture-window, `sub_45BC60` @0x45BC65 décode :

  ```text
  W = 256 - (window_word & 0x1F) * 8
  H = 256 - ((window_word >> 5) & 0x1F) * 8
  W,H bornés pour que x+W et y+H restent ≤ 256
  u_final = u8 * (1/W)
  v_final = v8 * (1/H)
  ```

  Les scales du slot `+0x18/+0x1C` alimentent `dword_1CB603C/38`, puis les `fmul`
  @0x461891-0x4618E4. Sans packet actif, le fallback est la LUT historique
  `clamp(i,1,254)/256`.
- Le bias additif `*(texinfo+0x28) * *(ctx+0xBF8)` et son pendant V sont gardés par
  `ctx+0xBF4`; il est initialisé OFF @0x40A00A.
- Les valeurs footer `ids={0,2,4}` sont des slots CLUT d'acteurs : pour
  `g=(ptr-g_BattlePresentationActors)/156`, `id=2g`. Ce sont les premiers slots CLUT des
  acteurs `g={0,1,2}`. Chaque acteur dispose de 1024 octets de staging, uploadés par la
  file type-0 de `0x509E00` sur les rangées `y=0xE0+2g` et `y+1`.
- `sub_45B920` @0x45B94A résout une référence CLUT par :

  ```text
  ptr = 0x1B47818 + 2048*(clut>>6) + 32*(clut&0x3F)
  ```

  Dans le miroir, une bande acteur correspond à deux segments de 512 octets séparés par
  le stride de rangée 0x800 ; ne pas la traiter comme un slice contigu de 1024 octets.

## 3. Quatre points UNPROVEN du lot 17

1. `W_window` effectif de battle13, attendu à **128** : lecture seule de la valeur
   `*(u32*)(pkt+4)` consommée @0x45BC65, pas des octets de code à cette adresse.
2. Correspondance byte-exacte des cid offline `0x1DA0-0x1E02` avec les rangées
   `y=0xE0+2g` du miroir.
3. Writers runtime de `ctx+0xBF8/0xBFC`; à citer uniquement si le bias/modulation UV est
   activé, puisqu'il est OFF par défaut.
4. Backend actif pendant la campagne, DDrawAlt ou GL ; la formule UV est identique.

`W=128` est une attente à mesurer, pas un établi. La fermeture prouve qu'une fenêtre 128
double l'UV par rapport à `/256`; elle ne justifie pas une correction arbitraire `U/2`.
La fermeture signale aussi qu'un writer runtime externe pourrait modifier le LOWORD `x` de
`off_B8BA38`; cette réserve non bloquante ne change ni les quatre vérifications ci-dessus ni
le plan du décodeur.

## 4. Décodeur v3 — ordre des actions

1. Conserver le décodage BGR validé.
2. Pour les records construits depuis les UV u8, appliquer la formule W/H par record. Pour
   W∈{128,256}, comparer l'effet du scale réel sans ajouter d'offset TPage. Si un replay
   consomme les UV float finaux du slot 51, les préserver sans seconde normalisation.
3. Pour chaque acteur `g∈{0,1,2}`, lire sa bande CLUT système via les deux rangées
   `0xE0+2g` et `0xE1+2g`, puis résoudre la CLUT avec la formule de `sub_45B920`.
4. Émettre deux rendus côte à côte : **EXACT PC 2013** et **CORRECTED /255**. Le rendu
   exact utilise W/H quand le packet fenêtre est actif et la LUT `/256` uniquement en
   fallback. Le mode `/255` reste une comparaison distincte.
5. Si la famille de couleurs est correcte mais que les lames/quadris persistent, utiliser
   la mesure W_window et l'effet tile/page comme discriminants ciblés.

## 5. Critères d'acceptation

- Aucun offset TPage n'est appliqué aux UV.
- `g` (index acteur) et `id=2g` (slot CLUT) ne sont jamais confondus.
- Le lecteur TX07 respecte le stride 0x800 entre les deux rangées de la bande acteur.
- Le rendu exact et le rendu `/255` sont produits séparément avec les paramètres utilisés.
- Toute valeur de W/H inconnue reste marquée UNPROVEN ; aucun 128 n'est codé en dur comme
  vérité battle13.

## 6. Où reprendre

- Audit consolidé : `AUDIT_completude.md` §11-12.4
- Fermeture : `CLOSURE_tim-vram-tpage.md`
- Decomp :
  - `../decomp/0x507400__BattleModel_AllocateTexturePagesAndPatchTPage.md`
  - `../decomp/0x45BC60__Gpu_SetTextureWindow_PageRectScales.md`
  - `../decomp/0x509E00__BattleActor_StageUploadCLUTBand.md`
- Décodeur existant :
  - `../../../../../tools/_tmp_af3dn_drop/decode/ff8dump.py`
  - `../../../../../tools/_tmp_af3dn_drop/decode/texture.py`
  - `../../../../../tools/_tmp_af3dn_drop/decode/selftest.py`
  - `../../../../../tools/_tmp_af3dn_drop/decode/compare.py`
  - `../../../../../tools/_tmp_af3dn_drop/decode/render_tim.py`

Les captures et la bibliothèque lot 16 restent hors git sous
`tools/_tmp_af3dn_drop/captures/`.
