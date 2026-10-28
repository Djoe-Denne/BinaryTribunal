# 0x701220 — sémantique B indépendante

## Entrée et couverture

Projection autorisée uniquement : `inputs/ff8-decomp-semantics-20261011-r01/g02/`. Manifest lu intégralement ; `asm-001.txt` lignes 1–25 et `asm-002.txt` lignes 1–4 couvrent les 29 instructions du seul bloc [0x701220,0x70126C). Les trois lignes de `bytes-001.txt` couvrent les 76 octets du chunk. `metadata.json` lignes 1–259 et `common-compaction.md` lignes 1–24 lus intégralement. Aucun auteur, C, score, review ou verdict consulté. Autorité : paquet natif dont le hash déclaré est `5a2d2dd11b9e5f5d5e3ec79fd236f5bbc03a85ec1d9b7065538ef166905b9141` ; compaction déclarée `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`. Hashes déclarés, non recalculés ici.

## Contrat mécanique — CERTAIN

Deux arguments de pile, convention compatible cdecl : premier argument lu comme un WORD signé puis étendu à 32 bits ; second argument pointeur de sortie. Le pointeur est capturé avant le WORD d'entrée, et les deux sont capturés avant toute écriture : un éventuel alias avec la pile d'entrée ne justifie pas une relecture ultérieure de l'angle.

Dans l'ordre natif : capture des arguments ; cinq stores DWORD zéro à sortie+0,+4,+8,+12,+16 ; appel 0x56D130 avec l'angle signé poussé en DWORD ; conservation de son EAX dans EBX ; appel 0x56D100 avec le même angle ; récupération des huit octets d'arguments des deux appels ; négation 32 bits modulo 2^32 du premier résultat ; stores WORD à +0 (0x1000), +8 (AX du second résultat), +14 (DX de la négation), +10 (BX du premier résultat), +16 (AX du second résultat). Ne pas réordonner ces stores.

Étendue directement écrite : 20 octets, non 18. Les octets +18/+19 restent zéro après le store DWORD à +16. Avec neuf WORDs contigus indexés par lignes de trois (stride de ligne 6 octets), le contenu final est :

| | colonne 0 | colonne 1 | colonne 2 |
|---|---|---|---|
| ligne 0 | 4096 | 0 | 0 |
| ligne 1 | 0 | low16(second résultat) | low16(premier résultat) |
| ligne 2 | 0 | low16(-premier résultat) | low16(second résultat) |

Pas de branche, de boucle, de shift ou de saturation dans cette cible. La négation est 32 bits ; seule sa moitié basse est stockée. Pas de comparaison signée/non signée à résoudre. EBX/ESI/EDI sont sauvegardés/restaurés ; la fonction retourne par `retn` sans dépilage des arguments propres. EAX reste le résultat **32 bits complet** du second appel : les écritures depuis AX ne modifient pas EAX. Ce n'est ni un pointeur de sortie, ni un retour limité à AL/AX. Le fait que les callers exploitent ce résultat n'est pas établi.

## Interprétation et nom — LIKELY

Nom proposé : `Mat3S16_MakeRotX_Q12`. Rôle probable : construire le bloc matriciel d'une rotation autour de X, en coefficients Q12, à partir d'un angle signé 16 bits. Ce nom n'est pas accepté parce qu'il existe déjà : deux supports distincts sont (1) le motif de stores laissant l'axe X invariant et plaçant un couple opposé dans le plan YZ, et (2) les deux appels numériques, dont la compaction gelée documente respectivement sinus et cosinus Q12. L'unité 4096 est indépendamment visible dans l'immédiat 0x1000. Si les deux callees sont confirmés comme tels, la matrice est [[4096,0,0],[0,c,s],[0,-s,c]].

La convention de multiplication vecteur/ligne ou vecteur/colonne n'est pas établie : ne pas attribuer une orientation géométrique positive absolue, ni transposer pour suivre une bibliothèque. L'usage métier précis (animation, caméra, effet particulier) reste UNCERTAIN. Les xrefs prouvent la réutilisation, pas cet usage.

## Six preuves ASM/xrefs

Chemins ci-dessous relatifs à `inputs/ff8-decomp-semantics-20261011-r01/g02/0x701220.readable/`.

1. `asm-001.txt:3,7`, 0x701222/0x70122B : capture du second argument et `movsx` du WORD du premier. `bytes-001.txt:1` contient `0FBF7C2410`, confirmant la source WORD signée et non un angle DWORD intégral.
2. `asm-001.txt:8–13`, 0x701230–0x70123C : cinq stores depuis EAX préalablement mis à zéro ; stride DWORD 4 et étendue totale 20 octets. Preuve indépendante de la taille réellement écrite.
3. `asm-001.txt:9,14–19`, 0x701232/0x70123F/0x701244/0x701247/0x70124E : deux arguments DWORD identiques, un par callee, premier EAX conservé dans EBX, nettoyage de 8 octets. Les rel32 des bytes correspondent à 0x56D130 puis 0x56D100 ; `metadata.json:254–257` confirme cet ensemble de cibles. Les noms et commentaires trigonométriques restent secondaires (`../common-compaction.md:10`).
4. `asm-001.txt:18–24`, 0x70124C–0x701260 : `neg edx`, stores DX à +14 et BX à +10. Preuve du couple opposé sans saturation ni inversion supplémentaire.
5. `asm-001.txt:21–25`, 0x701253–0x701264 : 0x1000 à +0 et AX identique à +8/+16. Avec les zéros, ce motif laisse la première coordonnée indépendante et forme le bloc YZ ; preuve de nom distincte des callees et du label.
6. `asm-002.txt:1–4`, 0x701268–0x70126B, et `metadata.json:217–252` : restauration des trois registres non volatils et retour simple, EAX intact depuis le second appel ; six callers 0x701310/430/4B0/530/5B0/630, sans ASM caller permettant de décider si le retour est consommé.

## Effets et limites ouvertes

- Effets directs certains : modifications du tampon de 20 octets et de la pile locale/transitoire ; pas d'accès global explicite dans cette cible. Aucun contrôle de pointeur, de taille ou d'alignement ; ne pas en inventer.
- Effets des callees et x87 : aucune instruction x87 directement ici. La compaction et les commentaires décrivent `fild`, facteur pi/2048, `fsin`/`fcos`, multiplication par 4096 et conversion magic-double. Leurs ASM complets, constantes brutes et gestion du contrôle/statut x87 ne sont pas fournis dans cette projection. Arrondi exact, précision intermédiaire, exceptions, changement éventuel d'environnement et effets globaux des callees restent non vérifiés. Ne pas substituer des appels de bibliothèque ou promettre une indépendance au mode d'arrondi.
- Angle périodique de 4096 unités : interprétation documentée, non démontrée par les instructions locales seules. Pas de masque de phase local.
- Structure nominale et padding +18/+19 : 20 octets nécessaires mécaniquement, mais type propriétaire complet et taille allouée des callers inconnus.
- ABI retour : EAX observable certain ; signature source intentionnelle et exploitation caller incertaines. Le WORD signé d'entrée n'impose pas que tous les bits du slot d'argument soient significatifs.
- Aucune divergence mécanique constatée entre slices et compaction. Le niveau de confiance du nom est volontairement limité par l'absence d'ASM callee ; les commentaires ne valent pas preuve native indépendante.

Aucun test, compilation, exécution ou validation §5.6 effectué ; aucune promotion.
