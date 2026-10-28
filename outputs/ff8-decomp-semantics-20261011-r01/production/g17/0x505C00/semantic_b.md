# Sémantique B — 0x505C00

## Identité et provenance
- Mission `ff8-decomp-semantics-20261011-r01`, groupe g17, tâche `task_mv44sf6m_00bb_yrap0p`, auteur `pool-205`, session `ses_ecf10bb44ffeUfJ8rO2r875w1F`.
- Admission attestée par le lead : `openai/gpt-6-astra`, variante `medium`, attendu/observé identiques. Les mentions historiques Sol high ne constituent pas le contrat courant.
- Entrée : `inputs/ff8-decomp-semantics-20261011-r01/g17/0x505C00.readable/` (ci-dessous P). Lecture complète de `manifest.json`, `asm-001.txt`, `asm-002.txt`, `bytes-001.txt`; `metadata.json:1–200` seulement. Contexte : `inputs/ff8-decomp-semantics-20261011-r01/g17/common-compaction.md` (ci-dessous CC), lu intégralement.
- Projection : 42 instructions, bytes couvrant `[0x505C00,0x505C6E)`. Original SHA256 `a9a3657c00325a3d8641238ff73c3400f89c3dff920d3ffdb3a9291a5cde3d58`; compaction `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`; manifeste `03705a61726c3dd316bc1c4618b0e6b621394330e4fa22a5593ea7b1113cd1a5`. Hashes attestés parent/manifeste, non recalculés ici.
- Source native déclarée : x86 32 bits, export du 2026-10-11T16:38:25.140966+00:00, EXE SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` (P/metadata.json:4–9).
- Aucun auteur frère, C, review ou verdict consulté. Le contexte hérité est celui de l'explorateur factuel autorisé, pas une production.

## Rôle et confiance
**CERTAIN (mécanique)** : filtre une requête numérique associée à un objet, puis choisit entre une délégation directe et la création d'un travail avec callback. Dans le second cas, attache l'objet et l'octet bas de la requête au travail, puis parcourt les liens `+0x8C` pour effacer un drapeau WORD dans certains états associés.

**UNCERTAIN (métier)** : il s'agit vraisemblablement d'une requête d'animation d'acteur de présentation, mais le sens précis de l'opération, du drapeau effacé et du callback n'est pas établi par les corps des callees dans cette projection. Le nom historique `BattlePresentation_StartActorAnimation` ne prouve ni « animation » ni un démarrage immédiat.

Nom proposé conservateur : **`Actor_RequestOperation_DirectOrDeferred`**. Verdict : **CERTAIN pour la distinction structurelle direct/différé; UNCERTAIN pour une spécialisation en animation**. Deux preuves indépendantes soutiennent ce nom : délégation directe avec deux arguments à `0x505BC0`, et enregistrement séparé du callback `0x505C70` avec stockage d'un payload par l'autre branche. « Actor » reprend l'identification contextuelle des objets (CC:19,25), non une structure C authentifiée. Pas de promotion demandée.

## Entrées, sorties et effets
- Deux arguments en pile : pointeur objet à `[ESPentrée+4]`, requête DWORD à `[ESPentrée+8]`; retours `RET` sans nettoyage des arguments. EBX/ESI sauvegardés et restaurés. Convention compatible caller-cleanup, sans prototype certifié.
- Si le **DWORD entier** de requête vaut zéro : sortie avant tout accès à l'objet. Sinon, si l'octet objet `+8` possède un bit du masque `0x18` et que la requête ne possède pas `0x1000`, sortie sans appel ni écriture locale.
- Après admission, enlève uniquement `0x1000` de la copie EBX. Aucun test signé : égalités, masques et tests de nullité seulement. Les 16 bits hauts de la requête ne sont pas supprimés.
- Si le DWORD/pointeur objet `+0x8C` est nul : appelle `0x505BC0(objet, requête nettoyée DWORD)`. Cette branche ne tronque pas la requête à un octet.
- Sinon : appelle `0x506C10(0x505C70)`. Si EAX est nul, abandonne sans stockage local ni parcours. Sinon écrit le pointeur objet à `[EAX+0x0C]` (DWORD) et BL à `[EAX+0x15]` (BYTE). Les autres octets du résultat de cette fonction ne sont pas initialisés ici.
- Parcours à partir de l'objet initial : si son octet `+0` possède le masque `0x02`, charge le pointeur `+0x74`, puis applique `WORD[pointeur+0x2C] &= 0xFFBF`, donc efface seulement `0x0040`. Suit ensuite `+0x8C`; s'arrête sur NULL ou retour à l'objet initial. Ni allocation ni callback supplémentaire dans ce parcours.
- **Stride** : aucun pas de tableau dans la cible; parcours par pointeurs `+0x8C`, pas `objet += 0x9C`. Le stride `0x9C` du contexte ne doit pas être substitué au lien.
- Aucun accès global direct visible. Effets indirects des deux callees non bornables ici. Les pointeurs ne sont pas validés; un cycle ne revenant pas à l'origine peut ne jamais terminer.
- **Retour AL/AX/EAX** : aucun résultat fonctionnel homogène. Les sorties initiales laissent EAX entrant; échec `0x506C10` laisse zéro; branche directe laisse le retour/résidu de `0x505BC0`; branche différée réussie laisse le pointeur du travail ou le dernier pointeur d'état chargé à `0x505C49`. AL et AX ne sont pas normalisés indépendamment. Ne pas déclarer un BOOL ou un identifiant de retour établi; une interface sans résultat exploité reste une hypothèse nécessitant les callers.

## Preuves natives (7)
1. **Garde DWORD et override** — `0x505C01–0x505C17`, P/asm-001.txt:2–10 : charge EBX complet, `TEST EBX,EBX`, test BYTE objet+8 avec `18h`, `TEST BH,10h`. P/bytes-001.txt:1 confirme les largeurs. Ceci interdit de remplacer l'entrée par un simple uint8.
2. **Choix et masque exacts** — `0x505C19–0x505C24`, P/asm-001.txt:11–14 : lit `+8Ch`, `AND BH,0EFh`, teste le pointeur et branche vers `0x505C61`. Seul le bit 12 de la requête disparaît; le branchement ne teste pas une taille de collection.
3. **Délégation directe** — `0x505C61–0x505C68`, P/asm-002.txt:11–14 : `PUSH EBX; PUSH ESI; CALL 0x505BC0; ADD ESP,8`. Le déplacement E8 `58ffffff` à P/bytes-001.txt:4 confirme la destination. Preuve indépendante du chemin direct dans le nom proposé.
4. **Callback et payload** — `0x505C26–0x505C3A`, P/asm-001.txt:15–21 : pousse `0x505C70`, appelle `0x506C10` (E8 `e00f0000`, P/bytes-001.txt:2), teste EAX puis écrit objet DWORD `+0Ch` et requête BYTE `+15h`. Preuve indépendante du chemin différé; ne prouve pas quand le callback s'exécute.
5. **Effacement sélectif WORD** — `0x505C3F–0x505C4C`, P/asm-001.txt:23–25 et asm-002.txt:1–2 : EDX=`0xFFBF`, masque objet BYTE `0x02`, charge `[ESI+74h]`, `AND [EAX+2Ch],DX`. Préfixe `66` dans les bytes (`66 21 50 2c`) confirme WORD, pas DWORD.
6. **Liste ou anneau** — `0x505C3D`, `0x505C50–0x505C60`, P/asm-001.txt:22 et asm-002.txt:3–10 : ECX capture l'origine, ESI suit `+8Ch`, compare à ECX puis teste NULL. Traite l'origine avant de suivre le premier lien et ne la retraite pas lors du retour.
7. **Usages contextuels, non preuve de métier** — P/metadata.json:108–120 documente deux appels depuis `0x502380` aux sites `0x502453/0x5024B1`; CC:29 rapporte des callers `0x50B677–0x50B69A` et `0x50BA8A–0x50BA94` faisant `OR AH,10h` avant de pousser EAX complet. Cette construction indépendante est cohérente avec le masque `0x1000`; elle ne certifie pas la signification du code d'opération.

## Divergences et questions ouvertes
- Pas de contradiction mécanique constatée entre ASM, bytes examinés et CC:25. Le contraste « DWORD transmis directement / BYTE stocké dans le travail » est réel, pas une divergence à normaliser.
- Le label historique est plus affirmatif que les preuves métier disponibles; cette limitation n'est pas une contradiction d'opcodes.
- Corps de `0x505BC0`, `0x505C70`, `0x506C10` nécessaires pour nommer précisément l'opération, certifier l'initialisation et la durée de vie du travail, ses effets et l'éventuel sens d'un retour. La mention d'inspection des voisins dans CC:34 ne fournit pas leurs corps ni ces conclusions.
- Sens de `objet+8 & 0x18`, de l'override `0x1000`, de `objet+0 & 2` et de `état+0x2C & 0x40` non établi. Intégrité de l'anneau, aliasing et mutabilité des liens après l'appel non garantis.
- Le parcours n'est effectué qu'après succès du chemin différé. Il ne faut pas attribuer cet effacement à la branche directe sans preuve du callee.
- Les xrefs ne sont pas tous relus : seule la tranche metadata explicitée est utilisée; aucun caller complet n'a été examiné pour son usage de retour. Couverture ASM cible complète, contexte voisin limité.
- Dépôt analytique B uniquement; aucune validation finale §5.6, modification IDB/Git/registre ou action live.
