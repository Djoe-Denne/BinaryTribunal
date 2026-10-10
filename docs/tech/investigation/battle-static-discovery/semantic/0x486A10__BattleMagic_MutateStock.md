# 0x486A10 — propagation sémantique acceptée

## Clôture parent native 2026-10-10

§5.6 native PASS borné : 116 instructions/292 octets, 22 blocs/27 arêtes,
2 CALL vers `0x4954B0` existant et cleanup4, quatre callers CODE17 avec
cleanup12 (quatrième différé `493EEC` XOR puis `493EEE` ADD), stride464,
garde AL signée100..127, six RET plein-EAX0/1/0/0/255/255 ; proposition
numérique fondée sur scans/strides et mutations opposées, pas sur le nom IDA.
Les huit gels et le C byte-exact `c553def5…6432` restent inchangés.
PE SHA `064d466b…89570` et IDB attendu vérifiés avant append
`set_func_cmt`, tag `[semantic-triple 2026-10-10]` unique1, ancien préfixe
préservé, sauvegarde true, readback exact SHA
`52a87fb124d7805c9097969795d35311d3d724175ef31cb8935756e4eafc3516`.
Pas de rename/SetType/patch, ni debugger/runtime ; LIKELY **numérique**,
identité métier et contrat mémoire/ABI universel non prouvés.

- Cible de publication parent : `0x486A10__BattleMagic_MutateStock.md` ; catalogue exact `domain::BattleMagic_MutateStock`.
- Nature : transcription documentaire des conclusions gelées A/V et des deux contextes parent autorisés ; **pas de nouvelle analyse, génération C ou vote**.
- Mode hérité : **1+V**, C corrigé et revue fraîche indépendante ; A == V sur rôle numérique, proposition numérique, confiance et faits ASM sous conditions explicites. Pas de contrôle P4 B/R revendiqué.
- Confiance héritée : **LIKELY NUMERIC** ; identité métier et équivalence universelle non certifiées. Proposition : `sub_486A10_Table32x5_ModifierPaireOctets_Pas464`.

## Rôle numérique hérité de A et V

Compare une clé DWORD aux ID octets zéro-étendus de 32 entrées de pas 5 à la base `0x1CFF082 + 464*index` modulo 2^32, puis, suivant mode zéro/non-zéro, incrémente/crée ou décrémente/efface le count adjacent. Deux sites d'appel opaque suivent création ou décrément à zéro. Clé zéro : EAX=0 sans accès table. Aucun contrôle d'index natif.

## Invariants propagés, sans redérivation

1. **Stride et scans.** `(i + 4*(8*i-i))*16 = 464*i`, modulo 2^32 ; 32 entrées de pas 5, premier match ou premier ID zéro. La formule intermédiaire de `frame_abi.txt` omet le facteur 4 et ne vaut pas 464 ; ce résumé gelé n'est pas réécrit.
2. **Mode et clé.** Mode zéro versus tout DWORD non-zéro. Match : ID octet zéro-étendu contre clé DWORD entière. Création : seul LSB stocké ; clé >255 ne matche jamais, y compris clé `0x100` pouvant créer un ID zéro. Clé zéro court-circuite au début.
3. **Ajout existant.** `cmp al,64h / jge` est signé : refus exactement 100..127, EAX=1. Valeurs 128..255 acceptées ; 255→0 sans effacer l'ID ni appeler. Sinon incrément modulo 256, EAX=0.
4. **Création.** Aucun emplacement ID zéro → EAX=1. Sinon push index original, store LSB d'ID, lecture du count déjà présent, incrément modulo 256 et store count, CALL opaque, EAX=0. Aucun count=1 systématique, ni garde 100..127 sur cette création.
5. **Retrait.** Absence ou count initial zéro → EAX=255 sans effacement. Sinon décrément modulo 256 et stockage du count ; résultat non-zéro → EAX=0. Résultat zéro → count stocké d'abord, puis push index, clear ID, CALL, EAX=255. Le JNZ utilise ZF du DEC, pas du MOV.
6. **ABI et retours.** Trois DWORD cdecl ; quatre sites appelants, cleanup 12 chacun. `493EE7 CALL`, `493EEC XOR EDX,EDX`, `493EEE add esp,0Ch` : quatrième cleanup différé, non absent ni groupé. Six RET C3 aux sites `486A22/486A7E/486A99/486AC6/486AFC/486B33`, EAX complet respectivement `0/1/0/0/255/255`, pas AL seul. EBX/EBP/ESI/EDI sauvegardés, EBP scratch, aucune allocation locale.
7. **Appels opaques.** `486AB8` et `486B22` vers `4954B0`, cleanup 4 chacun ; résultat écrasé, rôle/effets mémoire/terminaison inconnus. L'index original est poussé ; l'argument réellement lu reste intact seulement si table et pile sont disjointes. Cette disjonction n'est pas un fait prouvé par l'ASM.
8. **Couverture héritée.** A/V et revue rapportent 116 instructions, 292 octets, 22 blocs, 27 arcs, six retours, deux appels. SHA-256 natif `de7ca143ac4ec3024ff1bb357745a9ac4e6f9f6a927f5edc245795f6e53c5904`. Aucun nouveau contrôle natif effectué par ce worker.

## Nom catalogue et provenance post-gel

`parent_postfreeze_context.json` rapporte que `domain::BattleMagic_MutateStock` est cohérent avec l'attribution documentaire métier plus large, mais trop spécifique pour la preuve numérique isolée : **ni certifié, ni prouvé faux ; aucun rename**. La proposition numérique repose sur au moins deux familles de preuves indépendantes héritées : `486A35..486A73`, stride 464 et scans 32×5 ; `486A8F..486AB8` et `486B0C..486B22`, incrément/décrément et stores création/effacement.

Le parent rapporte deux hits QMD post-gel utiles, après requêtes exactes `0x486A10` et `BattleMagic_MutateStock` : `qmd://ff8-wiki/_staging/investigations/draw_stock_mutation_paths.md` et `qmd://ff8-wiki/projects/re-ff8/concepts/draw-magic-and-render-bridge.md`. Corroboration documentaire de chemins stock/consommation/ajout et contexte aux5=10, pas preuve métier native/runtime indépendante. Pas de prétention de recherche vide, ni de consultation QMD/wiki par ce worker. Garde signée et mismatch clé DWORD/ID octet qualifient les résumés usuels de stock.

Le pack/C primaires ont exposé des labels/alias IDA avant sanitation : **non strictement aveugles**. C corrigé, revue fraîche et A/V indépendants sont numériques, avec exceptions administratives génériques déclarées ; cela ne certifie pas l'aveuglement universel du contexte. L'échec Flash `uv_spawn` a entraîné un seul remplacement Sol high selon le contexte parent ; les corrections ordinaires ne sont pas des fallbacks. L'override utilisateur de capacité autorise cette propagation Sol après échecs ZAI rate-limit rapportés par la consigne. Aucun nouveau modèle, sous-agent ou readback high revendiqué.

## Limites acceptées et gate parent

- Index DWORD non borné et adresses modulo 2^32 : aucun domaine universel de validité/mappage prouvé.
- RAM ordinaire valide/non-MMIO, stabilité sans mutation concurrente/asynchrone, pile privée et séparation table/pile/contrôle sont des **préconditions**, pas des invariants natifs établis. Normalité de l'ABI et retour du callee opaque requis, non prouvés.
- Le contre-exemple statique de V exclut une équivalence sur tous les alias : avec `S=0x12FF00`, index `0x07B86B9E`, entrée 2 à `S-20` et clé `0x100000F1`, les stores peuvent transformer l'argument poussé en `0x07B86CF1`. Il est hors contrat C, pas exécuté ici, et ne prouve pas l'impossibilité native de cet alias.
- Contrat C32 et conversions/mapping dépendants d'implémentation ; aucune équivalence ISO universelle, backend/compilation, stack traffic exact, flags/faults, native ou runtime démontrée. Effets opaques inconnus.
- `parent_native_gate_final.json` : **PASS_BOUNDED**, déjà vérifié read-only par le parent ; portée conditionnelle conservée, pas nouveau PASS de ce worker.
- IDB push, sauvegarde/readback et commit : **pending parent**, aucune action ni réussite fabriquée.

## Payload accepté et intégrité

Le C est copié une seule fois dans `decomp_candidate.md` depuis `P4_C_re_review_1/c_reviewed_final.c` : 14 761 octets, SHA-256 `c553def5d9814560123b862d577cb368daf899f1581ebdd59429a576b4566432`. Son en-tête historique « pas final accepté » est maintenu verbatim ; l'acceptation postérieure est portée par la revue fraîche et le contexte parent, hors fence. Les 15 entrées sont hash-vérifiées ; les huit fichiers gelés restent inchangés. Voir les deux manifests de propagation pour la preuve mécanique.
