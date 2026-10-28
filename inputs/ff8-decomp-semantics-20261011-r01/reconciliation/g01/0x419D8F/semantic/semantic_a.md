# 0x419D8F — sémantique A indépendante

## Périmètre, sources et couverture

Mission run01, g01, volet sémantique A uniquement ; aucune production C, review ou sortie d'un autre auteur consultée. Aucun index, IDA, shell, API, compilation ou test exécuté dans ce volet.

Base des citations ci-dessous : `inputs/ff8-decomp-semantics-20261011-r01/g01/0x419D8F.readable/` (P). Lecture intégrale de `manifest.json` (30 lignes), `metadata.json` (60 lignes), `asm-001.txt` (25 lignes), `asm-002.txt` (9 lignes) et `bytes-001.txt` (3 lignes). Couverture : toutes les 34 instructions, les 90 octets du chunk unique `[0x419D8F,0x419DE9)`, et les quatre blocs CFG démarrant à 0x419D8F, 0x419DA2, 0x419DA8, 0x419DE2 ; aucun tronquage des slices.

La première lecture de `common-compaction.md` était tronquée par l'outil : elle n'a pas été considérée complète. Après complément autorisé du lead, lecture intégrale de `common-compaction.readable/manifest.json` et `part-001.txt` à `part-010.txt`. Ces dix tranches contiguës reproduisent la compaction, avec les `\n` littéraux conservés, selon le manifeste et la vérification du parent. Hashes déclarés, non recalculés ici : packet natif `bf1ee669cd27c5fdeba32939d67727ddcef4bbb63153d0703d2e8de20d6d326a` ; compaction `b1085a3007d76c5a2d8ca488b7247262aa52f66061b8d1aa1ead0ba16c9e41e3`. L'ASM/les octets projetés du packet natif restent l'autorité ; la prose et les labels ne remplacent pas les instructions.

## Rôle et confiance

**CERTAIN — mécanisme local :** wrapper à trois arguments 32 bits. Si le deuxième ou le troisième vaut zéro, il renvoie zéro sans accès aux objets ni appel. Sinon il copie un DWORD de l'adresse `argument1 + 0x64` vers `argument2 + 0x2C`, appelle 0x419410 avec les trois arguments, puis appelle 0x419CBE avec les deux premiers arguments et le résultat EAX du premier appel. Il renvoie le résultat EAX du second appel, sans le normaliser.

**UNCERTAIN — métier :** nature exacte des objets, signification du DWORD copié et des deux résultats. Le contexte voisin validé historiquement est compatible avec une sélection de payload au premier stade ; il ne démontre pas un lookup de texture déjà chargée. L'upload, le cache et les refcounts attribués au second stade restent des annotations non prouvées par son corps ASM dans ce gel.

**Nom proposé : `CopyField64To2CAndChainCalls` — CERTAIN comme nom mécanique, pas comme nom métier.** Deux appuis indépendants : (1) paire load/store explicite à 0x419DAE/0x419DB1 ; (2) flux EAX du premier appel vers le troisième argument du second à 0x419DC8–0x419DD7. Les anciens noms ne sont pas des preuves. Un nom texture/cache/upload serait prématuré.

## Contrat entrée / sortie / effets

- ABI visible : arguments à `[EBP+8]`, `[EBP+0xC]`, `[EBP+0x10]`, chacun 32 bits. Usage cdecl-compatible : pushes de droite à gauche, nettoyage de 12 octets après chaque appel ; retour `RET` sans immédiat. EBP sauvegardé/restauré ; deux locaux DWORD à EBP-8 et EBP-4. Le prototype historique `int* / int / int` n'est pas validé comme typage métier.
- Argument 1 : utilisé comme adresse source sur le chemin actif, sans garde zéro propre. Pour terminer normalement ce chemin, le DWORD à `arg1+0x64` doit être lisible. L'identité/type de cet objet n'est pas établi.
- Argument 2 : zéro désactive le traitement ; sinon sert d'adresse destination. Pour terminer normalement, le DWORD à `arg2+0x2C` doit être accessible en écriture.
- Argument 3 : seul son caractère nul/non nul est examiné localement ; sa valeur complète est transmise au premier appel. Rien ne prouve qu'il soit une adresse plutôt qu'un token, entier ou autre mot opaque.
- Appel 1 : `0x419410(arg1, arg2, arg3)` ; EAX complet sauvegardé à EBP-4. Appel 2 : `0x419CBE(arg1, arg2, result1)` ; il est exécuté même si `result1` vaut zéro. Aucun test du résultat 1 dans le wrapper.
- Sortie : zéro si l'une des deux gardes échoue ; sinon les 32 bits du résultat 2. Un zéro final ne distingue donc pas un court-circuit d'un retour zéro du second callee. Aucun contrat de booléen, pointeur, handle ou entier signé ne découle du seul transfert EAX.
- Effet direct visible : un seul store d'objet DWORD, avant les deux appels. Une lecture DWORD précède ce store ; aucune règle de non-aliasing ne peut être ajoutée. En cas de recouvrement source/destination, l'ordre load puis store reste essentiel. Les arguments sont rechargés depuis la pile avant leurs pushes, et non lus dans des champs d'objet modifiés.
- Aucun rollback ni chemin local d'échec après le store. Si un accès/callee ne termine pas normalement, aucun retour normal n'est garanti. Effets supplémentaires, mutations d'objets/globaux, allocation, callbacks et durée de vie dans les callees : non déterminés par ce wrapper.

## Huit preuves ASM / xrefs

1. **Frame et largeur des arguments** — P/`asm-001.txt:1–4`, 0x419D8F–0x419D95 ; P/`bytes-001.txt:1–3` : `55 8B EC 83 EC 08`, local zéro `C7 45 F8 ...`, références `45/4D/55 08`, `...0C`, `...10`. Deux locaux de quatre octets ; offsets pile exacts, non déduits des labels.
2. **Court-circuit** — P/`asm-001.txt:5–8`, 0x419D9C/0x419DA0 et 0x419DA2/0x419DA6 : comparaisons zéro suivies de JZ vers 0x419DE2. EBP-8 étant initialisé à zéro, les deux chemins renvoient zéro. Pas de garde arg1.
3. **Copie de champ, premier appui du nom** — P/`asm-001.txt:9–12`, 0x419DA8–0x419DB1 : EAX reçoit arg2, ECX arg1, EDX reçoit `[ECX+0x64]`, puis `[EAX+0x2C]` reçoit EDX. Octets `8B 51 64 89 50 2C`, avec frontière de slice au milieu du premier MOV. Largeur DWORD, décalages en octets.
4. **Premier appel et ordre des arguments** — P/`asm-001.txt:13–21`, 0x419DB4–0x419DC8 : pushes arg3, arg2, arg1 ; CALL à 0x419DC0 ; ADD ESP,0xC ; sauvegarde EAX. Rel32 `4B F6 FF FF` cible 0x419410, corroborée par P/`metadata.json:55–57`.
5. **Chaînage, second appui du nom** — P/`asm-001.txt:22–25` et P/`asm-002.txt:1–4`, 0x419DCB–0x419DDC : pushes result1, arg2, arg1 ; CALL à 0x419DD7 puis cleanup0xC. Rel32 `E2 FE FF FF` cible 0x419CBE. Aucun branchement entre les deux appels.
6. **Retour complet et épilogue** — P/`asm-002.txt:5–9`, 0x419DDF–0x419DE8 : stockage EAX à EBP-8 puis chargement EAX depuis ce local, restauration ESP/EBP, `C3`. Pas de réduction AL/AX ni de `RET 0xC`.
7. **Couverture du contrôle** — P/`metadata.json:11–39` : quatre blocs, deux branches zéro vers l'épilogue, un seul chemin actif linéaire ; les 34 lignes ASM en donnent la couverture complète. Aucun loop, dispatch indirect ou chemin alternatif masqué dans le chunk déclaré.
8. **Consommation côté appelants, provenance limitée** — P/`metadata.json:41–53` donne deux xrefs code, 0x407797 dans 0x4076B6 et 0x414AD1 dans 0x414A40. Compaction `part-004.txt:1`–`part-005.txt:1` rapporte des captures natives historiques : cleanup0xC et consommation DWORD EAX, avec test zéro/store +0x14 dans le premier caller et store +0x14 dans le second. Cela corrobore le transport DWORD/caller cleanup, pas le sens du résultat ; ces fenêtres ne sont pas des exports actuels revalidés ici.

## Signedness, strides, retour et environnement

Les seules branches conditionnelles sont JZ : pas de comparaison relationnelle signed/unsigned. Lire les mots comme `uint32_t` opaque décrit leur transport, sans déterminer leur signedness métier. Les offsets `0x64` et `0x2C` sont des déplacements d'octets, **pas des strides** ; aucun index de tableau ni stride numérique dans la cible. Aucun calcul métier, shift, division ou extension de signe ; pas de troncature partielle AL/AX. Les changements ESP relèvent de la pile x86, avec nettoyage exact0xC. Aucune instruction x87/SSE ni modification locale du control word ; l'environnement flottant éventuel des callees n'est pas établi.

## Divergences de sources et inconnues ouvertes

- L'ASM à 0x419DD7 porte un commentaire refcount +0x18 / handle +0x1C / slot +0x50. La compaction `part-007.txt:1`–`part-008.txt:1` explicite l'absence de corps natif standalone vérifié pour ce callee : ces propriétés ne sont donc pas des faits mécaniques promus ici.
- La compaction distingue le premier callee d'une recherche prouvée de cache de textures chargées (`part-006.txt:1`–`part-007.txt:1`). Les anciennes étiquettes et le catalogage wiki sont des repères, pas deux preuves indépendantes d'un nom métier.
- La compaction signale des previews historiques de la cible dans la recherche du reader. Aucune de ces previews, production C, recommandation de nom ou verdict cible n'est visible/utilisée dans ce volet ; la présente conclusion vient des slices natives autorisées. Aucun accès à leur source.
- À obtenir du lead si un nom métier est requis : corps ASM complet gelé de 0x419CBE (et helpers pertinents), layouts/field xrefs validés de `arg1+0x64` et `arg2+0x2C`, sémantique de arg3, types/valeurs de retour des deux callees, éventuel état global et contraintes d'alias/lifetime. Pas de preuve de thread-safety ni de refcount/overflow dans cette cible.

Livrable non promu ; aucune §5.6, écriture IDB, sauvegarde/readback ou intégration finale effectuée. Hash de sortie à calculer par le parent si nécessaire.
