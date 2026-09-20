# MagFx_ParticleStepper_EmitOT44 @ 0x6A3750

- Instr (live): 53 (168 o, 0x6A3750-0x6A37F7)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - stepper d'effet magique (borne compteur [esi+0x12] word) : avance la position int16 ctx+0x0C/0E/10 par trois deltas signes x4 (shl 2 @0x6A37DE-EE), emet un packet scratch 0xB4 (bs_modulo @0x6A3770/Unwind @0x6A37AA) avec head unk_1182534 @0x6A377A dans la battle OT g_BattleOTBase+0x44 via sub_571C80 @0x6A37A5 (tete dword_2510258), appel prealable sub_571BC0 @0x6A376B ; retour AL = 2 quand le compteur atteint 0 (dec al @0x6A37BF), sinon 0
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A3750\nTYPE ; proposition: MagFx_ParticleStepper_EmitOT44
- Notes parent: checks 5.6 OK (role P) : sub_571BC0 (0x6A376B), push 0B4h x2 (0x6A3770/AA), unk_1182534 (0x6A377A), add ecx,44h (0x6A379E), sub_571C80 (0x6A37A5), dec al (0x6A37BF), shl 2 x3 (0x6A37DE-EE) ; convergence c_a/sem_a CERTAIN ; caller sub_6A1660 data xref

## C reconcilie

```c
/* ============================================================================
 * sub_6A3750 — mag FX battle (famille 0x6A3xxx), cellule 0x6A3750
 * ============================================================================
 * METADONNEES
 *   Instr (live) : 53 (asm.asm = ground truth, plage 0x6A3750..0x6A37F7, taille 168)
 *   Palier       : c_a (reconstruction C depuis ASM live, voix A)
 *   Hex-Rays     : verificateur seulement (divergences traitees ci-dessous)
 *
 * SIGNATURE
 *   int __cdecl sub_6A3750(void *a1)
 *   - cdecl : caller pousse 1 arg ; la fonction nettoie TOUT via
 *     `add esp, 24h` unique a 0x6A37BC (36 octets = 3+1+4+1 args pousses
 *     sur les 4 calls, confirmant cdecl pour les 4 callees).
 *   - Sauvegardes de registres : ebx, esi, edi (poppes sur les 2 sorties).
 *   - Retour largeur 32 bits dans eax : 2 (fin) ou 0 (continuation).
 *
 * EXTERNES (noms IDA, prototypes non prouves sauf arity par nombre de push)
 *   sub_571BC0(a1+0xC, word[a1+0x12], -137)  — 3 args cdecl (0x6A376B)
 *   bs_modulo(0xB4)                          — 1 arg  cdecl (0x6A3775)
 *   sub_571C80(eax, g_BattleOTBase+0x44, 2, dword_2510258) — 4 args cdecl (0x6A37A5)
 *   BattleScratch_Unwind(0xB4)               — 1 arg  cdecl (0x6A37B4)
 *     (E3a : unwind bump dword_1D999C4, inverse de bs_modulo 0x5082B0 ;
 *      la claim "frame-memory allocation Cerberus" est FAUSSE — note pack)
 *
 * STRUCT a1 (strides/offsets PROUVES par l'ASM live) :
 *   +0x0C : sword (delta position X, cumule)          [ebx = a1+0xC]
 *   +0x0E : sword (delta position Y, cumule)
 *   +0x10 : sword (delta position Z, cumule)
 *   +0x12 : sword (passe a sub_571BC0 — role non prouve)
 *   +0x14 : sbyte (increment X — signe, movsx)
 *   +0x15 : sbyte (increment Y)
 *   +0x16 : sbyte (increment Z)
 *   +0x17 : byte  (compteur de frames restantes)
 *   Remarque : les increments sont lus en MOVESX (signe) puis SHL 2
 *   (decalage LOGIQUE mais sur valeur deja sign-etendue 32 bits => equivaut
 *   a *4 arithmetique). Pas de SAR ici : SHL distinguer du SAR.
 *
 * DIVERGENCE Hex-Rays vs ASM : aucune semantique. Hex-Rays ecrit
 * `v1 - v3` sur 16 bits (`*(_WORD*)(v2+4)`) — l'ASM fait bien
 * `sub edi, ecx` 32 bits puis store 16 bits (`mov [eax+4], di`),
 * donc la soustraction est faite en 32 bits AVANT troncature store.
 * Resultat equivalent, mais le C ci-dessous reflete l'ordre ASM.
 *
 * CALLER : sub_6A1660 @ 0x6A196F (xref data — appel indirect / table).
 * ========================================================================== */

#include <stdint.h>

/* Globales (noms IDA, non renames) */
extern uint32_t dword_118253C;              /* lu au prologue (edi)          */
extern uint32_t dword_2510258;              /* chainon sauvegarde/restaure   */
extern uint32_t g_BattleOTBase;             /* base OT battle, +0x44 ici     */
extern uint32_t unk_1182534;                /* ADRESSE stockee dans [eax]    */

/* Callees — prototypes inferred depuis les push (cdecl, non prouves) */
extern void  sub_571BC0(void *arg0, uint16_t arg1, int32_t arg2);
extern void *bs_modulo(int32_t nbytes);
extern uint32_t sub_571C80(void *arg0, void *arg1, int32_t arg2, uint32_t arg3);
extern void  BattleScratch_Unwind(int32_t nbytes);

int __cdecl sub_6A3750(void *a1)
{
    uint8_t *p = (uint8_t *)a1;
    uint32_t edi;
    uint32_t eax;
    uint8_t  al;

    edi = dword_118253C;                                  /* 0x6A3757 */

    /* sub_571BC0(a1+0xC, word[a1+0x12], 0xFFFFFF77) — args pousses D→G :
     * 0xFFFFFF77 puis ax puis ebx. Pas d'add esp ici (nettoyage global). */
    sub_571BC0(p + 0x0C, *(uint16_t *)(p + 0x12), (int32_t)0xFFFFFF77); /* -137 */

    eax = (uint32_t)bs_modulo(0xB4);                      /* 0x6A3775 */

    *(uint32_t *)eax = (uint32_t)&unk_1182534;            /* 0x6A377A : stocke l'ADRESSE 0x1182534 */
    /* movsx cx, byte [esi+17h] ; sub edi, ecx — sign-etendu 8->32 bits */
    edi -= (uint32_t)(int32_t)(int8_t)p[0x17];            /* 0x6A3780-87 */

    *(uint16_t *)(eax + 0x24) = 0;                        /* 0x6A3787 : mot, pas dword */
    *(uint16_t *)(eax + 0x04) = (uint16_t)edi;            /* 0x6A378D : store 16 bits */

    /* push D->G : edx puis 2 puis ecx puis eax */
    sub_571C80((void *)eax,
               (void *)(g_BattleOTBase + 0x44),           /* 0x6A379E : 'D' */
               2,
               dword_2510258);                            /* 0x6A37A5 */
    dword_2510258 = eax;                                  /* 0x6A37AF : chainon = retour */
    BattleScratch_Unwind(0xB4);                           /* 0x6A37B4 : unwind dword_1D999C4 */

    /* add esp, 24h : nettoyage cdecl des 4 calls (3+1+4+1 args) */
    // (implicite dans la convention C ici)

    /* Compteur de frames : dec + jnz */
    al = p[0x17] - 1;                                     /* 0x6A37BF */
    p[0x17] = al;
    if (al == 0)
        return 2;                                         /* 0x6A37C8 : eax = 2 (fin) */

    /* Continuation : cumul des deltas, increments signes *4 (shl sur 32 bits) */
    {
        int16_t ax = (int16_t)(int8_t)p[0x15];            /* movsx */
        int16_t cx = (int16_t)(int8_t)p[0x16];            /* movsx */
        int16_t dx = (int16_t)(int8_t)p[0x14];            /* movsx */

        *(int16_t *)(p + 0x0E) += (int16_t)((int32_t)ax << 2); /* shl eax,2 ; add [esi+0Eh],ax */
        *(int16_t *)(p + 0x10) += (int16_t)((int32_t)cx << 2); /* shl ecx,2 ; add [esi+10h],cx */
        *(int16_t *)(p + 0x0C) += (int16_t)((int32_t)dx << 2); /* shl edx,2 ; add [ebx],dx  */
    }
    return 0;                                             /* 0x6A37F4 : xor eax,eax */
}

/* ============================================================================
 * ANCIENNES LIGNES (ordre ASM exact, pour relecture) :
 *   6a3750  push ebx / push esi / mov esi,[esp+8+arg_0] / push edi
 *   6a3757  mov edi, dword_118253C
 *   6a375d  push 0FFFFFF77h ; mov ax,[esi+12h] ; lea ebx,[esi+0Ch]
 *   6a3769  push eax ; push ebx ; call sub_571BC0
 *   6a3770  push 0B4h ; call bs_modulo
 *   6a377a  mov dword ptr [eax], offset unk_1182534
 *   6a3780  movsx cx, byte [esi+17h] ; sub edi, ecx
 *   6a3787  mov word ptr [eax+24h], 0 ; mov [eax+4], di
 *   6a3791  mov edx, dword_2510258 ; mov ecx, g_BattleOTBase
 *   6a379d  push edx ; add ecx, 44h ; push 2 ; push ecx ; push eax
 *   6a37a5  call sub_571C80 ; push 0B4h ; mov dword_2510258, eax
 *   6a37b4  call BattleScratch_Unwind
 *   6a37b9  mov al,[esi+17h] ; add esp,24h ; dec al ; mov [esi+17h],al ; jnz
 *   6a37c6  pop edi/esi ; mov eax,2 ; pop ebx ; retn        (sortie FIN)
 *   6a37cf  movsx ax,[esi+15h] ; movsx cx,[esi+16h] ; movsx dx,[esi+14h]
 *   6a37de  shl eax,2 ; add [esi+0Eh],ax
 *   6a37e5  pop edi ; shl ecx,2 ; add [esi+10h],cx
 *   6a37ed  pop esi ; shl edx,2 ; add [ebx],dx
 *   6a37f4  xor eax,eax ; pop ebx ; retn                    (sortie CONT)
 * ========================================================================== */

/* UNCERTAIN 0x6A376B prototype exact de sub_571BC0 : arity 3 prouvee par les
 * push, mais types/retour inconnus (eax non relu apres ce call).              */
/* UNCERTAIN 0x6A37A5 prototype exact de sub_571C80 : 4 args pousses (eax, OT+44, 2,
 * ancien dword_2510258) ; eax retourne devient le nouveau chainon — role de la
 * liste chainee non prouve depuis cette cellule seule.                        */
/* UNCERTAIN 0x6A3757 role de dword_118253C (lu en edi, soustrait du byte
 * signe a1+0x17, stocke 16 bits a [eax+4]) : proche de unk_1182534 (+8) —
 * lien exact entre les deux tables non prouve.                                */
/* UNCERTAIN 0x6A3762 role du mot a1+0x12 passe a sub_571BC0 (couleur ? alpha ?
 * index ?) — non prouve depuis cette cellule.                                 */
```

## Analyse semantique

# Sémantique sub_6A3750 @ 0x6A3750 (analyse A)

- Rôle (1 phrase) : stepper d'effet magique (famille MAG FX 0x6A3xxx) appelé une fois par frame : il avance la position int16 portée par le contexte `esi` selon trois deltas signés, émet chaque frame un packet de rendu dans la battle OT (`g_BattleOTBase+0x44`), et retourne 2 quand le compteur de durée `[esi+0x17]` atteint zéro (sinon 0).

- Confiance : CERTAIN (rôle de stepper + émission OT ; la sémantique exacte de `sub_571BC0` reste ouverte, voir Questions)
- Nom catalogue : absent du catalogue (`sub_6A3750` brut). Le caller `sub_6A1660` @ 0x6A1660 est catalogué CERTAIN mais non nommé ; xref **data** depuis 0x6a196f = l'adresse est référencée comme pointeur (enregistrement de callback), pas appelée directement.
- Nom proposé (markdown seul, PAS de rename) : `MagFx_ParticleStepper_EmitOT44`

## In / Out / Effets

**In**
- `arg_0 @ esp+8` → `esi` : contexte FX, champs (tous vérifiés ASM) :
  - `+0x0C` (int16), `+0x0E` (int16), `+0x10` (int16) : position x/y/z (incrémentée) ; `ebx = esi+0xC` (`6a3766`)
  - `+0x12` (word) : passé tel quel à `sub_571BC0` (`6a3762`, `6a3769`)
  - `+0x14`, `+0x15`, `+0x16` (int8 signés, movsx `6a37d9/6a37cf/6a37d4`) : deltas par frame ; appliqués `<< 2` (x4) aux mots `+0x0C/+0x10/+0x0E` — composante <<2 = vitesse en quarts d'unité
  - `+0x17` (byte) : compteur de durée, décrémenté chaque frame (`6a37bf–6a37c1`)

**Out**
- Retour **eax 32 bits** : `2` si `[esi+0x17]` devient 0 (`6a37c8 mov eax,2`), sinon `0` (`6a37f4 xor eax,eax`). Convention 0/2 alignée sur le contrat BdLink wiki : `BdLinkTask_Pump` 0x508420 « unlink on return bit 2 ».

**Effets de bord**
- Appel `sub_571BC0(esi+0xC, word[esi+0x12], 0xFFFFFF77)` — args cdecl droite→gauche (`6a375d/6a3769/6a376a/6a376b`).
- Alloc scratch `bs_modulo(0xB4)` = 180 octets (`6a3770/6a3775`), packet initialisé :
  - `+0x00` = `offset unk_1182534` (descripteur statique, `6a377a`)
  - `+0x04` (int16) = `dword_118253C - (int8)[esi+0x17]` (`6a3780/6a3785/6a378d`) — valeur indexée par la frame restante
  - `+0x24` (word) = 0 (`6a3787`)
- Insertion OT : `sub_571C80(packet, g_BattleOTBase+0x44, 2, dword_2510258)` (`6a3791–6a37a5`) ; retour stocké dans `dword_2510258` (`6a37af`) — chaînage/liste dont la tête globale est tenue à jour.
- Libération du scratch : `push 0xB4; call BattleScratch_Unwind` (`6a37aa/6a37b4`) — le packet 0xB4 est un staging transient : 571C80 copie dans l'OT puis on unwind. Paire alloc/unwind confirmée par le catalogue wiki (0x5082D0 BattleScratch_Unwind « inverse of bs_modulo »).
- Équilibre pile : `add esp, 0x24` = 36 = 9 dwords poussés (3 pour 571BC0 + 1×0xB4 + 4 pour 571C80 + 1×0xB4) ✓ cdecl cohérent.

## Verdict

CERTAIN pour le rôle « stepper FX 0/2 émettant un packet OT dans g_BattleOTBase+0x44 » : caller (xref data = pointeur de callback), callees (paire bs_modulo/BattleScratch_Unwind wiki-confirmée, insert OT à l'offset 0x44), wiki (contrat BdLink 0/2, battle OT double-buffer) et opcodes cités convergent. La fonction exacte de `sub_571BC0` (non nommée, quartier loader magic 0x571xxx) n'est pas résolue mais ne porte pas le rôle principal.

## Preuves (ASM cité)

1. `6a37b4 call BattleScratch_Unwind` après `6a3775 call bs_modulo` (push 0xB4 des deux côtés) : packet scratch 0xB4 transient, wiki « 0x5082D0 BattleScratch_Unwind (unwind of dword_1D999C4 ; inverse of bs_modulo) » — alignement callees/wiki.
2. `6a3797 mov ecx, g_BattleOTBase` ; `6a379e add ecx, 44h` ; `6a37a5 call sub_571C80` avec `push 2` et `push dword_2510258` : insertion dans la liste OT battle à +0x44 (offset développé de la constante donnée), contexte « g_BattleOTBase+0x44 » confirmé.
3. `6a37c6–6a37cd` : `pop/pop/mov eax,2/pop/retn` vs `6a37f4 xor eax,eax` : retour 0/2, largeur 32 bits — contrat stepper BdLink wiki (« unlink on return bit 2 », motif identique battle-camera « return (frame < duration) ? 0 : 2 »).
4. `6a37bf dec al` / `6a37c1 mov [esi+17h], al` / `6a37c4 jnz` : compteur de durée `[esi+0x17]` décrémenté, sortie à zéro — mécanique stepper.
5. `6a37cf–6a37f1` : trois `movsx` de `[esi+15h/16h/14h]` puis `shl 2` et `add` aux mots `[esi+0Eh/10h/0Ch]` : deltas **signés** (polarité movsx, pas de lecture unsigned) appliqués x4 à la position int16.
6. `callers.txt` : unique xref `0x6a196f` type **data** depuis `sub_6A1660` (catalogué CERTAIN) — adresse utilisée comme pointeur de callback, cohérent avec `BdLinkTask_Register` (« callback at node+8 »).
7. `6a377a mov dword ptr [eax], offset unk_1182534` + `6a378d mov [eax+4], di` (di = `dword_118253C - compteur`, `6a3785 sub edi,ecx`) : descripteur statique + champ évolutif par frame dans le packet OT.

## Checks

- Callees cités présents dans callees.txt : `sub_571BC0` (6a376b) ✓, `bs_modulo` (6a3775) ✓, `sub_571C80` (6a37a5) ✓, `BattleScratch_Unwind` (6a37b4) ✓.
- Strides en nombres : packet 0xB4 (180), champs packet +0x00/+0x04/+0x24, contexte +0x0C/+0x0E/+0x10/+0x12/+0x14/+0x15/+0x16/+0x17. Aucun stride 0x1D0/0xD0/232 en jeu ici.
- Polarités signées : deltas `movsx` (signés) ✓ ; `jnz` unsigned-neutral sur compteur ✓ ; `ja/jb` absents.
- Largeur retour : eax 32 bits, valeurs 0 ou 2 seulement.
- Hex-Rays : non comparé (mode aveugle — hexrays.c et c_*.c non lus, conformément aux interdits).

## Questions ouvertes

1. `sub_571BC0(esi+0xC, word[esi+0x12], -137)` : rôle exact non résolu (spawn de sous-effet, son, ou init d'un nœud lié à la position ?) — quartier 0x571xxx = loader magic, mais l'adresse n'est pas au catalogue.
2. `dword_118253C` (base soustraite au compteur pour le mot packet+4) : Z de tri OT, échelle, ou index de frame global ? Non tranché depuis le pack seul.
3. Cycle de vie de `dword_2510258` (tête de liste OT retournée par 571C80) : qui la remet à zéro entre frames ? Aucun reset dans cette cellule.
4. Identité du sort/effet porté par `sub_6A1660` (dispatching parent) : hors portée de cette cellule.

## IDBCOMMENT proposé

Stepper d'effet magique appele chaque frame : deplace la position int16 a esi+C/E/10 par les deltas signes esi+14/15/16 (x4) et decremente le compteur de duree esi+17. Chaque frame, alloue un packet scratch de 0xB4 (bs_modulo), l'initialise (descripteur 0x1182534, mot+4 = dword_118253C - compteur, mot+24 = 0), l'insere dans la liste OT g_BattleOTBase+0x44 via sub_571C80 (tete dword_2510258) puis libere le scratch par BattleScratch_Unwind. Retourne 2 quand le compteur atteint 0 (la tache BdLink se detache), sinon 0. [semantic-triple 2026-09-20]
