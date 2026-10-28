# 0x464850 — contrat sémantique réconcilié R

## Périmètre, provenance et couverture

- Mission `ff8-decomp-semantics-20261011-r01`, g06, volet **semantic uniquement**, tâche `task_mv44rkz2_007d_qmixf3`. Aucun C d'un autre volet ni verdict externe consulté.
- Entrées : exclusivement `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g06/0x464850/semantic/` : manifest, A, B, common-compaction, packet original, native-manifest, cinq slices native-asm, native-bytes-001 et native-metadata.
- A : session native `ses_ed3cfeddfffe4zBqPk16BclUiP`, tâche `task_mv44rkv7_007a_mu149q`, `openai/gpt-6.1-sol`, `high`; SHA-256 déclaré `a6faeb1306bdf5e50b988cdd03e7cdd2bc6be0272ceb9058472add532f9f7bf3`.
- B : session native distincte `ses_ed3cfea82ffeOESPnX6ecTGtpv`, tâche `task_mv44rkv8_007b_qf1ba0`, même modèle/variante; SHA-256 déclaré `e5ebb08df02695a68067818f4fe679ddf4164d4663e46210bfbcf3d94ea50d41`. Deux auteurs indépendants selon le manifest parent, pas deux familles de modèles.
- Packet SHA-256 déclaré `72f5e85aeda3168bd1cd97ff40d4407399a0fbbdd3d5589f58031f5fc9e7b087`; compaction `ded4edb4b1c6b48f28524bd123684cad1cf7bbc1743739420aa39f22a47309dc`. Les hashes de projection du manifest R concordent avec native-manifest, les hashes communs avec A/B. Aucun hash manquant ou conflit de hash déclaré. **Pas de recalcul byte-exact des fichiers disponible dans les outils autorisés : vérification d'intégrité effective réservée au parent.**
- Gel natif x86 32 bits, export `2026-10-11T16:38:25.140966+00:00`, input SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- Couverture : unique chunk `[0x464850,0x464997)`, **327 octets, 119 instructions, 20 blocs, six xrefs entrants, unique cible appelée 0x467550**. Toutes les slices ASM/bytes et les métadonnées complètes ont été lues. La ligne ASM embarquée du packet est tronquée à l'affichage par read : elle n'est pas utilisée comme preuve; les cinq slices verbatim complètes couvrent intégralement cette ligne, et bytes/CFG/xrefs sont disponibles sans troncature.
- Aucune compilation, exécution, mutation IDB/Git/registre/config/live ni validation native finale §5.6. Ce livrable est un contrat sémantique, pas une promotion.

## Verdict et nom proposé

**Nom proposé : `Gfx_InvalidateTexturePageCachesForRect` — LIKELY.**

Rôle proposé : après changement d'un rectangle du miroir CPU associé à la VRAM, marquer des cellules de caches de pages de texture et effacer conditionnellement un bloc auxiliaire, avec une seconde couverture alignée par paires sur le premier axe.

Deux familles de preuves motivent ce nom, sans prendre un accord A=B ou un label pour preuve :

1. **Corps natif** : écritures de sentinelles dword -1 dans trois banques à stride 0x44C, effacement conditionnel de 0x400 octets, puis revisite du champ de la banque centrale avec index pair. Cela démontre le marquage/effacement, mais pas à lui seul la signification métier « invalidation ».
2. **Contexte caller gelé + xrefs natifs distincts** : appels à 0x45BDBA et 0x45BE5D après copies de mots vers/dans le buffer 0x1B47818, notification des bornes inclusives de destination selon common-compaction:15–16. Ce contexte transmis appuie l'invalidation consécutive à une modification; l'ASM des callers n'est pas inclus et n'a pas été revalidé ici.

**CERTAIN sur le corps direct** : quatre valeurs stack 32 bits, appel initial inconditionnel, divisions signées /64 et /256 tronquées vers zéro, deux parcours inclusifs, adresses/largeurs/ordre détaillés ci-dessous. **LIKELY** : métier VRAM/cache de texture et absence de retour utile. **UNCERTAIN** : effets du helper, identité des formats/banks/champs/gates, layout/capacité des tables et domaine d'appel sûr. Aucun upload GPU n'est démontré. Le corps direct ne réalise pas de copie source→destination de pixels; les effets transitifs du helper restent inconnus.

## Contrat d'entrée, ABI et environnement

Noter `(a0,a1,a2,a3)` les quatre slots d'entrée 32 bits. Les bytes imposent les chargements initiaux **EBP=a0, EBX=a1, ESI=a2, EDI=a3**; ne pas permuter les deux premiers registres. Le contexte caller gelé propose `(x_min,y_min,x_max_inclusif,y_max_inclusif)`, pas `(x,y,width,height)`. L'orientation physique des pages ne découle pas du nom des axes.

Convention **cdecl compatible**, avec sauvegarde/restauration EBX/EBP/ESI/EDI et RET sans immédiat. Le nettoyage caller de quatre arguments est rapporté dans la compaction. L'unique appel 0x467550 reçoit cinq mots, ordre effectif `(a0,a1,a2,a3,0x1CB6040)`, puis nettoyage de 0x14 octets par 0x464850. Ceci établit le site d'appel, pas le prototype/type métier du helper. Son retour EAX est immédiatement écrasé; sa préservation des registres non volatiles est une précondition ABI du contrat résumé.

Les slots d'arguments sont **écrits** : à 0x4648B1/B5/B9, arg3←u0, arg0←v0, arg1←v1; à 0x4648CD puis 0x464946, arg2 sert de compteur de rangées de première passe. Ce sont des effets sur la pile caller, pas des output-param métier. En plage externe vide, arg2 n'est pas initialisé comme compteur. Aucune garantie n'est donnée sur EFLAGS/ECX/EDX.

Définir :

```
u0 = trunc_s32(a0 / 64);   u1 = trunc_s32(a2 / 64);
v0 = trunc_s32(a1 / 256);  v1 = trunc_s32(a3 / 256);
```

CDQ fournit le biais de signe, AND fournit 63/255 uniquement si négatif, ADD puis SAR 6/8 réalise la troncature vers zéro. Les tests sont JG/JLE **signés**, non JA/JBE. Les shifts locaux ont des comptes constants; tous les produits/adresses suivent le wrap 32 bits x86. Les compteurs quantifiés sont bornés par ces divisions, donc leur incrément et le compteur `(v1-v0+1)` n'exigent pas d'overflow signé pour des arguments s32; les **produits d'adresse** peuvent cependant wrapper.

Aucun x87/SSE ni instruction de contrôle d'arrondi dans le corps : aucune dépendance locale à la précision/au mode x87, aucune garantie sur les effets du helper sur cet environnement. REP STOSD ne comporte aucun CLD : la plage ascendante ci-dessous suppose **DF=0 après le helper**. Avec DF=1 les 256 stores descendent; DF n'est pas modifié localement. Pas de guard/clamp, allocation, synchronisation ou rollback explicite.

## Effets directs ordonnés

Les descriptions de parcours/retours supposent retour normal du helper, ABI respectée, accès mémoire valides, et absence d'alias destructeur avec pile/code/temporaires. Aucune de ces conditions de sûreté n'est vérifiée par le corps.

1. **Appel inconditionnel** 0x467550 avec les valeurs brutes et la base 0x1CB6040. Il précède quantification/comparaisons, même si les plages quantifiées sont ensuite vides. Ses effets sont opaques, non assimilés à une notification ou à un overlap-clear certain.
2. **Première passe** : si v0≤v1, rangées extérieures v0…v1; pour chaque rangée, cellules intérieures u0…u1 si u0≤u1. Poser `i=u+16*v`.
   - Stores dword `0xFFFFFFFF` successifs à `0x1CB636C+0x44C*i`, puis `+0x8980`, puis `+0x11300`, avec wrap 32 bits. La chaîne LEA multiplie par 5, 11, 55, 275 puis le scale 4 donne 0x44C. Le pas de banque est `0x8980=32*0x44C`.
   - **Après** les trois stores : load dword du gate global `0x1CCFD90`, à chaque cellule. Si zéro, pas de second load/clear.
   - Sinon : `j=0x470*i` modulo 2^32, obtenu par `(9*i*8-i)*16`; load dword à **`0x1CAD694+j`**. Si zéro, pas de clear.
   - Sinon : EAX←0, ECX←0x100, EDI←`0x1CAD28C+j`; REP STOSD écrit 256 dwords zéro. Avec DF=0 : adresses début+0, +4, …, +0x3FC, soit `[début,début+0x400)` en l'absence de wrap. Avec DF=1 : début, début−4, …, début−0x3FC. Le champ gate est à début+0x408, non effacé par ce clear dans le layout normal. EDI est ensuite rechargé depuis arg1, qui contient v1.
   - L'aliasing ne permet pas d'anticiper les loads des gates ou de transformer tout le parcours en clear groupé : les stores précèdent les tests, et le gate global est relu par cellule.
3. **Deuxième passe**, seulement après achèvement de toute la première : mêmes plages rangée/cellule, mais `k=(u & 0xFFFFFFFE)+16*v`; store dword `0xFFFFFFFF` à `0x1CBECEC+0x44C*k` modulo 2^32.
   - `AND AL,0xFE` supprime **uniquement bit 0** de l'EAX 32 bits; ni troncature à 8 bits, ni masque EAX par 0xFE. Pour un u négatif impair, c'est aussi le pair immédiatement inférieur, pas une division tronquée par deux.
   - `0x1CBECEC=0x1CB636C+0x8980` : c'est le même champ de la banque centrale, pas une queue indépendante. Deux u adjacents peuvent produire deux stores identiques; un début impair peut marquer le pair précédent, absent de la première passe. Ne pas dédupliquer ces écritures pour un contrat fidèle d'accès.
   - Le CMP du compteur interne à 0x464972 précède les LEA/stores; ces instructions préservent ses flags jusqu'au JLE à 0x46498B.
4. Pops des quatre registres, RET. Pas de résultat succès/échec mis en forme.

**Plages vides** : si v0>v1, aucune passe locale mais appel initial et réécriture des trois slots persistent. Si v0≤v1 et u0>u1, les deux parcours de rangées persistent sans store de cellule ni lecture de gate. Une inversion des bornes brutes peut disparaître à la quantification; aucun guard équivalent sur les bornes brutes ne doit être ajouté.

**Retour machine**, sous les préconditions précédentes :

- v0>v1 : EAX=`a3+(a3<0 ? 255 : 0)` modulo 2^32, avant le SAR exécuté dans EDI.
- v0≤v1, u0>u1 : EAX=u0, chargé à 0x46495C.
- deux plages non vides : EAX=`275*((u1 & 0xFFFFFFFE)+16*v1)` modulo 2^32, dernier produit LEA, **pas** l'adresse complète ni la sentinelle.

AL/AX ne sont que les parties basses de ce reliquat. **Retour métier probablement void**, selon usages rapportés par la compaction; pas de prototype public void ou non-void certifié sans ASM caller. Aucun retour booléen/constant n'est prouvé.

## Réconciliation A/B et recherche d'erreurs communes

| Point | A / B | Décision R et preuve |
|---|---|---|
| Rôle/nom | Accord LIKELY sur invalidation de pages de texture | Maintenu LIKELY, pas CERTAIN; sentinelles/clear natifs et contexte caller gelé constituent les deux preuves. |
| /64, /256, signé, bornes inclusives | Accord | Confirmé par CDQ/AND/ADD/SAR et JG/JLE, non par prose historique. |
| Second gate | Accord sur 0x1CAD694 contre compaction 0x1CAD294 | Confirmé par bytes `8B 82 94 D6 CA 01`; conflit de source **résolu**, écart 0x400. Offset correct : base auxiliaire 0x1CAD228 +0x46C; clear+0x408. |
| Fin/« queue » | Accord sur deuxième passe aliasée | Confirmé par identité de base +0x8980 et AND AL; interprétation queue rejetée. Fonction métier de l'alignement pair UNCERTAIN. |
| Bornes/retour | Accord, B explicite davantage les préconditions d'alias | Formules confirmées par CFG et dernières définitions EAX; préconditions appliquées aussi au contrat A. |
| Registres d'entrée | A énumère EBX/EBP/ESI/EDI après a0…a3, formulation ambiguë; B ne les associe pas individuellement | Clarifié par offsets stack des bytes : EBP=a0, EBX=a1, ESI=a2, EDI=a3. |
| « Notifier » helper / base de table | Tous deux emploient ce vocabulaire dans des faits mécaniques | **Resserrement commun** : seul l'appel avec cinq mots et son ordre est certain; ni rôle notification ni type table/context ne sont prouvés par l'ASM helper absent. |
| Effets stack | Tous deux mentionnent des slots temporaires sans en détailler toutes les mutations | Complété : arg0=v0, arg1=v1, arg3=u0, arg2=compteur de première passe. Évite un contrat global limité abusivement aux stores absolus. |
| Contexte caller | Accord sur usages après copie | Les xrefs prouvent les sites; l'ordre copie→appel est une donnée gelée parent, pas un caller ASM revu par R. Ne pas rehausser sa confiance par accord A=B. |

Aucun désaccord mécanique A/B restant n'exige de vote ou de moyenne. Les limitations partagées sont conservées explicitement; les assertions métier demeurent LIKELY/UNCERTAIN.

## Huit ancrages exacts ASM / xref

1. **ABI/ordre d'appel** — `0x464851`, `0x464856`, `0x46485B`, `0x464860` : chargements stack; `0x464864–0x46486D` : pushes base,a3,a2,a1,a0 puis unique call; `0x464874` ADD ESP,0x14; `0x464992–0x464996` pops/RET. `native-asm-001:2–16`, `native-asm-005:15–19`, bytes:1–2,11.
2. **Quantification et pile** — `0x464877–0x4648AC` : CDQ/biais/SAR 6,8; `0x4648AF–0x4648BD` : CMP, trois stores de slots puis JG. `native-asm-001:17–25`, `native-asm-002:1–19`, bytes:2–4.
3. **Première passe/banques** — `0x4648D9–0x464901` : LEA multiplicateurs, trois MOV dword -1 et ADD 0x8980/DEC/JNZ. `native-asm-003:4–14`, bytes:5–6.
4. **Gates et correction** — `0x464903` load dword global; `0x46490D–0x464920` produit 0x470 et load/test secondaire. Bytes de `0x464918` **`8b8294d6ca01`** : déplacement 0x01CAD694. `native-asm-003:15–25`, `native-bytes-001:7`; contredit common-compaction:9,29.
5. **Clear et ordre/DF** — `0x464922` ECX=0x100; `0x464927` EAX=0; `0x464929` LEA base 0x1CAD28C; `0x46492F` F3 AB; `0x464931` reload EDI. `native-asm-003:25`, `native-asm-004:1–4`, bytes:7–8; aucun CLD dans les 119 instructions.
6. **Seconde passe et largeur** — `0x46496D` AND AL,FE; `0x464972` CMP; `0x464974–0x46497D` LEA; `0x464980` store à base 0x1CBECEC; `0x46498B/90` JLE. `native-asm-005:1–14`, bytes:9–11. Base centrale identique et conservation des 31 autres bits d'EAX.
7. **CFG/retour** — chemins `0x4648BD→0x464950→0x464992`, `0x464964→0x46498D`, et dernière définition EAX `0x46497D`; RET `0x464996` sans normalisation. Les 20 blocs de native-metadata:11–160 expliquent les trois classes de reliquat, les gates et les deux passes distinctes.
8. **Deux sites caller** — xrefs entrants `0x45BDBA` depuis `0x45BD30`, `0x45BE5D` depuis `0x45BDD0`, `native-metadata:181–192`; contexte copie/destination transmis par common-compaction:15–16,20. Les quatre autres xrefs natifs sont 0x45B6D8, 0x45BAB8, 0x45BC10, 0x45BFA7; aucun métier n'est déduit de leurs labels.

## Limites résiduelles / captures utiles au lead

- **UNCERTAIN helper** : demander ASM/bytes/CFG de 0x467550 si un contrat transitif exhaustif est requis. Le contraste « inconnu »/overlap-clear dans la compaction ne peut pas être arbitré avec ce seul gel; les votes historiques ne sont pas une preuve. Effets sur DF/x87 et ABI effectif restent à contrôler.
- **UNCERTAIN métier/layout** : demander consommateurs des champs +0x32C, gate auxiliaire +0x46C, gate global 0x1CCFD90 et layout natif pour expliquer banques/formats/pair. Ne pas inventer booléen, pointeur, compteur ou queue.
- **UNCERTAIN axes/capacité** : /64 sur a0/a2 et /256 sur a1/a3 sont certains; orientation GPU, limites acceptables et capacité réelle ne le sont pas. Adresses extrêmes/wrappées peuvent aliaser globals, pile ou autres zones; aucun contrat de sûreté mémoire général.
- **Retour/types caller** : ASM des six callers requis pour certifier usages de retour et prototype public, non pour la mécanique directe ici couverte.
- Parent seul : recalcul des hashes fichiers, contrôle natif final §5.6, éventuelle intégration/promotion. Les captures complémentaires sont nécessaires uniquement pour lever ces limites, pas pour inventer un verdict certain sur ce gel.
