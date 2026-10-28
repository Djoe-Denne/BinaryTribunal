# 0x500900 — contrat sémantique réconcilié R

## Périmètre, provenance et couverture

Mission `ff8-decomp-semantics-20261011-r01`, volet **semantic R uniquement**, tâche `task_mv44rlx4_007q_3y1d6q`. Entrée exclusive : `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g07/0x500900/semantic/`. Aucune consultation du volet C, d'un résultat antérieur, d'un index, d'IDA ou d'une autre session.

Le manifest identifie deux auteurs distincts, tous deux `openai/gpt-6.1-sol/high` :

| Auteur | Session native | Livrable gelé | SHA256 déclaré |
|---|---|---|---|
| A | `ses_ed3cfd2dcffelNZ3S8aEfm3R2U` | `semantic_a.md` | `d8272437884f9c29c5a5c8e5b2c2b2d174cfdbcf73e19668eb1367c5f6349e72` |
| B | `ses_ed3cfcf9affe6Ae7B9i4Phjris` | `semantic_b.md` | `c581491d2e6699a4d8537aca9cc0a933b11b0f02583043aa0246335e6995c2dc` |

Packet original : `0c68458ed2dd63fc4969914f650dfd11176145e5b11dda0e4ce2d917cff21590`; compaction : `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`. Ces déclarations concordent entre manifest, native-manifest et provenance A/B. Le recalcul cryptographique des fichiers n'est pas disponible ici : contrôle des hashes de contenu et hash du présent livrable réservés au parent; aucune incohérence déclarative constatée. L'indépendance des sessions est attestée par le gel parent, non reconstruite par inspection de sessions.

Gel natif : FF8_EN.exe x86 32 bits, SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export `2026-10-11T16:38:25.140966+00:00`.

Lectures bornées : A/B, common-compaction, les deux manifests, packet original, native-metadata, **tous les neuf native-asm et les deux native-bytes**. Le rendu du champ assembly monoligne du packet a été tronqué par l'outil; ce champ n'a pas été utilisé. L'ASM utilisé est exclusivement celui des neuf slices complets, et les deux chaînes hex du packet sont complètes. Aucun raisonnement sur un JSON tronqué. Les outils Context Mode ne sont pas exposés; les lectures restent les lectures courtes bornées expressément autorisées.

Couverture reconstituée : **206 instructions**, chunks demi-ouverts `[0x500900,0x5009A1)` (161 octets) et `[0x5005A0,0x50081F)` (639 octets), **20 blocs CFG**, toutes branches et sortie commune `RET` à `0x50081E`. L'E9 à `0x50099C` rejoint `0x5005A0`. Les destinations des 17 E8 du chunk d'entrée et de cet E9 ont aussi été recalculées sur les octets, sans service externe. Aucune compilation/exécution/différentiel ni validation native finale §5.6.

## Verdict et nom proposé

**Nom proposé : `BattlePresentation_ServiceTasksAndPrepareBuffers` — LIKELY.**

**CERTAIN, mécanique :** orchestrateur sans argument explicite consommé dans le corps. Il sert cinq têtes globales inconditionnellement et une sixième conditionnellement via le même helper, conserve deux retours AL et peut annuler la tête conditionnelle selon EAX entier. Il enchaîne d'autres helpers, exécute trois familles de travail sélectionnées par bits d'un octet, consomme deux fois des paramètres WORD signés, puis prépare cursor/end de paquets et base d'une table indexée.

Le nom repose sur deux familles indépendantes : (1) appels répétés à `0x508420`, têtes globales et résultats de service; (2) calculs de plages de paquets et écritures de bases distinctes dans la queue. La notion de **présentation de bataille** est LIKELY, contextualisée par les callers gelés et le contexte scheduling/TIM de common-compaction:38–42. Les noms historiques, commentaires caméra/GF et le commentaire LIVE d'entrée ne prouvent pas ce métier. « GF/input/upload » comme rôle exclusif est **UNCERTAIN**; aucun verdict live ou de neutralité de l'état de bataille n'est établi.

## Réconciliation A/B et recherche d'erreurs communes

| Sujet | A | B | Arbitrage natif |
|---|---|---|---|
| Stride table, argument de `0x45D610`, retour EAX | `0x4488` | `0x8910`, repris de la compaction | **A correct**. À `0x500803–812` : ECX=17*i; EDX=(i+8*17*i)*16+i=2193*i; adresse=base+8*2193*i=base+`0x4488*i`. Même séquence à `0x5006C8–6D7` et `0x500767–794`; octets concordants. Corriger B ET common-compaction:41. Aucun vote. |
| Nombre de blocs | 19 | 20 | **20**, décompte des objets de native-metadata:11–160. A omet un bloc dans son compte, pas de justification pour réduire la couverture. |
| Nom métier | BattleFrame/ServiceTasks/PreparePresentationBuffers | BattlePresentation/RunTasks/PrepareBuffers | Formulations compatibles, non preuve supplémentaire. Retenir service/préparation, éviter « flip » ou métier GF spécifique. Confiance LIKELY seulement. |
| « Six appels » au helper | Six sites décrits | Six sites décrits | **Six sites statiques, cinq ou six appels exécutés**, le site `0x50093A` est conditionnel. Qualification commune indispensable. |
| Largeurs, rerelectures, gate partiel, retour machine | Accord substantiel | Accord substantiel | Confirmés instruction par instruction ci-dessous, pas par accord. Le sens métier du retour reste UNCERTAIN. |

Contrôles contre erreurs communes : conserver aussi le **premier call `0x500900 -> 0x48D0D0`**, non mis en avant dans leurs résumés; aucune suppression d'un call nommé nullsub. Ne pas mettre en cache un index/flag sur toute la fonction. Ne pas transformer le test EAX en test AL. Ne pas étendre le gate DWORD à toute l'orchestration. Ne pas prendre la compaction « facts only » comme preuve de stride. Aucun conflit bytes/ASM établi sur les instructions examinées.

## Contrat final : entrées et résultat

- Aucun argument de l'appelant n'est chargé depuis la pile; aucun registre d'entrée n'est explicitement consommé avant le premier call. Compatible avec une entrée cdecl sans argument explicite; **cela ne fixe pas un prototype source ni les entrées implicites des callees**.
- Têtes DWORD, ordre de lecture : `0x1D96AA4`, `0x1D96A8C`, `0x1D96AA0`, `0x1D96AAC` (conditionnelle), `0x1D96AA8`, `0x1D96A94`.
- Flags lus **BYTE** à `0x1D96A9C`; bits `4`, `8`, `0x80`. Index lu **DWORD** à `0x1D96A80`, ensuite AND `0xFF` : domaine unsigned 0…255, pas int8. XOR 1 sélectionne une autre valeur; aucune preuve locale que seules 0/1 soient possibles, aucun toggle ni guard ajouté.
- Autres entrées : DWORD handle `0xB8A3E4`, DWORD base courante `0x1D8E04C`, BYTE compteur `0x1D8E03A`, WORDs `0x1D8E038/03C/03E`, DWORD gate `0x1CFF834`, DWORDs pointeurs `0xB6D094/070`. Les familles de tables utilisent les adresses immédiates `0x1D969C8`, `0x1D96980`, `0x1D924DC`, `0x1D8E058`.
- **Retour machine CERTAIN : EAX=`0x1D8E058 + 0x4488*i` modulo 2^32**, égal au DWORD final stocké à `0x1D8E04C`. Ici i est l'index bas-octet chargé à `0x5007B0`, commun à la préparation finale des paquets et de la table. Aucun call après cette lecture. Utilisation contractuelle de ce retour par les callers : **UNCERTAIN**; ni booléen ni prototype void/pointeur public imposé.

## Flux et effets, ordre exact

Les tuples d'arguments ci-dessous représentent uniquement les DWORDs explicitement poussés, dans l'ordre logique cdecl; ils ne déclarent pas de prototypes ni d'autres arguments implicites.

1. **Entrée/service.** Call `0x48D0D0`; trois calls `0x508420` avec lectures successives des trois premières têtes. Store **AL du troisième** à BYTE `0x1D96A90`. Lire la tête DWORD `0x1D96AAC`, nettoyer 12 octets de pile; si nonzero, call `0x508420`, nettoyer 4, tester **EAX entier**. Seulement si EAX=0, store DWORD EAX à `0x1D96AAC`. Ce store peut écraser une nouvelle valeur écrite par le callee : aucun compare-and-clear de l'ancienne tête n'existe.
2. Lire `0x1D96AA8`, call `0x508420`, store **AL** à BYTE `0x1D96A88`. Calls `0x502020`, `0x4BB090`, `0x48D0D0`; lire `0x1D96A94`, call `0x508420`, nettoyer 8 octets (argument de ce call ET celui de `0x500951`, maintenu pendant les calls intermédiaires). Puis `0x48D0D0`, `0x506C30`, `0x48D0D0`, `0x504060`, `0x506E30`, `0x5033E0`, `0x502020`, saut vers la queue. Effets indirects opaques.
3. **Premier bit 4.** Si BYTE flags &4, lire handle, puis index DWORD et masquer/XOR1, puis base courante `0x1D8E04C`. Call `0x4A9160` avec `(baseCourante+8, 0x1D969C8+0x5C*(i XOR 1), handle)`. Relire flags dans **AL**, nettoyer 12, re-tester bit4. S'il a disparu, sauter directement à `0x50065E` : le deuxième call ET le traitement du compteur sont omis.
4. Sinon relire index, calculer lignes actuelle/opposée, lire handle à nouveau et call `0x4A9220` avec `(handle, 0x1D96980+0x14*(i XOR 1), 0x1D969C8+0x5C*(i XOR 1), 0x1D969C8+0x5C*i)`. Lire compteur **dans AL seulement**, nettoyer 16. Compteur=0 : rien; compteur unsigned>16 (`JBE` sur AL pour l'autre branche) : ADD AL,`0xF0`, store BYTE, donc soustraction de 16 à largeur 8 bits. Compteur 1…16 : AND **EAX**,1 élimine tous les bits hauts, call `0x45C310` avec `(compteur &1)`, nettoyer 4, puis store BYTE zéro. Le zéro est écrit après le call, même si celui-ci modifie ce BYTE.
5. **Commun/bit 8.** Calls inconditionnels `0x501B60`, `0x501230`. Relire BYTE flags &8; si set : `0x505D20`, `0x45C9F0` avec `(0x1D8E040,1)`, `0x45C320` avec `(0x1D8E040)`, nettoyer 12 après les deux derniers calls. Le contexte gelé associe `0x505D20` au flush de textures; son corps n'est pas fourni et ce gate est bien dans le caller.
6. **Nouveau bit 4.** Relire BYTE flags &4. Si set : relire index bas-octet, call `0x45B660` avec `(0x1D969C8+0x5C*(i XOR 1))`. Relire index après ce call, call `0x45D610` avec `(0x1D924DC+0x4488*i)`.
7. Dans ce même bloc : MOVSX WORD `0x1D8E038` vers int32, call `0x56CD00` avec ce mot signé. Puis **lire 03E avant 03C**, tous deux WORD signés, et call `0x56CCE0` avec `(signed03C+0xA0, signed03E+0x6C)`. Répéter `0x56CD00` puis `0x56CCE0` en **relisant chacun des WORDs**, dans le même ordre. Nettoyer 32 octets (les huit arguments accumulés depuis `0x45B660`). Stores **WORD zéro à 03E puis 03C**; 038 n'est pas effacé. Aucune fusion de ces passages n'est fidèle si les calls changent les globals.
8. **Gate DWORD.** Lire/tester `0x1CFF834`. Seulement si zéro : relire index bas-octet et call `0x45D550` avec 13 DWORDs `(0x1D8E058+0x4488*i,0x1122,0,1,5,9,0x11,0x1011,0x1019,0x101A,0x101E,0x111E,0xFFFFFFFF)`, nettoyer `0x34`. Le dernier argument est un motif de bits, signedness source inconnue. Le gate ne supprime ni les services précédents ni la préparation suivante.
9. **Préparation finale.** Tester BYTE flags &`0x80`, puis charger index DWORD (MOV ne change pas les flags du TEST). Si set, lire DWORD pointeur à `0xB6D094`, calculer cursor=base+`0x24000*i`; sinon lire DWORD pointeur à `0xB6D070`, cursor=base+`0x1C000*i`. Store DWORD cursor à `0x1D8E054`; ajouter span; store DWORD end à `0x1D969A8`; calculer la table avec le **même i**, store DWORD `0x1D8E04C`; RET, EAX contenant cette adresse.

## Largeurs, ABI, alias et environnement

- Tous calculs d'adresse, additions et shifts entiers : DWORD x86 modulo 2^32, shifts logiques constants 3/4/14. `0x5C=(3*8-1)*4`; `0x14=5*4`; `0x4488=((1+8*17)*16+1)*8`; spans=`9<<14` et `7<<14`. Ne pas transcrire en opérations C signées à overflow indéfini.
- Les chargements AL conservent les 24 bits hauts d'EAX; le compteur n'utilise que AL jusqu'au AND EAX,1. Le test de fin de tête, lui, utilise EAX entier. Aucune donnée AX n'est retournée ni tronquée artificiellement; MOVSX et stores WORD gardent leur propre largeur.
- Calls avec pushes right-to-left, caller cleanup et RET simple, pile équilibrée sur chaque chemin selon ces cleanups. Les nettoyages différés font partie du contrat natif observé; des calls sans push local n'ont pas pour autant un prototype sans arguments prouvé.
- Aucune sauvegarde/modification explicite EBX/ESI/EDI/EBP, aucun opcode x87/SSE dans le corps. **Environnement x87 des callees inconnu**; aucune garantie de reset/préservation ou de comportement flottant inventée.
- Aucun noalias, immutabilité de globals, validation de pointeurs ou invariant d'allocation démontré. Les écritures directes listées gardent leurs largeurs/ordre; les callbacks peuvent changer têtes, flags, index ou WORDs entre les lectures. Les écritures après callee peuvent écraser ses modifications. Aucun caching trans-call, ni suppression de call sur son seul nom.
- Pas de store direct aux buffers d'actions/HP/ATB, pause ou index dans ce corps. Cela **ne prouve pas** l'absence d'effets indirects sur ces données, ni une prise de contrôle sûre/idempotente.

## Huit ancres exactes ASM/bytes/xrefs

Préfixe commun : répertoire semantic d'entrée ci-dessus; `S1…S9`=native-asm-001…009.txt, `H1/H2`=native-bytes-001/002.txt, `M`=native-metadata.json.

1. **Service/largeurs** : `0x500900–0x500956`, S1:1–25, H1:1–4; premier E8 vers `0x48D0D0`, stores A2/AL à `0x500928/956`, TEST EAX à `0x500942`, A3 DWORD à `0x500946`. Sixième site de service `0x500971`, S2:4–7. Prouve distinction AL/EAX et optionalité.
2. **Deux chunks** : E9 `0x50099C`, octets `e9 ff fb ff ff`, S2:15–17, H1:5–7, M:35–49; déplacement signé -1025 vers `0x5005A0`. RET unique `0x50081E`, S9:6, M:155–159. Queue non omissible.
3. **Bit4 et lignes** : `0x5005A0–0x50062D`, S2:16–25/S3/S4:1–5, H1:7–11. Rerelecture AL flags `0x5005DE`, stride `0x5C` et `0x14`, E8 `0x5005D9 -> 0x4A9160`, `0x50062D -> 0x4A9220`.
4. **Compteur/bit8** : `0x500632–0x50068C`, S4:6–25/S5:1–5, H1:11–14. `76 09` à `0x500640`=JBE unsigned, `04 f0`=ADD AL, `83 e0 01`=AND EAX,1; bit8 teste un BYTE à `0x500668`, pas un gate interne inféré.
5. **Stride corrigé et WORDs** : `0x5006C8–0x500744`, S5:19–25/S6, H1:16–20. `8d 14 c8; c1 e2 04; 03 d0; 8d 04 d5 dc 24 d9 01` établit `0x4488`, pas `0x8910`; six `0f bf` WORD, deux paires de calls, `66 c7 05` WORD zéro dans ordre 03E/03C.
6. **Gate étroit** : `0x50074D–0x5007A9`, S7/S8:1–3, H1:20/H2:1–3. Load/test DWORD puis JNZ `0x500754 -> 0x5007A9`; seul `0x45D550` et ses 13 pushes sont sautés, ADD ESP `0x34` à `0x5007A6`.
7. **Plages et retour** : `0x5007A9–0x50081E`, S8:3–25/S9, H2:3–6. Pointeurs chargés aux adresses absolues B6D094/B6D070, stores DWORD cursor/end/table, LEA à `0x500812` et A3 à `0x500819`, EAX non modifié avant RET. Deux spans et stride table indépendamment vérifiables.
8. **Callers gelés** : M:161–191 : quatre calls type17 `0x47D63D/0x47D6C5/0x47D707/0x47D811` dans `0x47CCB0`; jump type19 `0x47D905` dans `0x47D900`. Ne pas convertir ce dernier en cinquième call du directeur. Common-compaction:42 contextualise la distinction; aucun corps caller ni usage EAX fourni.

## Risques résiduels et gate parent

**UNCERTAIN** : métier exact des callbacks, statuts AL, contexte optionnel GF, prototypes réels/effets indirects de tous callees, rôles de `0x45D550` et des helpers sans arguments explicitement poussés, caméra/coordonnées/unités, significations des bits, validité et tailles allouées, invariant upstream index 0/1, emploi du retour par les callers. Captures complémentaires de callers/callees nécessaires seulement pour lever ces incertitudes; aucune n'est inventée.

Pas de divergence mécanique non tranchée sur les données complètes fournies. Les inconnues métier restent UNCERTAIN; le stride est tranché par les instructions, non par une préférence auteur. Le lead conserve le contrôle des hashes, le contrôle natif §5.6, l'acceptation finale, la promotion et toute intégration. Aucun IDB/Git/registre/config/live modifié.
