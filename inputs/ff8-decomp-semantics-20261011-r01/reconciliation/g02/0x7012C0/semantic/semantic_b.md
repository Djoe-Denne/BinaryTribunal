# 0x7012C0 — analyse sémantique B indépendante

## Périmètre et couverture

Gel : `inputs/ff8-decomp-semantics-20261011-r01/g02/`; paquet natif SHA-256 `1266b0df632a32ee19635b92615cab7a74f81d7e9bd28c0c70afcb3fd08f3ba8`, compaction `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34` (manifest:1–30). Lecture intégrale des 25+4 lignes ASM, des trois lignes d'octets (76 octets, unique chunk `[0x7012C0,0x70130C)`), des 205 lignes metadata et des 24 lignes de compaction. Un bloc, 29 instructions, aucune branche. Aucun C/auteur/review/classification consulté ; aucune compilation ou exécution revendiquée.

## Faits mécaniques — CERTAIN

- Deux arguments sur pile : premier argument lu comme WORD signé puis étendu à 32 bits dans EDI ; second argument pointeur chargé dans ESI. Prologue sauve EBX, ESI, EDI ; épilogue les restaure. `retn` sans immédiat : nettoyage des arguments externes par l'appelant, compatible cdecl.
- Avant le premier appel, cinq DWORD nuls sont écrits à destination+0,+4,+8,+12,+16, dans cet ordre. L'argument signé est capturé avant ces écritures ; le pointeur aussi. Exige donc une zone inscriptible de **20 octets**, pas seulement 18. Aucun test de nullité, bornage ou allocation.
- Appels directs à 0x56D130 puis 0x56D100, chacun avec le même entier signé poussé sur pile. Le résultat EAX du premier est conservé dans EBX ; le résultat EAX du second reste dans EAX. `add esp,8` retire les deux arguments poussés ; il n'inverse pas l'ordre des appels.
- Soient S et C les résultats 32 bits respectifs de ces appels. EDX reçoit S puis `neg edx` calcule sa négation modulo 2^32. Écritures WORD, dans l'ordre : +0 = low16(C), +6 = low16(-S), +2 = low16(S), +8 = low16(C), +16 = 0x1000. Aucun clamp. Les autres octets de la zone restent nuls sous réserve d'effets indirects des callees non documentés.
- Au retour EAX est **le résultat 32 bits complet du second callee** : seules des lectures AX sont faites, pas une écriture AX/AL ni une extension de AX. AX et AL correspondent donc à ses parties basses. Ce n'est pas le pointeur destination. Que les appelants exploitent ce retour n'est pas établi par les xrefs seuls.
- Pas d'accès global direct ni d'instruction x87 dans cette fonction. Effets indirects, flags et environnement flottant des deux callees non entièrement établis par ce gel.

## Interprétation mathématique — LIKELY

Nom proposé : **`Mat3S16_MakeRotZ_Q12`**. Rôle : construire un bloc de coefficients de rotation dans le plan XY, avec axe Z conservé et unité 4096. En convention de stockage ligne-major, mots de 2 octets et lignes de 6 octets, le bloc de neuf WORDs est :

| | colonne 0 | colonne 1 | colonne 2 |
|---|---|---|---|
| ligne 0 | C | S | 0 |
| ligne 1 | -S | C | 0 |
| ligne 2 | 0 | 0 | 4096 |

S/C désignent ici les parties basses stockées. L'interprétation sinus/cosinus et les unités angulaires sont corroborées par la compaction:10–11, mais les noms/commentaires IDA ne constituent pas une preuve. Deux appuis indépendants au nom : (1) motif natif des cinq coefficients, dont +16=4096 et couple antisymétrique +2/+6, établissant la forme plane et l'unité Q12 ; (2) les deux cibles d'appel natives, reliées par la compaction factuelle aux helpers trigonométriques communs. Confiance LIKELY plutôt que CERTAIN pour le nom complet, car leurs corps ne sont pas dans la projection cible.

Ne pas affirmer rotation positive/négative universelle : vecteurs lignes/colonnes et repère peuvent inverser cette lecture. Le signe natif est précisément +S à +2 et -S à +6. Pas de métier battle/caméra spécifique prouvé.

## Preuves ASM/xrefs (7)

Préfixe de provenance : `inputs/ff8-decomp-semantics-20261011-r01/g02/0x7012C0.readable/`.

1. `asm-001.txt:1–7`, 0x7012C0–CB : saves, second argument pointeur, `movsx edi` WORD du premier argument ; octets `0f bf 7c 24 10` dans `bytes-001.txt:1` confirment la largeur signée.
2. `asm-001.txt:8–13`, 0x7012D0–DC : cinq stores DWORD après `xor eax,eax`, offsets 0/4/8/12/16 ; étendue 20 octets et padding final de deux octets.
3. `asm-001.txt:14–17`, 0x7012DF/E7 ; `bytes-001.txt:1–2` : appels relatifs vers 0x56D130 puis 0x56D100, conservation du premier résultat dans EBX ; `metadata.json:200–203` confirme l'ensemble des cibles (son ordre n'est pas l'ordre d'exécution).
4. `asm-001.txt:18–20`, 0x7012EC–F1 : `mov edx,ebx`, nettoyage de huit octets, `neg edx` 32 bits ; négation wrap avant réduction WORD.
5. `asm-001.txt:21–25`, 0x7012F3–0x701302 : stores AX/DX/BX et unité 0x1000 ; forme antisymétrique et axe inchangé prouvés sans utiliser le commentaire de nom.
6. `asm-002.txt:1–4`, 0x701308–0B : trois restaurations puis retour ; EAX non réassigné après le second appel, pas de retour pointeur implicite.
7. `metadata.json:163–198` : xrefs de 0x701310/430/4B0/530/5B0/630, cohérents avec une famille de compositions selon compaction:13. Les xrefs attestent l'appel, pas les arguments ni l'usage du retour.

## Limites et questions ouvertes

- Fournir les corps gelés 0x56D130 et 0x56D100 pour confirmer leurs résultats complets, la périodicité angulaire annoncée 4096 et l'arrondi x87 exact. Ne pas remplacer par `sin`, `cos` ou un shift supposé équivalent : contrôle x87, précision intermédiaire, conversion magic-double et exceptions ne sont pas vérifiés ici.
- Quel type nominal englobe les 20 octets ? Neuf WORDs plus padding est compatible, mais taille structurelle globale/translation absente. Aucune boucle ni stride de tableau ; seuls strides de coefficients 2 et de lignes 6 relèvent de la lecture matricielle.
- Les call sites consomment-ils EAX, AX, AL ou aucun retour ? La valeur mécanique EAX est certaine, le contrat source intentionnel reste UNCERTAIN.
- Effets indirects et alias avec l'état des helpers non établis. Les écritures de destination sont bien antérieures aux appels ; ne pas réordonner en calculant tout avant la remise à zéro.
- Aucune divergence mécanique constatée entre ASM, octets et metadata. Les commentaires/compaction apportent des interprétations trigonométriques secondaires, non une validation native des callees. Pas de promotion ni validation §5.6 effectuée.
