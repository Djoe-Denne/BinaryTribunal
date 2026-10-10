# 0x4653B0 — candidat sémantique documentaire

Destination parent : `0x4653B0__isUpdateVRAMOrSomething.md` ; aucune installation ou promotion ici.

## Décision gelée

**1+V**, V original **ESCALADE_2+1** conservé, escalation exclusivement procédurale (>200 ; 268 instructions), satisfaite par C aveugle obligatoire + B sémantique/R. **MAINTIEN — LIKELY NUMERIC** ; A==V sur le fond. Pas de nouveau vote, RE ou C-gen.

Nouveauté matérielle B par rapport à **C-final/C-review ET A/V** : **0** ; R-only matérielle : **0**. Les détails nouvellement explicités dans une seule référence et les confirmations ne sont pas des découvertes ; aucun certificat exhaustif d'absence d'erreurs. R n'autorise pas de promotion à lui seul.

**Rôle** : sous gardes DWORD, calcule une adresse indexée, sélectionne des appels opaques et copie séquentiellement des lignes ou 128 octets avec substitution de trois mots locaux, puis examine un état relu pour une seconde voie.

**Nom** : maintien provisoire **`sub_4653B0`**, étayé par deux familles indépendantes (REP ordonnés ; gardes et dispatch +0x64/+0x80/BA8). Le basename catalogue est une destination documentaire, pas une identité validée. `isUpdateVRAMOrSomething`/VRAM/texture/graphique restent non prouvés, pas réfutés ; parent QMD exact EA/nom : **0 hit**, sans nouvelle requête ni bibliothèque inventée, sans rename.

**In / Out / Effets** : trois mots observés à entrée ESP+4/+8/+12 (adresse p, bits d'index, garde), pas un prototype certifié. Allocation 0x110 ; EBP devient longueur. Lectures/relectures RAM, copies DWORD puis BYTE, écritures de frame et calls opaques. Plein **EAX32 natif** path-dependent, sans normalisation booléenne/AL/AX ; le C final **void EFFECTS-ONLY** exclut plein EAX et pile physique sortante et n'établit pas le prototype natif ni une ABI flottante/CW.

## Huit preuves propagées de R, qualifiées par le parent

1. **Source et CFG** — `0x4653B0: 81ec10010000` alloue 272 octets ; `0x4653C0 MOV` / `0x4653C5 JZ` court-circuite à zéro sur le seul null initial. Rapports R/parent : **268 instructions / 880 octets / 45 blocs / 76 arêtes de blocs** ; **299 arêtes de successeurs instructionnels**, pas 299 arêtes CFG-blocs. 32 JZ/JNZ, 3 JMP, 12 CALL (8 sites directs/7 cibles, 4 indirects), 6 REP, un RET. Hash natif rapporté `bbe507d6369efcb4ebbd6814fef60b07e19fff5d9721579395cd705be9bca382`. Gate parent **PASS_BOUNDED**, aucun contrôle natif nouveau ici.

2. **Calcul d'adresse et polarité** — `0x465401..0x46544C` pousse sept mots droite→gauche pour `0x46544D` ; cleanup28 `0x465452`. `0x46543B SAR EDX,CL` : sign-fill et compte &31 ; calcul DWORD modulo 2^32. `0x465449: 8d0c58` = EAX+EBX*2, **pas ESP**. Les seules gardes JZ/JNZ ne prouvent ni positivité signée ni borne.

3. **Comparaisons et invariant local** — `0x465497 CMP ECX,0x10` / `0x46549C CMP [0xB7DB44],1` conditionnent neuf comparaisons : +0x28 contre code, puis +0x30..+0x4C contre +0x6C..+0x88, +0x2C/+0x68 sautés. `0x4654FF/0x465507`, puis `0x465520/0x465522`, retestent le même EAX ; branche 522→5AA infaisable en **flot normal local**, sans call ni écriture EAX sur son chemin entrant. Déjà connue du C final/review ; pas preuve universelle, arête structurelle non supprimée.

4. **rq, capture et route zéro ligne** — `0x46552D/0x4655AE LEA` et `0x465533/0x4655B4 MOV 0x7C` : rq=entrée−252, **124 octets**, seul premier DWORD initialisé ; 120 autres octets indéterminés avant outputs opaques. Scratch séparé entrée−128, **128 octets**. `0x465545/0x4655C6 CALL [table+0x64]` : cinq mots observés `(receiver,0,&rq,0x21,0)` ; suite si EAX=0, receiver/table/cible capturés avant call. Table +0x80 relue à `0x46559A/0x465676`. `0x465637→0x465676` bypass les reloads 66E/672 et conserve EDI/ESI courants. Taille/succès ne prouvent pas l'étendue ou les outputs de rq.

5. **Copies par ligne et vrai stride** — `0x465573/0x46564B REP MOVSD` : longueur>>2 DWORD ; `0x46557C/0x465654 REP MOVSB` : longueur&3 octets. Source avancée de longueur capturée ; destination de stride **relu après chaque ligne** `0x46557E/0x465656` : ESP+52=entrée−236=rq+16=**rq[4], non rq[1]** ; destination initiale rq+36=rq[9]. `0x465588/0x465660 DEC ECX` gouverne backedges ; stores intermédiaires préservent ZF. Forward seulement sous **DF=0**, séquentiel, pas memmove ni borne positive inventée.

6. **128 octets et ordre des effets** — `0x4655DF/0x4655EE` charge deux mots avant `0x4655F2 REP` de 32 DWORD, troisième +0x40 après à `0x4655F4` ; stores scratch[0/1/2] et lecture rq[9] ordonnés. `0x4656E4 PUSH` précède `0x4656E5 REP` de 32 DWORD ; lectures +0x3C/+0x40/+0x44 puis stores correspondants restent intercalés, sans hoisting sous alias. `0x465693 ADD ESP,0x10` nettoie ensemble les deux jeux de deux arguments directs.

7. **Plein EAX et état relu** — Huit arrivées à `0x465696` : 45D mot BA8 non nul (**scalaire 2 possible**), 472 pointeur intermédiaire +0x10, 486 pointeur +0x94, 51B résultat de 513, 54A résultat non nul de 545, 5A5 résultat de 59F, 5CB résultat non nul de 5C6, 693 résultat de 68E. `0x46569B CMP [ESI+0xBA8],1` **relit** state1 sans modifier EAX (state0 gouverne la voie principale). Huit arrivées à `0x465716` : 3C5 zéro ; 6A2 EAX entrant conservé ; 6AF/6B9 zéro ; 6C1/6C6/6D0 pointeur +0x98 ; 713 plein EAX opaque de `0x46570E`. `0x46571F C3` ne réduit pas le retour. C void = effets seulement, pas restitution de ce registre.

8. **Reload physique et ABI bornée** — `0x46558F/0x465667: 8bac2424010000` lit ESP+292 ; équivaut à entrée+4 **seulement si** ESP=entrée−288 et slot stable. Fermeture ESP à RET conditionnelle aux pops indirects20/8, retours normaux et nonvolatiles, **pas preuve ABI des cibles**. Les deux xrefs callers `0x464C49/0x464D85` sont gelées ; parent/V rapportent cleanup12 chacun, écrasement EAX à `0x464C51 XOR`, ou propagation possible sur sortie de boucle après 464D85 jusqu'au RET464DA0. R n'en fait pas une inspection nouvelle des corps. Les douze sites/arity de pushes/effets conditionnels sont recensés dans `decomp_candidate.md` d'après la source revue, pas des contrats décompilés.

## Limites et provenance

Préconditions **non prouvées** : RAM ordinaire séquentielle valide et finie ; C32/i386, alignement/types effectifs/étendues ; pointeurs C sans wrap ; DF0 ; frame privé, slot entrée+4 stable, tables/receivers valides aux captures et reloads ; outputs rq[4]/rq[9] définis et writes bornés ; conservation opaque des nonvolatiles et pops20/8. Alias ordinaires inter-objets non globalement exclus. Plein EAX, pile physique et locaux échappés exclus du C de production. Pas d'équivalence universelle tous états/toutes piles, de preuve MMIO/concurrence, native compilée, runtime, ISO ou backend.

Le primaire pack/C n'était pas strictement aveugle (aliases/labels natifs). Re-review frais et contrôles numériques gardent leurs exceptions administratives héritées/AGENT/ContextMode ; les audits API parent portent sur requêtes observées, pas sur un certificat inconditionnel d'aveuglement de toute infrastructure/contexte. AGENT lu comme trace administrative seulement ; aucun POLICY complet, histoire, QMD/GrepAI/global ctx_search ou source supplémentaire.

C accepté copié sans édition : `P5_C_re_review_1/c_reviewed_final.c`, SHA256 `660e88a0661ddb42d876013491f07fe7341d642a835599440c538af4b253c0fa`. Ancien header/commentaires conservés dans le seul fence C de `decomp_candidate.md` ; acceptation externe `c_review.md`/`findings.json`, **projection effects-only conditionnelle**.

Gel : **18/18 hashes du manifeste**, **8/8 gels production + 3/3 R** inchangés ; résultats et portée effective des lectures dans les deux JSON de cette tâche. Ni régénération C, ni nouveaux faits natifs, vote ou promotion. **Append IDB/save/readback exact et git restent pending parent : non effectués.** Aucun debugger/runtime, queue/registry, écriture hors dossier ou sous-agent.

## Clôture parent native 2026-10-10

Gate ASM §5.6 PASS **borné**, source/hash, callees/callers réels, cleanup, strides, polarités et retour plein-EAX revérifiés par le superviseur. Les 18 inputs et huit gels production plus trois R restent inchangés ; fence C unique et byte-exact (34350 octets, SHA `660e88a0661ddb42d876013491f07fe7341d642a835599440c538af4b253c0fa`).
PE SHA `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` et IDB attendu vérifiés ; append `set_func_cmt`, tag `[semantic-triple 2026-10-10]` unique, ancien préfixe conservé, sauvegarde true puis readback exact SHA `0b4d6eade8197258a5e8fd5cb8cbd1e2197aadeb75189798032f64cf4618a956`. Aucun rename/SetType/patch, debugger ou runtime.
Confiance **LIKELY NUMERIC**, jamais preuve d’identité métier ou d’équivalence ISO/backend/runtime. Escalade V procédurale préservée, R MAINTIEN ; B matériel nouveau contre BOTH baselines = 0 (absence de découverte identifiée, pas certificat exhaustif).
45 blocs / 76 arêtes de blocs, non 299 (successeurs instructionnels). C `void` **effects-only**, exclut plein-EAX natif et pile physique, jamais prototype source ; `BA8=2` peut laisser un EAX scalaire entier.
