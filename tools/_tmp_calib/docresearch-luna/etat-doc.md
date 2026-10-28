# Recherche doc : état battle-static-discovery (Luna)

- Question : Inventorier les notes racines, évaluer render/GPU, battle loop, field encounter, audio et input, repérer contradictions/doublons, gaps envers les 218 candidats du ledger et recommander la suite.
- Réponse courte (3–5 phrases) : Documentation très dense et structurée pour le rendu battle/GPU et le déroulé battle loop/init; la preuve du ledger confirme cependant que la clôture sémantique n'est pas complète. L'input n'est abordé que par des points de raccord (HUD/input/ATB), et field encounter/audio n'ont pas de dossier thématique équivalent dans le scope; ce sont des lacunes documentaires relatives, pas une preuve d'absence de code. Les 218 sont un sous-ensemble de file Grok battle, tandis que de nombreuses fonctions battle déjà nommées ou non décompilées ne sont pas représentées par une explication narrative complète. Le corpus identifie explicitement des conflits de description sur la garde du loader et les fichiers associés, et les notes de synthèse datées doivent être lues avec leur date.

## Inventaire des notes racines

Sujet résumé d'après titre et contenu; les références `:1` pointent au titre.

| Note | Sujet en une ligne | Source |
|---|---|---|
| `aali-gamedriver-reference.md` | Comparaison du driver FF8 avec le driver OpenGL Aali. | `docs/tech/investigation/battle-static-discovery/aali-gamedriver-reference.md:1` |
| `battle-model-tools-discovery.md` | Outils, format DAT et chaîne asset→rendu des modèles battle. | `.../battle-model-tools-discovery.md:1` |
| `closure-audit.md` | Audit de clôture statique du pipeline battle et dette restante. | `.../closure-audit.md:1` |
| `corpus-audit.md` | Registre MagicList Logic/TextureLoad et critères de clôture. | `.../corpus-audit.md:1` |
| `driver-abi-spec.md` | ABI et table de slots du driver graphique externe. | `.../driver-abi-spec.md:1` |
| `driver-drop-test-af3dn-2026-09-25.md` | Drop test live du driver AF3DN.P, lot 12-ter. | `.../driver-drop-test-af3dn-2026-09-25.md:1` |
| `driver-drop-test-af3dn-v7-2026-09-25.md` | Campagne de dump draw-lists v7 et décodage PNG, lot 13. | `.../driver-drop-test-af3dn-v7-2026-09-25.md:1` |
| `driver-provenance.md` | Provenance du backend et du chemin de présentation réel. | `.../driver-provenance.md:1` |
| `ffnx-driver-reference.md` | Référence d'interposition graphique FFNX et transposition FF8. | `.../ffnx-driver-reference.md:1` |
| `ffnx-ea-crosswalk.md` | Table de correspondance d'adresses/références FFNX (titre frontmatter). | `.../ffnx-ea-crosswalk.md:1` |
| `glm-mcp-function-budget.md` | Budget de fonctions documentées pour GLM/QMD. | `.../glm-mcp-function-budget.md:1` |
| `HANDOFF_chunk-grok.md` | Consignes de décompilation pour gros chunks. | `.../HANDOFF_chunk-grok.md:1` |
| `HANDOFF_gfx-pipeline-decomp.md` | Handoff de décompilation du pipeline graphique Battle Room. | `.../HANDOFF_gfx-pipeline-decomp.md:1` |
| `HANDOFF_glm-triple-review.md` | Reprise de revue sémantique triple GLM. | `.../HANDOFF_glm-triple-review.md:1` |
| `HANDOFF_lots-8-9-10bis-11.md` | Handoff des lots d'analyse 8, 9, 10-bis et 11. | `.../HANDOFF_lots-8-9-10bis-11.md:1` |
| `HANDOFF_lots-post-magfx.md` | Handoff des contrats renderer après les lots MagFX. | `.../HANDOFF_lots-post-magfx.md:1` |
| `HANDOFF_R1-plan.md` | Plan de fixtures golden et visionneur modèles, R1. | `.../HANDOFF_R1-plan.md:1` |
| `HANDOFF_rewrite-plan.md` | Passage du plan graphique au plan de réécriture Battle Loop. | `.../HANDOFF_rewrite-plan.md:1` |
| `HANDOFF_semantic-triple-review.md` | Reprise de revue sémantique Grok et escalade. | `.../HANDOFF_semantic-triple-review.md:1` |
| `HANDOFF_wave3-apply.md` | Handoff de clôture statique du pipeline graphique battle. | `.../HANDOFF_wave3-apply.md:1` |
| `idb-comments-pack-battle-models-2026-09-25.md` | Pack de commentaires IDB lié aux battle models, lot 14. | `.../idb-comments-pack-battle-models-2026-09-25.md:1` |
| `notes-lot13-session-2026-09-25.md` | Compte-rendu de session dump draw-lists/décodage PNG. | `.../notes-lot13-session-2026-09-25.md:1` |
| `PROMPT_af3dn-drop-test.md` | Prompt de campagne live AF3DN.P. | `.../PROMPT_af3dn-drop-test.md:1` |
| `PROMPT_battle-model-tools-discovery.md` | Prompt de découverte statique des outils modèles. | `.../PROMPT_battle-model-tools-discovery.md:1` |
| `PROMPT_drawlist-dump-decode.md` | Prompt de dump et décodage draw-list live/offline. | `.../PROMPT_drawlist-dump-decode.md:1` |
| `PROMPT_semantic-triple-continue-2.md` | Prompt de reprise sémantique, file d'attente v2. | `.../PROMPT_semantic-triple-continue-2.md:1` |
| `PROMPT_semantic-triple-continue.md` | Prompt de reprise sémantique pipeline graphique. | `.../PROMPT_semantic-triple-continue.md:1` |
| `PROMPT_v8-texture-capture.md` | Prompt de capture texture v8 et export PNG fidèle. | `.../PROMPT_v8-texture-capture.md:1` |
| `r0-arbitrage.md` | Arbitrage R0, périmètre et verdicts PE. | `.../r0-arbitrage.md:1` |
| `r0-scope.md` | Scope figé de réécriture Battle Loop. | `.../r0-scope.md:1` |
| `r1-synthesis.md` | Synthèse R1 du rendu battle extrait, fixtures et errata. | `.../r1-synthesis.md:1` |
| `semantic-certainty.md` | Ledger de certitude des fonctions et file de vérification. | `.../semantic-certainty.md:1` |

## Faits sourcés

| Fait | Source chemin:ligne | Fraîcheur |
|---|---|---|
| Le ledger classe 293 entrées LIKELY/UNCERTAIN/CONFLICT en file et filtre 218 adresses `0x47xxxx–0x51Bxxx` pour la bataille; la prochaine tête indiquée après les trois premières closes est `0x47CEF0`. | `docs/tech/investigation/battle-static-discovery/semantic-certainty.md:21,33-44` | Phase initiale datée 2026-09-15; le ledger ajoute du contenu jusqu'au 2026-09-19 (`:444-464`). |
| Des domaines battle très divers figurent dans le ledger: combat/AI, dégâts, menus/UI, camera, modèles, animation, fichiers et tâches; de nombreuses lignes restent `SKIP_NODECOMP` ou `SKIP_CHUNK`. | `.../semantic-certainty.md:130-170,188-202,291-310,357-429` | État ledger versionné; nombre de file daté comme ci-dessus. |
| R1 détaille dix ensembles de docs rendu et 18 fixtures, tout en précisant que le travail est extraction/spec, pas réécriture du Battle Loop. | `docs/tech/investigation/battle-static-discovery/r1-synthesis.md:25-40,98-107` | Synthèse datée 2026-09-12; corrections plus tardives mentionnées dans le ledger. |
| L'audit de clôture dit explicitement que clôture structurelle oui, sémantique à 100 % non; il conserve des nœuds `non-investigué statiquement`. | `docs/tech/investigation/battle-static-discovery/closure-audit.md:8-26,436-446` | Audit daté 2026-09-11, lots E3c inclus ensuite dans son corps (`:405-434`). |
| La couverture render/GPU est substantielle: pipeline, draw-list, drivers, textures, modèles et fixtures; l'audit décrit toutefois des résidus bornés comme layouts CAM, writers A2 et détails HUD. | `.../r1-synthesis.md:25-40,140-180`; `.../closure-audit.md:189-233,266-290` | R1 2026-09-12; audit clôture enrichi par vagues E3. |
| Le battle loop distingue propriétaire de frame (`FFBattleModule`) et directeur de domaine; l'ordre actif et la séparation HUD/input/ATB sont explicités. | `docs/tech/systems/battle_loop.md:5-10,23-56` | Système; inclut validation live datée 2026-07-12 à `:80`. |
| L'init documente les états, chargements asynchrones, party/enemy/ATB, contrôles pré-battle et fins. | `docs/tech/systems/battle_init.md:7-46,93-120,251-349,394-468` | Système; recoupe des notes 2026-08-30 à `:310,362`. |
| Field encounter apparaît surtout comme fonction de sélection de scène (`Field_Encounter_RollAndSelectScene`), sans dossier field/encounter détaillé dans les notes racines consultées. | `.../semantic-certainty.md:40,121` | Ledger 2026-09-15. |
| Audio apparaît ponctuellement (DSound/Music et AKAO) mais pas comme couverture système audio cohérente. | `.../closure-audit.md:109-111,227-233,415-418`; `.../semantic-certainty.md:113-119,342-344` | Audit enrichi; ledger table même horodatage de phase. |
| Input a des fonctions nommées (`Input_ProcessInput`, `get_key_state`) mais sans C réconcilié dans le ledger; côté battle, le loop lie input au HUD/ATB et à l'évasion. | `.../semantic-certainty.md:111-112,179`; `docs/tech/systems/battle_loop.md:29-36,44-50` | Ledger 2026-09-15; système pour flux. |
| Les candidats callback du graphe sont explicitement des indices extraits de pushes devant enregistreurs, à typer avant preuve; ce n'est pas la même cohorte que les 218 fonctions de la file Grok. | `.../closure-audit.md:259-265,399-403`; `.../semantic-certainty.md:21` | E3c pour graphe, ledger battle pour file; cohortes distinctes. |

## Contradictions / doublons détectés

1. **Loader nullable ou appel direct (contradiction explicite).** `magic_effect_table` montre un appel sans garde; `gf_asset_loading` décrit une garde non-null et l'audit demande arbitrage sur le désassemblage. Citations: `docs/tech/investigation/battle-static-discovery/corpus-audit.md:58-62` (les deux propositions sont reproduites avec leurs sources d'origine). Pas de résolution factuelle établie dans le scope consulté.
2. **Règle universelle de fichiers (contradiction explicite).** Exemples génériques `.00 + .01` face au cas Diablos qui charge `.tim`; l'audit recommande une classification par loader/famille. Citations: `.../corpus-audit.md:53,58-63`.
3. **Doublon de contenu contrôlé, non contradictoire :** battle_loop.md et battle_init.md se recoupent sur propriétaire/directeur, étapes et handoff, mais le premier renvoie au second pour le détail complet. Citations: `docs/tech/systems/battle_loop.md:58-72`; `docs/tech/systems/battle_init.md:7-46`.
4. **Fraîcheur à ne pas confondre avec contradiction :** R1 est daté 2026-09-12, ledger démarre 2026-09-15 puis intègre des résultats 2026-09-19; les totaux/états narratifs de R1 ne doivent pas être lus comme état courant. Citations: `.../r1-synthesis.md:1-4`; `.../semantic-certainty.md:3-7,444-464`.

## Gaps / muet sur les 218

- Le compteur 218 identifie une cohorte par plages d'adresses mais n'associe pas, dans la synthèse de tête, un statut narratif par système; on peut donc établir le total et l'ordre, pas quel sous-système précis représente chaque candidat sans parcourir la table ligne à ligne. `semantic-certainty.md:21,33-44`.
- **Field encounter** est représenté par la fonction de sélection de scène; les conditions et le graphe de rencontre ne sont pas développés dans les documents système autorisés. L'init battle commence après détermination de `COMBAT_SCENE_ID`, sans documenter l'origine field. `semantic-certainty.md:40,121`; `battle_init.md:97-110`.
- **Input**: deux entrées moteur sont marquées sans décompilation réconciliée; `battle_loop.md` décrit l'emplacement d'input dans HUD/ATB et la présentation d'évasion, pas le mapping bas niveau/clavier/contrôleur. `semantic-certainty.md:111-112,179`; `battle_loop.md:29-36,44-50`.
- **Audio**: le ledger contient DSound/Music et setup AKAO dans les plages d'adresses, mais les systèmes autorisés n'en donnent pas d'explication intégrée; la note de clôture cite encore des hubs DSound à nommer/qualifier. `semantic-certainty.md:113-119,342-344`; `closure-audit.md:415-418`.
- **Render/GPU**: c'est le mieux couvert, mais les fonctions `SKIP_NODECOMP`/`SKIP_CHUNK` et zones ouvertes de l'audit restent hors explication sémantique complète, notamment helpers internes, callbacks et grosses fonctions. `semantic-certainty.md:62-77,202,235,291-310`; `closure-audit.md:23-26,266-290`.
- Les docs battle_loop/init sont des synthèses de systèmes, pas un mapping exhaustif des 218 candidats avec EA→preuve→statut. Les fonctions battle/UI/camera/action/AI explicitement `SKIP_NODECOMP` illustrent ces blancs. `semantic-certainty.md:130-170,188-202,237,271-282,401-425`.

## Manques / angles morts

- Aucun document autorisé ne fournit un index croisé exhaustif « 218 candidats → note explicative / preuve / statut »; la table ledger est le seul inventaire fin visible.
- Pas de preuve de couverture complète du field encounter, de l'audio, ni du pipeline input bas niveau dans ce scope.
- Les comptes rendus PROMPT/HANDOFF constituent une part importante des 32 notes racines recensées; ils guident des travaux mais ne sont pas, à eux seuls, des spécifications de système.

## Recommandation (0–3 actions)

1. Publier un index court des 218 adresses avec domaine, note de référence, classe ledger et prochain acte; commencer à `0x47CEF0` conformément à l'ordre annoncé.
2. Prioriser les silences transversaux: field encounter (chemin field→scene id), input de base et audio (routes DSound/AKAO), sans rouvrir le rendu déjà largement couvert.
3. Arbitrer les deux questions du corpus-audit (garde de null et fichiers par famille), puis ajouter un tableau de fraîcheur qui distingue R1 historique, audit enrichi et ledger actuel.
