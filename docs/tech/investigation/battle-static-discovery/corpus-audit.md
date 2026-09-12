# Audit du corpus — registre MagicList 400 × Logic/TextureLoad

## Mise à jour post-extraction du 2026-09-10

Le registre demandé existe désormais dans [`magic-registry.json`](magic-registry.json). Il a été extrait en lecture seule depuis l’IDB consolidée, puis validé indépendamment contre les octets du PE original avec `tools/validate_battle_static_registry.py`.

Résultat de validation :

- SHA-256 binaire : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`;
- 800 slots contrôlés contre le PE;
- `Logic` : 343 non nuls, 57 nuls, 343 pointeurs distincts;
- `TextureLoad` : 343 non nuls, 57 nuls, 343 pointeurs distincts;
- 686 cibles fonctions IDA uniques, 686 ensembles de chunks rehashés;
- zéro pointeur non nul restant sans fonction IDA;
- trois groupes byte-identiques de tailles 17/94/14, mais un seul groupe relocation-aware de 17 loaders `ret`;
- SHA-256 du registre validé : `2815045b891e9543dcff4c2ec432d8fa24e329b35ff4ed1820e1cfc7fc2b472a`.

La clôture **structurelle et byte-exacte** des deux tables est donc atteinte. La clôture **sémantique** ne l’est pas encore : les 686 cibles sont reconnues, mais les familles ne sont pas toutes démontrées par équivalence sémantique et les formats d’assets ne sont pas tous décodés.

Le PE validé est `C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe`. Le fichier `D:\Modding\ff8\retro-exe\FF8_EN.exe.bak` est une base IDA, pas le PE de référence.

## Portée et verdict

Cet audit est documentaire et borné au sous-périmètre magie/G-Force de la phase 8 du plan `battle-static-discovery`. Il ne lance ni IDA, ni observation live, ni recherche web. Il compare le plan avec `magic_effect_table.md`, `gf_families.md`, `gf_asset_loading.md` et `battle_loop_render_pipeline_entrypoints.md`.

Verdict initial de cet audit : le corpus prouvait les deux bases de tables, la convention d’indexation et plusieurs chaînes représentatives, mais ne fermait pas les registres `400 Logic` et `400 TextureLoad`. Ce manque est maintenant corrigé par le registre JSON. Les formulations « master dispatch table » et « all 16 junctionable GFs confirmed » continuent toutefois à ne documenter que des sous-ensembles sémantiques.

Le périmètre restant est donc : (1) classer chaque cible unique, (2) fermer ses callbacks indirects, (3) approfondir les familles et formats. Une entrée non encore comprise reste `non-investiguée statiquement`; elle ne devient `runtime-only` que si le manque est démontré comme dépendant d’un état absent de l’image.

## Preuves déjà présentes

| Preuve | Ce qu’elle établit | Ce qu’elle n’établit pas |
|---|---|---|
| [`magic_effect_table.md:7`](../../reference/magic_effect_table.md:7) | `MagicList_Logic` à `0xC81774`, 400 pointeurs, rôle général | Les 400 valeurs, les nulls, les thunks et les clones |
| [`magic_effect_table.md:9`](../../reference/magic_effect_table.md:9) | Table parallèle `MagicList_TextureLoad` à `0xC81DB8` | La correspondance ligne par ligne et le comportement de chaque loader |
| [`magic_effect_table.md:13-31`](../../reference/magic_effect_table.md:13) | Conversion `effect_id` 1-based → index 0-based et retour du callback | La validité de chaque pointeur et le détail de tous les chemins d’appel |
| [`magic_effect_table.md:50-71`](../../reference/magic_effect_table.md:50) | 16 GFs jonctionnables, IDs non contigus, wrappers 14o (Diablos/Carbuncle/Pandemona/Quezacotl, `FUNC_THUNK=0`) | La couverture des 384 autres lignes et la preuve des loaders associés |
| [`magic_effect_table.md:75-94`](../../reference/magic_effect_table.md:75) | Quelques GFs spéciaux et quatre variantes Gilgamesh | Un inventaire exhaustif des effets spéciaux, Limits et attaques |
| [`magic_effect_table.md:120-170`](../../reference/magic_effect_table.md:120) | Sources documentées des IDs GF : 16 entrées kernel de 132 octets et table non-junctionable de 20 octets | Le dump complet de ces tables, leurs bornes exactes et toutes les écritures runtime |
| [`gf_asset_loading.md:7-14`](../../gforce/gf_asset_loading.md:7) | Deux tables parallèles, stride 4, plage annoncée de 400 IDs | La preuve octet par octet de la plage et l’état de chaque slot |
| [`gf_asset_loading.md:22-34`](../../gforce/gf_asset_loading.md:22) | Resolver commun et ordre reset-arena → loader → callback | Que le loader soit toujours non nul, ni son contrat pour les 400 slots |
| [`gf_asset_loading.md:36-64`](../../gforce/gf_asset_loading.md:36) | Deux exemples de loaders, VFS/disque et arène partagée 1 MiB | Que chaque loader lise exactement deux fichiers ou que chaque fichier existe |
| [`gf_asset_loading.md:66-75`](../../gforce/gf_asset_loading.md:66) | Un format `.00` avec offsets et un `.01` encore non décodé; moteur d’animation partagé | Le format de toutes les familles, les rôles des sections et la parité de tous les effets |
| [`gf_families.md:3-47`](../../gforce/gf_families.md:3) | Trois formes structurelles et quelques exemplars | La classification des 400 implémentations et la preuve d’équivalence des clones |
| [`battle_loop_render_pipeline_entrypoints.md:256-286`](battle_loop_render_pipeline_entrypoints.md:256) | Routes de dispatch et trois représentants Fire/Carbuncle/Alexander | La fermeture de tous les workers et callbacks indirects |
| [`battle_loop_render_pipeline_entrypoints.md:374-384`](battle_loop_render_pipeline_entrypoints.md:374) | L’état consolidé reconnaît que l’échantillon magie/GF doit être étendu | La clôture des registres |

## Hypothèses non prouvées ou trop larges

1. **Cardinalité et contenu.** Les deux docs donnent 400 comme cardinalité, mais aucun inventaire 0..399 n’est présent. Il manque les pointeurs bruts, les sections mémoire qui les contiennent, les lignes nulles, les pointeurs hors image et les thunks.
2. **Type uniforme.** `int(__cdecl*)(int)[400]` est présenté comme type de tableau ([`magic_effect_table.md:7`](../../reference/magic_effect_table.md:7)), tandis que les rôles couvrent magie, GF, attaques et boss. Le prototype réel de chaque cible et les wrappers ABI doivent être vérifiés; le type documentaire ne suffit pas à typer les implémentations.
3. **Parallélisme sémantique.** « matching » et « one per effect » ([`magic_effect_table.md:9`](../../reference/magic_effect_table.md:9)) ne prouvent ni que Logic[i] et TextureLoad[i] forment toujours une paire valide, ni qu’un slot nul est impossible.
4. **Fichiers par loader.** La règle « exactement deux fichiers » est tirée de deux exemples ([`gf_asset_loading.md:38-51`](../../gforce/gf_asset_loading.md:38)); elle ne peut pas être généralisée aux 400 loaders. Le cas Diablos documente en plus un `.tim` ([`magic_effect_table.md:71`](../../reference/magic_effect_table.md:71)), incompatible avec une règle universelle `.00` + `.01` sans qualification par famille.
5. **Familles.** FamilyA/FamilyB/SharedInit sont des formes avec exemplars ([`gf_families.md:9-47`](../../gforce/gf_families.md:9)); « atypique » signifie précisément que le graphe reste partiel. Aucun seuil de confiance ni résultat de hash CFG n’est fourni.
6. **Formats.** Le header de `mag203_b.00` est une fixture utile, mais les rôles de sections sont explicitement non décodés et `.01` est explicitement inconnu ([`gf_asset_loading.md:66-69`](../../gforce/gf_asset_loading.md:66)). Il est donc interdit d’extrapoler ce format à tous les `mag<N>`.
7. **Dépendance runtime.** La résolution de l’`effect_id` depuis kernel et le choix de l’effet actif sont runtime ([`magic_effect_table.md:44`](../../reference/magic_effect_table.md:44)), mais la table de pointeurs, les littéraux de fichiers et les CFG sont statiques. Un trou d’extraction ne doit pas être étiqueté runtime-only.

## Contradictions et points à arbitrer

| Point | Formulation A | Formulation B | Arbitrage requis |
|---|---|---|---|
| Appel du loader | Exemple sans garde : `MagicList_TextureLoad[idx]()` ([`magic_effect_table.md:18-21`](../../reference/magic_effect_table.md:18)) | Resolver avec `if (MagicList_TextureLoad[idx])` ([`gf_asset_loading.md:27-32`](../../gforce/gf_asset_loading.md:27)) | Relever le désassemblage réel : null est-il autorisé, ou la garde est-elle une reconstruction prudente ? |
| Fichiers associés | Loader générique `.00` + `.01` ([`gf_asset_loading.md:36-51`](../../gforce/gf_asset_loading.md:36)) | Diablos charge `mag324.tim` ([`magic_effect_table.md:71`](../../reference/magic_effect_table.md:71)) | Classer par loader/famille; ne pas annoncer une règle unique |
| Nom du resolver | `BattleGF_LoadCallbackByMagicID` ([`magic_effect_table.md:13`](../../reference/magic_effect_table.md:13)) | Alias `Magic_GetIDLoad` ([`gf_asset_loading.md:22-24`](../../gforce/gf_asset_loading.md:22)) | Conserver un nom canonique et documenter l’alias IDA, ABI et VA |
| Bornes | `idx < 0 || idx >= 400` ([`magic_effect_table.md:18-20`](../../reference/magic_effect_table.md:18)) | « range-checked < 400 » ([`gf_asset_loading.md:27-30`](../../gforce/gf_asset_loading.md:27)) | Vérifier le traitement des IDs nuls/négatifs, erreurs et fallback index 0 |
| Clôture du corpus | « all 16 » GFs jonctionnables ([`magic_effect_table.md:48-50`](../../reference/magic_effect_table.md:48)) | Plan : 400 Logic + 400 TextureLoad ([`pasted-text.txt:116-121`](../../../../../../.codex/attachments/c37d5f74-41ba-4660-9546-a41db5ac405d/pasted-text.txt:116)) | Le premier est un sous-ensemble prouvé; le second est le critère de clôture global |

## Nombres, index et formats à verrouiller

- Bases annoncées : `MagicList_Logic = 0xC81774`, `MagicList_TextureLoad = 0xC81DB8`; stride de pointeur `4` octets ([`gf_asset_loading.md:7-14`](../../gforce/gf_asset_loading.md:7)).
- Convention : `effect_id` est 1-based et `idx = effect_id - 1`; les limites attendues sont `idx ∈ [0,399]` ([`magic_effect_table.md:16-25`](../../reference/magic_effect_table.md:16)).
- Kernel junctionable : 16 entrées × `132` octets, `magicID` à `+0x04` ([`magic_effect_table.md:120-134`](../../reference/magic_effect_table.md:120)). Non-junctionable : au moins 15 entrées × `20` octets, `magicID` à `+0x02` ([`magic_effect_table.md:136-150`](../../reference/magic_effect_table.md:136)). Ces bornes doivent être confirmées par bytes avant d’être des formats.
- Arène annoncée : `1 MiB`, table d’allocations jusqu’à `256` entrées ([`gf_asset_loading.md:53-64`](../../gforce/gf_asset_loading.md:53)). C’est un contrat de chargement, pas un format des effets.
- Fixture `.00` : header DWORD fixe (`[0]=0`, `[5]=0x30`, `[1]==[7]`), pointeurs fichier-relatifs `+0x04/+0x10/+0x18` (+`+0x14` table TIM, `+0x20/+0x24` dispatch) — **pas** `section_count=4` (ancien exemple `0xDC14` réfuté : `mag203_b.00` = 73444 o ; voir [`gf_asset_loading.md`](../../gforce/gf_asset_loading.md) « File format », PH9).
- Le plan demande explicitement les 400 pointeurs Logic et 400 loaders, les noms, strings, fichiers, callees et statuts null/thunk ([`pasted-text.txt:116-121`](../../../../../../.codex/attachments/c37d5f74-41ba-4660-9546-a41db5ac405d/pasted-text.txt:116)). Ce sont des champs obligatoires, pas des données déjà disponibles.

## Critères de clôture précis

La tranche `400 Logic + 400 TextureLoad` ne peut être marquée close que si un registre machine-readable et sa version lisible contiennent exactement les lignes `0..399` pour chaque table, sans ligne implicite. Chaque ligne doit contenir : valeur brute, VA/RVA ou nature non-code, statut (`compris`, `clone`, `data-driven`, `null`, `thunk`, `hors plage`, `non-investigué statiquement` ou `runtime-only`), preuve de bytes/xref, et confiance.

Pour `Logic`, il faut ensuite :

- résoudre chaque cible non nulle jusqu’à son entry et ses callbacks indirects pertinents;
- regrouper les implémentations uniquement avec hash bytes/CFG et comparer les paramètres qui empêchent une équivalence;
- fournir une décompilation pour chaque implémentation unique et un représentant pour chaque clone prouvé;
- relier chaque route à sa famille, son `effect_id` source, ses tables de données et son chemin de fin;
- isoler les effets data-driven et les dispatchs indirects (par exemple `dword_187281C`) dans un registre de données, sans les appeler « compris » par simple présence d’un dispatcher.

Pour `TextureLoad`, il faut :

- relever les 400 pointeurs et distinguer null, thunk, loader code, loader partagé et pointeur hors image;
- extraire pour chaque loader les littéraux de fichiers, le nombre d’appels, le VFS/disque utilisé, les écritures d’arène et les globals de sortie;
- relier chaque fichier à un consommateur et à une fixture hashée quand elle existe; marquer `absent` séparément de `non-investigué`;
- documenter les formats seulement avec une preuve code + fixture. Le `.01` reste inconnu tant que son parseur et ses champs ne sont pas décodés.

La clôture doit aussi publier un registre de limites. Une limite `runtime-only` doit donner l’adresse ou le champ concerné, la valeur manquante, la raison pour laquelle l’image statique ne peut pas la fournir et la plus petite observation runtime qui lèverait la limite. Les états actifs (effet choisi, fichier réellement présent, timing, état GPU, parité pixel) peuvent être runtime-only; une cible encore non extraite, un CFG non comparé ou un fichier non recherché sont `non-investigués statiquement`.

## État et périmètre recommandé

| Objet | État prouvé par le corpus | État de clôture |
|---|---|---|
| Bases et cardinalités annoncées | Confirmées par 800 lectures PE | Clos structurellement |
| Convention 1-based/0-based | Confirmée par resolver et registre | Bornes statiques closes |
| 16 GFs junctionables | Sous-ensemble documenté 16/16 | Ne clôt pas les 400 |
| GFs spéciaux/Gilgamesh/Angelo/Phoenix | Plusieurs lignes documentées | Couverture partielle |
| Fonctions cibles | 686/686 créées dans l’IDB, zéro anomalie | Clos structurellement |
| Familles de code | Wave3 : 5 seaux Logic 82/58/111/84/8 prouvés, wrappers ≠ équivalence | Entries closes ; ~120 noms `MagicList_*` 225–344 + inits/ticks à nommer |
| Loaders et fichiers | Wave3 : 265×1 TIM (+Phoenix étendu) / 58 paires / 17 ret / Tonberry 3 / Devour 5 / Cactuar alt ; packs partagés recensés | Formats `.00`(sections)/`.01`(stream) encore partiels, consommateurs H9/H10 C0M ouverts |
| Format `.00` | 1 fixture avec offsets | Généralisation interdite |
| Format `.01` | Mentionné, non décodé | Non-investigué statiquement |

Le premier livrable — registre exhaustif des 800 slots et liste des cibles uniques — est produit. Les entrées qui restent sans preuve doivent maintenant être triées entre `non-investigué statiquement` et `runtime-only`; aucune ne doit être comptée dans un « 100 % » par défaut. Le document d’entrypoints a été mis à jour avec les arbitrages consolidés.
