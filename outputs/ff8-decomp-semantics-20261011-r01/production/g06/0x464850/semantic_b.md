# 0x464850 — analyse sémantique B indépendante

## Périmètre / provenance

- Mission `ff8-decomp-semantics-20261011-r01`, groupe g06, rôle semantic B, tâche `task_mv44rkv8_007b_qf1ba0` ; modèle déclaré GPT-6.1 Sol. Aucun changement local de modèle/variante.
- Entrée : `inputs/ff8-decomp-semantics-20261011-r01/g06/common-compaction.md` et projection `0x464850.readable/{manifest.json,asm-001.txt,…,asm-005.txt,bytes-001.txt,metadata.json}` sous ce même groupe. Les références abrégées ci-dessous désignent exclusivement ces fichiers.
- Manifest : packet SHA-256 `72f5e85aeda3168bd1cd97ff40d4407399a0fbbdd3d5589f58031f5fc9e7b087`, compaction SHA-256 `ded4edb4b1c6b48f28524bd123684cad1cf7bbc1743739420aa39f22a47309dc`. Hashes rapportés du manifest, non recalculés.
- Couverture : les 119 instructions, les 11 lignes de bytes (327 octets), les 20 blocs du CFG et les six xrefs ; chunk unique `[0x464850,0x464997)`. Aucun auteur voisin, C cible, review ou classement consulté. Ni compilation, test, différentiel, IDB ou promotion.
- Les commentaires et labels de l'ASM ne servent pas de preuves.

## Rôle et confiance

**Nom proposé : `Gfx_InvalidateTexturePageCachesForRect`. Confiance globale : LIKELY.**

- **CERTAIN (mécanique)** : notifier d'abord un helper avec quatre bornes brutes et une base de table, puis marquer des champs de cellules avec `0xFFFFFFFF`, effacer conditionnellement un bloc de données par cellule, et effectuer une seconde passe de marqueurs avec regroupement par paires sur le premier axe.
- **LIKELY (métier)** : invalidation de caches de pages/textures après modification d'un rectangle du miroir CPU associé à la VRAM. Deux familles indépendantes de preuves motivent le nom : les écritures de sentinelles/effacements du corps (P3–P5), et les appels après copie de pixels vers la destination documentée dans le contexte gelé (P7). Aucun ancien nom n'est nécessaire à cette conclusion.
- **UNCERTAIN** : signification précise des trois banques, du bloc effacé et du helper ; une opération GPU/upload n'est pas démontrée. Le corps ne copie aucun pixel source vers une destination.
- **CONFLICT localisé** : l'adresse de la seconde condition dans la compaction est erronée ; l'ASM et les bytes imposent `0x1CAD694`, pas `0x1CAD294` (voir P4). Ce conflit de contexte ne remet pas en doute l'adresse native.

## Contrat mécanique

### Entrées / ABI

Quatre arguments de pile de 32 bits, ordre `(a0,a1,a2,a3)`, convention compatible cdecl. Le contexte gelé des callers les interprète comme `(x_min,y_min,x_max_inclusif,y_max_inclusif)`, **pas** `(x,y,width,height)` (`common-compaction.md:7,15–16`). Le corps seul établit quatre bornes, sans nom d'axe métier.

Le helper `0x467550` est appelé **avant toute comparaison**, avec l'ordre logique `(a0,a1,a2,a3,0x1CB6040)` ; les cinq pushes sont droite-vers-gauche, et le caller nettoie `0x14` octets. Son retour EAX est écrasé immédiatement. Les effets supplémentaires du helper ne sont pas exhaustivement connus dans le gel.

Définir les cellules :

- `u0 = trunc_signed(a0/64)`, `u1 = trunc_signed(a2/64)` ;
- `v0 = trunc_signed(a1/256)`, `v1 = trunc_signed(a3/256)`.

La troncature est vers zéro : `CDQ`, ajout de 63 ou 255 uniquement pour un opérande négatif, puis `SAR 6/8`. Ce n'est ni une division unsigned ni un arrondi supérieur systématique. Les comparaisons de bornes et les boucles `JG/JLE` sont **signées**. Les calculs d'adresses et produits sont modulo 2^32 ; aucune vérification de capacité, borne écran, valeur négative ou overflow d'adresse.

### Effets directs et ordre

1. Pour chaque cellule visitée, `v` extérieur de `v0` à `v1`, `u` intérieur de `u0` à `u1`, définir `q = u + 16*v`.
2. Écrire successivement trois dwords `0xFFFFFFFF` aux adresses `0x1CB636C + 0x44C*q + k*0x8980`, pour `k=0,1,2`. Les trois writes précèdent la condition de clear. `0x8980 = 32*0x44C`, donc ce sont trois banques de même pas mécanique, non trois octets/pixels.
3. Lire le dword à `0x1CCFD90`. S'il est non nul, lire le dword à `0x1CAD694 + 0x470*q`. S'il est lui aussi non nul, mettre EAX à zéro et effectuer `REP STOSD`, ECX=`0x100`, EDI=`0x1CAD28C + 0x470*q`. Avec DF=0 : 256 écritures de dwords, soit `0x400` octets. La condition se trouve à `clear_base+0x408`, **hors** de cette plage effacée. Ni condition ni pointeur de condition n'est mis à zéro par cette plage normale.
4. Après la totalité de la première passe, nouvelle traversée des bornes : écrire `0xFFFFFFFF` à `0x1CBECEC + 0x44C*((u & 0xFFFFFFFE) + 16*v)`.
5. **Aliasing important** : `0x1CBECEC = 0x1CB636C + 0x8980`. La seconde passe revisite donc le champ de la **deuxième banque de la première passe**, avec index premier axe aligné au pair. Il ne s'agit pas d'une preuve de queue séparée. Deux cellules adjacentes peuvent produire deux writes au même champ ; si `u0` est impair, le marqueur peut concerner la cellule paire immédiatement précédente, absente de la première passe.

Les marqueurs sont des dwords complets ; `AND AL,0xFE` ne tronque pas l'index à 8 bits : il efface seulement le bit 0 d'EAX et conserve ses 31 autres bits. Le stride des entrées est `0x44C`, celui des blocs auxiliaires `0x470`, et l'incrément par rangée de `v` vaut 16 entrées.

Les quatre registres EBX/EBP/ESI/EDI sont sauvegardés/restaurés ; les emplacements d'arguments sont réutilisés comme temporaires. Aucun x87/SSE dans ce corps. `REP STOSD` dépend de DF et aucune instruction `CLD` n'est présente : DF=0 après le helper est une précondition ABI pour l'effacement ascendant décrit. Avec DF=1, les writes descendent à partir de l'adresse de départ ; ne pas remplacer silencieusement ce comportement par un memset abstrait.

### Bornes vides / retours

- Si `v0>v1`, les deux passes sont sautées, mais le helper a déjà été appelé.
- Si `v0<=v1` et `u0>u1`, la première boucle parcourt son compteur de rangées sans write ni lecture des conditions, puis la seconde parcourt aussi les rangées sans write. Pas de garde globale sur les bornes brutes ; une inversion brute peut disparaître après troncature en cellules.
- Pas de valeur de succès établie. **EAX n'est pas normalisé**, et ni AL ni AX n'est une sortie booléenne démontrée. Avec retour normal, ABI respectée et sans alias destructeur des temporaires :
  - `v0>v1` : EAX reste `a3 + (a3<0 ? 255 : 0)`, avant son `SAR` effectué dans EDI ;
  - rangées non vides mais `u0>u1` : EAX final=`u0` ;
  - les deux plages non vides : EAX final=`275*((u1 & 0xFFFFFFFE) + 16*v1)` modulo 2^32, c'est l'index multiplié et non l'adresse complète du dernier write.
- Les callers documentés ignorent ce reliquat (`common-compaction.md:7`). Un contrat métier sans retour utile est LIKELY ; déclarer un retour constant/boolean serait faux mécaniquement. AL/AX sont simplement les parties basses de cet EAX.

## Sept preuves instruction/xref

**P1 — ABI et notification inconditionnelle.** `0x464851–0x464860` charge les quatre arguments ; `0x464864–0x46486D` pousse base puis a3,a2,a1,a0 ; `0x464874` nettoie 20 octets. `asm-001.txt:2–16`. Le helper est unique dans `metadata.json:200–203`.

**P2 — Signedness et découpage asymétrique.** `0x464877–0x4648AC` réalise les biais de signe puis shifts arithmétiques /64 pour a0/a2, /256 pour a1/a3 ; `0x4648BD`, `0x4648D7`, `0x464938`, `0x464954`, `0x46498B`, `0x464990` portent les tests signés. `asm-001.txt:17–25`, `asm-002.txt:1–25`, `asm-003.txt:1–3`, `asm-004.txt:5–23`, `asm-005.txt:11–14`. L'orientation vient des opérandes, pas d'un nom historique.

**P3 — Trois banques de marqueurs.** Les LEA `0x4648D9–0x4648E8` donnent `4*275*q = 0x44C*q` ; `0x4648EF–0x464901` écrit trois fois -1 avec pas `0x8980`. `asm-003.txt:4–14`. Sentinelles par cellule plutôt que copie de données pixel : première preuve du nom d'invalidation.

**P4 — Deux conditions et clear exact ; conflit résolu nativement.** `0x464903–0x464920` teste `0x1CCFD90`, puis calcule `0x470*q` et charge `0x1CAD694+[offset]`. `0x464922–0x46492F` efface via ECX=256, EAX=0, EDI=`0x1CAD28C+[offset]`. `asm-003.txt:15–25`, `asm-004.txt:1–4`. `bytes-001.txt:7` contient pour `0x464918` `8b8294d6ca01` : déplacement little-endian **0x01CAD694**, indépendant du label. La compaction `:9,29` annonce 0x1CAD294, contredite de 0x400.

**P5 — Paire, pleine largeur et table aliasée.** `0x46496B–0x464980` fait `MOV EAX,ECX; AND AL,FE; ADD EAX,EDX`, puis multiplication par 275 et write de -1 ; `0x464968` avait mis `v*16` dans EDX. `asm-004.txt:24–25`, `asm-005.txt:1–14`, bytes `:9–10`. L'adresse constante est exactement la base de marqueur de banque 1 déjà écrite par P3 ; l'hypothèse de queue distincte n'est pas soutenue.

**P6 — Retour reliquat et préservation ABI.** `0x464992–0x464996` ne fait que quatre POP puis RET, sans affecter EAX ; ses dernières définitions sont `0x46489F`, `0x46495C` ou `0x46497D` selon chemin. `asm-002.txt:6–14`, `asm-004.txt:15–23`, `asm-005.txt:9–19`. Aucun SETcc ni assignment d'un résultat de succès.

**P7 — Justification métier indépendante par les callers.** Xrefs natifs `0x45BDBA` depuis `0x45BD30` et `0x45BE5D` depuis `0x45BDD0`, `metadata.json:181–191`. La compaction gelée `:15–16,20` fournit le contexte validé : copie de mots de pixels vers/dans le buffer CPU `0x1B47818`, puis notification des bornes inclusives de **destination**. Cette succession appuie « invalidation de caches pour rectangle », sans supposer que la cible effectue elle-même le blit. Les quatre autres xrefs figurent `metadata.json:162–179,193–198` ; rien n'est extrapolé de leurs seuls labels.

## Divergences de sources / limites et questions ouvertes

1. La seconde condition est fixée à **0x1CAD694** par P4. Toute reprise du gel doit corriger les lignes 9 et 29 de la compaction ; je ne modifie pas cet input.
2. `common-compaction.md:26` conserve un échange d'axes dans la prose historique. Le contrat mécanique /64 et /256 est CERTAIN ; l'emploi x/y suit les callers gelés, pas cette prose. Pourquoi ces tailles et trois banques ? Formats de pixels possibles, non prouvés ici.
3. La seconde passe n'est mécaniquement pas une queue indépendante (P5). Le rôle métier de l'alignement au pair — probablement couverture d'une représentation à granularité doublée — reste une hypothèse, non une preuve de format particulier.
4. Le helper `0x467550` reste opaque pour ce travail : le gel `:14,28` rapporte à la fois « rôle inconnu » et une description historique d'overlap-clear. ASM du helper nécessaire pour établir ses effets exhaustifs, son ABI réel et l'état de DF à son retour.
5. Sémantique du dword à `0x1CAD694+0x470*q` : présence/validité d'une ressource probable, mais ni type pointeur ni propriété d'allocation prouvés. Le dword global `0x1CCFD90` est seulement une condition non-zéro démontrée.
6. Domaine d'appel valide et tailles effectives des tables inconnus. Les coordonnées négatives et extrêmes ne sont pas rejetées. Sans domaine borné, ne garantir ni sûreté des adresses ni indépendance des régions aliasées.
7. Retour EAX sans utilité apparente ; confirmation de tous les usages de retour demanderait l'ASM des six callers. Aucun besoin de ce complément pour décrire les effets directs couverts ; aucune promotion finale effectuée.
