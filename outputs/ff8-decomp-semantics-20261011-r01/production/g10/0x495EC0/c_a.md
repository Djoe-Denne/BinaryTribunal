# C volet A — g10 / 0x495EC0 (2+1, aveugle)

- Mission / tâche : `ff8-decomp-semantics-20261011-r01` / `task_mv44rwys_009x_l5n5n2`
- Rôle : producteur C volet A (session `pool-88`, agent `re-decompile-ensemble`)
- Modèle : admission attendue `openai/gpt-6.1-sol high` (décision lead). Le
  `Model.Ref` effectif de cette session n'est **pas** vérifiable depuis la session
  elle-même → contrôle lead requis avant intégration ; je ne prétends pas être le
  modèle annoncé.
- Entrée gelée (manifeste) : `inputs/ff8-decomp-semantics-20261011-r01/g10/0x495EC0.json`
  - EXE `FF8_EN.exe` sha256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`
  - IDB `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`, bits 32,
    export `2026-10-11T16:38:25.140966+00:00`
  - 1 chunk `0x495EC0`–`0x495EE6` (38 octets), `instruction_count` 16
  - Hash du packet JSON lui-même : **non calculé** (aucun outil de hachage
    disponible dans cette session) → vérification d'intégrité à faire côté lead.

## ⚠ Incident de provenance (à tracer par le lead)

Avant de commencer la production C, un listing de répertoire a exposé
`semantic_a.md` (volet **sémantique A**, pair) et je l'ai ouvert et lu, alors que
la consigne interdit toute lecture d'un autre volet. Contenu vu : verdict,
pseudo-code et interprétations du volet sémantique. **Aucune ligne de ce fichier
n'a été utilisée comme preuve ici** : le décode ci-dessous est dérivé uniquement
des octets du gel (re-décodé à la main après l'incident). La conséquence
d'indépendance n'est pas nulle pour autant (forme de boucle connue à l'avance) ;
le lead arbitre : accepter avec traçabilité, ou re-dispatcher un volet A fresh.
Aucune lecture de c_b, de la réconciliation, du ledger ou des sorties voisines
n'a eu lieu.

---

## 1. Décode vérifié octets → instructions (16/16)

| # | Adresse | Bytes | Instruction | Notes mécaniques |
|---|---------|-------|-------------|------------------|
| 1 | 0x495EC0 | `56` | `push esi` | sauvegarde callee-saved |
| 2 | 0x495EC1 | `57` | `push edi` | sauvegarde callee-saved |
| 3 | 0x495EC2 | `33 FF` | `xor edi,edi` | EDI = 0 (index 32 bits) |
| 4 | 0x495EC4 | `BE B9 DC CF 01` | `mov esi,0x01CFDCB9` | imm32 little-endian |
| 5 | 0x495EC9 | `F6 06 01` | `test byte ptr [esi],1` | lit **1 octet**, teste bit 0 |
| 6 | 0x495ECC | `74 09` | `jz short 0x495ED7` | cible = 0x495ECE + 0x09 |
| 7 | 0x495ECE | `57` | `push edi` | argument **dword** (index courant) |
| 8 | 0x495ECF | `E8 AC FE FF FF` | `call 0x495D80` | rel32 = −0x154 ; 0x495ED4−0x154 = 0x495D80 = `code_targets[0]` |
| 9 | 0x495ED4 | `83 C4 04` | `add esp,4` | nettoyage **cdecl par l'appelant** |
| 10 | 0x495ED7 | `83 C6 44` | `add esi,0x44` | pas = 68 octets |
| 11 | 0x495EDA | `47` | `inc edi` | index +1 (32 bits) |
| 12 | 0x495EDB | `81 FE F9 E0 CF 01` | `cmp esi,0x01CFE0F9` | borne imm32 little-endian |
| 13 | 0x495EE1 | `7C E6` | `jl short 0x495EC9` | cible = 0x495EE3 − 0x1A ; backedge |
| 14 | 0x495EE3 | `5F` | `pop edi` | restauration LIFO correcte |
| 15 | 0x495EE4 | `5E` | `pop esi` | restauration LIFO correcte |
| 16 | 0x495EE5 | `C3` | `retn` | retour near **sans** immédiat |

Somme des longueurs : 1+1+2+5+3+2+1+5+3+3+1+6+2+1+1+1 = **38 octets** =
`end − start` (0x495EE6 − 0x495EC0 = 0x26) → chunk intégralement couvert,
aucun octet orphelin, aucune instruction restée inexpliquée. Le champ
`assembly` du gel correspond à ce décode instruction par instruction (16/16).

## 2. CFG

5 blocs (concordants avec le gel) :
`0x495EC0→0x495EC9` ; `0x495EC9→{0x495ECE,0x495ED7}` ; `0x495ECE→0x495ED7` ;
`0x495ED7→{0x495EC9 (backedge), 0x495EE3}` ; `0x495EE3→[]` (épilogue).
Une seule sortie, une seule backedge → `do-while` avec un `if` interne.

## 3. C complet

```c
/* Production C volet A — 0x495EC0 — mission ff8-decomp-semantics-20261011-r01.
 * Source unique : gel inputs/ff8-decomp-semantics-20261011-r01/g10/0x495EC0.json
 * (EXE sha256 064d466b…9570). Décode manuel, aucun accès IDB/live.
 * Les étiquettes natives sont des identifiants freeze (label-only), pas des preuves. */
#include <stdint.h>

typedef uint8_t  u8;
typedef uint32_t u32;
typedef int32_t  i32;

/* Callee 0x495D80, présent dans code_targets du gel ; étiquette freeze
 * « domain__BattleGF_RecomputeBattleData » (label-only, pas une preuve).
 * Prototype déduit UNIQUEMENT du site d'appel local :
 *   - 1 argument dword empilé (push edi),
 *   - nettoyage par l'appelant (add esp,4) → cdecl sur ce site,
 *   - valeur de retour ignorée (EAX jamais lu après le call).
 * La largeur réellement consommée par le callee est HORS GEL (incertitude §7-1). */
extern void domain__BattleGF_RecomputeBattleData(i32 arg_dword);

/* 0x495EC0 : zéro paramètre (aucun [esp+imm] lu dans la fonction), retour void
 * (EAX jamais écrit), `retn` sans immédiat → cdecl-compatible. */
void sub_495EC0(void)
{
    u8 *p = (u8 *)0x01CFDCB9u;   /* 00495EC4 mov esi,imm32 : base du balayage */
    u32 i = 0u;                  /* 00495EC2 xor edi,edi : index 32 bits     */

    do {
        if ((*p & 0x01u) != 0u) {            /* 00495EC9 test byte [esi],1 ; 00495ECC jz */
            domain__BattleGF_RecomputeBattleData((i32)i);
            /* 00495ECE push edi (dword) ; 00495ECF call ; 00495ED4 add esp,4 */
        }
        p += 0x44u;                          /* 00495ED7 add esi,44h */
        i  = i + 1u;                         /* 00495EDA inc edi (voir §5 : wrap non atteignable) */
    } while ((i32)(uintptr_t)p < (i32)0x01CFE0F9u);
        /* 00495EDB cmp esi,imm32 ; 00495EE1 jl (comparaison SIGNÉE) */
    /* 00495EE3 pop edi ; 00495EE4 pop esi ; 00495EE5 retn
       → sauvegardes/restaurations gérées par le compilateur en C réel. */
}
```

Notes de fidélité du C :
- Le test porte sur **un octet** (`byte ptr`), pas sur un dword : `*p` est `u8`.
- Aucune structure n'est supposée : la base 0x01CFDCB9 est l'adresse de
  l'**octet testé** du premier élément, pas nécessairement un début
  d'enregistrement. Le C avance d'un pas fixe de 0x44 depuis cette adresse.
- `p` n'est pas déclaré `volatile` : l'appel externe opaque force de toute façon
  la relecture à chaque tour chez un compilateur incapable de prouver la
  non-aliasing entre le callee et la zone pointée (le callee peut en théorie
  modifier le tableau, incertitude §7-5). Le decode d'origine relit bien la
  mémoire à chaque itération (`test [esi]` re-exécuté).
- Le `push edi` passe un dword : le C passe `(i32)i` (32 bits). La conversion
  d'index en type consommé par le callee est hors périmètre du site d'appel.

## 4. ABI / pile / registres / flags

- **Paramètres** : aucun. Aucun accès `[esp+imm]` (le seul `esp` utilisé est
  `add esp,4` de nettoyage).
- **Retour** : `void`. EAX n'est écrit nulle part dans la fonction ; EAX/ECX/EDX
  en sortie valent ce que le dernier callee appelé y a laissé (ou restent
  inchangés si aucun appel n'a eu lieu) — l'appelant ne doit pas les lire
  (cdecl : caller-saved de toute façon).
- **Callee-saved** : ESI/EDI sauvegardés en entrée (`push esi`, `push edi`),
  restaurés en épilogue dans l'ordre LIFO inverse (`pop edi`, `pop esi`).
  EBP/EBX/DS/ES/FS non touchés ; pas de frame pointer, pas de `sub esp`.
- **Équilibre de pile** : −8 en prologue ; séquence d'appel par itération
  `push edi` (−4) → `call` (−4) → `add esp,4` (+4) → `ret` callee (+4) = net 0 ;
  épilogue +8 puis `retn` (+4) → pile exactement restaurée. `retn` sans
  immédiat → convention à nettoyage appelant à l'égard des appelants (pas de
  variante stdcall `retn n`).
- **Appel auxcallee** : cdecl sur ce site (nettoyage appelant). Un seul argument
  dword. La pile au premier octet du callee : `[esp]=@ret`, `[esp+4]=index`.
- **Flags** : `test`/`cmp` définissent les flags consommés immédiatement après
  (`jz` sur `test` ; `jl` adjacent à son `cmp`). `inc edi` modifie OF en x86, mais
  le `jl` consomme les flags du `cmp` qui le précède directement — aucun usage de
  flag périmé. Flags non définis à la sortie de la fonction.
- **Largeurs** : aucune op 8/16 bits sur registres (pas d'AL/AX usage ; le seul
  accès 8 bits est la lecture mémoire `test byte ptr [esi],1`). Pas de
  décalage/rotation, pas de mul/div, pas de flottant, pas de string op, pas de
  `cld`/`std`.

## 5. Arithmétique

- Delta de borne : `0x01CFE0F9 − 0x01CFDCB9 = 0x440` = 1088 octets ;
  pas `0x44` = 68 → `1088 / 68 = 16` exactement, reste 0 → **16 itérations**
  (index i = 0..15), sortie quand ESI == 0x01CFE0F9.
- Boucle `do-while` (test en fin) : le corps s'exécute **au moins une fois** —
  pas de garde d'entrée (le CFG n'a pas de bloc de pré-test).
- `jl` est une comparaison **signée** ; ici ESI ∈ [0x01CFDCB9, 0x01CFE0F9], tous
  les deux < 0x80000000 → signé ≡ non signé, aucun wrap possible. Si la base
  était ≥ 0x80000000 le sens changerait — ce n'est pas le cas avec ces constantes.
- `inc edi` : incrément 32 bits modulaire ; le wrap 2^32 n'est pas atteignable
  (16 itérations max, aucune écriture externe d'EDI dans la boucle).
- `add esi,0x44` : imm8 0x44 positif, extension de signe sans effet.
- Overflow d'addition d'adresses : impossible avec ces constantes (max
  0x01CFE0F9).

## 6. Étiquettes natives = label-only (non-preuve)

Présentes dans le gel, **ignorées comme preuve de rôle** :
`domain::Battle_FinalizePartySetup` (nom de fonction),
`SG_ARRAY_GF_DATA.Exists` (opérande du `mov esi`),
`SG_ARRAY_CHARA_DATA.Magic.amount` (opérande du `cmp`),
`domain__BattleGF_RecomputeBattleData` (cible du `call`),
commentaire de pile `gf_id`, et le commentaire IDA d'en-tête (« iterates all 16
GFs … »). Tout ceci est historique, non validé ; le C n'en dépend pas.

## 7. Incertitudes / ouvertes

1. **Callee 0x495D80** : signature et effets hors gel (EA possédé par le groupe
   g14). Prototype ci-dessus = minimum déduit du site d'appel (1 dword, cdecl,
   retour ignoré). Largeur réellement consommée (octet ? dword ?) inconnue.
2. **Tableau** : la forme « 16 × pas 0x44 » est un fait d'octets ; la nature des
   enregistrements, l'offset du drapeau dans l'enregistrement et le sens du bit 0
   ne sont pas décidables depuis ce seul gel.
3. **Borne de fin** : 0x01CFE0F9 = base + 0x440 exactement ; les deux adresses
   sont décalées de +1 octet l'une de l'autre (0x…B9 / 0x…F9) — cohérent avec un
   balayage d'octet-drapeau, mais le C n'émet aucune hypothèse de début de
   structure.
4. **Appelants** (xrefs type 17, appels directs) : 0x48B7E0 @0x48B89D ;
   0x48E620 @0x48E813 ; 0x4971F0 @0x497220. Contexte d'appel (phase, état) hors
   gel de cette EA.
5. **Mutation du tableau par le callee** pendant l'itération : indéterminé ici
   (impacte les appelants et R, pas ce décode qui relit la mémoire à chaque tour).
6. **Segment de données** : les constantes 0x01CFxxxx présupposent la layout
   d'image d'origine ; toute réimplantation (relocation) devra recalculer ces
   constantes.

## 8. Non-claims

- Pas de compilation, pas de test, pas d'accès IDB/live/registre — vérification
  manuelle des octets uniquement ; la validation ASM §5.6 et l'intégration
  appartiennent au lead / à la réconciliation R.
- Rôle mécanique : **CERTAIN** (boucle do-while 16 pas, garde bit 0 d'un octet,
  appel cdecl à 1 dword). Toute lecture métier au-delà est refusée ici
  (appartient au volet sémantique).
