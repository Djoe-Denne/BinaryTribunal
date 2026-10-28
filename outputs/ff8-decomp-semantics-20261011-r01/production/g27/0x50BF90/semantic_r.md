# 0x50BF90 — contrat sémantique réconcilié R

## Périmètre, provenance et couverture

Mission `ff8-decomp-semantics-20261011-r01`, g27, volet **semantic** exclusivement. Aucune lecture du volet C, d'un historique cible, d'un index ou d'une session voisine ; aucune redécouverte. Les commentaires et noms IDA du gel ne constituent pas des preuves métier.

Projection consommée : `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g27/semantic/`. Le parent a levé le blocage initial en fournissant `manifest.json`, SHA256 annoncé `41f53277c54589adb12c2613c59bf9f47adefffa08049ec3c2b27a6879c04b61`, et quatre extraits ASM verbatim bornés. Le manifest atteste deux sessions disjointes A=`ses_ed3fb70f5ffeSQr1yrXUrHqSKU`, B=`ses_ed3fb6ea7ffeJJy2Sc7uxpDVdE`, checkpoint exclusif `msg_12be31170001b3JqulokpGSCsD`.

Hashes d'entrée consignés par le parent :

| Fichier | SHA256 |
|---|---|
| semantic_a.md | `5c272fb5c18e05db2ad71d284b6511de1fc3e043b46af615afedb34b0dfab096` |
| semantic_b.md | `cfd11fa689bec41135d3b9f675af96e5fbc5b525eebec364248c88afa6631ad1` |
| common-compaction.md | `7b885f8d258f5c0e8121e281427974d5c0c9b0ab73ff5a496b6d49a35b603c7f` |
| 0x50BF90.json | `523b578c584278d960cfc11a0b6a7040ae1ab80b26d0b8d26454e1190e26f678` |
| asm-01.txt | `3dce9d48c8ce6a2a583143026da748ffdb6864ee79e37461acde735202b47705` |
| asm-02.txt | `d2176b52122ac2151eeba51f52deaaafc50be6d014b134015f97fa5b998f2b9c` |
| asm-03.txt | `fb478606dfb661af88d4cef614daa19ce6ef3c596d56f700726689caa64fe397` |
| asm-04.txt | `5a8d52c6b719abe8d7f1ee80a3d2ba61db2ecad6be1888c73083e2fd2cd70340` |

Ces hashes sont des receipts du parent, non un recalcul indépendant par R : aucune primitive de lecture binaire/hash n'est exposée. Aucune incohérence documentaire détectée. Le gel contient un chunk `[0x50BF90,0x50C090)`, 256 octets, 81 instructions, 15 blocs CFG, un xref entrant `0x50A799` dans `0x50A790`, aucun appel/branche indirecte dans la cible. Les 81 instructions ont été relues intégralement dans asm-01..04 et confrontées aux octets JSON, notamment les préfixes WORD, accès BYTE, déplacements ESP et branches. Hash des octets natifs rapporté par la compaction : `87e46f3c9d4a4887e644b74372ba88c60db247c499b5e2f347a81e654aa14921`. SHA EXE : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

Couverture : entrée/sauvegardes, branche initiale, initialisation extérieure, groupe vide/non vide, boucle intérieure, branches catégorie et drapeau, restaurations/counter, sortie des boucles, tail vide/non vide, épilogue ; tous les blocs/chunk couverts.

## Verdict, rôle et nom final proposé

**Nom neutre proposé : `LatchDescriptorContextAndAggregateRecordMasks`. CERTAIN pour les opérations désignées, pas pour un type métier.**

Deux preuves indépendantes du nom : (1) publication du pointeur, de champs et d'une adresse de table calculée à `50BF9B..50BFE7` ; (2) parcours de listes avec agrégation WORD à `50C008..50C066`. Le nom ne découle pas de l'ancien label.

**Rôle :** préparer un état partagé à adresses fixes depuis un descripteur : latch de valeurs/pointeurs, sélection d'une entrée de table, parcours de groupes/listes comptées, réduction en masques et drapeau, puis publication de résumés du premier groupe. Aucune allocation, exécution d'événement, application de dégâts, I/O ou dispatch effectué ici.

**LIKELY seulement :** contexte partagé de séquence/presentation battle. La compaction rattache le tableau numérique à des acteurs de présentation et fournit une chaîne d'appels bornée ; les corps voisins/readers/writers ne sont pas fournis intégralement. Un préfixe `BattleSequenceContext_` peut être proposé au lead comme qualification LIKELY, pas imposé dans le nom certain. **UNCERTAIN :** catégories métier, identité cible/acteur de chaque byte, GF-only, types exacts, capacités, contrat de résultat API.

## Matrice de réconciliation — aucune décision par vote

| Point | A / B | Décision R et preuve |
|---|---|---|
| Nom | A : `BattleSequence_LatchDescriptorAndCollectRecordMasks` ; B : `BattleSequenceContext_LatchPayloadAndAggregateRecordMasks` | Divergence lexicale résolue vers le nom neutre ci-dessus. « Descriptor » décrit l'argument observé ; « Context » les publications ; « Aggregate » les OR répétés. Préfixe battle LIKELY, « payload » n'est pas un type natif prouvé. |
| ABI | Accord : argument DWORD, nettoyage appelant, retour métier inconnu | Confirmé par accès `[S+4]`, `C3` final et fenêtre caller gelée push/call/add esp,4 ; cdecl compatible, pas thiscall/stdcall. |
| Strides et shifts | Accord : table 0x9C, groupes 0x14, records 0x18 ; shift DWORD puis OR WORD | Confirmé par LEA/SHL/SUB et `66 0B E8`, `66 09 05`. Ni stride 0xD0 ni masque DWORD ni index borné. |
| Largeurs/persistance | Accord : globals BYTE/WORD ; 0x1D99A84 et 0x1D99A48 non systématiquement écrits | Confirmé aux stores et branches ; aucune remise à zéro ajoutée. |
| CL / scratch | Accord : sauvegarde BYTE, restauration DWORD, identité ordinaire seulement | Confirmé `88 4C 24 0C` avant pushes et `8B 4C 24 14` après pushes, même `[S-4]`. Les trois autres octets sont non initialisés **par cette fonction**, pas une justification pour introduire de l'UB C. Aliases peuvent modifier CL final. |
| Retour EAX | A/B conditionnent la zéro-extension finale au chemin « ordinaire/non aliasing » ; B envisage des bits hauts hérités sous aliasing | **Correction commune : pour toute exécution native normale qui atteint RET avec code intact, EAX[31:8]=0.** Le bypass initial est impossible (unsigned byte + 1 = 1..256, EBP=0). À la seule sortie du parcours, `50C05E dec eax` suivi de `50C063 jnz` impose EAX=0 ; aucune instruction ultérieure ne modifie ses bits hauts. Aliaser le compteur peut changer durée/terminaison, pas cette postcondition d'une sortie atteinte. Aucun type API significatif n'en découle. |
| « Any-record », dernier record, identité initiale | Accord sur les résumés | Validés sous stockage ordinaire disjoint ; sous aliasing, parler de valeurs effectivement lues et de stores séquentiels, non d'une photographie immuable des listes initiales. |
| Métier/route 0/writers | Accord : ambiguïtés documentaires non promues | UNCERTAIN conservé ; rien dans la cible n'arbitre les producteurs voisins ou le sens de route 0. |

## Contrat opérationnel complet (reconstruction sémantique ordonnée)

Notation : `S` = ESP d'entrée ; `P` = DWORD lu à `[S+4]` ; `M8/M16/M32` = accès x86 little-endian de largeur exacte. Tous les calculs d'adresse et registres DWORD sont modulo 2^32. Chaque lecture/store reste à sa place ; aucune hypothèse `restrict`, aucun cache substitué à une relecture. Ce contrat n'est pas un C de production et ne remplace pas le volet C séparé.

1. Réserver 8 octets ; sauver EBP à `[S-12]`, ESI à `[S-16]` ; charger P dans ESI ; EBP=0.
2. `M32(0x1D99A50)=P`, puis `M16(0x1D99A5C)=0`.
3. Capturer `v8=M32(P+8)` ; charger CL=`M8(P)` ; publier `M32(0x1D99A60)=v8`. EAX=ECX puis AND 0xFF : index initial unsigned byte.
4. `M8(S-4)=CL` seulement ; `M16(0x1D99A90)=0` ; `M8(0x1D99A6D)=0`.
5. Calculer `(index*5*8-index)*4+0x1D972C0`, soit table base + **0x9C*index**. Capturer `vC=M32(P+0xC)` avant de publier l'adresse à `M32(0x1D99A40)`.
6. EAX=0 ; AL=`M8(P+0x11)` ; `M32(0x1D99A74)=vC` ; INC EAX. CMP signé à EBP=0 / JLE vers tail reste dans le CFG, mais n'est jamais pris avec ces définitions (1..256).
7. Sauver EBX puis EDI à `[S-20]` et `[S-24]`. EBX=P+0x10 ; écrire le compteur extérieur EAX à **M32(S+4)**, écrasant l'argument home sans modifier ESI.
8. Pour chaque groupe : EAX=0, AL=`M8(EBX)` ; TEST DWORD/JLE signé. Valeurs possibles 0..255 : zéro saute au point 11, toute autre valeur entre au point 9.
9. EDX=`M32(EBX-8)` ; EDI=nombre intérieur. À chaque record :
   - CL=`M8(EDX)` ; EAX=1 ; SHL EAX,CL avec compte hardware `CL & 31` ; `BP |= AX`. Les indices 16..31 ne contribuent aucun bit WORD ; 32..255 se replient modulo 32, sans validation.
   - AL=`M8(EDX+3)` ; si `(AL & 8)!=0` : ECX=1 ; SHR **AL** de 6 (0..3) ; `M32(S-8)=ECX` ; `M8(0x1D99A84)=AL` ; CL=AL ; EAX=`M32(S-8)` ; SHL DWORD EAX,CL ; OR **WORD** `M16(0x1D99A90)` avec AX. Ne pas supprimer le store/reload scratch : un alias peut modifier sa valeur entre les deux.
   - CL=`M8(EDX+2)` ; CL &= 0x30 ; si CL==0x30, OR **BYTE** `M8(0x1D99A6D)` avec 2. Test des deux bits simultanément, non chacun séparément.
   - EDX+=0x18 ; DEC EDI / JNZ reprend le record. Nombre intérieur fixé dans EDI, non relu à chaque record.
10. Après une liste non vide seulement : ECX=`M32(S-4)` ; les trois octets hauts n'ont pas été initialisés ici. Les groupes vides n'altèrent pas CL.
11. EAX=`M32(S+4)` ; EBX+=0x14 ; DEC EAX ; `M32(S+4)=EAX` ; JNZ reprend le groupe. Le compteur est **rechargé de mémoire**, pas une variable locale réputée inaltérable sous alias.
12. À sortie EAX=0 ; restaurer EDI ; `M16(0x1D99A5C)=BP` ; restaurer EBX. BP est le masque en registre des bytes effectivement lus, pas forcément de l'entrée initiale immuable.
13. Tail : AL=`M8(P+0x10)` ; TEST AL ; `M8(0x1D99A5A)=AL`. Si le byte testé est non nul : EDX=`M32(P+8)` **relecture après le store du count** ; AL=`M8(EDX)` ; `M8(0x1D99A48)=AL`. Si nul, ne pas écrire 0x1D99A48. Le test précède le store ; une éventuelle modification ultérieure de mémoire ne change pas cette décision.
14. Restaurer ESI ; `M8(0x1D99A56)=CL` ; restaurer EBP ; libérer 8 octets ; RET sans nettoyage de l'argument appelant. Pas de remise à zéro inconditionnelle de 0x1D99A84. Pas de contrôle de bornes/pointeurs, verrou, appel caché ou publication atomique.

Stockage ordinaire disjoint : EBX/EDI/ESI/EBP préservés, ESP restauré ; ECX/EDX/EAX et flags sont volatils. Si l'entrée/les globals aliasent les sauvegardes de pile, les POP lisent les octets alors présents : ne pas promettre les valeurs sauvegardées originales sous ce scénario.

## In/out et retour exact

- **Entrée ABI :** un pointeur DWORD passé sur pile, cdecl compatible. Aucune entrée de registre supplémentaire n'est requise pour les résultats bas observables sous stockage ordinaire ; les bytes hauts préexistants d'ECX/scratch ne sont pas une identité DWORD démontrée.
- **Entrées mémoire :** P+0 (BYTE), P+8/P+0xC (DWORD), P+0x11 (BYTE), groupes `count=P+0x10+0x14*i`, `list=P+8+0x14*i`, records aux offsets BYTE +0,+2,+3 ; relectures tail. Aucun extent/type complet prouvé.
- **Sorties fixes :** DWORD 0x1D99A50/60/40/74 ; WORD 0x1D99A5C/90 ; BYTE 0x1D99A6D/84/5A/48/56. Les effets et l'ordre exacts sont ceux du contrat ci-dessus. Des writes de pile et alias éventuels font partie des effets, même sans store explicite `[ESI+...]`.
- **CL final :** byte initial P+0 si le scratch reste inchangé ; sinon valeur basse effectivement restaurée après la dernière liste non vide. Tous groupes vides : CL initial demeure. Il n'y a pas de DWORD identité publié.
- **AL/AX/EAX à RET normal :** AL vaut le count tail lu s'il est zéro, sinon le byte lu au pointeur tail rechargé. AH et EAX[31:16] valent zéro ; AX et EAX sont donc la zéro-extension de ce byte. C'est une postcondition des registres, pas un verdict « succès », booléen ou prototype de résultat. Le caller fourni réécrit EAX immédiatement. Le count publié et le premier byte publié peuvent provenir de snapshots différents.
- **Terminaison/capacité :** sous stockage disjoint, 1..256 groupes, chacun 0..255 records ; ce sont plages de compte, pas allocations validées. Aliasing du compteur de pile peut changer la durée ou empêcher la terminaison. Les accès invalides peuvent fauter : le contrat de RET n'affirme pas que tout input retourne.

## Huit groupes de preuves ASM/octets/xrefs

1. **Latch :** `50BF95`, `50BF9B`, `50BFA8/AB/AD`, `50BFDA/DD`, `50BFE4/E7` établissent lecture/publis ordonnées. Les octets `89 35 50 9A D9 01` et `A3 60 9A D9 01` donnent les adresses numériques sans sémantique des labels.
2. **Table :** `50BFCB lea edx,[eax+eax*4]`, `50BFCE shl edx,3`, `50BFD1 sub edx,eax`, `50BFD3 lea eax,[0x1D972C0+edx*4]` prouvent 156=0x9C ; masque `50BFB4 and eax,0xFF` prouve unsigned byte index.
3. **CFG/parcours :** `50BFED/F0` INC/JLE signé, `50BFFB..50C006` compte byte unsigned/JLE signé, `50C04D add edx,0x18`, `50C05B add ebx,0x14`, `50C057/5F` rechargement/écriture `[S+4]`. Les 15 blocs du JSON correspondent aux branches lues.
4. **Masque primaire :** `50C008/00A/00F/011`, octets `D3 E0 66 0B E8`, puis `50C066` store WORD BP : shift 32 bits masqué31, réduction 16 bits.
5. **Catégorie :** `50C014/017/019` byte +3 / TEST 8 / JZ ; `50C020 C0 E8 06` SHR AL ; `50C023/027/02E/032/034` scratch DWORD, publication BYTE, shift DWORD et OR WORD. Initialisation `50BFBD` du masque seulement ; pas de reset 0x1D99A84.
6. **Drapeau :** `50C03B/03E/041/044/046` BYTE +2, AND/CMP 0x30, JNZ puis OR BYTE 2 ; `50BFC4` remet uniquement 0x1D99A6D à zéro.
7. **Partiels/tail :** `50BFB9 88 4C 24 0C` sauvegarde BYTE `[S-4]`, `50C053 8B 4C 24 14` recharge DWORD même local ; `50C06E/073/078/07A/07D/07F/085` prouve count relu, store inconditionnel count, store premier byte conditionnel, pointer relu et CL final.
8. **ABI et correction commune EAX :** `50C05E 48` DEC EAX, `50C063 75 96` JNZ impose EAX=0 à sortie ; uniquement loads AL ensuite ; `50C08C/08F 83 C4 08 C3` épilogue/plain RET. Xref natif JSON `0x50A799` ; compaction §20 fenêtre push/call puis `50A79E` écrase EAX et `50A7A5 add esp,4`. Fenêtre caller secondaire gelée, pas un nouveau corps complet.

## Limites et questions ouvertes pour le lead

1. Readers/writers natifs bornés nécessaires pour nommer les index, deux masques, bits +2/+3, bytes persistants et le champ +0xC. Pas de nom GF/damage/target certain.
2. Types exacts, extents, ownership et alias policy manquants ; taille des groupes/records inférée par strides, pas structures validées. Le nombre documentaire de sept acteurs n'est pas contrôlé ici.
3. Contexte caller-chain gelé tronqué ; un xref fourni n'est pas une preuve d'exhaustivité. Un contrat de retour métier requiert d'autres usages validés, même si EAX à RET est déterminé.
4. Contradictions documentaires sur route 0 et producteurs +0x10/+0x11 non arbitrables par cette cible : **UNCERTAIN**, pas CERTAIN inventé ; pas de nouvelle capture indispensable pour livrer ce contrat mécanique.
5. Aucune compilation/test natif ni §5.6 final, promotion, IDB/save/readback ou intégration effectué. Le lead conserve ces contrôles et le calcul du hash de sortie.

**Décision finale :** contrat mécanique réconcilié complet ; divergence de nom résolue sans surpromesse métier ; erreur commune sur l'éventuelle absence de zéro-extension d'EAX à RET sous aliasing corrigée par le CFG. Métier précis reste LIKELY/UNCERTAIN, sans conflit mécanique résiduel détecté.
