# MagFX_EffectScript_StepGroups_EmitOtPacket @ 0x6A2940

- Instr (live): 111 (327 o, 0x6A2940-0x6A2A86)
- Palier: 2+1
- Verdict: LIKELY - interprete le flux de commandes d'effet mag FX par groupe (caller unique sub_6A2760 @0x6A28E3) : pour chaque groupe i du masque dword [a2+0x18] (bit i = shl edx,1 / jz skip, troncature mod 32 sans garde), lit n = word signe a blk @0x6A2999 (movsx [eax-2]) et avance le curseur de +2 ; idx>=0 -> Field_readCa + Camera_ReadVariables_Space + sub_6A2A90(&curseur_arg4, &v26, entity) avec tbl = [a2+0x50]+32*(idx+8) ; idx<0 -> n records 8 octets flaggues 0x10, skip 6m+2 octets ; alignement 4 octets (and al,0FCh @0x6A2A2F), lit 2 words vers a2+0x08/0x0A, puis sub_68AAE0(entity, a3, a4, g_BattlePacketCursor) @0x6A2A53-6D reecrit g_BattlePacketCursor ; retour EAX residuel non relu par le caller
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A2940\nTYPE ; proposition: MagFX_EffectScript_StepGroups_EmitOtPacket
- Notes parent: checks 5.6 OK : mov edx,1 (0x6A2979), jz skip (0x6A2989), movsx word [eax-2] (0x6A2999), lea arg_4 (0x6A29DD) + reload (0x6A2A1D), and al,0FCh (0x6A2A2F), g_BattlePacketCursor read/write (0x6A2A53/6D), caller unique code sub_6A2760 @0x6A28E3 (callers.txt + sondage XrefsTo R) ; arite sub_6A2A90 = 3 args tranchee par sondage prologue (0x6A2A90/99/B0)

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_6A2940 (0x6A2940 .. 0x6A2A86, 327 octets, 111 instr. live)
 * Triple 2+1 campagne mag FX battle — rôle C-R (réconciliateur).
 * GROUND TRUTH = live ASM (asm.asm). Hex-Rays (hexrays.c) = vérificateur
 * SEULEMENT. c_a.c / c_b.c = voix aveugles réconciliées (voir reconcile_notes.md).
 * Type IDA : 'int __cdecl(int, __int16 *, int, char)'
 * Unique caller : sub_6A2760 (xref code 0x6A28E3, callers.txt).
 *
 * Convention stack ASM : sub esp,0Ch (0x6A2940) puis push ebx/ebp/esi
 * (0x6A2947-49) puis push edi UNE FOIS dans le prologue étendu (0x6A2964,
 * hors boucle — le back-edge 0x6A2A79 reboucle sur 0x6A2969, pas 0x6A2964).
 * PIEGE MAJEUR : le slot arg_4 (2e paramètre) est RECYCLÉ comme variable
 * locale "curseur" dès 0x6A2983 (mov [esp+1Ch+arg_4], eax) ; la valeur
 * initiale du paramètre est d'abord chargée dans edi (0x6A2965). Le curseur
 * est rechargé depuis ce slot en 0x6A2A1D après sub_6A2A90 (passage &curseur).
 * Locaux réels : var_C = ptr zone de travail ([a2+4]) ; var_4 = sauvegarde
 * du compteur de groupes (ebp) ; var_8 = sauvegarde de l'index (esi) —
 * ebp/esi clobbered par la branche des entrées, restaurés en 0x6A2A24/28.
 * ========================================================================== */

/* --- Externes : uniquement les callees présentes dans asm.asm/callees.txt ---
 * Appels cdecl, args poussés droite→gauche, cleanup caller.
 *  - 0x6A29CD / 0x6A29D3 : 1 arg chacun (push esi), couverts par add esp,14h.
 *  - 0x6A29E3 : 3 args (&curseur, &var_C, a2) ; add esp,14h (0x6A29E8) couvre
 *    les 5 pushes cumulés (2×push esi + push edi + push edx + push eax).
 *  - 0x6A2A65 : 4 args, add esp,10h (0x6A2A6A).
 * Retours de Field_readCa / Camera_ReadVariables_Space / sub_6A2A90 : eax
 * jamais relu ensuite → déclarés void.
 * // UNCERTAIN 0x6a29cd types de retour exacts de ces trois callees
 */
extern void Field_readCa(int entry);            /* entry = *(a2+0x50) + 32*(idx+8) */
extern void Camera_ReadVariables_Space(int entry);
extern void sub_6A2A90(int *pCur, int *pWork, int a2); /* (&curseur, &var_C, a2) */
extern int  sub_68AAE0(int a2, int a3, char a4, int packetCursor);
extern int  g_BattlePacketCursor;               /* lu 0x6A2A53, écrit 0x6A2A6D */

/* ----------------------------------------------------------------------------
 * Structure pointée par a2 (edi, base fixe pendant toute la boucle) :
 *   +0x00 : DWORD curseur script de l'entité (écrit 0x6A2A51 : mov [edi],eax)
 *   +0x04 : DWORD ptr zone de travail (var_C, lu 0x6A298F)
 *   +0x08 : WORD  (écrit 0x6A2A3B, lu depuis le flux aligné 4)
 *   +0x0A : WORD  (écrit 0x6A2A49)
 *   +0x18 : DWORD masque de groupes (test bit i, 0x6A297E/0x6A2987)
 *   +0x4C : DWORD base table d'opcodes (byte signé à [op + base + 5], 0x6A29AE-B4)
 *   +0x50 : DWORD base table 32 octets/entrée (index = byte+8, 0x6A29C1-CA)
 * -------------------------------------------------------------------------- */

int __cdecl sub_6A2940(int a1, void *a2, int a3, char a4)
{
    int  *table;     /* ebx : *(DWORD*)(a1+4), puis avance de 4 par pas */
    int   nGroups;   /* ebp, sauvegardé var_4 : table[0], comparaisons SIGNÉES
                      * (jle 0x6A295E, jl 0x6A2A79) */
    int   i;         /* esi, sauvegardé var_8 */
    int   cursor;    /* vit dans le slot arg_4 recyclé (voir préambule) */
    int   v26;       /* var_C : copie de *(a2+4), avance par pas de 8 octets */
    int   ret;       /* miroir de eax — valeur de retour résiduelle */

    table = (int *)*(unsigned int *)(a1 + 4);  /* 6A294A mov ebx,[eax+4] */
    i = 0;                                     /* 6A294D xor esi,esi */
    ret = a1;                                  /* 6A2943 : eax = arg_0 dès l'entrée
                                                * (état de sortie si nGroups<=0) */
    nGroups = table[0];                        /* 6A2953 mov ebp,[ebx] */
    table++;                                   /* 6A2955 add ebx,4 → table d'offsets */

    if (nGroups <= 0)                          /* 6A295E jle — SIGNÉ */
        return ret;                            /* eax = a1 */

    do                                         /* loc_6A2969 (back-edge 0x6A2A79 jl) */
    {
        int blk;     /* eax : pointeur de bloc = base + offsets[i] */
        int n;       /* sous-compteur d'entrées, WORD SIGNÉ */

        blk = *table++ + *(int *)(a1 + 4);     /* 6A296D mov eax,[ebx] ; 6A296F add ebx,4 ;
                                                * 6A2972 mov edx,[ecx+4] (base RECHARGÉE
                                                * chaque itération) ; 6A2977 add eax,edx */
        ret = blk;                             /* eax = blk tant que rien ne l'écrase
                                                * (cas groupe sauté → eax résiduel) */
        cursor = blk;                          /* 6A2983 : slot arg_4 ← blk (recyclage) */

        if (((1 << i) & *(int *)((char *)a2 + 0x18)) == 0)
            goto next_group;                   /* 6A297E shl edx,cl ; 6A2987 test ; 6A2989 jz */
                                               /* NB : shl masque cl sur 5 bits → bit i mod 32
                                                * // UNCERTAIN 0x6a297e comportement voulu si nGroups > 32 */

        v26 = *(int *)((char *)a2 + 4);        /* 6A298F mov ecx,[edi+4] → var_C */

        n = *(short *)cursor;                  /* 6A2999 movsx ecx,word ptr [eax-2] — le mot
                                                * est lu À blk, AVANT l'avance du curseur
                                                * (ordre ASM : 6A2992 add eax,2 PUIS lecture
                                                * décalée de -2 ; équivalent fonctionnel :
                                                * lecture à blk puis cursor = blk+2) */
        cursor += 2;                           /* 6A2992 add eax,2 — cursor = blk+2 */

        if (n > 0)                             /* 6A2999 test ; 6A29A3 jle → tail direct */
        {
            int k = n;                         /* 6A29A9 mov ebp,ecx — ebp = compteur entrées */

            do                                 /* loc_6A29AB */
            {
                int op;                        /* WORD signé */
                int idx;                       /* byte signé dans [op + *(a2+0x4C) + 5] */

                op = *(short *)cursor;         /* 6A29AB movsx edx,word ptr [eax] */
                cursor += 2;                   /* 6A29B1 add eax,2 */

                idx = *(signed char *)(*(int *)((char *)a2 + 0x4C) + op + 5);
                                               /* 6A29AE mov ecx,[edi+4Ch] ; 6A29B4
                                                * movsx ecx,byte ptr [edx+ecx+5] */

                if (idx >= 0)                  /* 6A29BF jl short loc_6A29ED — SIGNÉ */
                {
                    /* --- op standard : entrée 32 octets, deux calls + sub_6A2A90 --- */
                    int tbl = *(int *)((char *)a2 + 0x50) + ((idx + 8) << 5);
                                               /* 6A29C1 mov edx,[edi+50h] ; 6A29C4 lea esi,[ecx+8] ;
                                                * 6A29C7 shl esi,5 (×32) ; 6A29CA add esi,edx */
                    Field_readCa(tbl);             /* 6A29CC push esi ; 6A29CD call */
                    Camera_ReadVariables_Space(tbl); /* 6A29D2 push esi ; 6A29D3 call */
                    sub_6A2A90(&cursor, &v26, (int)a2);
                                               /* 6A29D8-6A29E3 : pushes droite→gauche = edi (a2),
                                                * &var_C, &curseur(slot arg_4, 6A29DD lea) ;
                                                * add esp,14h en 0x6A29E8 (5 pushes cdecl) */
                    /* 6A2A1D : eax ← slot arg_4 — le curseur est rechargé, sub_6A2A90
                     * peut avoir réécrit *pCur et *pWork (modélisé par &cursor/&v26) */
                }
                else
                {
                    /* --- 6A29ED : idx < 0 — op à taille variable : n WORDs skippés,
                     * destination : WORD 0x10 écrit à v26+6, v26 += 8 par itération --- */
                    int m = *(short *)cursor;  /* 6A29ED movsx ecx,word ptr [eax] */
                    cursor += 6 * m + 2;       /* 6A29F0 lea edx,[ecx+ecx*2] ; 6A29F3
                                                * lea eax,[eax+edx*2+2] ; stocké slot 6A29FA
                                                * AVANT le test m==0 (avance de +2 même si m==0) */
                    if (m != 0)                /* 6A29F7 mov edx,ecx ; 6A29FE test ; 6A2A00 jz */
                    {
                        int t = m;             /* 6A2A02 lea eax,[ecx+1] (compteur = m) */
                        do                     /* loc_6A2A05 */
                        {
                            *(short *)(v26 + 6) = 0x10; /* 6A2A05 mov ecx,var_C ; 6A2A09
                                                         * mov word ptr [ecx+6],10h */
                            v26 += 8;          /* 6A2A0F-6A2A17 : var_C += 8 (rechargée/restockée
                                                * à chaque itération dans le slot var_C) */
                        } while (--t != 0);    /* 6A2A16 dec eax ; 6A2A1B jnz */
                    }
                }
            } while (--k != 0);                /* 6A2A1D mov eax,arg_4 (rechargement commun) ;
                                                * 6A2A21 dec ebp ; 6A2A22 jnz loc_6A29AB */

            /* 6A2A24 mov ebp,var_4 ; 6A2A28 mov esi,var_8 — restauration du compteur
             * de groupes et de l'index avant le tail (ebp/esi avaient été réutilisés) */
        }
        /* n <= 0 : saut direct 6A29A3 → loc_6A2A2C, eax = blk+2 (curseur courant) */

        /* --- loc_6A2A2C : alignement 4 octets + lecture queue + sub_68AAE0 --- */
        cursor = (cursor + 3) & ~3;            /* 6A2A2C add eax,3 ; 6A2A2F and al,0FCh —
                                                * alignement en OCTETS (and sur al seulement,
                                                * mais équivalent exact de (x+3) & ~3 : seuls
                                                * les bits 0-1 du poids bas sont effacés) */

        *(short *)((char *)a2 + 0x08) = *(short *)cursor; /* 6A2A35 mov dx,[eax] ; 6A2A3B mov [edi+8],dx */
        cursor += 2;                           /* 6A2A38 add eax,2 */
        *(short *)((char *)a2 + 0x0A) = *(short *)cursor; /* 6A2A43 mov cx,[eax] ; 6A2A49 mov [edi+0Ah],cx */
        cursor += 0x0A;                        /* 6A2A46 add eax,0Ah — total +0xC depuis l'aligné */

        *(int *)a2 = cursor;                   /* 6A2A51 mov [edi],eax — curseur stocké dans a2+0 */

        ret = sub_68AAE0((int)a2, a3, a4, g_BattlePacketCursor);
                                               /* 6A2A4D mov ecx,arg_8 (a3) ; 6A2A53 mov edx,
                                                * g_BattlePacketCursor ; 6A2A5D mov eax,arg_C (a4) ;
                                                * pushes 6A2A61-64 : edx, eax, ecx, edi →
                                                * droite→gauche = (a2, a3, a4, g_BattlePacketCursor) ;
                                                * 6A2A65 call ; add esp,10h en 0x6A2A6A */
        g_BattlePacketCursor = ret;            /* 6A2A6D mov g_BattlePacketCursor,eax —
                                                * le retour de sub_68AAE0 RÉÉCRIT le global */

next_group:                                    /* loc_6A2A72 */
        i++;                                   /* 6A2A72 inc esi */
    } while (i < nGroups);                     /* 6A2A73 cmp esi,ebp ; 6A2A75 mov var_8,esi ;
                                                * 6A2A79 jl — SIGNÉ */

    /* 6A2A7F-6A2A86 : pop edi,esi,ebp,ebx ; add esp,0Ch ; retn.
     * PAS de retour dédié : eax résiduel au retn =
     *   - retour du dernier sub_68AAE0 si le dernier groupe a été traité,
     *   - sinon blk (= base + offsets[dernier groupe]) si son bit était à 0,
     *   - sinon a1 si nGroups <= 0 (sortie précoce 0x6A295E).
     * // UNCERTAIN 0x6a2940 quelle valeur le caller sub_6A2760 exploite-t-il
     * // réellement ? (Hex-Rays tape le retour __int16*, IDA tape int —
     * // l'ASM ne normalise pas eax.)
     */
    return ret;
}
```

## Analyse semantique

# Sémantique sub_6A2940 @ 0x6A2940 (réconciliation R)

- Rôle (1 phrase) : Stepper d'un frame de script d'effet magic FX — pour chaque groupe actif du masque `a2+0x18`, décode le flux s16 du groupe (table d'opcodes `a2+0x4C`, entrées 32 octets `a2+0x50`), met à jour l'état (`a2+0x00/+0x08/+0x0A`) et le pool de records 8 octets à `a2+4`, puis émet un paquet via `sub_68AAE0` vers le bucket OT `a3 = g_BattleOTBase+0x44` en faisant tourner `g_BattlePacketCursor`.
- Verdict : **LIKELY (consolidé)** — mécanique de qualité CERTAIN (opcodes cités, caller/callees confirmés par sondage IDB live lecture seule), nom de domaine LIKELY faute de couverture wiki (`wiki.md` vide, QMD ff8-wiki sans hit sur `0x6A2940`/`g_BattlePacketCursor`/callees).
- Confiance : LIKELY
- Nom catalogue : `sub_6A2940` (pas de nom IDA, CMT vide — rien de mensonger à corriger). Proposition (markdown seul, pas de rename) : **`MagFX_EffectScript_StepGroups_EmitOtPacket`** — nom A retenu ; nom B `Battle_MagicFx_ExecEffectGroupCommands_AppendDrawPackets` gardé comme alias conceptuel équivalent.

## Nom proposé — preuves (≥2 indépendantes, adressées)

1. **« StepGroups »** : boucle par groupe + masque de bits — `0x6A2979 mov edx,1 / 0x6A297E shl edx,cl / 0x6A2980 mov ecx,[edi+18h] / 0x6A2987 test ecx,edx / 0x6A2989 jz loc_6A2A72` ; compteur `ebp = [table]` signé (`0x6A2953 mov ebp,[ebx]`, `0x6A295E jle`), index `esi` (`0x6A2A73 cmp esi,ebp / 0x6A2A79 jl loc_6A2969`).
2. **« EmitOtPacket »** : `0x6A2A53 mov edx,g_BattlePacketCursor` → pushes 0x6A2A61–64 → `0x6A2A65 call sub_68AAE0` → `0x6A2A6D mov g_BattlePacketCursor,eax`, avec l'OT passé par le caller : `0x6A28CB mov ecx,g_BattleOTBase / 0x6A28D5 add ecx,44h / 0x6A28DA push ecx` (sondage IDB live, site d'appel unique 0x6A28E3).
3. **Préfixe « MagFX »** : ancre orchestrator (caller `sub_6A2760` = MagFX render stepper, en cours de fermeture) + a1 = `effect+0x64` (`0x6A28DB mov ecx,[eax+64h]`).

## In / Out / Effets

Prototype cdecl 4 args (cohérent : 4 pushes caller `0x6A28D8–0x6A28E2`, `add esp,10h` @0x6A28F1 ; `add esp,0Ch` final + 4 regs sauvegardés @0x6A2A7F–0x6A2A86).

- **a1** (caller : `effect+0x64`) : descripteur d'effet ; `*(a1+4)` = base de table (rechargée chaque itération, `0x6A2972 mov edx,[ecx+4]`). `table[0]` = nombre de groupes (s32, garde signée `jle` 0x6A295E) ; `table[1+i]` = offset 32 bits, adresse du bloc du groupe i = `base + offsets[i]` (`0x6A296D mov eax,[ebx] / 0x6A2977 add eax,edx`). Layout bloc : `WORD[blk]` = compteur n **signé** (`0x6A2999 movsx ecx,word ptr [eax-2]` — lu À blk, avant l'avance) ; `WORD[blk+2]` = premier op ; curseur = blk+2 après lecture.
- **a2** (caller : `esi+0x20`, scratch) : état d'exécution effet, accès DWORD sauf mention :
  - `+0x00` : curseur de flux de l'entité, write-back fin de groupe (`0x6A2A51 mov [edi],eax`)
  - `+0x04` : base du pool de records **8 octets** (lue `0x6A298F mov ecx,[edi+4]` ; avancée de +8/record en copie locale `var_C` `0x6A2A13 add edx,8`, et par `sub_6A2A90` via `*pWork` `0x6A2B4C add ebp,8` → write-back `0x6A2B66 mov [eax],ebp`) — `*(a2+4)` lui-même n'est jamais réécrit par sub_6A2940
  - `+0x08` / `+0x0A` : deux WORDs lus du trailer de groupe aligné (`0x6A2A35 mov dx,[eax] → 0x6A2A3B mov [edi+8],dx` ; `0x6A2A43 mov cx,[eax] → 0x6A2A49 mov [edi+0Ah],cx`)
  - `+0x18` : masque d'occupance, bit `i mod 32` = groupe actif (`0x6A297E shl edx,cl / 0x6A2987 test` — aucune garde si nGroups > 32)
  - `+0x4C` : base table d'octets ; type = `s8 [op + base + 5]` (`0x6A29B4 movsx ecx,byte ptr [edx+ecx+5]`)
  - `+0x50` : base table d'entrées de **32 octets**, index `type+8` (`0x6A29C1 mov edx,[edi+50h] / 0x6A29C4 lea esi,[ecx+8] / 0x6A29C7 shl esi,5 / 0x6A29CA add esi,edx`)
- **a3** (caller : `g_BattleOTBase+0x44`, via `arg_8`) : bucket OT, 2e arg de `sub_68AAE0` (`0x6A2A4D mov ecx,[esp+1Ch+arg_8]` → push 0x6A2A63).
- **a4** (caller : `0`, via `arg_C`) : 3e arg de `sub_68AAE0`, pass-through (`0x6A2A5D mov eax,[esp+1Ch+arg_C]` → push 0x6A2A62).
- **Out** : `g_BattlePacketCursor` (lecture 0x6A2A53, write-back 0x6A2A6D, largeur DWORD pleine) + mutation de `a2` + pool rempli. Retour `eax` = **résiduel non normalisé** (dernier `sub_68AAE0` > dernier `blk` > `a1` si sortie précoce) ; le sondage live montre que l'unique caller **ne lit pas eax** après le call (`0x6A28E8 mov eax,[esp+24h+arg_4]` recharge immédiatement) — proto IDA `int` trompeur sur l'intention.
- **Effets** : `Field_readCa(tbl)` et `Camera_ReadVariables_Space(tbl)` sur la même entrée 32 octets (`0x6A29CC/D2 push esi / 0x6A29CD/D3 call`, 1 arg chacun) ; `sub_6A2A90(&curseur, &var_C, a2)` — **3 args** (`0x6A29DC–0x6A29E2` pushes = `edi, &var_C, &slot arg_4` ; `0x6A29DD lea eax,[esp+28h+arg_4]` = adresse du SLOT, pas une copie) ; cleanup groupé unique `0x6A29E8 add esp,14h` (5 pushes) ; flag `0x10` écrit à `record+6` soit inline (branche type négatif, `0x6A2A09 mov word ptr [ecx+6],10h`) soit par `sub_6A2A90` (`0x6A2AE4 mov word ptr [ebp+6],10h`) ; émission paquet par groupe actif (`0x6A2A65`).

## Divergences A/B (tranchées une par une, contre l'ASM)

1. **Nom** — A : `MagFX_EffectScript_StepGroups_EmitOtPacket` ; B : `Battle_MagicFx_ExecEffectGroupCommands_AppendDrawPackets`. Tranché **A** : les deux moitiés sont prouvées ASM (masque bits 0x6A2979–89 ; émission 0x6A2A53–6D), le préfixe MagFX s'aligne sur la famille du caller (ancre orchestrator + `0x6A28DB mov ecx,[eax+64h]`) ; « ExecEffectGroupCommands » de B surinterprète (2 formes d'op seulement : idx≥0 → entrée 32 octets via sub_6A2A90 ; idx<0 → skip+flag).
2. **Arité de `sub_6A2A90`** — A : 4 args avec `rec32` en dernier ; B : 3 args. Tranché **B (3 args)** : les deux `push esi` (0x6A29CC/D2) sont l'unique arg de chaque reader, pas un arg de sub_6A2A90 ; au call, seuls `edi (a2), edx (&var_C), eax (&slot arg_4)` sont dessus. Preuve par le callee lui-même : prologue `0x6A2A90 mov ecx,[esp+arg_0]` (=*pCur→edi), `0x6A2A99 mov edx,[esp+0Ch+arg_4]` (=&pWork), `0x6A2AB0 mov esi,[esp+0Ch+arg_8]` (=a2) — exactement 3 args lus.
3. **`arg_C` = OT (B) vs `a4` = 0 (A)** — B écrivait « arg_C : pointeur de battle OT (g_BattleOTBase+0x44) ». Tranché **A** : l'OT est `arg_8` (a3) ; `arg_C` (a4) = 0. Preuve caller (sondage live) : `0x6A28CB mov ecx,g_BattleOTBase / 0x6A28D5 add ecx,44h / 0x6A28D8 push 0 / 0x6A28DA push ecx` → 4e push du caller = a4 = 0, 3e = OT+0x44.
4. **Position de a4 dans `sub_68AAE0`** — A : « 2e position » ; B : non précisé. Tranché **ASM** : pushes 0x6A2A61–64 = `edx (cursor), eax (arg_C), ecx (arg_8), edi (a2)` → droite→gauche = `sub_68AAE0(a2, a3, a4, g_BattlePacketCursor)` ; a4 est le **3e** arg (opcode `push` + ordre cdecl).
5. **Branche type négatif** — A : « spawn/flag de n2 sous-éléments » (spéculatif) ; B : « remplissage de N entrées 8 octets avec word 0x10, pas de call ». Tranché **B** : `0x6A29ED movsx ecx,word ptr [eax]` (m) ; `0x6A29F3 lea eax,[eax+edx*2+2]` (curseur += 6m+2 **octets**, avance inconditionnelle stockée 0x6A29FA avant `test`/`jz` 0x6A29FE/0x6A2A00) ; boucle m itérations `0x6A2A09 mov word ptr [ecx+6],10h / 0x6A2A13 add edx,8`. Miroir exact du chemin « pas de transform » de `sub_6A2A90` (`0x6A2AE4 mov word ptr [ebp+6],10h`) → c'est la variante inline sans GTE.
6. **Retour eax** — A : « dernier sub_68AAE0 ou a1 » ; B : « non assigné, non exploitable ». Tranché : **résiduel** (dernier `sub_68AAE0` > dernier `blk` > `a1`) — aucune instruction ne fixe eax avant `0x6A2A86 retn` ; et le caller **ne le lit pas** (sondage live `0x6A28E8 mov eax,[esp+24h+arg_4]`). A plus précis sur la valeur, B plus prudent sur l'exploitation — fond identique.
7. **Lecture de n (héritée D2 du C-R)** — le CODE des deux voix lisait à `blk+2`, leurs commentaires citaient `[eax-2]`. Tranché : **n = WORD signé À `blk`**, curseur = blk+2. Preuve : `0x6A2992 add eax,2` puis `0x6A2999 movsx ecx,word ptr [eax-2]` ; 1er op lu à blk+2 (`0x6A29AB movsx edx,word ptr [eax]`).
8. **« Deux push esi inutiles » (B, ceinture-et-bretelles)** — faux : chaque `push esi` (0x6A29CC/D2) est l'arg cdecl du reader correspondant ; le `add esp,14h` unique (0x6A29E8) couvre les 5 pushes cumulés (2 readers + 3 args de sub_6A2A90). Tranché **A** (cleanup cumulé correctement décomposé).

## Questions ouvertes (preuve ASM adressée)

1. **Sémantique domaine de `a2+0x4C` (offset +5) et `a2+0x50` (index type+8)** — `0x6A29B4 movsx ecx,byte ptr [edx+ecx+5]`, `0x6A29C4 lea esi,[ecx+8]` : en-têtes de table non documentés ; wiki vide (QMD ff8-wiki sans hit). Non tranchable par l'ASM seul.
2. **Signification des deux WORDs `a2+0x08`/`+0x0A`** — `0x6A2A3B`/`0x6A2A49` : coordonnées, index ou flags ? Le domaine ne tranche pas.
3. **`nGroups > 32`** — `0x6A297E shl edx,cl` tronque à `i mod 32`, aucun garde dans l'ASM ni chez Hex-Rays (`// UNCERTAIN 0x6a297e`).
4. **Contenu des entrées 32 octets traitées par `Field_readCa`/`Camera_ReadVariables_Space`** — même pointeur `tbl` aux deux calls (0x6A29CC/D2) ; retours eax jamais relus (déclarés void dans le C-R) ; rôle lecture pure vs effet de bord à confirmer par leurs propres décompilations (hors périmètre).

## Preuves (ASM cité)

1. `0x6A2953–0x6A295E` : `mov ebp,[ebx]` (nGroups s32), `test ebp,ebp` + `jle loc_6A2A80` — garde **signée**, sortie précoce avec eax = a1 (0x6A2943).
2. `0x6A2979–0x6A2989` : `mov edx,1 / shl edx,cl / mov ecx,[edi+18h] / test ecx,edx / jz loc_6A2A72` — masque bit `i mod 32` ; groupe inactif sauté sans décodage ni émission.
3. `0x6A2992–0x6A299F` : `add eax,2` puis `movsx ecx,word ptr [eax-2]` — n lu À blk AVANT l'avance ; cursor = blk+2 ; 1er op à blk+2 (0x6A29AB).
4. `0x6A29B4–0x6A29CA` : `movsx ecx,byte ptr [edx+ecx+5]` (type s8, table `a2+0x4C`) puis `lea esi,[ecx+8] / shl esi,5 / add esi,[edi+50h]` — stride **32** explicite, index `type+8`.
5. `0x6A2A2C–0x6A2A51` : `add eax,3 / and al,0FCh` (alignement 4 **octets**) ; `mov dx,[eax] → [edi+8]` ; `add eax,2` ; `mov cx,[eax] → [edi+0Ah]` ; `add eax,0Ah` (total +0xC) ; `mov [edi],eax` — trailer 2 words + write-back curseur.
6. `0x6A2A4D–0x6A2A6D` : `mov ecx,[esp+arg_8]` / `mov edx,g_BattlePacketCursor` / `mov eax,[esp+arg_C]` ; pushes `edx,eax,ecx,edi` → `sub_68AAE0(a2, a3=OT+0x44, a4=0, cursor)` ; `add esp,10h` ; `mov g_BattlePacketCursor,eax` — write-back global pleine largeur.
7. Sondage IDB live (lecture seule) : `XrefsTo(0x6A2940)` = **1 seul** xref code `0x6A28E3` dans `sub_6A2760` (fan-in 1, `more:false`) ; site d'appel `0x6A28CB–0x6A28E3` = pushes `(effect+0x64, esi+0x20, g_BattleOTBase+0x44, 0)` ; après le call, `0x6A28E8 mov eax,[esp+24h+arg_4]` — **eax retour non lu**.
8. `sub_6A2A90` (sondage live, 0xE3 octets) : prologue lit exactement 3 args (`0x6A2A90 mov ecx,[esp+arg_0]`, `0x6A2A99 mov edx,[esp+0Ch+arg_4]`, `0x6A2AB0 mov esi,[esp+0Ch+arg_8]`) ; write-back `0x6A2B63 mov [edx],edi` / `0x6A2B66 mov [eax],ebp` — **réécrit le curseur** (slot arg_4) et `var_C`, d'où le reload `0x6A2A1D mov eax,[esp+1Ch+arg_4]` ; flag miroir `0x6A2AE4 mov word ptr [ebp+6],10h`.

## Checks §5.6

- Callees cités présents : `Field_readCa` (0x6A29CD), `Camera_ReadVariables_Space` (0x6A29D3), `sub_6A2A90` (0x6A29E3), `sub_68AAE0` (0x6A2A65) — tous dans callees.txt + asm.asm, aucune library call inventée. ✓
- Caller présent : `sub_6A2760` xref code 0x6A28E3 unique (callers.txt + sondage live). ✓
- Strides en nombres : 32 (`shl esi,5` 0x6A29C7), 8 octets/record (`add edx,8` 0x6A2A13 ; `add ebp,8` sub_6A2A90 0x6A2B4C), 6m+2 octets (`lea eax,[eax+edx*2+2]` 0x6A29F3), +0xC queue (`add eax,2` 0x6A2A38 + `add eax,0Ah` 0x6A2A46). ✓
- Polarités signées : `jle` 0x6A295E / 0x6A29A3, `jl` 0x6A29BF / 0x6A2A79, `movsx` sur tous les tokens — aucune confusion signed/unsigned (`ja` 0x6A2AE2 est dans sub_6A2A90, hors périmètre). ✓
- Largeur retour : eax DWORD non normalisé au retn (résiduel) ; `g_BattlePacketCursor` écrit pleine largeur (0x6A2A6D) ; caller ne lit pas eax (0x6A28E8). ✓
- Nom ≥2 preuves ASM indépendantes adressées : masque/boucle groupes (0x6A2979–89) + émission OT/cursor (0x6A2A53–6D) + contexte caller (0x6A28D5). ✓

## IDBCOMMENT

Stepper d un frame de script d effet magic FX : pour chaque groupe dont le bit i mod 32 est pose dans le masque a2+18h, decode le flux s16 du bloc (compteur word signe a blk, table d octets a2+4Ch offset +5, entrees de 32 octets a2+50h index type+8), remplit le pool de records de 8 octets a a2+4 via sub_6A2A90 ou flag inline 10h, puis stocke les deux words de queue en a2+08/+0A et le curseur en a2+00. Termine chaque groupe actif par un alignement 4 octets puis emet un paquet via sub_68AAE0(a2, g_BattleOTBase+44h, 0, g_BattlePacketCursor) et reecrit le global avec le retour. La valeur eax de retour est residuelle et non lue par l unique caller sub_6A2760 (0x6A28E3, rechargement immediat en 0x6A28E8). Nom propose : MagFX_EffectScript_StepGroups_EmitOtPacket. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_6A2940 (0x6A2940, 111 instr, 327 octets)

Triple 2+1 campagne mag FX battle. Ground truth = `asm.asm` (live ASM).
`hexrays.c` = vérificateur SEULEMENT. Voix : `c_a.c` (A), `c_b.c` (B).

Caller unique : `sub_6A2760` (xref code 0x6A28E3, callers.txt).
`globals.txt` est vide — pas de contexte global exploitable ; le seul global
touché (`g_BattlePacketCursor`, 0x6A2A53/0x6A2A6D) est nommé dans l'ASM lui-même.

---

## Divergences tranchées contre l'ASM

### D1 — Ordre nGroups / masque : conformes dans A et B, précision mod 32
- A : `(1 << i) & *(int*)(st+0x18)` avec remarque « shl edx,cl = i mod 32 ». B : idem, `1u << i`.
- ASM : `6A2953 mov ebp,[ebx]` lit `nGroups = *(DWORD*)(*(a1+4))` (compteur, comparaisons signées `jle` 0x6A295E / `jl` 0x6A2A79) ; `6A297E shl edx,cl` puis `6A2987 test ecx,edx` contre `*(DWORD*)(a2+0x18)` (chargé 0x6A2980). Le masque est testé APRÈS le calcul du pointeur de bloc et le recyclage du slot arg_4 (0x6A2983) — les deux voix respectent cet ordre.
- **Tranché : conformes.** Précision ajoutée : `shl edx,cl` tronque `cl` sur 5 bits → bit testé = `i mod 32` ; l'ASM n'a aucun garde contre `nGroups > 32`. `// UNCERTAIN 0x6a297e comportement voulu si nGroups > 32`.

### D2 — Ordre lecture n / avance curseur en tête de bloc : **A et B FAUX tous les deux**
- A : `cursor += 2` (ligne 66) PUIS `n = *(short*)cursor` (ligne 68) — lit donc à `blk+2`. B : `cur += 1` (ligne 79) PUIS `n = *(short*)cur` (ligne 81) — lit aussi à `blk+2`. Les commentaires des deux voix citent `[eax-2]` mais leur CODE ne décalait pas la lecture en arrière.
- ASM : `6A2983` cursor = blk ; `6A2992 add eax,2` (eax = blk+2) ; `6A2999 movsx ecx, word ptr [eax-2]` → **n = word signé À `blk`** (lecture décalée de -2) ; `6A299F mov [esp+1Ch+arg_4], eax` → cursor final = `blk+2`. Ensuite `6A29AB movsx edx, word ptr [eax]` lit le 1er op À `blk+2`.
- Layout confirmé : `WORD[blk]` = compteur n, `WORD[blk+2]` = premier op, cursor = blk+2 après la lecture du compteur.
- **Tranché : n = *(short*)blk (lecture AVANT l'avance) ; cursor = blk+2.** Le C réconcilié lit `n` à `cursor` puis avance `cursor += 2` — les deux voix aveugles lisaient le mot suivant (divergence corrigée, preuve 0x6A2999 `[eax-2]`).

### D3 — Alignement 4 octets : octets, pas words
- A : `cursor = (cursor + 3) & ~3` — correct. B : `aligned = cur + 3; aligned &= ~3u` avec remarque « and al,0FCh (aligne sur 4, pas ~3 complet) ».
- ASM : `6A2A2C add eax,3` ; `6A2A2F and al,0FCh` — `and al` n'efface que les bits 0–1 du poids bas, ce qui est **exactement équivalent** à `(x+3) & ~3` sur un pointeur (les bits 2+ sont intacts dans al et dans le reste de eax). Les deux voix convergent ; la remarque de B est surinterprétée mais sans effet.
- **Tranché : `(cursor + 3) & ~3`, unité = octets.**

### D4 — Queue : deux WORDs vers a2+0x08/+0x0A, curseur *(DWORD*)a2 = eax
- A et B conformes (`[edi+8]`/`[edi+0Ah]`, `[edi] = eax`).
- ASM : `6A2A35 mov dx,[eax]` / `6A2A3B mov [edi+8],dx` ; `6A2A43 mov cx,[eax]` / `6A2A49 mov [edi+0Ah],cx` ; `6A2A46 add eax,0Ah` (total +0xC depuis l'adresse alignée) ; `6A2A51 mov [edi],eax`.
- **Tranché : conforme dans les deux voix**, offsets octets confirmés.

### D5 — sub_68AAE0 : ordre pushes exact et réécriture du global
- A : `sub_68AAE0((int)a2, a3, a4, prev)` — ordre correct. B : identique.
- ASM : `6A2A4D mov ecx,[esp+1Ch+arg_8]` (a3) ; `6A2A53 mov edx,g_BattlePacketCursor` ; `6A2A5D mov eax,[esp+1Ch+arg_C]` (a4) ; pushes 6A2A61–64 = `edx, eax, ecx, edi` → droite→gauche = `(edi=a2, a3, a4, g_BattlePacketCursor)` ; `6A2A65 call` ; `add esp,10h` 0x6A2A6A ; `6A2A6D mov g_BattlePacketCursor,eax` — **le retour réécrit le global**.
- **Tranché : conforme, deux voix correctes.** Signature retenue : `int sub_68AAE0(int a2, int a3, char a4, int packetCursor)`.

### D6 — Slot arg_4 recyclé + restauration ebp/esi
- A : préambule explicite (recyclage dès 0x6A2983, restauration 0x6A2A24/28). B : idem, avec `var_4`/`var_8` modélisés implicitement.
- ASM : `6A2983 mov [esp+1Ch+arg_4], eax` (1er recyclage) ; `6A299F`, `6A29BB`, `6A29FA`, `6A2A31`, `6A2A3F`, `6A2A59` = re-stockages du curseur dans le même slot ; `6A2A1D mov eax,[esp+1Ch+arg_4]` = rechargement commun après `sub_6A2A90` et à chaque itération de la boucle d'entrées ; `6A2A24 mov ebp,[esp+1Ch+var_4]`, `6A2A28 mov esi,[esp+1Ch+var_8]` = restauration (ebp = compteur groupes, esi = index).
- **Tranché : conforme.** C réconcilié modélise le recyclage par la variable `cursor` + commentaire d'ancre ; la restauration ebp/esi est documentée en commentaire (pas reproductible en C portable sans variable dédiée — A stockait `var_4`/`var_8` comme sauvegardes, retenu sémantiquement).

### D7 — Valeur de retour : eax résiduel, pas de retour dédié
- A : `ret` miroir de eax, `return ret` final, UNCERTAIN déclaré. B : pas de `return` explicite (fin de fonction), même UNCERTAIN, note « eax au retn = dernier sub_68AAE0 retourné, ou base+off, ou a1 ».
- ASM : `6A2A7F–6A2A86` = pops + `add esp,0Ch` + `retn` — **aucune instruction ne fixe eax en sortie**. Chemins d'eax : `a1` (0x6A2943, sortie précoce `jle` 0x6A295E), `blk` (0x6A2977/0x6A2983, groupe sauté), `sub_68AAE0` (0x6A2A65), `cursor` aligné (0x6A2A31–0x6A2A59 si... non : ces eax sont réutilisés/écrasés ; à la sortie de boucle, eax = dernier `sub_68AAE0` ou dernier `blk`).
- **Tranché : `return ret` avec `ret` = miroir d'eax (dernier sub_68AAE0 > dernier blk > a1).** Les deux voix étaient d'accord sur le fond. `// UNCERTAIN 0x6a2940 quelle valeur le caller sub_6A2760 exploite-t-il réellement ?` (Hex-Rays type `__int16*` vs IDA `int` — divergent, l'ASM ne tranche pas).

### D8 — Branche idx >= 0 vs idx < 0 : polarité et contenu
- A et B conformes (idx >= 0 → Field_readCa/Camera/sub_6A2A90 ; idx < 0 → liste variable).
- ASM : `6A29B4 movsx ecx,byte ptr [edx+ecx+5]` (byte SIGNÉ) ; `6A29BF jl short loc_6A29ED` → **jl = brancher si idx < 0** vers la branche « liste variable » ; chemin tombant (idx >= 0) = `6A29C1` : `mov edx,[edi+50h]`, `lea esi,[ecx+8]`, `shl esi,5`, `add esi,edx` → `tbl = *(a2+0x50) + 32*(idx+8)` ; `push esi` ×2 → `Field_readCa` 0x6A29CD, `Camera_ReadVariables_Space` 0x6A29D3 ; puis `sub_6A2A90(&curseur, &var_C, a2)` avec pushes droite→gauche 6A29DC–E2 = `edi (a2), &var_C, &curseur (lea eax,[esp+28h+arg_4] — c'est le SLOT arg_4, pas une copie)` ; cleanup groupé `add esp,14h` 0x6A29E8 (5 pushes).
- **Tranché : conforme.** Ancre : le 1er arg de sub_6A2A90 est **l'adresse du slot arg_4** (`lea eax,[esp+28h+arg_4]` 0x6A29DD) → le callee peut réécrire le curseur ; rechargé en 0x6A2A1D.

### D9 — Branche idx < 0 : avance du curseur AVANT le test m == 0
- A : `cursor += 6*m + 2` puis `if (m != 0)` — correct. B : `cur = cur + 3*n + 1` puis test, avec note « avance même si n == 0 » — correct aussi.
- ASM : `6A29ED movsx ecx,word ptr [eax]` (m) ; `6A29F0 lea edx,[ecx+ecx*2]` ; `6A29F3 lea eax,[eax+edx*2+2]` (curseur += 6m+2) ; `6A29FA mov [esp+1Ch+arg_4],eax` (stocké **avant** `6A29FE test edx,edx` / `6A2A00 jz`) → l'avance a lieu même si m == 0 (+2).
- **Tranché : conforme, avance inconditionnelle de `6*m + 2` WORDs** (i.e. `3m+1` words). Boucle : `6A2A09 mov word ptr [ecx+6],10h` (v26+6 = 0x10), `6A2A13 add edx,8` (v26 += 8), compteur `6A2A02 lea eax,[ecx+1]` / `6A2A16 dec` / `6A2A1B jnz` = m itérations.

### D10 — Type du 2e paramètre et pointeur v26
- A : `__int16 *a2` (IDA type), `recPtr` int, stride 8 octets. B : `void *a2_entity`, `v26` int, stride 8.
- ASM : tous les accès à a2 sont en DWORD (`[edi+4]`, `[edi+18h]`, `[edi+4Ch]`, `[edi+50h]`, `[edi+8]/dx`, `[edi+0Ah]/cx`, `[edi]/eax`) → les mots de 16 bits ne concernent que +0x08/+0x0A. Hex-Rays tape `__int16 *` (à cause de `v9[4]`/`v9[5]`) mais l'ASM écrit bien des **words à offsets octets 0x08/0x0A**, pas des éléments d'un tableau `__int16[4]/[5]`.
- **Tranché : a2 = `void *` avec layout documenté en commentaire** (les mots 0x08/0x0A sont des champs WORD dédiés, pas des indices de tableau). B était plus fidèle.

### D11 — `add esp,14h` (0x6A29E8) : portée du cleanup
- A : « cleanup cumulé 0x14 = 4+4 (deux push esi) + 12 (3 args) » — correct. B : « couvre les 5 pushes cdecl » — idem.
- ASM : pushes dans la branche = `esi` (0x6A29CC), `esi` (0x6A29D2), `edi` (0x6A29DC), `edx` (0x6A29E1), `eax` (0x6A29E2) = 20 octets = 0x14. **Un seul cleanup pour les trois calls.**
- **Tranché : conforme, un seul `add esp,14h` couvre Field_readCa + Camera_ReadVariables_Space + sub_6A2A90.**

---

## Divergences vs Hex-Rays (vérificateur, pas vérité)

1. **Type de retour** : Hex-Rays `__int16 *` vs IDA `int __cdecl(...)` — l'ASM ne normalise pas eax (voir D7). ASM gagne : retour résiduel non typé.
2. **Lecture `v13 = *(v12 - 1)`** (hexrays.c:49) : Hex-Rays lit `n` via `*(v12-1)` après `v12 = result + 1` — il est le SEUL à lire à la bonne adresse (`blk`) ; **A et B lisaient toutes deux à `blk+2`** (divergence D2). Preuve : `6A2999 movsx ecx, word ptr [eax-2]` où eax = blk+2 (0x6A2992).
3. **`v23 += 6`** (hexrays.c:99) : Hex-Rays avance de 6 `__int16` (= 12 octets) après le 2e word — conforme à l'ASM (`add eax,0Ah` après `add eax,2` = +12 octets depuis l'aligné). OK, pas de divergence.
4. **`v9[4]` / `v9[5]`** : Hex-Rays traite +0x08/+0x0A comme éléments d'un tableau `__int16*` — l'ASM écrit des words à offsets octets fixes (D10). ASM gagne sur la sémantique de layout.
5. **`sub_6A2A90((int *)&a2, &v26, (int)v9)`** : Hex-Rays passe `&a2` — sa variable `a2` EST le slot arg_4 recyclé ; conforme à l'ASM (`lea eax,[esp+28h+arg_4]`). Hex-Rays correct ici, contrairement à une lecture naïve du paramètre formel.
6. **Sortie précoce** : Hex-Rays `return result` (= a1, hexrays.c:29/37) — conforme à l'ASM (eax = arg_0 dès 0x6A2943, `jle` 0x6A295E). OK.
7. **Pas de garde `nGroups > 32`** dans Hex-Rays non plus (`1 << v6` nu, hexrays.c:45) — divergence A/B nulle ici, l'ambiguïté reste.

---

## UNCERTAIN restants

- `// UNCERTAIN 0x6a29cd` — types de retour exacts de `Field_readCa`, `Camera_ReadVariables_Space`, `sub_6A2A90` (eax jamais relu dans cette fonction → déclarés `void`, à confirmer par leurs propres décompilations).
- `// UNCERTAIN 0x6a2940` — quelle valeur du retour résiduel le caller `sub_6A2760` (0x6A28E3) exploite-t-il réellement ? Nécessite de regarder le site d'appel (hors périmètre de cette cellule).
- `// UNCERTAIN 0x6a297e` — comportement voulu si `nGroups > 32` (shl tronque à i mod 32 ; aucun garde dans l'ASM ni chez Hex-Rays).
- `// UNCERTAIN 0x6a29b4` (hérité de B, maintenu) — sémantique de la table `[op + *(a2+0x4C) + 5]` : signification du décalage +5 et du +8 dans `(idx+8)*32` (en-têtes de table documentés ?). Nécessite wiki/domaine, hors périmètre C-R.
- `// UNCERTAIN 0x6a2a3b/0x6a2a49` (hérité de B, maintenu) — signification des deux WORDs stockés à a2+0x08 / a2+0x0A (coordonnées ? index ?). Rôle domaine (A/V/R), pas tranchable par l'ASM seul.

## Anomalies pack

- `globals.txt` : **vide** (pas de contexte global fourni) — compensé par les noms présents dans l'ASM (`g_BattlePacketCursor`).
- `callees.txt` : sections CALLS et PROTOS vides ; seules les lignes call/add-esp sont peuplées. Les prototypes des callees sont donc inférés des pushes/add esp uniquement.
- `callers.txt` : un seul caller (`sub_6A2760`, fan-in = 1) — conforme au minimum (2–5 callers demandés par la phase 1, mais l'xref live n'en montre qu'un ; pas de xref data).
- Pas de `grepai.txt`, pas de `wiki.md`/`qmd_search.txt` dans le pack — non requis pour la cellule C-R (pas de création de pack).
