# 0x45E9D0 — sémantique A indépendante

## Périmètre et couverture

- Rôle : auteur sémantique A, 2+1 ; seule cible 0x45E9D0. Aucun C, résultat B, classifier, review ou verdict futur consulté.
- Autorité : export natif PE32 du 2026-10-11T16:38:25.140966+00:00, EXE SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- Projection : `inputs/ff8-decomp-semantics-20261011-r01/g02/0x45E9D0.readable/`. Hash original déclaré au manifest : `20a01d8e22132e51bd91786c830d7529b9608a3d0cdabc88a1981ffcda06cf5e`. Hash compaction déclaré : `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34` ; pas de recalcul de hash effectué.
- Lecture complète : manifest 1–45 ; ASM 001–004, chacune 1–25, ASM 005 1–9, soit **109/109 instructions** ; bytes-001 1–17, **un chunk [0x45E9D0,0x45EBE9), 537 octets**, sans omission ; metadata 1–1588, tous CFG/xrefs ; common-compaction 1–24.
- Les lectures natives héritées proviennent du lecteur factuel, pas d'un auteur. La projection verbatim complète remplace pour l'analyse la ligne JSON ASM historiquement affichée avec troncature. Pas de nouvelle recherche externe.

## Rôle, confiance et nom

**Fait mécanique CERTAIN :** multiplie trois valeurs globales signées de 16 bits par un facteur commun dérivé d'une quatrième valeur signée ; convertit les résultats via x87/biais binaire, conserve les trois valeurs brutes dans des DWORDs, écrit des versions saturées signées dans trois autres DWORDs, puis pousse trois octets saturés et un octet de contrôle dans un FIFO de trois DWORDs. Réinitialise et construit un masque d'indicateurs de saturation. Ne cumule pas les valeurs précédentes des trois résultats bruts.

**Nom proposé : `ScaleGlobalS16Triplet_ClampAndPushPackedBytes`. Confiance CERTAIN pour ce nom mécanique**, indépendamment du nom IDA : le produit commun est prouvé par les `FILD/FMUL` (preuve 2) ; les saturations et le FIFO/octet de contrôle sont prouvés séparément par les branches/stores (preuves 1, 4–6).

**Interprétation métier LIKELY :** helper de mise à l'échelle d'intensités/couleurs dans l'état global d'émulation GTE. La compaction appelle les zones IR/MAC/RGB et documente une échelle Q12. Ces mots sont des conventions contextuelles, pas des types matériels démontrés par les labels. Identification d'une instruction PSX particulière, d'un acteur, d'un effet ou d'une phase de rendu : **UNCERTAIN**. Aucun nom d'opcode matériel proposé.

## Contrat observable (terminaison normale)

### Entrées et ABI

- Aucune entrée stack/register applicative lue. Fonction sans argument mécanique visible, sans appel sortant ; `retn` simple, compatible cdecl sans argument mais insuffisant pour prouver une déclaration source.
- Lit deux DWORDs à `0x1CA8A64` et `0x1CA8A68` pour le FIFO ; lit un octet à `0x1CA8A2B` ; lit les **mots bas signés** à `0x1CA8A30`, `34`, `38`, `3C` (`MOVSX`, puis `FILD m32int`). Les mots hauts de ces quatre DWORDs ne sont pas les entrées arithmétiques.
- Lit le réel **binary32** à `0xB695F8` et le réel **binary64** à `0xB693D8`. Leurs adresses/largeurs sont prouvées par `D8 0D` et `DC 05` ; leurs contenus numériques ne sont pas capturés dans ce chunk. `1/4096` et `4503601774854144 = 2^52 + 2^31` sont les valeurs de contexte/label, à garder conditionnelles.
- Dépend de l'environnement x87 entrant (RC, PC, masques d'exception, état/tag/occupation de pile). Aucun chargement du control word ni sauvegarde/restauration de l'environnement.
- Réserve 8 octets locaux ; sauvegarde/restaure EBX avec PUSH/POP. ESI/EDI/EBP non modifiés. EAX/ECX/EDX et EFLAGS sont volatils. Aucun ordre d'arguments de callee à reconstruire : aucun CALL.

### Arithmétique exacte au niveau instruction

Appeler `s` le mot signé de `30`, et `v1,v2,v3` ceux de `34,38,3C`. La pile x87 conserve `k = FMUL_x87(FILD(s), binary32[B695F8])`. Pour chaque composante dans cet ordre :

1. `FILD(v_i)` ; multiplication par la valeur `k` encore présente en ST(1).
2. Addition x87 de `binary64[B693D8]`.
3. **FSTP m64real** dans les 8 octets locaux ; lecture du DWORD bas de la représentation binary64 stockée, pas conversion `FISTP`.
4. Addition entière de `0x80000000`, modulo 2^32, au DWORD bas : résultat brut `r_i`.

La largeur m64 du FSTP est confirmée par `DD 5C 24 00` dans les bytes, malgré l'ASM sans suffixe explicite. La même zone locale est réutilisée d'abord comme entier signé m32, puis comme réel m64, puis comme deux moitiés de bits ; aucune équivalence par cast numérique simple n'est implicite.

Sous les constantes du contexte et un environnement adapté, cela est une mise à l'échelle Q12 avec arrondi par biais. **Ne pas remplacer inconditionnellement par division entière, SAR 12, troncature, `round()` ou nearest-even** : multiplication/addition et stockage subissent l'environnement x87, et la précision PC peut changer le résultat. Le facteur reste en x87, non arrondi en binary32 après son FMUL. Trois `FSTP` des sommes et le `FSTP ST(0)` final enlèvent les quatre valeurs chargées ; profondeur nette restaurée sur exécution normale, maximum deux nouvelles valeurs simultanées. Status word/flags x87 peuvent changer ; exceptions non masquées peuvent interrompre avant les effets finaux.

### Sorties mémoire et ordre

1. Copie les anciens DWORDs `64 -> 60`, puis `68 -> 64`. FIFO à **stride 4 octets**, trois entrées, pas tableau de mots de stride 2. Les deux anciens DWORDs ont été chargés avant les stores.
2. Écrit `byte[68+3] = byte[2B]`, avant les calculs et les trois autres octets. Les 24 bits bas de `68` restent temporairement anciens.
3. Met `DWORD[92F8] = 0` après le chargement x87 des deux premières entrées ; écrit les résultats bruts `r1,r2,r3` dans les DWORDs `74,78,7C`, **stride 4**, avant tout clamp. Les anciennes valeurs de ces trois globals ne sont jamais lues.
4. Écrit `DWORD[34/38/3C] = clamp_signed32(r_i, -32768, 32767)` dans cet ordre. Ce sont des **stores de 32 bits**, non de 16 bits : une valeur négative est sign-étendue dans tout le DWORD. `30` demeure inchangé.
5. Dérive les octets directement des résultats bruts conservés dans EDX/EAX/ECX, **pas des DWORDs déjà saturés**. Un CMP/JBE unsigned conserve les valeurs 0..255 ; sinon `SAR reg,31 ; NOT reg` donne 0 pour une valeur brute signée négative et `0xFFFFFFFF` pour une valeur positive hors plage. Stocke DL à `68`, AL à `69`, CL à `6A`, **stride 1** ; `6B` conserve le contrôle copié à l'étape 2. Aucun décalage supplémentaire (par exemple RGB >> 4) n'existe.

Masque à `92F8` après le clear :

| Condition sur résultat brut | Contribution exacte |
|---|---|
| r1 hors [-32768,32767], comparaison signée | affectation `0x81000000` |
| r2 hors [-32768,32767], comparaison signée | OR `0x80800000` |
| r3 hors [-32768,32767], comparaison signée | OR `0x00400000` |
| uint32(r1) > 255 | OR `0x00200000` |
| uint32(r2) > 255 | OR `0x00100000` |
| uint32(r3) > 255 | OR `0x00080000` |

En particulier r3/clamps octets ne posent **pas** un bit 31 supplémentaire. Ne pas synthétiser un bit d'erreur général pour toute saturation. Les négatifs déclenchent les branches unsigned hors plage octet. Les CMP signés suivis de JGE/JLE incluent exactement -32768 et 32767 ; CMP unsigned/JBE inclut 255. MOV, PUSH/POP et FSTP intermédiaires ne remplacent pas les flags entiers du CMP utilisé par la branche.

### AL/AX/EAX au retour

Pas de résultat applicatif stable établi par les xrefs seules ; privilégier contrat à effets, pas un retour couleur ou booléen inventé. Cependant **EAX natif est entièrement déterminé par le chemin**, et pas seulement AL :

- Si `uint32(r3) <= 255` : EAX est `r2` lorsque `uint32(r2) <= 255`, sinon 0 si `int32(r2) < 0`, sinon `0xFFFFFFFF`. Le store AL à `69` ne modifie pas EAX.
- Si `uint32(r3) > 255` : `45EBCB` recharge le masque dans EAX, puis OR `0x80000` ; EAX = masque final à `92F8`, pas r2. AL/AX sont simplement ses sous-registres.
- Pas de valeur de retour ST(0) ajoutée ; la pile x87 applicative retrouve sa profondeur entrante. Pas de retour constant/flag fiable prouvé par un usage caller.

État partagé non réentrant sans sérialisation externe ; séquence multi-store non atomique. Ni garde de pointeur, allocation, I/O, appel de bibliothèque ni restauration de l'ancien masque.

## Huit preuves indépendantes et provenance

Chemins ASM/bytes/metadata ci-dessous relatifs à la projection `.readable/` indiquée plus haut.

1. **FIFO et contrôle, preuve de nom indépendante du calcul :** `45E9D3–45E9E3`, `45E9FB/45EA09`, `asm-001.txt:2–5,9–12` : deux copies DWORD et un byte ciblant l'entrée finale. `bytes-001.txt:1–2` confirme les stores sans préfixe 66 et le store byte `88 15`.
2. **Facteur signé commun, preuve de nom calcul :** `45E9E9/45E9F0/45EA0F/45EA64`, `45EA16/45EA2A/45EA4E/45EA78`, `asm-001.txt:6–25`, `asm-002.txt:5–9` : quatre MOVSX, FILD signés, un facteur gardé en pile et trois FMUL ST,ST(1).
3. **Conversion par bits et écrasement sans accumulation :** `45EA2C–45EA48`, `45EA50–45EA6F`, `45EA7A–45EA96`, `asm-001.txt:18–24`, `asm-002.txt:1–16`, `bytes-001.txt:3–7` : FADD m64, FSTP m64, lecture du DWORD bas et +0x80000000, trois stores bruts. Aucune lecture des anciens 74/78/7C.
4. **Clamps signés complets :** `45EA8E–45EB74`, `asm-002.txt:14–25`, `asm-003.txt:1–25`, `asm-004.txt:1–7` ; JGE/JLE autour de 0xFFFF8000 et 0x7FFF, puis DWORD stores. Les trois ensembles de flags diffèrent, spécialement `0x00400000` pour la troisième composante.
5. **Clamps octets unsigned :** `45EB7A–45EBDA`, `asm-004.txt:8–25`, `asm-005.txt:1–6` : JBE unsigned et SAR 31/NOT, drapeaux 0x200000/0x100000/0x80000 ; ne dépend pas des sorties IR saturées en mémoire.
6. **Largeurs packed/retour :** `45EB9E/45EBC4/45EBDF`, `asm-004.txt:16,25`, `asm-005.txt:2–9` : stores DL/AL/CL et rechargement conditionnel du masque dans EAX ; bytes `88 15`, `A2`, `88 0D`, puis `83 C4 08 C3` (`bytes-001.txt:15–17`).
7. **Structure/ABI :** `metadata.json:11–173,1586–1587` : 22 blocs, aucun code_target ; ASM entier sans CALL, `SUB ESP,8`, PUSH/POP EBX, RET sans immédiat. Les pushs ne sont pas des arguments d'un appel caché.
8. **Contexte d'appel indépendant, sans surinterprétation métier :** `metadata.json:175–203` montre les appels `56CB64` (fonction `56CB50`), `56CBD4` (`56CBC0`), `5D9570` (`5D9510`), deux sites dans `657DF0`. `metadata.json:859–864` contient `7013F0` (`701390`). Ceci prouve réemploi et sites directs, pas la consommation d'EAX ni un type de scène.

## Couverture des 22 blocs

Départs des blocs, tous examinés (metadata 11–173) :

- `45E9D0` : FIFO, contrôle, calcul/conversion des trois bruts, initialisation du masque, test bas r1.
- `45EA9E`, `45EAB4`, `45EABC`, `45EAD2` : clamp bas r1 / test haut / clamp haut / store dans plage.
- `45EAD8`, `45EAE0`, `45EAFE`, `45EB05`, `45EB23` : sauvegarde EBX et test bas r2 / clamp bas / test haut / clamp haut / store dans plage.
- `45EB28`, `45EB30`, `45EB4E`, `45EB56`, `45EB74` : test bas r3 / clamp bas / test haut / clamp haut / store dans plage.
- `45EB7A`, `45EB82` : test unsigned r1 / remplacement octet et flag.
- `45EB99`, `45EBA7` : store premier octet, restauration EBX, test r2 / remplacement et flag.
- `45EBBE`, `45EBCB` : store deuxième octet, test r3 / remplacement et flag avec écrasement d'EAX.
- `45EBDF` : troisième octet, libération des 8 octets et RET.

## Divergences, hypothèses et questions ouvertes

- Aucune contradiction mécanique trouvée entre projection, bytes et compaction. Les désignations IR/MAC/RGB et Q12 restent du contexte ; le nom mécanique proposé ne dépend pas de leur validation. Ne pas transformer les labels/constants en preuve des données à leurs adresses.
- Complément nécessaire pour une formule numérique totalement spécialisée : gel des 4 octets à B695F8, des 8 octets à B693D8 et du contrat x87 entrant (PC/RC/masques, disponibilité de deux slots). Ce manque n'empêche pas de documenter la séquence exacte, mais empêche une équivalence inconditionnelle à un arrondi C standard.
- Complément nécessaire pour déclarer un prototype de retour : ASM caller borné avant/après les sites indiqués, en particulier éventuelles lectures AL/AX/EAX. Les métadonnées seules ne prouvent pas que le retour est ignoré.
- Complément métier éventuel : gel autorisé de la définition de l'état/global mapping et des wrappers `56CB50/56CBC0`, sans C/verdict cible ni nouvelle recherche de worker.
- Aucun test, compilation, exécution x87, recalcul de hash ou validation §5.6 réalisé. Output documentaire seulement ; promotion, gel/hachage final, IDB et clôture réservés au lead.
