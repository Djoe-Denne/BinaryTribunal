# R — réconciliation C — g10 / 0x495EC0 (2+1, A+B gelés)

- Mission / tâche : `ff8-decomp-semantics-20261011-r01` / `task_mv44rx02_00a1_8asna4`
- Rôle : C volet R (réconciliateur), session `pool-181`, agent `re-reconcile-ensemble`
- Entrées : gel natif `inputs/ff8-decomp-semantics-20261011-r01/g10/0x495EC0.json`
  (+ projection lisible `g10/0x495EC0.readable/` : manifest, asm-001, bytes-001,
  metadata) et livrables gelés des deux auteurs :
  `outputs/ff8-decomp-semantics-20261011-r01/production/g10/0x495EC0/c_a.md` (pool-88, A)
  et `.../c_b.md` (pool-89, B). Sortie : ce fichier `c_r.md` uniquement.
- Aucune lecture du volet sémantique (`semantic_a.md`, pair du présent répertoire),
  du ledger, d'un index de résultats ou d'une session voisine. Aucune mutation
  IDB/git/registre, aucun shell, aucun sous-agent.

## 0. Intégrité du gel — vérifié et non vérifié

- Deux auteurs présents (A/B déposés, un fichier chacun). Fichier review (volet V)
  : **absent — non bloquant** (optionnel dans le contrat ; les livrables attendus
  pour R sont bien les deux volets A/B).
- Cohérence de contenu vérifiée par moi (chevauchement byte-exact) :
  - `bytes-001.txt` (l1 32 octets @0x495EC0 + l2 6 octets @0x495EE0 = 38 octets)
    ≡ hex du chunk `0x495ec0–0x495ee6` du packet, concaténation identique
    caractère par caractère.
  - `asm-001.txt` (16 lignes) ≡ champ `assembly` du packet, 16/16 instructions,
    `instruction_count = 16`.
  - CFG du packet = 5 blocs, identique à la décomposition ci-dessous.
- sha256 **non recalculables** dans cette session (aucun outil de hachage
  disponible, shell interdit) : `original_sha256 2e154d64…8220`,
  `compaction_sha256 2ccc15a8…7a01`, et les sha256 de fichiers du manifest restent
  des **attestations lead**. Aucune incohérence interne détectée ; contrôle hash
  natif final = lead (non remplacé par la présente réconciliation).

## 1. Re-décodage indépendant (octets → instructions, 16/16)

Re-décode effectué par moi directement depuis les 38 octets gelés, **sans** partir
du raisonnement de A ni de B. Résultat identique aux deux volets :

| # | EA | Bytes | Instruction | Contrôles indépendants |
|---|----|-------|-------------|------------------------|
| 1 | 0x495EC0 | `56` | `push esi` | callee-saved, premier sauvegardé |
| 2 | 0x495EC1 | `57` | `push edi` | callee-saved |
| 3 | 0x495EC2 | `33 FF` | `xor edi,edi` | EDI = 0, 32 bits |
| 4 | 0x495EC4 | `BE B9 DC CF 01` | `mov esi,0x01CFDCB9` | imm32 LE |
| 5 | 0x495EC9 | `F6 06 01` | `test byte ptr [esi],1` | F6 /0 **ib** : 1 octet lu, masque bit0 |
| 6 | 0x495ECC | `74 09` | `jz short 0x495ED7` | cible 0x495ECE+9 = 0x495ED7 (bit0=0 → sauter l'appel) |
| 7 | 0x495ECE | `57` | `push edi` | arg **dword** = index |
| 8 | 0x495ECF | `E8 AC FE FF FF` | `call 0x495D80` | rel32 = −0x154 (0xFFFFFEAC) : 0x495ED4−0x154 = 0x495D80 = `code_targets[0]` |
| 9 | 0x495ED4 | `83 C4 04` | `add esp,4` | nettoyage **appelant** (cdecl sur ce site) |
| 10 | 0x495ED7 | `83 C6 44` | `add esi,0x44` | imm8 positif, pas = 68 |
| 11 | 0x495EDA | `47` | `inc edi` | index+1 |
| 12 | 0x495EDB | `81 FE F9 E0 CF 01` | `cmp esi,0x01CFE0F9` | 81 /7 **id** imm32 LE |
| 13 | 0x495EE1 | `7C E6` | `jl short 0x495EC9` | 0x495EE3−0x1A = 0x495EC9, backedge, comparaison **signée** |
| 14 | 0x495EE3 | `5F` | `pop edi` | ordre LIFO correct (inverse des pushes) |
| 15 | 0x495EE4 | `5E` | `pop esi` | restauration correcte |
| 16 | 0x495EE5 | `C3` | `retn` | near, sans immédiat |

Somme des longueurs 1+1+2+5+3+2+1+5+3+3+1+6+2+1+1+1 = 38 = 0x26 = end−start
→ couverture intégrale, aucun octet orphelin, une seule sortie (`retn`), une
seule cible de code externe (`0x495D80`), pas de rep/lock/string/shift/rot/mul/div/FPU.

## 2. Convergences A=B (toutes contre-vérifiées contre le gel)

Aucune n'est retenue sur le seul accord des volets : chaque item a été re-dérivé
des octets par moi — l'accord A=B seul ne dispense jamais du contrôle opcode
§1 — et la liste ci-dessous ne repose que sur ce décodage indépendant.

1. **Corps** : 16 instructions, 38/38 octets, 1/1 chunk, fin `C3` — CERTAIN.
2. **Cible du call** 0x495D80 par calcul rel32 — CERTAIN (coïncide avec
   `code_targets[0]` du gel).
3. **Nettoyage cdecl par l'appelant** de l'argument du callee (`add esp,4`) —
   CERTAIN (mécanisme local).
4. **Test sur 1 octet** (`test byte ptr [esi],1`, masque 0x01) — CERTAIN ;
   bit0=0 → ZF=1 → `jz` → appel sauté.
5. **Boucle** : pas 0x44, borne 0x01CFE0F9, delta 0x440, 0x440/0x44 = 16 reste 0 →
   16 itérations, indices 0..15, sortie quand ESI == 0x01CFE0F9 (jl strictement
   inférieur) ; dernier enregistrement visité 0x01CFE0B5 — CERTAIN (arithmétique
   du gel, recalculée).
6. **Comparaison signée** `jl` ; intervalle [0x01CFDCB9, 0x01CFE0F9] entièrement
   < 0x80000000 → signé ≡ non signé ici, aucun wrap — CERTAIN (sur ces constantes).
7. **`sub_495EC0`** : 0 paramètre (aucun accès `[esp+imm]` de lecture d'argument ;
   seuls usages d'esp : pushes/pops propres et `add esp,4`), `retn` sans immédiat →
   compat cdecl ; retour **void** (aucune écriture EAX dans le corps) — CERTAIN
   au niveau du corps (laissé au niveau ABI : ce que fait un appelant d'EAX n'est
   pas démontré ici).
8. **Callee-saved** ESI/EDI symétriques (push1/push2 vs pop2/pop1) — CERTAIN ;
   pas de frame pointer, pas de `sub esp`, pile exactement rééquilibrée.
9. **Flags** : `test`→`jz` et `cmp`→`jl` adjacents l'un à l'autre ; `inc edi`
   touche OF mais aucun flag périmé consommé — CERTAIN (aucun effet observable
   hors branches).
10. **Étiquettes natives = label-only** (aucune valeur de preuve) : les deux
    volets s'y tiennent ; règle respectée dans le C réconcilié ci-dessous.

## 3. Chasse aux erreurs communes (contrôles supplémentaires)

- **cible rel32** recalculée indépendamment : 0xFFFFFEAC = −0x154, aucune
  lecture alternative cohérente — ✔ cible 0x495D80.
- **immédiat du `test`** : F6 /0 consomme **1 octet** ; un masque imm32 aurait
  donné une longueur différente (6+imm32 au lieu de 2+imm8) — ✔ 3 octets, cohérent
  avec le chaînage des EA et la CFG du gel.
- **borne exacte de sortie** : si le pas ne divisait pas le delta, compte
  différent ; ici division exacte → sortie pile à la limite par `jl` strict — ✔.
- **ordre pop** : pop edi puis pop esi (l'inverse des pushes esi puis edi) — ✔.
- **argument push dword** : `push edi` empile toujours 32 bits, pas un octet — ✔
  (aucune reconstruction en `char` chez A/B).
- **lecture de paramètre entrant** : aucun `mov …,[esp+…]` — ✔ 0 argument.
- **EAX** jamais écrit avant `retn` (aucun `mov eax`/`or eax`/…) ; après le call
  il n'est jamais lu — ✔ void minimal.
- **CFG consolidée** (5 blocs, [(0x495EC0,0x495EC9), (0x495EC9,{0x495ECE,0x495ED7}),
  (0x495ECE,0x495ED7), (0x495ED7,{0x495EC9,0x495EE3}), (0x495EE3,∅)]) = décode — ✔.

## 4. Matrice de divergence et tranchage

| # | Point | A | B | Tranchage (preuve) |
|---|-------|---|---|--------------------|
| D1 | Forme de boucle | `do{…}while((int32_t)(uintptr_t)p < 0x01CFE0F9)` | `for(;;){…; if(rec>=limit) break;}` + forme bornée `for(i<16)` | **sémantiquement identiques**, les trois représentations produisent ici le même flux. La forme **primaire adoptée** est le `do-while` avec comparaison `int32_t` (fidèle à la CFG : backedge 0x495ED7→0x495EC9, corps exécuté ≥ 1 fois, test du flag en tête du corps, avance+comparaison en queue). Commentaire de B « test en tête, avance en queue, jl vers le test » est **imprécis** : la comparaison terminale (cmp/jl) est en **queue**, le test du flag est en tête du corps ; rectifié ici. Les formes bornées chez B (`i<16`) deviennent **variante équivalente documentée**, pas primaire (dépend du dérivé « 16 » ; la forme pointeur reste valable si l'un des deux dérivés était faux). |
| D2 | Prototype callee | `extern void domain__BattleGF_RecomputeBattleData(i32 arg_dword);` | `void __cdecl sub_495D80(unsigned int index);` | **Largeur = dword** : CERTAIN (push dword). **Signedness du consommé : UNCERTAIN** (dépend du callee, hors gel g14) — aucune des deux n'est prouvable ; choix neutre : `unsigned int index` (l'usage local d'EDI est un compteur non signé 0..15 ; pour ces valeurs, signé/non signé encodent des octets identiques). **Nommage** : noms neutres `sub_495D80` adoptés dans le code, étiquette freeze `domain__BattleGF_RecomputeBattleData` conservée **en commentaire uniquement** (label-only ; le vote métier appartient au volet sémantique, pas au C). |
| D3 | Caching de `*p` / `volatile` | soulevé (pas de volatile, justifié par l'opacité du callee) | non traité | **Adopté tel quel, avec garde écrite** : tant que le callee reste une fonction externe opaque appelée **entre les itérations**, un compilateur conforme ne peut pas cacher la valeur de `*p` (le callee peut écrire dans la zone) → sans `volatile`, la relecture `test [esi]` est garantie. Si un jour le callee est inliné/montré pur, ajouter `volatile` sur le pointeur pour préserver la relecture — noté en limite, pas de divergence fonctionnelle ici. |
| D4 | xrefs appelants | listées (0x48B7E0@0x48B89D, 0x48E620@0x48E813, 0x4971F0@0x497220, type 17) | non disponibles (permission refusée), demandées à R | **Adoptées depuis le gel** (packet `xrefs_to`, trois appels directs iscode) — intégrées §8. Pas de divergence de fond, écart d'accès seulement. |
| D5 | Provenance A | **incident déclaré** : lecture non autorisée de `semantic_a.md` (volet sémantique pair) avant production C ; auteur affirme n'en avoir pas utilisé le contenu | — | **Tracé lourd, effet neutralisé pour C** : je n'ai pas lu ce fichier ; chaque affirmation technique de A a été re-dérivée des octets du gel (§1), donc le livrable réconcilié ne repose sur aucun élément de sémantique. L'éventuelle contamination de **forme** (boucle `do-while` déjà « connue ») est sans effet : la forme était dérivable de la seule CFG. L'arbitrage accepter/re-dispatcher un A fresh = **lead** (signalé). Statut : tracé de provenance, pas de CONFLICT technique. |
| D6 | Provenance B ; modèle runtime | admission annoncée `openai/gpt-6.1-sol high`, readback non vérifiable côté session | source citée `.tmp/ff8-decomp-semantics-20261011-r01/native/0x495EC0.json` ; assignation `opencode-go/gpt-6-luna medium`, runtime réel `zai-coding-plan/glm-5.3-flash` ; contrôle renvoyé au lead | **Contenu B vérifié contre mon gel byte-exact** (hex + timestamps + input_sha256 identiques) → l'écart de chemin de citation n'entame pas la preuve (provenance de chemin tracée, mineure). Modèles : correctif 2026-10-12 du guide de mission — mentions de modèle historiques, discordance **tracée, non bloquante** pour la production C ; contrôle `Model.Ref`/routing = lead. |
| D7 | Sémantique du bit0 / « GF » | refusée au C (hors périmètre) | idem | **Convergence = règles de rôle** : aucune lecture métier au C. Le bit0 et la zone balayée restent factuels (§9, UNCERTAIN de sens). |

## 5. C réconcilié complet (livrable primaire)

```c
/* R réconcilié — 0x495EC0 — mission ff8-decomp-semantics-20261011-r01.
 * Unique source de vérité : gel inputs/ff8-decomp-semantics-20261011-r01/g10/0x495EC0.json
 * (input_sha256 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570,
 * IDB "FF8_EN.exe - 9.3.i64", bits 32, export 2026-10-11T16:38:25.140966+00:00).
 * Noms neutres ; étiquettes natives citées en commentaire = label-only (pas preuve).
 * Aucun accès IDB/live; reconstruction statique uniquement. */

#include <stdint.h>

/* Callee 0x495D80 (EA possédée par g14, hors gel de cette cible).
 * Prototype minimum déduit du SEUL site d'appel local :
 *   1 dword empilé (push edi), nettoyage par l'appelant ici -> cdecl-like sur ce site,
 *   retour non lu localement (EAX non consulté après le call).
 * Signedness réellement consommée et effet de bord : HORS GEL -> limites §7. */
extern void sub_495D80(unsigned int index);   /* freeze label: domain__BattleGF_RecomputeBattleData (label-only) */

/* 0x495EC0..0x495EE6 : 0 paramètre (aucun accès [esp+imm] d'argument), retn sans
 * immédiat -> compatible cdecl ; retour void (aucune écriture d'EAX dans le corps). */
void __cdecl sub_495EC0(void)
{
    unsigned char *p;                     /* ESI — curseur octet ; 00495EC4 mov esi,0x01CFDCB9 */
    unsigned int   i;                     /* EDI — index 0..15 ;        00495EC2 xor edi,edi */

    p = (unsigned char *)0x01CFDCB9u;     /* base = octet-drapeau du 1er élément balayé */
    i = 0u;

    do {
        if ((*p & 0x01u) != 0u) {         /* 00495EC9 test byte ptr [esi],1 ; 00495ECC jz -> 00495ED7 */
            sub_495D80(i);                /* 00495ECE push edi (dword) ; 00495ECF call ; 00495ED4 add esp,4 */
        }
        p += 0x44u;                       /* 00495ED7 add esi,44h */
        ++i;                              /* 00495EDA inc edi */
    } while ((int32_t)(uintptr_t)p < 0x01CFE0F9);
        /* 00495EDB cmp esi,0x01CFE0F9 ; 00495EE1 jl (comparaison SIGNÉE; backedge -> 00495EC9) */
        /* valeurs < 0x80000000 sur tout l'intervalle -> signé ≡ non signé ici. */
    /* 00495EE3 pop edi ; 00495EE4 pop esi ; 00495EE5 retn (c3) — gérés par le compilateur réel. */
}
```

Variante équivalente dérivée (documentée, non primaire — dépend du dérivé « 16 »;
même flux conditionnel, octet par octet, pour i∈[0,15] avec i×0x44 sans débordement) :

```c
void __cdecl sub_495EC0(void)
{
    unsigned char *base = (unsigned char *)0x01CFDCB9u;
    unsigned int i;
    for (i = 0u; i < 16u; ++i)            /* (0x01CFE0F9 - 0x01CFDCB9) / 0x44 == 16 exact */
        if ((base[i * 0x44u] & 0x01u) != 0u)
            sub_495D80(i);
}
```

Notes de fidélité du primaire :
- `test byte ptr` = **1 octet** lu par itération ; `*p` est `unsigned char`.
- Le callee est externe/opaque et appelé entre les itérations : la relecture de
  `*p` à chaque tour est garantie sans `volatile` (limite : ajouter `volatile`
  si le callee devient inliné/montré pur — §4-D3).
- Adresses absolues 0x01CFDCB9/0x01CFE0F9 : constantes de l'image d'origine ;
  toute réimplantation devra les recalculer (limite §7).
- Les `push/pop` encadrant le corps (0x495EC0/C1 et 0x495EE3/E4) sont le
  prologue/épilogue x86, pas du C source : le compilateur génère l'équivalent
  pour cette signature — ils sont cités en commentaire, pas en code.

## 6. ABI / pile / registres / flags / largeurs (tranché)

- **Conventions** : sub_495EC0 appelable en cdecl (0 arg, `retn` sans immédiat,
  nettoyage des arguments par l'appelant) ; au site d'appel de sub_495D80,
  nettoyage effectif `add esp,4` par CETTE fonction → **cdecl-like sur ce site** ;
  la convention *réelle* du callee (stdcall possible si le callee nettoie
  lui-même ses arguments à son `ret n`) reste hors gel.
- **Pile** : prologue −8 ; séquence par itération net 0 (−4 push, −4 call,
  +4 add esp,4, +4 ret callee) ; épilogue +8 puis `retn` (+4) → exactement
  restauré. Pas de frame ebp, pas de locales, pas d'alignement démontré depuis ce
  seul gel (aucune SSE) — laissé non démontré.
- **Registres** : ESI/EDI callee-saved, symétriques. EAX/ECX/EDX caller-saved ;
  EAX non écrit localement (valeur en sortie : résidu du dernier callee appelé,
  non déterministe selon les GFs existants). Aucune opération 16/8 bits sur
  registres (aucun AL/AX/AH) ; l'unique accès 8 bits est la lecture mémoire
  `test byte ptr [esi],1`.
- **Flags** : définitions consommées de façon immédiatement adjacente ; `inc edi`
  (OF touché) jamais relayé par une lecture périmée ; rien d'observable en sortie.
- **Arithmétique** : inc modulaire sur EDI, wrap 2^32 non atteignable (16 tours) ;
  `add esi,44h` imm8 signé positif (extension de signe sans effet) ; comparaison
  `jl` signée, équivalente en unsigned sur l'intervalle réel ; pas de shift/rot,
  pas de mul/div, pas de FP, pas de string op.

## 7. Incertitudes restantes (hors tranchage possible depuis ce gel)

1. **Callee 0x495D80** (g14) : consommation réelle de l'argument (largeur utilisée
   après le push dword : octet ? dword ?), signedness consommée, type de retour,
   effets de bord (mutation potentielle du tableau balayé pendant l'itération ;
   le décode local relit la mémoire à chaque tour, donc aucune contradiction de
   preuve ici), exigences d'alignement de pile — **UNCERTAIN**.
2. **Sens du bit0** et nature des enregistrements 0x44 : indécidable mécaniquement ;
   label-only `SG_ARRAY_GF_DATA.Exists` @0x01CFDCB9 et
   `SG_ARRAY_CHARA_DATA.Magic.amount` @0x01CFE0F9 (là la borne, pas un accès) —
   appartiennent au volet sémantique. **UNCERTAIN** au C (factuel seulement :
   bit0 du 1er octet de chaque pas de 0x44, base impaire ≡ 1 (mod 4) —
   alignement non démontrable, array-of-records vs flags espacés : les deux
   formes restent cohérentes avec les octets).
3. **Contexte d'appel** des 3 xrefs (phase/guards) : hors gel de cette EA —
   **UNCERTAIN** au C.
4. **Adresses absolues** : réimplantation/relocation à recalculer côté intégration.

## 8. Appelants / xrefs (du gel, adoptés tel quel)

`type 17` = call direct vers 0x495EC0 :
- depuis 0x48B89D (fonction 0x48B7E0),
- depuis 0x48E813 (fonction 0x48E620),
- depuis 0x497220 (fonction 0x4971F0).

## 9. Verdicts

- **Rôle mécanique du corps = CERTAIN** : do-while 16 pas (pas 0x44), test du
  bit0 du premier octet de chaque pas sur 1 octet, appel cdecl à 1 dword quand
  le bit vaut 1, index dword 0..15 en argument, aucun paramètre entrant, retour
  void, pile rééquilibrée. Toutes ces assertions sont des faits d'octets du gel,
  re-dérivés indépendamment par R (cf. §1, §3) — l'accord A=B n'y avait **pas**
  suffi.
- **Au-delà du mécanique (sens du drapeau, métier, nommage réel du callee,
  structure d'enregistrements) : hors périmètre du C**, laissé UNCERTAIN, pas
  inventé en CERTAIN.
- **Aucun CONFLICT technique non tranché** entre A et B (toutes divergences ont
  été arbitrées §4). Restent 2 signalements de provenance pour le lead :
  (S1) A a ouvert `semantic_a.md` avant la production C (effet neutralisé pour
  le C réconcilié car toutes les preuves sont re-dérivées du gel ; arbitrage
  accept/re-dispatch A fresh = lead) ; (S2) B cite une source `.tmp/...` et un
  modèle runtime différent de l'assignation — contenu vérifié byte-exact contre
  mon gel, discordance tracée conformément au correctif 2026-10-12 (non bloquante).

## 10. Non-claims

- Pas de compilation, pas de test, pas d'accès IDB/live/registre/shell ; la
  validation §5.6, la saisie du readback `Model.Ref` et l'intégration finale
  appartiennent au lead.
- Pas de recalcul des sha256 dans cette session (attestations lead à confirmer
  côté natif).
- Pas de promotion de label, pas de décision sémantique (métier) — le volet
  sémantique possède sa propre piste.
