# 0x56C090 — sémantique A indépendante

## Autorité et couverture

Gel natif SHA-256 `e68f56607e807248d56cc62139e98f0783ff8f47fb67210c5983f809fc4ed1ad`; compaction `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34` (manifest). Lecture complète de `asm-001..005.txt` (25+25+25+25+16 = 116 instructions), `bytes-001.txt` (13 lignes, chunk [0x56C090,0x56C21C), 396 octets), et `metadata.json` (1–1747). Trois blocs couverts : préparation [C090,C12F), boucle [C12F,C1EC), copie/retour [C1EC,C21C). Les commentaires et le nom exporté ne servent pas de preuves. Aucune lecture d'auteur, review ou classification, aucun test/compilation exécuté.

Les références ci-dessous sont relatives à `inputs/ff8-decomp-semantics-20261011-r01/g02/0x56C090.readable/`.

## Rôle, confiance et nom

**Nom proposé : `Mat3S16_MultiplyScaledX87_Copy20`.** Confiance **CERTAIN** pour le mécanisme trois vecteurs / neuf produits scalaires / copie 20 octets / retour pointeur ; **LIKELY** pour l'interprétation composition matricielle Q12. Le suffixe Q12 pourrait être utilisé après confirmation native de la valeur de B695F8, donnée comme 1/4096 dans la compaction mais non exportée comme données dans ces slices.

Deux preuves indépendantes du nom : (1) neuf coefficients signés de 16 bits, offsets 0,2,4,6,8,A,C,E,10, et trois produits scalaires par vecteur (C09D–C12B et C16B–C1D3) ; (2) trois itérations à stride 6 suivies de cinq stores DWORD à destination (C11E/C15D/C1E6 et C1F8–C215). Ni nom ancien ni commentaire ne sont nécessaires à cette déduction.

Interprétation métier **LIKELY** : primitive de composition de matrices 3×3 à coefficients fixes. Aucun domaine particulier (battle, caméra, GTE matériel, transformation affine avec translation) n'est établi par ces seuls operands/xrefs. Hypothèse géométrique : matrices rangées par lignes et vecteurs-lignes multipliés à droite ; cette convention décrit les indices, pas une preuve de convention graphique du moteur.

## Contrat mécanique

- ABI x86 32 bits compatible **cdecl**, trois arguments mémoire : arg0 à EBP+8 = A, arg4 à EBP+C = B, arg8 à EBP+10 = D. RET sans immédiat ; EBP/ESI restaurés, EBX/EDI non modifiés. Pas de call, donc aucun ordre de poussée interne à reconstruire ; un appel cdecl correspondant pousse D, B, A, mais aucun caller ASM n'est fourni ici pour confirmer sa déclaration source.
- A et B : chacun 18 octets lus comme neuf `s16` sign-étendus avant FILD dword signé. B entièrement chargé avant la boucle ; A lu par triplets aux offsets 6i,6i+2,6i+4 pour i=0,1,2. Aucun contrôle de validité/alignment/null.
- Pour chaque triplet, chacun de ses trois éléments est multiplié en x87 par le float mémoire B695F8. Pour j=0,1,2, on forme dans cet ordre `(B[2j]*scaled(A[6i]) + B[6+2j]*scaled(A[6i+2])) + B[12+2j]*scaled(A[6i+4])`, les indices entre crochets étant **offsets en octets**. La terminologie matricielle correspond donc à A×B en stockage row-major.
- Chaque somme est additionnée au double mémoire B693D8, stockée en binary64 dans le scratch, puis **les 16 bits bas de cette représentation** sont copiés en WORD local. Ce n'est ni FISTP, ni conversion C par cast, ni saturation, ni SAR 12. Sous les constantes nominales de la compaction, c'est l'idiome magic-double de quantification d'un produit fixe ; la politique d'arrondi exacte dépend de l'environnement x87.
- Les neuf WORDs remplissent un tampon local de 18 octets. C1EC–C215 copient ensuite **20 octets**, cinq DWORDs, aux offsets destination 0,4,8,C,10. Les octets destination +12h/+13h proviennent de deux octets locaux **non initialisés par la fonction** ; ne pas les mettre à zéro, les préserver depuis D ou les attribuer à B. La fonction n'écrit pas de translation.
- Tous les inputs sont lus avant le premier store dans D : alias ordinaire D=A, D=B ou A=B compatible avec ce staging. Pas de promesse `restrict`. Cette observation suppose des buffers ordinaires, pas un chevauchement artificiel avec la pile privée/arguments de la fonction.
- Retour : **EAX entier = D**, chargé à C1EC et jamais modifié après. AX/AL sont uniquement les sous-registres de cette adresse finale, pas un coefficient/booléen ni un retour flottant. SI est un transfert WORD temporaire, sans sign-extension de résultat. ECX/EDX sont clobbered.
- Effets : D[0..19], pile temporaire, état/status x87 et flags CPU. Aucun global écrit ; deux constantes globales lues. L'unique branche JNZ dépend du DEC EDX initialisé à 3 ; test égalité zéro, ni comparaison signed ni unsigned de données. Additions de pointeurs x86 en 32 bits ; aucun wrap entier de multiplication à substituer aux calculs x87.

## x87 : fidélité et limites

Neuf chargements de B utilisent FILD ; six coefficients sont spillés en float32 (D9 / FSTP m32), trois restent dans la pile x87. Tous les s16 sont exactement représentables dans ces floats. À chaque tour, trois valeurs A mises à l'échelle sont poussées ; les sommes sont calculées séquentiellement par FMUL/FADDP, sans FMA, puis FADD m64 et FSTP m64 (DD). Trois FSTP ST éliminent les valeurs A après les résultats ; trois autres éliminent les coefficients persistants en épilogue. Pic de huit entrées x87 propres à la routine : elle suppose une pile x87 suffisamment libre, normalement vide à l'entrée ; elle ne fait ni FINIT ni sauvegarde/restauration du control word. En exécution normale avec pile initialement vide, elle la laisse vide, sans retour ST0.

Precision control, rounding control, masques d'exceptions et flags de statut ne sont pas fixés ici. Les exceptions/status, les résultats de l'ajout magic-double et un éventuel trap doivent rester liés à cet environnement. Pas de garantie universelle « truncation », « nearest-even » ou équivalence exacte avec un shift entier. Les constantes sont attestées comme références mémoire par les opcodes ; leurs valeurs nominales reposent sur la compaction, pas sur une exportation native de leur contenu dans ce packet.

## Preuves ASM/xref (8)

1. **Types/coefficient layout** : `asm-001.txt:5–25`, `asm-002.txt:1–18`, C099–C12B : arg4, MOVSX WORD aux neuf offsets, FILD, spills float32. Preuve de matrice signée, pas d'un tableau de DWORD.
2. **Triplets et compte fixe** : `asm-002.txt:6,11,14–25`, `asm-003.txt:1–8`, `asm-004.txt:23` : arg0+4, EDX=3, [ECX-4/-2/0], incréments 6, DEC/JNZ. Exactement trois triplets.
3. **Produit scalaire colonne 0** : `asm-003.txt:9–18`, C16B–C181 : FLD ST(3/5/6), FMUL puis deux FADDP ; colonne B offsets 0/6/C, ajout m64 et store double. Preuve arithmétique indépendante du nom exporté.
4. **Colonnes 1/2 et quantification WORD** : `asm-003.txt:19–25`, `asm-004.txt:1–22` : coefficients spillés, sommes identiques, MOV SI du scratch, stores WORD [EAX-A/-8/-6]. Pas de clamp.
5. **Tampon et padding non écrit** : `asm-002.txt:14,21`, `asm-003.txt:24`, `asm-004.txt:11,20,24–25`, `asm-005.txt:1–13` : scratch résultat commence à ESP+28h après le push ESI ; WORDs couvrent +28h..+39h, copies DWORD couvrent +28h..+3Bh. +3Ah/+3Bh n'ont aucun store antérieur.
6. **Retour/ABI** : `asm-001.txt:1–6`, `asm-004.txt:24`, `asm-005.txt:2–16` : frame EBP, alignement ESP à 8, restauration ESI/EBP, EAX=arg8, RET simple ; pas de retour AL/AX indépendant.
7. **Bytes corroborant les largeurs** : `bytes-001.txt:3–13` : D9 stores/loads m32, DD5C2408 stores m64 ; `668970f6/f8/fa` = WORD stores, puis `8910`, `894804`, `895008`, `89480c`, `895010` = cinq DWORD stores. Les cinq slices ASM et le chunk concordent sur ces points.
8. **Usage multiple sans preuve métier** : `metadata.json:33–69,250–321` : xrefs depuis 50344D, 508EC5, 56C233/283/304/374 et paires depuis 701310/430/4B0/530/5B0/630. `metadata.json:1745–1746` confirme aucun code_target et 116 instructions. Les xrefs ne montrent pas les arguments ni l'usage du retour.

## Questions ouvertes / divergences de sources

1. Confirmer par gel des données les bytes des constantes B695F8 et B693D8 et le control word x87 utilisé aux callers. Les commentaires sémantiques ne remplacent pas cette preuve.
2. Le padding de deux octets est-il ignoré par tous les consommateurs ? Le mécanisme de copie est CERTAIN ; l'absence d'impact métier est UNCERTAIN.
3. Les callers emploient-ils une structure de 20 octets explicitement paddée, et exploitent-ils EAX ? Les xrefs seuls ne suffisent pas.
4. Convention row/column et signification géométrique à confirmer au niveau callers, sans changer l'ordre natif du produit.

Pas de conflit mécanique observé entre compaction et slices : stride 6, matrice 18 octets, copie 20 avec padding indéterminé et EAX destination concordent. La seule limite de preuve externe est la valeur des constantes/environnement, non une divergence démontrée. Aucun §5.6/promotion ; hash de sortie laissé au parent.
