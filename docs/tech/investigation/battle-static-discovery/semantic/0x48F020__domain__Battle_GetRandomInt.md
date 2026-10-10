# Sémantique candidate 0x48F020 — `domain::Battle_GetRandomInt` (P2_propagate)

> Candidat issu d'une propagation mécanique déterministe : aucune nouvelle analyse, aucun vote,
> aucune génération. Promotion, push IDB, rename/promotion de classe : interdits à ce niveau —
> `IDB_push_done = false`, `parent_gate_required = true` (le gate appartient au parent).
> Destinataire après gate parent : page sémantique associée à `0x48F020__domain__Battle_GetRandomInt.md`.

## Contrat

- **Rôle (1 phrase)** : RNG bataille à table fixe : avance le curseur d'octet de la lane sélectionnée puis rend le byte indexé par l'ancien curseur, EAX32 zéro-étendu.
- **Confiance** : **LIKELY** — comportement numérique établi sur les 10 instructions ; qualification métier au-delà de la structure non revendiquée.
- **Nom** : `domain::Battle_GetRandomInt`, reçu du contexte parent post-freeze (labels exposés seulement après le gel A/V). Confirmation **STRUCTURELLE** par ancres reçues après le gel A/V — pas le label IDA seul :
  1. Structure numérique racine : lane-adresse stride 1, avance ordonnée du curseur d'octet, lookup ROM `0xB697F8` — structure primitive de tirage.
  2. Caller CODE `0x483190` : consomme EAX masqué FF puis compare 40h et partitionne en quartiles ; call natif existant.
  3. Callers à largeurs distinctes : `0x48CBD6` masque EAX complet puis `idiv 5` signé ; `0x4942CC` consomme AL directement via `mov cl,al`.
  4. 71 xrefs d'entrée toutes CALL type 17 CODE ; aucune xref DATA inventée ; racine sans CALL, RET C3, sans args explicites/cleanup/branche conditionnelle.
- **Accord A/V** : 1 review V, verdict ACCEPTE, zéro désaccord avec A → **A==V**, aucune correction sémantique numérique (`ACCEPTE_without_semantic_correction_numeric_role`).
- **In / Out / Effets** : `i = M32[0x01D2A230] & 255` ; `a = 0x01D2A228 + i` ; `b = M8[a]` ; écriture `M8[a] = (b+1) & 255` ; retour `EAX = zext32(M8[0x00B697F8 + b])` (AX = zext16, EAX[31:8] = 0). Ordre des accès : **M32 read → byte read → byte store → table byte read**, index de table = ancien octet `b`, adresse d'écriture = adresse sauvegardée dans ECX à I3. Registres écrits : EAX (I1,I2,I4,I7,I9), ECX (I3), EDX (I5,I6) ; flags écrits (I2,I6,I7), jamais lus. Aucun argument consommé, aucun CALL, aucun cadre local ; `retn` C3 dépile seulement l'adresse de retour (callee ne purge rien).

## Lane 8 — invariant de domaine EXTERNE

La racine masque **FF (0..255), pas 7** : elle ne force elle-même aucun invariant « 0..7 ». L'invariant « 8 lanes » du sélecteur provient du contexte de domaine/seed **externe**, pas de cette primitive. Aucune constante inventée côté racine ; les faits numériques idx 0..255 et l'alias idx 8..11 restent des faits de modèle, sans hypothèse de pureté/validité mémoire.

## Preuves (6)

1. **I1–I2 (0x48F020/0x48F025)** : `mov eax, ds:0x1D2A230` puis `and eax, 0xFF` — lecture réellement 32 bits (pas une simple lecture 8 bits), sélection 0..255, EAX[31:8] mis à zéro ; le masque est FF, pas 7.
2. **I3–I4 (0x48F02A/0x48F030)** : `lea ecx, [eax+0x1D2A228]` sauvegarde l'adresse **avant** `mov al, [eax+0x1D2A228]` ; la destination d'écriture ne dépend ni du nouvel AL ni d'un sélecteur relu ; les bits hauts d'EAX sont déjà nuls au moment du chargement.
3. **I5–I8 (0x48F036..0x48F040)** : `mov edx, eax ; and edx, 0xFF ; inc al ; mov [ecx], al` — EDX conserve l'ancien octet (zext 8→32), écriture 8 bits à l'adresse sauvegardée, bouclage modulo 256 (255→0) sans retenue vers EAX[31:8].
4. **I9–I10 (0x48F042/0x48F048)** : `mov al, [edx+0x00B697F8] ; retn` — lecture de table **après** l'écriture et indexée par l'ancien octet ; retour AL=r, AX=zext16(r), EAX=zext32(r), sans résidu haut ; la largeur consommée par les callers n'est pas mesurée ici.
5. **Alias idx 8..11** : `0x01D2A230 == 0x01D2A228 + 8` ; pour i=8..11, `a = 0x01D2A230..0x01D2A233` recouvre la lecture M32 initiale, laquelle est terminée avant l'écriture (little-endian x86) ; i=8 peut modifier le prochain sélecteur, i=9..11 ses octets hauts (masqués à la prochaine invocation). Aucune hypothèse de non-alias physique nécessaire ; plages natives slot/table disjointes.
6. **ABI/frame** (`frame_abi.txt`) : FUNC_FRAME non positionné, `frsize=0`, aucun push/pop, EBP non référencé, ESP non référencé hors `retn`, aucun `[esp+x]` lu (aucun argument), zéro CALL dans `0x48F020..0x48F048` ; 71 xrefs near call type 17 ; retour consommé depuis les registres avec projection EAX zéro-étendue.

Le C accepté (`pilot-2026-10-09/c_corrected_sol.c`, copie verbatim dans `decomp_candidate.md`) est concordant avec ce contrat : mêmes valeurs, même ordre M32→byteRead→byteStore→tableRead, même distinction ancien octet (`edx`) / adresse sauvegardée (`addr`), projection limitée aux accès mémoire ordonnés et au résultat EAX complet.

## Questions ouvertes

- Cartographie/validité des mémoires `0x01D2A228..0x01D2A233` (slots), `0x01D2A230` (M32) et `0xB697F8..+255` (table) ; alias physiques éventuels selon le backend abstrait.
- Concurrence/interruptions et comportement réel des helpers `MEM32`/`MEM8`/`SET_MEM8` (déclarations externes, pas des callees natifs observés, non fournis ni validés).
- Consommation caller (AL vs EAX complet) : faits caller documentés comme ancres structurelles, pas mesurés dans cette primitive.
- Identité métier au-delà de la structure : qualification CERTAIN contextuelle non revendiquée.
- Aucun test ISO, compilation ni runtime effectué ; statique ≠ compilation/ISO/native/runtime.
- Invariant « 8 lanes » : non vérifiable à la racine (masque FF, pas 7) ; dépend du contexte externe.

## Provenance

- Analyse A : `P2_A/semantic_a.md` (SHA-256 `9839b37a631ba036d9338c7dd82d09fd82c85d632516b11c315fadb763e5bc26`), analyse numérique provisoire bornée.
- Review V : `P2_V/semantic_v.md` (SHA-256 `2c7a9c30ce905fa1137ab121f83e665a423c1878687790bf20507e14ceb48c4d`), verdict ACCEPTE ; provenance de session notée `openai/gpt-6.1-sol` (conformité de routage à vérifier par l'orchestrator, sans substitution GLM revendiquée).
- Entrées neutres gelées : `P2_neutral_v2/asm.txt` (`a1db4569…`) et `P2_neutral_v2/frame_abi.txt` (`abfcceed…`) ; variantes C neutres lues mais non clôture : `accepted_C_neutral.c` (`f53490bd…`).
- C accepté (clôture) : `pilot-2026-10-09/c_corrected_sol.c` (`31db377a…`), review indépendante Sol, ACCEPTE.
- Spécification finale : `parent_postfreeze_context.json` (`7fe1880e…`), postérieur au gel A/V.
- Cette page : propagation mécanique P2 (2026-10-10), sans apport analytique nouveau.

## Contexte wiki (faits de contexte uniquement, tels que cités par le spec parent)

- `qmd://ff8-wiki/_staging/investigations/battle_rng_storage.md` (`#6a4705`) L29-43, L69-77 — source de contexte stockage RNG citée par le spec parent.
- `qmd://ff8-wiki/_staging/investigations/live_static_closure_2026-06-13.md` (`#93bd63`) L24, L32-43 — live **historique** (`historical_live_not_this_run = true`) : ne constitue aucune validation live de la campagne courante.

## Contradiction signalée — hors périmètre, non arbitrée

- `#6a4705` L49-67 affirme un upstream CRT `rand`/`srand` ; `#93bd63` L35 affirme qu'aucun CRT `rand` n'existe. Contradiction documentaire **non arbitrée ici** : aucune conclusion whole-binary sur le RNG/seeding, aucune campagne live nouvelle. Fait local borné : la racine `0x48F020` ne contient aucun CALL, donc aucun appel CRT dans cette fonction uniquement.


## Gate parent natif 2026-10-10 — clôture

IDB append réel `set_func_cmt`, tag `[semantic-triple 2026-10-10]` unique1,
historique préservé, save attendu `D:/Modding/ff8/retro-exe/FF8_EN.exe - 9.3.i64`
true ; readback exact SHA `51835485b4af2a9807e2c38fa14ddce75f27ae8d8fba5ef1f8ef498ae5f5df18`.

Les mentions candidate/pending de la provenance sont historiques et supersédées par ce gate. §5.6 PASS statique borné : 10/10 instructions, 41 octets et source SHA natif f9531ffbcf5e2663971762983f3afbc20b4674e86649a1ef39cf817a8324f92e. Parent vérifie EAX haut zéro (AND FF), adresse ECX capturée avant AL, ancien byte EDX, ordre M32→M8→store8→table8, zéro CALL/args, RET C3, stride1. 71 xrefs CODE CALL type17, ancres réelles 483190 (EAX/quartiles), 48CBD6 (EAX/idiv5), 4942CC (AL). Pas de condition signée ni shift dans la primitive ; consommation caller distincte. Premier et unique fence C exact, SHA31db377a982f9b409e4d1546e7be5c84110f2c34722ec5c6fb229276951e911a. Confiance LIKELY, contexte post-freeze concordant sans élargir les garanties numériques ni le domaine ; A==V, pas de trigger B/R. Backend/flags/registres hors projection/compilation/native/ISO/runtime restent non prouvés. Aucun test runtime. Preuve parent locale parent_gate_native.json SHAa1148e8b77d17b1bc07c79bc9ae1af43ad64afb1cee57a47f9c91746b06b6356.
