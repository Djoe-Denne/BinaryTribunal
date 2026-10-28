# 0x419D8F — sémantique B indépendante

## Entrée et couverture

Rôle : semantic B uniquement, mission run01, 2+1. Aucune production A/C, review ou classification consultée ; aucun C cible produit ici.

Projection `inputs/ff8-decomp-semantics-20261011-r01/g01/` : manifest et metadata intégralement lus ; `0x419D8F.readable/asm-001.txt:1–25`, `asm-002.txt:1–9`, `bytes-001.txt:1–3` entièrement couverts. Un chunk `[0x419D8F,0x419DE9)`, 90 octets, 34 instructions, quatre blocs CFG (`0x419D8F`, `0x419DA2`, `0x419DA8`, `0x419DE2`). Le packet natif reste autorité, SHA256 annoncé `bf1ee669cd27c5fdeba32939d67727ddcef4bbb63153d0703d2e8de20d6d326a` ; les trois slices bytes sont cohérentes avec les instructions, y compris les deux CALL relatifs vers `0x419410` et `0x419CBE`.

Compaction originale initialement tronquée par l'outil de lecture : couverture achevée grâce à la projection autorisée `common-compaction.readable/manifest.json:1–68` et `part-001.txt` à `part-010.txt`, chacun entièrement lu. SHA256 source annoncé `b1085a3007d76c5a2d8ca488b7247262aa52f66061b8d1aa1ead0ba16c9e41e3`. Pas de calcul de hash indépendant ni de test/compilation effectué.

## Rôle et nom proposés

**Nom conservateur : `CopyField64To2CAndChainCalls` — CERTAIN comme description mécanique**, non comme identification métier. Deux preuves indépendantes fondent ce nom : copie DWORD à `0x419DAE/0x419DB1` ; chaînage explicite des deux appels avec résultat du premier comme troisième argument du second à `0x419DC8–0x419DD7`.

**Rôle mécanique CERTAIN :** wrapper à trois arguments qui, si les arguments 2 et 3 sont non nuls, prépare un champ de l'objet 2 depuis l'objet 1, appelle deux fonctions successivement et restitue intégralement le résultat de la seconde. Sinon, il renvoie zéro sans accéder aux objets ni appeler ces fonctions.

**Interprétation métier LIKELY :** étape de préparation puis sélection de payload dans un chemin graphique/texture. Le contexte historique validé du premier callee indique une sélection de payload, pas une recherche prouvée de texture déjà chargée. **UNCERTAIN :** upload effectif, recherche de cache, acquisition d'un handle et incrément de référence dans le second callee. Les labels `TextureRelated2`, `Texture_FindTexture`, `Texture_UploadRefcountOrReuse` et le commentaire de refcount ne fondent pas le nom proposé.

## Contrat mécanique in/out/effets

- ABI observée : trois slots DWORD à `[EBP+8]` (a1), `[EBP+0xC]` (a2), `[EBP+0x10]` (a3), compatibles cdecl 32-bit. Prologue EBP, deux locaux DWORD ; RET simple sans dépilage d'arguments. Le wrapper dépile 12 octets après chacun de ses appels. Aucun paramètre implicite ECX n'est établi.
- Si a2 vaut zéro, ou si a2 est non nul et a3 vaut zéro : retour EAX=0. a1 n'est pas contrôlé, mais il n'est pas déréférencé sur ces chemins.
- Sinon : lecture DWORD à l'adresse 32-bit `a1+0x64`, puis écriture de cette même valeur à `a2+0x2C`, avant tout appel. Ce sont des offsets en octets (100 et 44), **pas des strides de tableau**. a1 et a2 désignent ici des adresses ; la nature de a3 (clé, pointeur, options, entier) n'est pas prouvée par ce wrapper.
- Première fonction : `0x419410(a1,a2,a3)` ; pushes dans l'ordre a3, a2, a1. Résultat EAX conservé dans le local `[EBP-4]`.
- Seconde fonction : `0x419CBE(a1,a2,r1)` ; pushes dans l'ordre r1, a2, a1. Elle est appelée même si r1 vaut zéro. Aucun test, masque, conversion ou dereference de r1 par le wrapper.
- Retour : résultat complet 32-bit de la seconde fonction, sauvegardé dans `[EBP-8]` puis chargé en EAX. Ni retour AL/AX, ni booléen normalisé, ni pointeur/entier signé démontré. Les callers historiques le testent contre zéro et/ou le stockent en DWORD ; cela ne résout pas son type métier.
- Effet direct : une écriture DWORD relative à a2 ; aucune référence directe à un global, aucun appel indirect. Les effets transitifs des callees restent ouverts. Source/destination peuvent aliaser ; aucun `restrict`, non-aliasing, alignement ou layout struct complet n'est démontré. La copie précède les appels : leurs observations peuvent dépendre de cet alias et de cette écriture. Aucun rollback n'est visible si un callee échoue ou renvoie zéro.
- Les seuls branchements de données sont des tests d'égalité à zéro : aucune signedness d'ordre à déduire. Pas de boucle, multiplication de stride, shift, arithmétique métier, accès partiel de registre ou instruction x87 dans le wrapper. Les adresses sont celles de l'exécution x86 32-bit ; ne pas convertir implicitement cette mécanique en arithmétique de pointeurs hôte 64-bit. Aucun changement direct de l'environnement x87 n'est visible ; comportement des callees non établi.
- Préconditions de sûreté non implémentées : sur le chemin actif, les adresses a1+0x64 et a2+0x2C doivent permettre respectivement lecture et écriture DWORD pour une exécution sans faute. a3 non nul n'implique pas sa validité. Le zéro de retour n'identifie donc pas à lui seul une cause d'échec.

## Preuves ASM/xrefs (8)

Chemins relatifs à la projection g01 ci-dessus, sauf sources historiques explicitement indiquées.

1. `asm-001.txt:1–4,5–8` : `0x419D95` initialise le retour à zéro ; `0x419D9C/0x419DA0`, `0x419DA2/0x419DA6` court-circuitent sur les seuls arguments 2/3. Les bytes `837d0c00` et `837d1000` fixent les slots, indépendamment des labels.
2. `asm-001.txt:9–12` : `0x419DAE MOV EDX,[ECX+64h]`, `0x419DB1 MOV [EAX+2Ch],EDX` prouvent copie et largeur DWORD. Première preuve du nom.
3. `asm-001.txt:13–20` : `0x419DB7/0x419DBB/0x419DBF` et CALL `0x419DC0`, suivi d'ADD ESP,0xC, prouvent l'ordre des trois arguments et l'appel direct à `0x419410`.
4. `asm-001.txt:21–25`, `asm-002.txt:1–4` : sauvegarde EAX puis PUSH à `0x419DCE`, pushes a2/a1 et CALL `0x419DD7` sans test de r1. Deuxième preuve du nom, indépendante de la copie.
5. `asm-002.txt:5–9` : `0x419DDF/0x419DE2` sauvegardent/rechargent EAX entier ; `0x419DE8` RET simple. `bytes-001.txt:3` confirme la terminaison `8945f88b45f88be55dc3`.
6. `metadata.json:11–40` : quatre blocs, deux sorties anticipées convergeant au bloc `0x419DE2`, aucun autre chemin omis. `metadata.json:55–59` confirme deux code targets et 34 instructions.
7. `metadata.json:41–54` : xrefs code depuis `0x407797` (fonction `0x4076B6`) et `0x414AD1` (fonction `0x414A40`). La compaction, parts 004–005, cite les captures historiques `tools/_tmp_semantic_triple/0x4076b6/asm.asm:71–87` et `tools/_tmp_wave_review/glm_triple/0x419d8f/ida_extra.txt:3` : cleanup 12 et stockage DWORD à objet+0x14, avec test de zéro dans le premier caller. Ces fenêtres sont contexte historique, non nouveaux exports de callers.
8. Compaction parts 005–007 : source historique parent-validée `tools/_tmp_semantic_triple/0x419410/parent_verification_2026-10-09.md:5–10`, byte equality documentée, retour EAX complet à `0x41964F`, sélection d'un payload via scratch+0xC (`0x419798`). Elle soutient seulement l'interprétation de sélection de payload du voisin ; ne prouve ni cache de textures chargées ni effets du second callee.

## Inconnues, divergences et limites

- Sens et types des champs +0x64 et +0x2C, taille des objets, ownership, lifetime et contraintes d'alias : inconnus. Ne pas leur assigner des noms métier sur les seules annotations.
- Callee `0x419CBE` non fourni en ASM complet : effets globaux, erreurs, allocations, uploads, refcount/overflow, handle et appels indirects non vérifiés. Les offsets +0x18/+0x50/+0x1C du commentaire restent hypothèses.
- Le contexte du premier callee corrige la lecture historique « cache lookup » vers sélection de format/payload ; les noms présents dans l'ASM ne constituent pas une contradiction d'opcodes mais un risque d'interprétation.
- Capture actuelle du wrapper et validations historiques des voisins ont des dates différentes. Aucun readback actuel des voisins ou de leurs données effectué ; aucune preuve d'exhaustivité des xrefs de champs/globaux.
- La compaction signale des previews historiques C/verdict dans l'ancien historique de recherche explorateur. Aucune de ces productions n'a été consultée dans la projection disponible pour cette analyse ; elles sont exclues des preuves. Cette réserve de provenance doit rester visible au lead, sans revendication d'audit de tout l'historique non projeté.
- Questions ouvertes au lead si un nom métier plus spécifique est exigé : fournir le gel complet de `0x419CBE`, les layouts et xrefs des deux champs, et la nature du troisième argument. Le contrat mécanique décrit ici ne nécessite pas de les inventer.

Aucune promotion, validation finale §5.6, mutation IDB/Git/registre ou action live. Hash du livrable à calculer par le parent.
