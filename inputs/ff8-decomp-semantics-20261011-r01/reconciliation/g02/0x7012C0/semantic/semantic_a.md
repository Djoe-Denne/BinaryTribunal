# 0x7012C0 — sémantique A indépendante

## Autorité et couverture

Entrée : `inputs/ff8-decomp-semantics-20261011-r01/g02/`. Gel original SHA-256 `1266b0df632a32ee19635b92615cab7a74f81d7e9bd28c0c70afcb3fd08f3ba8`; compaction `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34` (manifest:3–6). Lecture intégrale de common-compaction.md:1–24, manifest.json:1–30, asm-001.txt:1–25, asm-002.txt:1–4, bytes-001.txt:1–3 et metadata.json:1–205. Couverture : 29/29 instructions, un chunk de 76 octets `[0x7012C0,0x70130C)`, un bloc CFG, tous les xrefs/métadonnées fournis. Aucun C/verdict/review consulté. Les commentaires et noms historiques ne constituent pas des preuves.

## Rôle et nom

**Nom proposé : `Mat3S16_MakeRotZ_Q12_PosSin01` — LIKELY.** Construction d'une matrice de rotation autour de Z, avec sinus positif en élément (0,1), négatif en (1,0), sous la convention d'indexation ligne-major. Le motif des stores et l'unité 0x1000 établissent indépendamment la forme et l'échelle fixe; l'identification trigonométrique des deux résultats repose sur le contexte commun autorisé, non sur leurs seuls labels. Le sens physique de rotation dépend de l'emploi lignes/colonnes par les consommateurs et n'est pas établi ici.

**CERTAIN (mécanique)** : initialise 20 octets, appelle deux helpers avec le même entier signé issu d'un WORD, puis remplit cinq WORDs. Aucun branchement, boucle, saturation ou contrôle de pointeur.

## Contrat / effets

- ABI compatible cdecl : premier slot pile = angle (seuls ses 16 bits bas sont lus et sign-étendus); deuxième slot = pointeur destination 32 bits. `movsx edi,[esp+0Ch+arg_0]` est bien un chargement WORD (`0F BF` dans les bytes), pas une lecture signée de DWORD. Valeur transmise aux helpers : -32768..32767.
- L'angle est capturé avant les stores; la destination est capturée avant les appels. Aucun test de validité/alignement. Région accessible en écriture de **20 octets** requise pour une exécution ordinaire, pas seulement 18 octets.
- Ordre exact : cinq stores DWORD nuls aux offsets 0,4,8,12,16; appel 0x56D130 avec angle poussé; angle poussé de nouveau, premier EAX conservé dans EBX; appel 0x56D100; nettoyage de 8 octets d'arguments; NEG 32 bits du premier résultat copié en EDX; stores WORD aux offsets **0,6,2,8,16**, dans cet ordre. Ne pas remplacer par une initialisation de 18 octets ou retarder les zéros après les appels.
- Si S = EAX du premier helper et C = EAX du second, résultat en neuf WORDs contigus (stride élément 2, ligne 6) : `[low16(C), low16(S), 0; low16(-S), low16(C), 0; 0, 0, 0x1000]`. NEG est modulo 2^32 et le store DX conserve ses 16 bits bas. Les octets +18/+19 restent nuls : aucune translation n'est construite.
- **Retour machine : EAX entier 32 bits inchangé depuis le second helper**, non un pointeur destination, non un booléen AL, non un retour AX uniquement. AX est utilisé pour deux stores, sans modifier EAX. Un retour API intentionnel de cosine n'est pas démontré sans consommation par les callers.
- EBX/ESI/EDI sont sauvegardés/restaurés, ESP rétabli; ECX/EDX et flags sont volatils. Aucune lecture/écriture globale directe par cette fonction; effets indirects des helpers non bornés par leur ASM dans cette projection.
- Aucune instruction x87 locale, aucun changement local du control word. La compaction décrit des helpers sinus/cosinus Q12 (angle 4096 unités/tour), mais leur précision, arrondi, exceptions, état x87 et éventuelles dépendances globales ne sont pas prouvés par ce corps. Ne pas substituer une fonction mathématique de bibliothèque réputée équivalente.

## Preuves (sources relatives à l'entrée g02)

1. `0x7012C0.readable/asm-001.txt:3,7` / EA 7012C2,7012CB : pointeur deuxième argument et angle WORD signé. `bytes-001.txt:1` confirme `0FBF7C2410`.
2. `asm-001.txt:4–13` / EA 7012C6–7012DC : EAX=0, cinq stores espacés de 4, empreinte **20 octets**; angle lu avant initialisation.
3. `asm-001.txt:9,14–19` / EA 7012D2–7012EE, et `metadata.json:200–203` : deux appels directs distincts, même angle, résultats conservés séparément, cleanup de deux slots. La résolution des rel32 dans `bytes-001.txt:1–2` correspond respectivement à 56D130 puis 56D100.
4. `asm-001.txt:18,20–25` / EA 7012EC–701302 : motif de coefficients `[C,S,0;-S,C,0;0,0,0x1000]`. **Preuve de nom indépendante A** : bloc 2×2 antisymétrique hors-diagonale et axe restant invariant.
5. `asm-001.txt:25` / EA 701302 : constante d'unité 4096; combinée aux appels trigonométriques documentés dans `common-compaction.md:11,13`, **preuve de nom indépendante B** : construction à partir du même angle avec échelle Q12. Les labels seuls sont exclus de cette justification.
6. `asm-001.txt:17–25` et `asm-002.txt:1–4` : après second appel, aucune instruction ne réécrit EAX, seulement lectures AX; epilogue restaure trois registres et RET sans immédiat. Retour machine = second EAX complet.
7. `metadata.json:164–198` : six sites d'appel distincts dans 701310/430/4B0/530/5B0/630; prouve réutilisation comme helper, pas un domaine métier précis. CFG `metadata.json:11–17` confirme un seul bloc sans branche.

## Incertitudes / limites

- **UNCERTAIN** : convention vectorielle et sens de rotation réel, type déclaré complet du buffer (padding ou autre structure), exploitation intentionnelle du retour EAX.
- **UNCERTAIN** : comportement exact des helpers sous environnement x87 non standard; leurs ASM/constantes ne sont pas dans les slices cibles. Demander au lead un gel des callees et des usages du retour si nécessaire à une promotion CERTAIN du contrat trigonométrique/ABI déclarée.
- Aucun conflit mécanique constaté entre compaction, bytes, ASM et metadata. La qualification « cosine/Q12 » reste contextuelle; la formule en résultats S/C et les stores sont certains.
- Aucun test, compilation, exécution, hash de sortie ou validation §5.6 effectué. Aucune promotion.
