# 0x419D8F — contrat sémantique réconcilié R

## Provenance et statut

Mission `ff8-decomp-semantics-20261011-r01`, g01, tâche `task_mv44nk0q_005h_9xh6aa`, R sémantique 2+1. Projection exclusivement lue : `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g01/0x419D8F/semantic/` (P). Aucun volet C, index, verdict antérieur, session étrangère, IDA, shell, git, registre ou live consulté.

A : session `ses_ed3e1bcb4ffeNAfwA6qfV4aNvL`, OpenAI `gpt-6.1-sol/high`, SHA256 `7cddb608c816800f2d5295dbe862e7f0a30955f8106847dd950ddb2b8f037a1f`.
B : session distincte `ses_ed3e1b98bffeFauStXuZ7ucfLT`, même modèle/variante, SHA256 `1969e69a95cfaed6d8388e02664e8dd649206008aa5b6fb4dbedaccd392786f1`.
Présence des deux auteurs vérifiée dans le manifeste ; indépendance fresh attestée par le parent, non auditée dans leurs historiques. Deux sessions distinctes ne prouvent pas diversité de modèle.

Packet natif : SHA256 `bf1ee669cd27c5fdeba32939d67727ddcef4bbb63153d0703d2e8de20d6d326a`. Compaction : `b1085a3007d76c5a2d8ca488b7247262aa52f66061b8d1aa1ead0ba16c9e41e3`. Le parent rapporte PASS du recalcul des neuf fichiers et égalité byte-à-byte de la concaténation des dix parts avec la compaction ; aucun recalcul cryptographique effectué par R. Les hashes du native-manifest correspondent aux entrées préfixées `native-` du manifeste R ; ces changements de noms ne changent pas le contenu déclaré.

Lecture intégrale de manifest, enveloppe JSON, native-manifest, native-metadata, deux native-asm, native-bytes, A/B et common-compaction.readable/manifest + parts 001–010. Redérivation sur les octets et 34 instructions du chunk unique `[0x419D8F,0x419DE9)`, 90 octets, quatre blocs ; aucun bloc/chunk fourni laissé hors analyse. Export natif du 2026-10-11T16:38:25.140966+00:00, x86 32 bits, FF8_EN.exe SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

**CERTAIN : mécanique locale décrite ci-dessous. UNCERTAIN : métier, types et effets transitifs.** Livrable non promu ; contrôle natif final §5.6, hash de sortie et intégration restent au parent.

## Matrice des convergences et divergences

| Point | A | B | Arbitrage R contre preuve |
|---|---|---|---|
| Gardes et sortie anticipée | a2/a3 zéro → zéro | Identique, explicite court-circuit | Retenu : `83 7D 0C 00`, JZ puis `83 7D 10 00`, JZ ; local zéro à 0x419D95. Aucune garde a1. |
| Copie et ordre | DWORD a1+0x64 → a2+0x2C avant appels | Identique | Retenu par `8B 51 64 89 50 2C`, pas par accord. |
| Chaîne/retour | r1 transmis sans test, retour r2 complet | Identique | Retenu par pushes, deux CALL rel32, stores/loads EAX, `C3`. |
| ABI/type | cdecl-compatible, mots opaques | Identique, aucun ECX implicite établi | Retenu : trois slots de pile et cleanup12 ; pas de thiscall ni de type métier démontré. |
| Nom | CopyField64To2CAndChainCalls | Identique | Retenu seulement comme description mécanique, deux preuves indépendantes détaillées ci-dessous. |
| Métier | UNCERTAIN | LIKELY préparation/sélection de payload dans chemin graphique/texture | **Réduit à UNCERTAIN pour la cible.** Les instructions actuelles ne portent aucun discriminateur métier ; contexte du premier callee historique, pas corps natif actuel du second. LIKELY ne devient pas CERTAIN par consensus. |
| Callee2/cache/upload/refcount | Non prouvé | Non prouvé | Retenu : commentaire à 0x419DD7 n'est pas un opcode ni une preuve des effets du callee. |
| Alias et effets | Alias permis, un store visible | Identique | Pas de non-aliasing source/destination ajouté. Qualification commune : « un store » désigne les objets, non les écritures de pile ; le contrat abstrait suppose une frame ABI intacte. |

Pas de conflit mécanique non tranché. Recherche d'erreurs communes : vérification indépendante des offsets via ModRM, de la largeur EAX versus AL/AX, des cibles rel32, des chemins zéro, de l'absence de test r1 et du RET sans immédiat. Le nom existant et les commentaires ont été exclus comme fondement métier.

## Contrat final

**Nom proposé : `CopyField64To2CAndChainCalls`**, CERTAIN comme nom mécanique uniquement. Il décrit la copie explicite à 0x419DAE/0x419DB1 et la transmission du résultat du premier appel au troisième argument du second à 0x419DC8–0x419DD7. Aucune proposition de nom texture/cache/upload/refcount promue.

- Entrées visibles : a1 = DWORD `[EBP+8]`, a2 = DWORD `[EBP+0xC]`, a3 = DWORD `[EBP+0x10]`. a1/a2 sont utilisés comme adresses sur le chemin actif ; a3 est un mot opaque dont seule la nullité est examinée.
- Frame : EBP sauvé/restauré, huit octets de locaux ; `[EBP-8]` initialisé zéro, `[EBP-4]` reçoit r1. Arguments externes non dépilés par la cible ; cdecl-compatible, corroboré par cleanup12 dans les fenêtres historiques des callers, sans prétendre résoudre tout le typage.
- Si a2 = 0 : a3 n'est pas examiné, aucune lecture/écriture d'objet ni appel. Sinon, si a3 = 0 : même résultat. EAX final vaut zéro sur ces chemins.
- Chemin actif : lire 32 bits à l'adresse x86 a1+0x64 ; écrire les mêmes 32 bits à a2+0x2C ; appeler `0x419410(a1,a2,a3)` ; appeler `0x419CBE(a1,a2,r1)` sans test de r1 ; restituer les 32 bits r2 en EAX.
- Arguments poussés de droite à gauche ; chaque appel suivi de `ADD ESP,0xC`. Registres EAX/ECX/EDX utilisés comme temporaires, pas de paramètre implicite ECX établi. EBP est le seul registre non volatil explicitement sauvegardé ici ; obligations des callees non auditables avec ce seul corps.
- Zéro final ne distingue pas une garde d'un retour zéro du callee2. Aucun booléen normalisé, pointeur, handle, signedness métier, extension de signe ou troncature AL/AX démontré.
- Effet objet direct : une lecture DWORD et un store DWORD, avant les appels ; effets transitifs inconnus. Pas de rollback visible après ce store, même si r1/r2 vaut zéro. Aucune référence directe globale ni appel indirect dans ce wrapper, sans conclusion sur les callees.
- Sûreté du chemin actif : a1+0x64 lisible et a2+0x2C inscriptible ; aucune validation propre de a1 ni de validité de a2/a3. Pas de garantie d'alignement, taille de structure, ownership, lifetime ou thread-safety. Les objets source/destination peuvent se recouvrir : le load précède le store.
- Comme tout résumé ABI, cette expression en a1/a2/r1 suppose que les accès objets/callees ne corrompent pas la frame de la cible. Les instructions rechargent réellement les arguments depuis leurs slots avant les pushes ; si une adresse hostile aliasait ces slots ou les locaux, leur contenu modifié gouvernerait la suite. A/B ne démontrent pas une exclusion absolue de cet alias avec la pile.
- Offsets 0x64 et 0x2C en octets, pas strides. Adressage 32 bits avec wrap architectural, non pointeurs hôte 64 bits. Aucun loop, index de tableau, multiplication, shift ou comparaison d'ordre signé/non signé. Aucun accès partiel AL/AX ni x87/SSE/changement de control word local ; effets d'environnement transitifs inconnus.

## Huit ancres de preuve

1. **Frame/slots** — P/native-asm-001:1–4, native-bytes-001:1–3 : `55 8B EC 83 EC 08`, initialisation `C7 45 F8 00000000`, références pile +08/+0C/+10. Deux locaux DWORD, arguments transportés en DWORD.
2. **Gardes** — 0x419D9C–0x419DA6, native-asm-001:5–8 : JZ à 0x419DE2 ; branches bytes `74 40` et `74 3A` atteignent bien le bloc final. Zéro vient du local initialisé, sans accès objet sur ces chemins.
3. **Premier appui du nom** — 0x419DA8–0x419DB1, native-asm-001:9–12 : EAX=a2, ECX=a1 ; `8B 51 64 89 50 2C` copie exactement un DWORD source+0x64 vers destination+0x2C. La coupe des bytes à 0x419DAF se situe au milieu du MOV, pas à une nouvelle frontière d'instruction.
4. **Appel1** — 0x419DB4–0x419DC8, native-asm-001:13–21 : pushes a3/a2/a1 ; `E8 4B F6 FF FF`, suivant 0x419DC5 plus déplacement signé -0x9B5 = 0x419410 ; cleanup12 et sauvegarde EAX.
5. **Second appui du nom/chaînage** — native-asm-001:22–25 + native-asm-002:1–4 : push r1/a2/a1, aucun branchement/test r1 ; `E8 E2 FE FF FF`, suivant 0x419DDC plus -0x11E = 0x419CBE ; cleanup12.
6. **Retour/largeur** — 0x419DDF–0x419DE8, native-asm-002:5–9 : EAX → local → EAX, restauration ESP/EBP, `C3`. Aucun `RET 0xC`, ni `MOVZX EAX,AL/AX` ou masque.
7. **CFG/couverture** — native-metadata:11–39,55–60 : blocs 0x419D8F, 0x419DA2, 0x419DA8, 0x419DE2 ; deux gardes et chemin actif unique, 34 instructions. End 0x419DE9 moins start 0x419D8F = 0x5A = 90 octets.
8. **Xrefs et limite de contexte** — native-metadata:41–58 : appels entrants 0x407797/0x414AD1 dans 0x4076B6/0x414A40, cibles sortantes 0x419410/0x419CBE. Compaction parts004–006 rapporte captures historiques des callers (cleanup12, consommation DWORD) et validation native datée 2026-10-09 du premier callee ; ce contexte corrobore le transport, non une preuve actuelle de métier/effets du second.

## Limites et besoins éventuels du parent

La compaction décrit une sélection de payload pour le premier voisin, pas une recherche prouvée de texture chargée. Le commentaire callee2 (+0x18 refcount, +0x50 upload, +0x1C handle), les labels et le wiki restent annotations. Les previews historiques de cible rencontrées par l'explorateur sont signalées dans parts008–010 ; elles sont exclues des preuves, sans revendication d'audit de cet historique non projeté.

**Restent UNCERTAIN :** sens des deux champs et d'a3, types et sémantique des résultats, cache/upload/refcount/allocation, erreurs, état global, callbacks et lifetime/concurrence. Pour lever un gate de nom métier : demander au parent le corps ASM gelé complet de 0x419CBE et helpers pertinents, layouts/xrefs des champs, contexte natif actuel des callers/callees. Aucune capture supplémentaire nécessaire au seul contrat mécanique ; aucune certitude métier inventée. §5.6 et promotion finale non effectués par R.
