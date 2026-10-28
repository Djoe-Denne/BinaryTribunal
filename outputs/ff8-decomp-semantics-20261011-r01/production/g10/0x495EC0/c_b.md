# PRODUCE C — volet B — g10 / 0x495EC0

- Mission: ff8-decomp-semantics-20261011-r01, run01
- Producteur: session pool-89 (fork indépendant depuis la session explorateur gelée discover-g10), rôle B (2+1)
- Date: 2026-10-12
- Statut: reconstruction C factuelle du gel. Aucun verdict sémantique, aucune promotion de label.

## 0. Source de vérité (gel)

- Paquet: `.tmp/ff8-decomp-semantics-20261011-r01/native/0x495EC0.json`
- IDB: `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`
- Input: `C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe`, 32 bits
- `input_sha256: 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`
- Export gel: 2026-10-11T16:38:25.140966+00:00
- Label IDA (artefact de nommage, SANS valeur de preuve): `domain::Battle_FinalizePartySetup`
- Commentaire IDA inline (artefact, sans valeur de preuve): «Finalize party setup: iterates all 16 GFs, for each existing GF calls sub_495D80 to set up GF battle data.»

Chunk gelé, cité verbatim (1/1 chunk, function complète — se termine par `c3`):

```
start 0x495ec0  end 0x495ee6 (fin exclusive)  0x26 = 38 octets
hex 565733ffbeb9dccf01f60601740957e8acfeffff83c40483c6444781fef9e0cf017ce65f5ec3
```

## 1. Désassemblage vérifié (décodé octet par octet du hex gelé)

16 instructions, 38 octets, aucune lacune, aucun octet résiduel (0x495EE6 - 0x495EC0 = 0x26 = somme des longueurs).

```
00495EC0: 56                 push    esi
00495EC1: 57                 push    edi
00495EC2: 33 FF              xor     edi, edi                      ; index = 0
00495EC4: BE B9 DC CF 01     mov     esi, 1CFDCB9h                 ; base = 0x01CFDCB9
00495EC9: F6 06 01           test    byte ptr [esi], 1             ; bit0 du 1er octet de l'enregistrement
00495ECC: 74 09              je      short 00495ED7                ; bit0 clair -> sauter l'appel
00495ECE: 57                 push    edi                           ; arg unique (dword) = index
00495ECF: E8 AC FE FF FF     call    00495D80                      ; rel32 -0x154: 0x495ED4 - 0x154 = 0x495D80
00495ED4: 83 C4 04           add     esp, 4                        ; nettoyage par l'APPELANT (cdecl)
00495ED7: 83 C6 44           add     esi, 44h                      ; pas = 0x44 octets
00495EDA: 47                 inc     edi                           ; index++
00495EDB: 81 FE F9 E0 CF 01  cmp     esi, 1CFE0F9h                 ; fin = 0x01CFE0F9
00495EE1: 7C E6              jl      short 00495EC9                ; signé; retour au test
00495EE3: 5F                 pop     edi
00495EE4: 5E                 pop     esi
00495EE5: C3                 ret                                   ; ret 0 -> convention cdecl côté appelant
```

Arithmétique du rel32 du call: `0xFFFFFEAC` signé = −0x154 ; IP suivant 0x495ED4 ; 0x495ED4 − 0x154 = **0x495D80**. Cible vérifiée, aucune autre cible de code dans la fonction.

Arithmétique de la boucle: `0x01CFE0F9 − 0x01CFDCB9 = 0x440` ; `0x440 / 0x44 = 16` exactement → **16 itérations**, index `edi` = 0..15, enregistrements à `0x01CFDCB9 + 0x44*i` (dernier: 0x01CFE0B5), sortie quand `esi == 0x01CFE0F9` (incrément final de 0x01CFE0B5 + 0x44).

## 2. Reconstruction C

```c
/* Contrat observé au site d'appel pour le callee — voir §4; type de retour non vérifié. */
void __cdecl sub_495D80(unsigned int index);

/* 0x495EC0 — reconstruction fidèle au flux de contrôle réel:
   test en tête, avance en queue, jl vers le test. */
void __cdecl sub_495EC0(void)
{
    unsigned int    index;                     /* edi — compteur 0..15, dword */
    unsigned char  *rec;                       /* esi — pointeur d'enregistrement */

    index = 0u;                                /* 00495EC2 xor edi,edi */
    rec   = (unsigned char *)0x01CFDCB9;       /* 00495EC4 mov esi,1CFDCB9h */

    for (;;)
    {
        if ((rec[0] & 0x01u) != 0u)            /* 00495EC9 test byte ptr [esi],1 */
            sub_495D80(index);                 /* 00495ECE..00495ED4 push/call/add esp,4 */

        rec += 0x44u;                          /* 00495ED7 add esi,44h */
        index++;                               /* 00495EDA inc edi */

        if ((ptrdiff_t)rec >= (ptrdiff_t)0x01CFE0F9)  /* 00495EDB cmp; 00495EE1 jl boucle */
            break;
    }
    /* 00495EE3..00495EE5 pop edi; pop esi; ret — rien en eax, aucun retour observable */
}
```

Forme équivalente bornée (lecture seule, même sémantique, bornes dérivées du gel):

```c
void __cdecl sub_495EC0(void)
{
    unsigned char *base = (unsigned char *)0x01CFDCB9;   /* 16 enregistrements, pas 0x44 */
    for (unsigned int i = 0u; i < 16u; i++)              /* (0x1CFE0F9-0x1CFDCB9)/0x44 == 16 */
        if ((base[i * 0x44u] & 0x01u) != 0u)
            sub_495D80(i);
}
```

## 3. ABI / pile / registres — preuves

- **Convention appelant**: `ret` sans immédiat (0x495EE5) → la fonction ne nettoie aucun octet d'arguments → prototype `void __cdecl f(void)` compatible. Aucun paramètre entrant lu: la fonction ne référence jamais `[esp+8]`/`[esp+0Ch]` (seuls accès esp: ses propres push/pop et l'argument transitoire).
- **Retour**: eax jamais écrit, jamais lu → aucun résultat restitué; type `void` (le corps ne peut pas prouver ce que fait un éventuel appelant de eax; ici eax n'existe même pas comme sortie de CE corps).
- **Sauvegardes callee-saved**: esi, edi push/pop symétriques (0x495EC0/C1 vs 0x495EE3/E4). ebx/ebp non touchés. eax/ecx/edx jamais touchés localement (volatile, inchangés par ce corps hors appel).
- **Drapeaux**: `test` → ZF consommé par `je`; `cmp esi,imm32` → `jl` consomme SF≠OF. `inc edi` modifie les drapeaux sans branche associée — sans effet.
- **Pile**: delta net nul à la sortie (2 push / 2 pop); argument transitoire 1 dword nettoyé par l'appelant (`add esp,4`). Pas de frame ebp, pas de locales. Alignement 16 octets de esp à l'appel: non démontrable depuis ce seul gel (aucune instruction SSE ici); non asserté.
- **Largeurs/signes**: index dword non-signé (edi, 0..15, jamais signé en usage); test sur **byte** (`test byte ptr [esi],1`, largeur 1 octet exactement); comparaison de boucle **signée** (`jl`) sur des valeurs toutes < 0x80000000 → signé/non-signé équivalents sur tout l'intervalle d'itération; aucun wrap possible (16 itérations bornées, borne inférieure de l'intervalle d'adresses).

## 4. Callee 0x495D80 — uniquement ce qui est prouvé au site d'appel

- Cible unique du call, calculée du rel32 (§1). Nom `sub_495D80` = nom automatique IDA (le commentaire du gel dit «sub_495D80»), pas un nom validé.
- Argument: exactement **1 dword** empilé (`push edi`), pointeur de pile rendu à son état par `add esp,4` → nettoyage **appelant** (style cdecl). 
- Le corps de 0x495EC0 ignore eax après le call → type de retour du callee **non vérifiable ici**; `void` dans le prototype est une hypothèse minimale d'appel, non une preuve.
- Signedness et sémantique de l'argument: **inconnus** (dépendent du callee, hors gel possédé). Aucune lecture du paquet 0x495D80 (g14) — accès gel refusé à cette session producteur et hors périmètre possédé; déclaré comme incertitude, pas contourné.
- Aucun library call, aucun callee inventé: le seul transfert de contrôle sortant est ce call vérifié.

## 5. Observations factuelles sans verdict

- Base 0x01CFDCB9 **non alignée** (impair; ≡1 mod 4) → la zone parcourue est soit un tableau d'enregistrements de 0x44 octets démarrant sur un champ byte, soit 16 flags espacés de 0x44 octets à l'intérieur d'une structure plus grande. Indécidable depuis ce gel.
- 0x01CFDCB9..0x01CFE0F9 est dans une région de données cohérente avec les autres fonctions g10 (0x48FE20 référence 0x1CFBD7B/0x1CF8..; 0x48D200 référence 0x1D28000/0x1CF80E0) — cohérence de région uniquement, pas de preuve de structure.
- Le bit0 du premier octet est la seule condition; sa signification est **inconnue** (le label/commentaire IDA suggère «GF existe» — artefact de nommage, aucune valeur de preuve, non repris comme fait).
- «16» est ici un fait arithmétique du gel (§1), indépendant de toute connaissance externe sur FF8.

## 6. Incertitudes et validations non exécutées

1. `xrefs_to`, `code_targets`, `instruction_count` et le texte ASM ligne-à-ligne du paquet: **non capturés** — la permission de lecture du répertoire gel a été refusée à cette session producteur après handoff (le corps complet est couvert par le hex du chunk, cité in-extenso par le paquet lui-même; décodage complet et auto-cohérent: 38 octets, 16 instructions, fin `c3`). xrefs entrants de 0x495EC0 à récupérer par le lead/réconciliateur si requis.
2. Type de retour et signedness du paramètre de 0x495D80: non vérifiés (§4).
3. Alignement de pile exigé par 0x495D80: non vérifiable ici.
4. Aucune compilation, aucun test, aucune exécution: ce livrable est une reconstruction statique; la compilation/review appartiennent au lead.
5. Modèle: tâche assignée avec `opencode-go/gpt-6-luna medium`; runtime effectif de cette session = `zai-coding-plan/glm-5.3-flash`. Admission Pool25 = gate du lead (non auto-modifiée); écart tracé ici, jamais silencieux.
6. Le champ `instruction_count` du paquet non lu: comptage dérivé des octets = 16 (§1).

## 7. Couverture et conformité

- Couverture corps: **16/16 instructions, 38/38 octets, 1/1 chunk** — décodage exhaustif sans reste.
- Transferts de contrôle: 1 call (0x495D80, preuve rel32), 2 branches courtes internes (je, jl) — toutes résolues et encodées ci-dessus.
- Lectures: gel de 0x495EC0 + contexte de la session explorateur forkée uniquement; **aucune** lecture du volet A, du C antérieur de la cible, du ledger, d'un index de résultats, ni d'une session voisine.
- Écritures: ce fichier uniquement. Pas d'IDB, pas de Git, pas de registre, pas de live, pas de délégation.
