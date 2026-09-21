# BattleMagic_M207_Maelstrom_Stepper @ 0x6A3B70

- Instr (live): 161 (532 o, 0x6A3B70-0x6A3D83)
- Palier: 2+1
- Verdict: LIKELY - stepper BdLinkTask par-frame de l'effet M207 Maelstrom (caller BattleMagic_M207_Maelstrom_SetupTask 0x6A3AE0) : toggle double-buffer dword_2517A24 = arene+0x1A2C/0x11A2C (latch [ctx+0x10] @0x6A3B82-BA7) ; au tick WORD[ctx+0x0C]==1 (un seul passage, jnz @0x6A3BB4) : overlay un seul rect {0x240,0x100,0x140,0x100} en arg1 (isDravingOverlayImage 4 args ASM @0x6A3BBA-F2, Hex-Rays 5 args rejete) + sub_45B5E0(0x240,0x100), armement one-shot (sub_6A6070 blob, 2x BS_Memset 2517A38 0x4E8x1 / 2517A28 0x20x0x40, Register sous-task sub_6A3D90 @0x6A3C3A-44, FillDwords 0x4DC octets, copie sub_7016B0 unk_11AE3F4->task+0x30 0x4B8 @0x6A3C63-73 = 17 pushes), centroide des cibles party (ids u8 stride 0x18, acteurs 0x1D972C0+id*0x9C @0x6A3CB0-B8, moyennes idiv signees task+0x28/2A/2C avec buf[2] relu apres callee @0x6A3CD8, Y-0x200) ; puis Mat3S16_OrthonormalizeQ12 dword_1D97778->2517A80 (0x6A3D30-35) + 2x BdLinkTask_Pump (2517A38/2517A28 @0x6A3D3F-49, ret #1 esi @0x6A3D4E) si flag ; retour AL = 2 si Pump(#1)==0 && flag, sinon ++WORD[ctx+0x0C] et 0
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A3B70\nTYPE ; proposition: BattleMagic_M207_Maelstrom_Stepper
- Notes parent: checks 5.6 OK : toggle 2517A24 (0x6A3B91-BA7), gate jnz (0x6A3BB4), overlay 4 args (0x6A3BBA-F2), 2 listes + Register sub_6A3D90 (0x6A3C1B-3F), copie 0x4B8 (0x6A3C63), stride acteur 0x9C x39x4 (0x6A3CB0-B8), Orthonormalize + 2 Pump (0x6A3D30-49), fin jnz (0x6A3D67), pile equilibree (0x18/0x44/8/0x10/8), caller data xref sub_6A3AE0 ; R : FillDwords 0x4DC octets (A 0x5DC corrige), stride 0x9C (B 0xE4 corrige)

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — cellule 0x6A3B70 — réconciliation C des voix A (c_a.c) et
 * B (c_b.c), pipeline triple 2+1 campagne mag FX battle.
 * EA   : 0x6A3B70  sub_6A3B70  (stepper BdLinkTask — famille mag FX battle ;
 *        enregistré comme donnée à 0x6a3b3e dans sub_6A3AE0, ctx = unk_2517A48)
 * Ground truth = live ASM (asm.asm, 161 instr, 532 octets), pas Hex-Rays.
 * Retour : EAX entier défini aux deux sorties (0 = continuer, 2 = terminé) ;
 *          équivalent u8 largeur AL — type int retenu (cf. reconcile_notes.md).
 * Convention : cdecl, args poussés droite→gauche, caller nettoie la pile
 *              (add esp 0x18 / 0x44 / 8 / 0x10 / 8 / 8 — équilibré).
 * ==========================================================================*/

typedef unsigned char  u8;
typedef unsigned short u16;
typedef short          s16;
typedef unsigned int   u32;
typedef int            s32;

/* ---- externes : uniquement ceux visibles dans asm.asm / callees.txt ---- */

/* 4 args prouvés : pushes ebp,ebp,ebp,edx @0x6A3BBA-BC6, call @0x6A3BDF ;
   arg1 = &rect (dernier push). Hex-Rays rend 5 args — rejeté (preuve pile). */
extern void isDravingOverlayImage(void *a1, u32 a2, u32 a3, u32 a4);

extern void sub_45B5E0(u32 a1, u32 a2);            /* (0x240, 0x100) @0x6A3BEA */
extern void sub_6A6070(void *a1);                  /* (&unk_25102CC) @0x6A3C02 */
extern void BS_Memset(void *a1, u32 a2, u32 a3, u32 a4); /* sémantique args
                                            non prouvée dans cette cellule */
extern u32  BdLinkTask_Register(void *list_head, void *callback); /* -> handle */
extern void FillDwords(void *dst, u32 val, u32 count);   /* rep stosd */
extern void sub_7016B0(void *a1, void *a2, u32 a3);/* copie template 0x4B8 */
extern void Actor_MidpointBonesF0F1(void *rec, void *out_buf);
        /* callees.txt : 2x BattleGeom_ResolveBoneIndexAndPose @0x502170,
           bones 0xF0/0xF1, midpoint s16 arrondi — écrit via out_buf */
extern void Mat3S16_OrthonormalizeQ12(void *src, void *dst);
        /* 2x Vec3_NormalizeQ12_LenSq + cross sub_56BBF0 + normalize -> 3x3 */
extern u32  BdLinkTask_Pump(void *list_head);
extern void sub_6A3D90(void);   /* callback stepper enfant, signature hors cellule */

/* ---- globales touchées (globals.txt) ---- */
extern u32  dword_1D97778[];   /* source Mat3S16_OrthonormalizeQ12            */
extern u32  dword_25102C8;     /* valeur = base domaine battle
                                  (offsets 0x1A2C / 0x11A2C / 0x800 / 0)      */
extern u32  dword_2517A0C;     /* valeur = ptr ; [ptr+4] = sous-ctx party :
                                  [party+0x10] = count u8, [party+8] = tab
                                  d'IDs u8 (stride 0x18/slot)                 */
extern u32 *dword_2517A24;     /* écrite à CHAQUE appel : base+0x1A2C ou
                                  base+0x11A2C (latch [ctx+0x10] alterné)     */
extern u32  dword_2517A28;     /* list_head #2 (BS_Memset 0x20 x 0x40)        */
extern u32  dword_2517A38;     /* list_head #1 (BS_Memset 0x4E8 x 1)          */
extern u32  dword_2517A80[8];  /* dst Mat3S16_OrthonormalizeQ12               */
extern u8   unk_25102CC[];     /* arg sub_6A6070                              */
extern u8   unk_11AE3F4[];     /* template 0x4B8 octets -> task+0x30          */

/* 0x1D972C0 : sans nom IDA (lea eax, ds:1D972C0h[edx*4] @0x6A3CB8).
   Table d'enregistrements acteur indexée par id, stride 0x9C (156) :
   lea edx,[eax+eax*4] ; shl edx,3 ; sub edx,eax => id*39 ; *4 => id*156. */
#define ACTOR_RECORDS_1D972C0 0x1D972C0u

/* ---- layout ctx (arg0), prouvé par les accès ----
 * +0x0C : u16 compteur de frames (inc 16 bits à chaque retour 0 ;
 *         == 1 déclenche le one-shot init — cmp word, jnz @0x6A3BB0-BB4)
 * +0x0F : u8  flag "init effectuée / actif" (0->1 au one-shot @0x6A3C07 ;
 *         gate des pumps @0x6A3D2C et du retour 2 @0x6A3D5E)
 * +0x10 : u32 latch alterné 0<->1 à chaque appel (@0x6A3B82-BAD) ; choisit
 *         l'offset écrit dans dword_2517A24
 *
 * ---- layout tâche (handle retourné par BdLinkTask_Register) ----
 * +0x0C : zone FillDwords(0, 0x137) — 0x137 dwords
 * +0x0E : u16 count (zero-extend du u8 [party+0x10])
 * +0x14 : u32[] pointeurs d'enregistrements acteur (0x1D972C0 + id*0x9C)
 * +0x28 : u16 somme buf[0] (var_8), puis moyennée (idiv signé)
 * +0x2A : u16 somme ([rec+0x36] - 0x200), puis moyennée
 * +0x2C : u16 somme buf[2] (var_4, relu après callee), puis moyennée
 * +0x30 : 0x4B8 octets copiés depuis unk_11AE3F4 (sub_7016B0)
 */

int __cdecl sub_6A3B70(void *ctx_raw)
{
    u8 *ctx = (u8 *)ctx_raw;       /* edi = [esp+18h+arg_0] @0x6A3B77 */
    s16 buf[4];                    /* var_8/var_6/var_4/var_2 — sub esp,8 @0x6A3B70 */
    u32 base = dword_25102C8;
    u32 pump0;                     /* esi en phase pump */
    u32 handle;                    /* esi = tâche BdLinkTask (init) */
    u32 ebp = 0;                   /* 0 persistant, compteur de boucle */
    u32 ebx = 1;                   /* 1 puis offset dans le tableau d'IDs u8 */

    /* --- latch alterné [ctx+0x10] — 0x6A3B82..0x6A3BAD ---------------------- */
    if (*(u32 *)(ctx + 0x10) != ebp) {                     /* cmp [edi+10h],ebp ; jz */
        dword_2517A24 = (u32 *)(base + 0x1A2C);            /* 0x6A3B87-91 : +0x1A2C  */
        *(u32 *)(ctx + 0x10) = 0;                          /* 0x6A3B96               */
    } else {
        dword_2517A24 = (u32 *)(base + 0x11A2C);           /* 0x6A3B9B-A7 : +0x11A2C */
        *(u32 *)(ctx + 0x10) = ebx;                        /* 0x6A3BAD (=1)          */
    }

    /* --- one-shot init : gate WORD[ctx+0x0C] == 1 — 0x6A3BB0..0x6A3BB4 ------ */
    /* jnz loc_6A3D29 = early-exit vers la phase pump ; un seul passage.       */
    if (*(u16 *)(ctx + 0x0C) == ebx) {                     /* cmp [edi+0Ch],bx(1)    */

        /* rect {0x240, 0x100, 0x140, 0x100} puis 2 appels overlay.
           NB : les pushes d'args précèdent l'écriture du buffer dans l'ASM
           (0x6A3BBA-BDF) — ordre conservé ici pour lisibilité équivalente.    */
        buf[0] = 0x240;                                    /* 0x6A3BC7 (576)  */
        buf[1] = 0x100;                                    /* 0x6A3BCE si=100h*/
        buf[2] = 0x140;                                    /* 0x6A3BD3 (320)  */
        buf[3] = 0x100;                                    /* 0x6A3BDA        */
        isDravingOverlayImage(buf, 0, 0, 0);               /* 0x6A3BDF — 4 args (ebp,ebp,ebp,edx) */
        sub_45B5E0(0x240, 0x100);                          /* 0x6A3BEA — push esi(100h), push 240h */
                                                           /* add esp,0x18 @0x6A3BF2 = 4+2 args */

        if (ctx[0x0F] != 0)                                /* 0x6A3BEF-BF7 test ; jnz loc_6A3D30 */
            goto pump_phase;                               /* flag déjà armé -> pump direct */

        /* --- armement (flag [ctx+0x0F] == 0) --- */
        sub_6A6070(&unk_25102CC[0]);                       /* 0x6A3C02 */
        ctx[0x0F] = (u8)ebx;                               /* 0x6A3C07 (=1) */

        BS_Memset(&dword_2517A38, base + 0x800, 0x4E8, 1); /* 0x6A3C0F-20 : push ebx,4E8,eax,offset */
        BS_Memset(&dword_2517A28, base,        0x20, 0x40);/* 0x6A3C25-35 : push 40h,20h,ecx,offset */

        handle = BdLinkTask_Register(&dword_2517A38, sub_6A3D90); /* 0x6A3C3A-44 -> esi */
        {
            u8 *t = (u8 *)handle;
            FillDwords(t + 0x0C, 0, 0x137);                /* 0x6A3C4B-55 (val=ebp=0) */
            sub_7016B0(&unk_11AE3F4[0], t + 0x30, 0x4B8);  /* 0x6A3C5A-68 */
        }
        /* add esp,0x44 @0x6A3C73 = 17 pushes (1+4+4+2+3+3) depuis 0x6A3BFD */

        /* --- partie : count + accumulateurs --- */
        {
            u32 party = *(u32 *)(dword_2517A0C + 4);       /* 0x6A3C76 mov edx,[ecx+4] */
            u16 count = (u16)*(u8 *)(party + 0x10);        /* 0x6A3C79 movzx ax, byte [edx+10h] */
            u8 *t     = (u8 *)handle;

            *(u16 *)(t + 0x0E) = count;                    /* 0x6A3C81 */
            *(u16 *)(t + 0x2C) = 0;                        /* 0x6A3C85 */
            *(u16 *)(t + 0x2A) = 0;                        /* 0x6A3C89 */
            *(u16 *)(t + 0x28) = 0;                        /* 0x6A3C8D */

            if ((s16)count > 0) {                          /* 0x6A3C91 cmp ax,bp ; jle SIGNED — skip si 0 */
                u32  id_off = 0;                           /* ebx */
                u32 *w      = (u32 *)(t + 0x14);           /* edi = curseur table ptrs */

                /* boucle : i (ebp) vs (s16)[t+0x0E], jl SIGNED — 0x6A3C98..0x6A3CFC */
                for (s32 i = 0; i < (s32)*(s16 *)(t + 0x0E); ++i) {
                    u32 ids, rec, rec2;
                    u16 v0, v4, f36;

                    ids = *(u32 *)(party + 8);             /* 0x6A3CA3 — dword_2517A0C et party relités à CHAQUE itération */
                    rec = ACTOR_RECORDS_1D972C0
                        + (u32)(*(u8 *)(ids + id_off)) * 156; /* 0x6A3CA6-CB8 : u8 id zero-extendé ; id*39*4 = id*0x9C */
                    *w = rec;                          /* 0x6A3CC0 */

                    Actor_MidpointBonesF0F1((void *)rec, buf); /* 0x6A3CC2 — args (rec, &buf) */

                    /* add esp,8 @0x6A3CCE — args midpoint (caller-cleanup) */
                    rec2 = *w;                         /* 0x6A3CC7 mov edx,[edi] — rechargement */
                    v0   = (u16)buf[0];                /* 0x6A3CC9 var_8  */
                    v4   = (u16)buf[2];                /* 0x6A3CD8 var_4 (buf+4) relu APRÈS callee */
                    w++;                               /* 0x6A3CD1 add edi,4 */
                    f36  = *(u16 *)(rec2 + 0x36);      /* 0x6A3CD4 mov ax,[edx+36h] */
                    *(u16 *)(t + 0x28) = (u16)(*(u16 *)(t + 0x28) + v0); /* 0x6A3CDD add [esi+28h],cx */
                    *(u16 *)(t + 0x2C) = (u16)(*(u16 *)(t + 0x2C) + v4); /* 0x6A3CE1 add [esi+2Ch],dx */
                    f36 = (u16)(f36 - 0x200);          /* 0x6A3CE5 sub ax,200h */
                    id_off += 0x18;                    /* 0x6A3CE9 — stride 0x18 du tableau d'IDs */
                    *(u16 *)(t + 0x2A) = (u16)(*(u16 *)(t + 0x2A) + f36); /* 0x6A3CEC */
                    buf[1] = (s16)f36;                 /* 0x6A3CF0 mov [esp+var_6],ax */
                    // UNCERTAIN 0x6a3cf0 : buf[1] écrit ici, jamais relu dans cette
                    // fonction — store mort côté caller ou miroir du contrat du callee ?
                    // UNCERTAIN 0x6a3cd8 : seule la consommation de buf[0] (0x6A3CC9) et
                    // buf[2] (0x6A3CD8) est prouvée ; la valeur de buf[2] est celle
                    // laissée par Actor_MidpointBonesF0F1 (0x140 initial uniquement si
                    // le callee n'écrit pas buf+4 — non prouvable dans cette cellule).
                }
                /* 0x6A3CFE edi=arg0 (reload ctx) ; 0x6A3D02 ebp=0 */
            }
            ebp = 0;

            /* moyennes — idiv SIGNÉ (cdq) par (s16)[t+0x0E], INCONDITIONNEL
               (même si count==0 : la boucle est bypassée par jle @0x6A3C91,
               pas les divisions) — 0x6A3D04..0x6A3D25 */
            // UNCERTAIN 0x6a3d0d : si le u8 [party+0x10] vaut 0, les 3 idiv
            // divisent par 0 => #DE. Atteignabilité non prouvable dans cette cellule.
            {
                s32 c = (s32)*(s16 *)(t + 0x0E);
                *(u16 *)(t + 0x28) = (u16)(((s32)*(s16 *)(t + 0x28)) / c); /* 0x6A3D04-0F */
                *(u16 *)(t + 0x2A) = (u16)(((s32)*(s16 *)(t + 0x2A)) / c); /* 0x6A3D13-1A */
                *(u16 *)(t + 0x2C) = (u16)(((s32)*(s16 *)(t + 0x2C)) / c); /* 0x6A3D1E-25 */
            }
        }
    }

pump_phase:                                            /* loc_6A3D29 */
    ebp = 0;
    if (ctx[0x0F] != 0) {                              /* 0x6A3D29-2E test al,al ; jz loc_6A3D5A */
        Mat3S16_OrthonormalizeQ12(&dword_1D97778[0], &dword_2517A80[0]); /* 0x6A3D30-3A — push offset 2517A80, push offset 1D97778 */
        pump0 = BdLinkTask_Pump(&dword_2517A38);       /* 0x6A3D3F-44 -> esi (ret #1 conservé) */
        BdLinkTask_Pump(&dword_2517A28);               /* 0x6A3D49-50 — ret #2 ignoré */
        /* add esp,0x10 @0x6A3D55 = 4 args (2+2) */
    } else {
        pump0 = (u32)ctx_raw;                          /* 0x6A3D5A mov esi,[esp+arg_0] — non nul */
    }

    /* --- sortie — 0x6A3D5E..0x6A3D83 ---------------------------------------- */
    if (ctx[0x0F] != 0 && pump0 == ebp) {              /* 0x6A3D5E test ; 0x6A3D65 cmp esi,ebp(0) ; jnz continue */
        return 2;                                      /* 0x6A3D6C mov eax,2 — terminé (AL=2) */
        // UNCERTAIN 0x6a3d67 : condition de fin = flag actif ET Pump(#1)==0 —
        // sémantique "liste vide" vs "échec" non prouvable dans cette cellule.
    }
    ++*(u16 *)(ctx + 0x0C);                            /* 0x6A3D76 inc word ptr [edi+0Ch] — wrap 16 bits */
    return 0;                                          /* 0x6A3D7D xor eax,eax — continue (AL=0) */
}

/* ===========================================================================
 * RÉCONCILIATION A/B — voir reconcile_notes.md pour le détail tranché.
 * Tranchés contre l'ASM : 4 args isDravingOverlayImage (0x6A3BDF + add esp,18h
 * @0x6A3BF2), buf[2] relu après callee (0x6A3CD8), gate WORD==1 (0x6A3BB0),
 * latch alterné (0x6A3B82-BAD), retour type int (EAX 32 bits défini 0/2).
 * Divergences vs Hex-Rays : 5 args overlay (rejeté), accumulation task+0x2C
 * avec constante 0x140 (rejeté — var_4 relu après callee), dword_2517A80
 * passé par valeur au lieu d'adresse (artefact typage int[8]).
 * ===========================================================================*/
```

## Analyse semantique

# Sémantique sub_6A3B70 @ 0x6A3B70 (réconciliation R)

- Rôle (1 phrase) : stepper BdLinkTask par-frame de l'effet magie battle M207 (Maelstrom) — enregistré comme donnée par le SetupTask 0x6A3AE0, il bascule à chaque appel le double buffer `dword_2517A24` (base+0x1A2C / base+0x11A2C), exécute un one-shot d'armement au passage où `[node+0x0C]==1` (overlay 320×256, init des 2 listes 0x2517A38/0x2517A28, enregistrement du sous-task sub_6A3D90, template 0x4B8, centroïde s16 des cibles), puis orthonormalise la matrice caméra et pompe les deux listes, retournant EAX=0 (continuer) ou 2 (terminé, sémantique AL / bit-2 unlink).
- Verdict : **LIKELY consolidé** (mécanique intégralement prouvée par l'ASM — callers, callees, opcodes cités ; label M207/Maelstrom porté par le caller ancré CERTAIN ; wiki.md en échec qmd → barème §5.6 wiki-aligné non satisfait, CERTAIN refusé).
- Confiance : LIKELY (mécanique de niveau CERTAIN, label famille LIKELY).
- Nom catalogue : sub_6A3B70 non nommé — proposition (markdown seul, PAS de rename) : **`BattleMagic_M207_Maelstrom_Stepper`** (synthèse : base famille du caller ancré + « Stepper » de B ; « Tick » de A rejeté comme redondant, précédent cellule 0x6a2760 où « Tick » avait déjà été écarté au profit de `MagFX_Stepper_*`).

## Nom — preuves ASM indépendantes adresées (≥2)

1. **Callback enregistrée par le SetupTask M207** : data-xref unique @0x6a3b3e depuis sub_6A3AE0 (callers.txt, `more:false`) — le caller prend l'adresse (pas d'appel direct), signature d'un stepper BdLinkTask enregistré ; sub_6A3AE0 = BattleMagic_M207_Maelstrom_SetupTask (ancrage orchestrateur, fermé CERTAIN).
2. **Architecture stepper par frame identique au gabarit MAG_212 fermé CERTAIN (0x6A0DC0 = MAG_212_Effect_Tick_Stepper)** : compteur de frames `[node+0x0C]` gate one-shot @0x6a3bb0 (`cmp [edi+0Ch], bx` avec ebx=1) et incrémenté @0x6a3d76 (`inc word ptr [edi+0Ch]`) ; double `BdLinkTask_Pump` @0x6a3d44/0x6a3d50 ; retour 2 = détachement @0x6a3d6c `mov eax, 2` (contrat unlink bit-2, même motif que 0x6A11CA du gabarit).
3. **Auto-enregistrement d'un stepper enfant** @0x6a3c3a-0x6a3c44 : `push offset sub_6A3D90; push offset dword_2517A38; call BdLinkTask_Register` — même patron d'enregistrement que le gabarit MAG_212 @0x6A0E77-81 (`push offset sub_6A1660; call BdLinkTask_Register`).

## In / Out / Effets

**In** : arg_0 = node BdLink (edi @0x6a3b77). Champs ctx :
- `[node+0x0C]` (u16) : compteur de frames — gate one-shot `== 1` @0x6a3bb0, `inc` à chaque retour 0 @0x6a3d76.
- `[node+0x0F]` (u8) : flag armé — posé à 1 @0x6a3c07 après `sub_6A6070(&unk_25102CC)` @0x6a3c02 ; gate des pumps (test @0x6a3bf5/0x6a3d2c) et du retour 2 (@0x6a3d5e-67).
- `[node+0x10]` (u32) : latch ping-pong 0↔1 togglé à CHAQUE appel @0x6a3b82-0x6a3bad (avant le gate +0x0C) ; choisit la banque écrite dans dword_2517A24.

État global : `dword_25102C8` = base blob effet (banques +0x1A2C/+0x11A2C, pool listes +0x800 et +0) ; `dword_2517A0C` → `[+4]` = sous-ctx party (`[party+0x10]` = count u8, `[party+8]` = table d'IDs u8, stride 0x18) ; template `unk_11AE3F4` (0x4B8) ; caméra native `dword_1D97778` (vue caméra, ancrage orchestrateur).

**Out / Effets** :
- `dword_2517A24` = base+0x1A2C (latch≠0, remis à 0 @0x6a3b96) **ou** base+0x11A2C (latch==0, mis à 1 @0x6a3bad) — double buffer delta 0x10000, écrit à chaque invocation.
- One-shot (compteur==1) : `isDravingOverlayImage(&buf{0x240,0x100,0x140,0x100}, 0,0,0)` @0x6a3bdf (**4 args**, pushes ebp,ebp,ebp,edx @0x6a3bba-bc6) puis `sub_45B5E0(0x240, 0x100)` @0x6a3bea (`add esp,18h` @0x6a3bf2 = 4+2 args exactement) ; `sub_6A6070(&unk_25102CC)` + flag=1 ; `BS_Memset(&2517A38, base+0x800, 0x4E8, 1)` @0x6a3c20 et `BS_Memset(&2517A28, base, 0x20, 0x40)` @0x6a3c35 (ordre pushes 0x6a3c0f-2f ; sémantique arg3/arg4 non prouvée) ; `BdLinkTask_Register(&2517A38, sub_6A3D90)` → handle esi @0x6a3c44 ; `FillDwords(esi+0xC, 0, 0x137)` @0x6a3c55 (0x137 dwords = **0x4DC octets**, borne esi+0x4E8 = taille du pool liste #1) ; `sub_7016B0(&unk_11AE3F4, esi+0x30, 0x4B8)` @0x6a3c68 (template) ; bloc soldé `add esp,44h` @0x6a3c73 (17 pushes).
- Centroïde cibles : `[esi+0x0E]` = u16 count (movzx du u8 `[party+0x10]` @0x6a3c79) ; boucle : id u8 `[ids + off]` (off stride 0x18, `add ebx,18h` @0x6a3ce9) → record = **0x1D972C0 + id×0x9C** (0x6a3cb0-cb8 : `lea edx,[eax+eax*4]; shl edx,3; sub edx,eax` = ×39, `×4` = ×0x9C) stocké à `task+0x14+i*4` (@0x6a3cc0, curseur `add edi,4` @0x6a3cd1) ; `Actor_MidpointBonesF0F1(rec, &buf)` @0x6a3cc2 ; accumulations u16 wrap : X=buf[0]→+0x28, Z=buf[2] (**relu APRÈS le callee** @0x6a3cd8 `mov dx,[esp+var_4]`), Y=`[rec+0x36]−0x200`→+0x2A (@0x6a3cd4/0x6a3ce5) ; puis 3× `idiv` signé par le count @0x6a3d0d/18/23 (moyennes, inconditionnel — la boucle est bypassée par `jle` @0x6a3c91, pas les divisions).
- Chaque frame armée : `Mat3S16_OrthonormalizeQ12(&dword_1D97778, &dword_2517A80)` @0x6a3d3a (pushes offset 2517A80 puis 1D97778 @0x6a3d30-35), `BdLinkTask_Pump(&2517A38)` → esi @0x6a3d44, `Pump(&2517A28)` retour jeté @0x6a3d50, `add esp,10h` @0x6a3d55.
- Retour : `EAX = 2` @0x6a3d6c si flag armé ET pump #1 == 0 (`test al,al` @0x6a3d5e + `cmp esi,ebp`/`jnz` @0x6a3d65-67), sinon `inc word [node+0x0C]` @0x6a3d76 et `EAX = 0` @0x6a3d7d. EAX défini en entier aux deux sorties — sémantique AL 0/2, type `int` retenu.

## Divergences A/B (tranchées une par une, contre l'ASM)

1. **Nom** — A `BattleMagic_M207_Maelstrom_StepperTick` vs B `BattleMagic_M207_Maelstrom_Stepper`. **Tranché : B.** « Tick » est redondant (« Stepper » implique le tick par frame : compteur @0x6a3bb0/0x6a3d76 + pumps @0x6a3d44/50) et le précédent 0x6a2760 a déjà rejeté « Tick » en synthèse (`MagFX_Stepper_*`). La base famille `BattleMagic_M207_Maelstrom_*` (A) est conservée : caller ancré CERTAIN. Gabarit voisin : `MAG_212_Effect_Tick_Stepper` (0x6a0dc0 R) — la convention locale « Stepper » domine.
2. **Stride acteur (boucle party)** — A : 0x9C (39×4) ; B : **0xE4**. **Tranché : A, 0x9C = 156.** ASM 0x6a3cb0-cb8 : `lea edx,[eax+eax*4]` (×5) `shl edx,3` (×40) `sub edx,eax` (×39) `lea eax, ds:1D972C0h[edx*4]` = id×156. B a mal lu le calcul. Cross-check : même table 0x1D972C0 / même stride 0x9C dans le gabarit MAG_212 (@0x6A0F0C-14) et la cellule 0x69eb70.
3. **FillDwords en octets** — A : « 0x137 dwords = 0x5DC » ; B : 0x4DC octets. **Tranché : B.** 0x137×4 = 0x4DC (0x137 = 311 ; 311×4 = 1244 = 0x4DC) ; borne esi+0xC+0x4DC = esi+0x4E8 = taille exacte du pool memset liste #1 @0x6a3c15 — cohérence interne. Le zéro-fill couvre task+0x0C..+0x4E7, A incluait à tort le template (+0x30..+0x4E7) dans « 0x5DC ».
4. **Overlay : un rect vs deux rects** — A : un rect `{0x240,0x100,0x140,0x100}` (320×256 à 576,256) ; B : « deux rects (576×256 et 320×256) ». **Tranché : A.** buf = 4 mots écrits @0x6a3bc7-0x6a3bda (var_8=240h, var_6=100h, var_4=140h, var_2=100h) passés comme **un seul** pointeur arg1 (`lea edx,[esp+var_8]` @0x6a3bbc, `push edx` @0x6a3bc6, call @0x6a3bdf) ; aucun second appel overlay — `sub_45B5E0(0x240,0x100)` @0x6a3bea est un callee distinct, pas un second rect. Interprétation champ-par-champ du rect (position vs dims) non prouvable ici.
5. **Confiance** — A : CERTAIN (mécanique) ; B : LIKELY. **Tranché : LIKELY consolidé.** La mécanique est prouvée par opcodes, mais wiki.md est en échec (`qmd failed: [WinError 2]`) — le barème §5.6 du pipeline exige wiki aligné pour CERTAIN ; assumé LIKELY plutôt que CERTAIN gonflé.
6. **Largeur retour** — A : AL only ; B : EAX entier (type u8). **Tranché : EAX défini entier aux deux sorties** (`mov eax,2` @0x6a3d6c / `xor eax,eax` @0x6a3d7d), sémantique utile AL 0/2 (contrat unlink bit-2 Pump), type `int` retenu (u8 et int équivalents ici — cosmétique, cf. reconcile_notes #7).
7. **BS_Memset liste #2** — A : « 0x40 × 0x20 » (ordre inversé) ; B : (0x20, 0x40). **Tranché : B sur l'ordre des pushes** — @0x6a3c2b-2f : `push 40h; push 20h; push ecx; push offset dword_2517A28` → args cdecl (2517A28, base, **0x20, 0x40**). La sémantique arg3/arg4 (count/val) reste UNCERTAIN (non prouvable dans cette cellule) — concordant reconcile_notes #4/#8.
8. **Accumulateur task+0x2C** — A et B concordants (buf[2] relu après callee) vs Hex-Rays (constante 0x140). **Tranché : A/B, ASM gagne** — @0x6a3cd8 `mov dx,[esp+var_4]` est relu APRÈS `call Actor_MidpointBonesF0F1` @0x6a3cc2 ; le callee écrit buf+4 via le pointeur out, Hex-Rays ne modélise pas cette écriture (divergence Hex-Rays rejetée @0x6A3CD8, ancrage orchestrateur).

## Preuves (ASM cité)

1. @0x6a3b3e : data-xref unique depuis sub_6A3AE0 (SetupTask M207 ancré) — callback stepper enregistrée, aucun appel direct (callers.txt `more:false`).
2. @0x6a3b82-0x6a3bad : latch `[edi+10h]` → `dword_2517A24 = dword_25102C8+1A2Ch` ou `+11A2Ch`, toggle 0↔1 à chaque appel — double buffer delta 0x10000.
3. @0x6a3bb0-0x6a3bb4 + @0x6a3d76 : `cmp [edi+0Ch], bx` (ebx=1) `jnz loc_6A3D29` (early-exit pump) / `inc word ptr [edi+0Ch]` — one-shot au passage compteur==1.
4. @0x6a3bba-0x6a3bf2 : overlay **4 args** (pushes ebp,ebp,ebp,edx ; call isDravingOverlayImage @0x6a3bdf ; push esi(100h), push 240h ; call sub_45B5E0 @0x6a3bea ; `add esp,18h` = 4+2 args pile — Hex-Rays 5 args rejeté).
5. @0x6a3c0f-0x6a3c44 : armement — BS_Memset(&2517A38, base+0x800, 0x4E8, 1), BS_Memset(&2517A28, base, 0x20, 0x40), `push offset sub_6A3D90; push offset dword_2517A38; call BdLinkTask_Register` ; bloc soldé `add esp,44h` @0x6a3c73 (17 pushes, pile équilibrée).
6. @0x6a3cb0-0x6a3ce9 : stride acteur ×39×4 = **0x9C** sur base 0x1D972C0 ; stride table IDs **0x18** (`add ebx,18h`) ; curseur table task+0x14 stride 4 (`add edi,4` @0x6a3cd1).
7. @0x6a3cd4-0x6a3d25 : centroïde — `[rec+0x36]−200h` @0x6a3cd4/0x6a3ce5, buf[2] relu après callee @0x6a3cd8, accumulations u16 wrap, 3× `idiv` signé (cdq) par count @0x6a3d0d/18/23.
8. @0x6a3d30-0x6a3d7d : OrthonormalizeQ12(&1D97778, &2517A80) @0x6a3d3a, Pump#1 → esi @0x6a3d44-4e, Pump#2 @0x6a3d50, sortie `mov eax,2` @0x6a3d6c (flag && pump==0) sinon `inc` + `xor eax,eax` @0x6a3d76-7d.

## Checks §5.6

- **Callees cités tous présents** (callees.txt) : isDravingOverlayImage (6a3bdf), sub_45B5E0 (6a3bea), sub_6A6070 (6a3c02), BS_Memset ×2 (6a3c20/6a3c35), BdLinkTask_Register (6a3c44), FillDwords (6a3c55), sub_7016B0 (6a3c68), Actor_MidpointBonesF0F1 (6a3cc2), Mat3S16_OrthonormalizeQ12 (6a3d3a), BdLinkTask_Pump ×2 (6a3d44/6a3d50). `sub_6A3D90` poussé comme data (callback), pas appelé — absent à juste titre. ✔
- **Caller présent** : sub_6A3AE0 data-xref @0x6a3b3e (callers.txt). ✔
- **Strides en nombres** : acteurs 0x9C (39×4, base 0x1D972C0), records 0x18, template 0x4B8, FillDwords 0x137 dwords = 0x4DC octets, double-buffer delta 0x10000, rect 0x240/0x100/0x140/0x100. ✔
- **Polarités signées** : `jle` @0x6a3c91 (movzx ax vs bp — u8 count, ne déclenche que si 0), `jl` @0x6a3cfc (movsx du s16 [+0x0E]), `idiv` signé avec cdq ; aucun ja/jb. ✔
- **Largeur retour** : EAX défini entier aux deux sorties (0/2), sémantique AL, compatible contrat BdLinkTask unlink bit-2. ✔
- **Nom ≥2 preuves ASM indépendantes adresées** : data-xref 0x6a3b3e + architecture stepper par frame (compteur/pumps/inc) + auto-enregistrement enfant @0x6a3c3a-44. ✔
- **Pile équilibrée** : add esp 0x18/0x44/8/0x10/8/8 vs pushes — vérifié (reconcile_notes #8). ✔

## Questions ouvertes (non bloquantes)

- Sémantique arg3/arg4 de BS_Memset (0x4E8,1 / 0x20,0x40) : count/val ou val/count — non prouvable depuis les seuls pushes de cette cellule.
- `buf[1]` (var_6) écrit @0x6a3cf0, jamais relu dans cette fonction — store mort ou contrat du callee (hors cellule).
- Valeur exacte de buf[2] accumulée : celle laissée par Actor_MidpointBonesF0F1 à buf+4 (0x140 initial uniquement si le callee n'écrit pas buf+4).
- Si `[party+0x10]` == 0, les 3 idiv divisent par 0 (#DE) — atteignabilité non prouvée (la boucle est bypassée par `jle` @0x6a3c91, pas les divisions).
- Consommateurs downstream de dword_2517A24 (banques +0x1A2C/+0x11A2C) — hors cellule (sub_6A3D90 non fournie).
- Sens du word `[rec+0x36] − 0x200` (composante Y/origine centrée) et interprétation champ-par-champ du rect overlay.
- Rang exact du premier armement (1er vs 2e appel) : dépend de l'initialisation du compteur par sub_6A3AE0.

## IDBCOMMENT

Stepper BdLinkTask du FX magie M207 Maelstrom, enregistre comme donnee par le setup 0x6A3AE0. A chaque appel il bascule dword_2517A24 entre base+1A2C et base+11A2C (latch node+10h) ; au passage ou node+0Ch vaut 1 il dessine l overlay 320x256 (rect 0x240,0x100), arme node+0Fh, initialise les listes 2517A38/2517A28 depuis le blob 25102C8, enregistre le sous-task 6A3D90 avec le template 4B8 et calcule le centroide des cibles (records 1D972C0 stride 9C, IDs stride 18, Y-200h, moyennes idiv). Chaque frame arme il orthonormalise en Q12 la camera 1D97778 vers 2517A80 puis pompe les deux listes ; retour AL 0 pour continuer (node+0Ch incremente), 2 quand le flag est arme et le premier pump rend 0. [semantic-triple 2026-09-21]

## Notes C-R

# reconcile_notes.md — cellule 0x6A3B70 (sub_6A3B70)

Voix A = `c_a.c`, voix B = `c_b.c`. Ground truth = `asm.asm` (161 instr, 532 octets). `hexrays.c` = vérificateur seulement. Le réconcilié suit A et B (quasi-identiques) avec preuves d'adresse.

## Divergences A/B tranchées contre l'ASM

Aucune divergence sémantique réelle A/B : les deux voix convergent sur tous les points. Écarts de présentation uniquement (voir §4). Les tranchages ci-dessous portent sur les points de tranchage du brief.

### 1. Toggle double-buffer dword_2517A24
- A : dword_2517A24 = base+0x1A2C / base+0x11A2C, latch [ctx+0x10] alterné. B : idem.
- **Tranché : conforme à A et B.** ASM 0x6A3B82 `cmp [edi+10h],ebp` ; branche !=0 : 0x6A3B87-91 `mov eax,[25102C8] ; add eax,1A2Ch ; mov [2517A24],eax` puis 0x6A3B96 latch=0 ; branche ==0 : 0x6A3B9B-A7 `add ecx,11A2Ch` puis 0x6A3BAD latch=1 (ebx=1). Hex-Rays 6700/72236 = 0x1A2C/0x11A2C, concordant.

### 2. Gate init WORD[ctx+0x0C]==1
- A : `== 1` (cmp avec bx=1). B : `== 1`, avec UNCERTAIN sur le rang de l'appel (1er vs 2e).
- **Tranché : conforme aux deux.** ASM 0x6A3BB0 `cmp [edi+0Ch],bx` (ebx=1 posé @0x6A3B7D), 0x6A3BB4 `jnz loc_6A3D29` = early-exit vers la phase pump. Un seul passage possible à la valeur 1 (compteur inc à chaque retour 0, @0x6A3D76).

### 3. Overlay : isDravingOverlayImage 4 args
- A : 4 args (&rect, 0, 0, 0). B : 4 args, arg1=&buf. Hex-Rays : **5 args** (0, &v13, 0, 0, 0).
- **Tranché : 4 args, A/B gagnent, Hex-Rays rejeté.** ASM 0x6A3BBA-BC6 : pushes ebp,ebp,ebp,edx (4 dwords exactement) ; call @0x6A3BDF ; puis push esi(100h), push 240h ; call sub_45B5E0 @0x6A3BEA ; 0x6A3BF2 `add esp,18h` = 24 octets = 4+2 args pile exactement. 5 args rendraient la pile déséquilibrée de +4. Ordre args cdecl : dernier push = edx = &rect → arg1 = &rect (A inverse l'ordre d'affichage mais place rect en arg1 correctement).
- sub_45B5E0(0x240, 0x100) : push esi puis push 240h → (0x240, 0x100). Concordant A/B/Hex-Rays.

### 4. Armement
- A et B identiques : sub_6A6070(&unk_25102CC) @0x6A3C02 ; ctx[0x0F]=1 @0x6A3C07 ; BS_Memset(2517A38, base+0x800, 0x4E8, 1) @0x6A3C20 ; BS_Memset(2517A28, base, 0x20, 0x40) @0x6A3C35 ; BdLinkTask_Register(&2517A38, sub_6A3D90) @0x6A3C44 (pushes callback puis list_head, 0x6A3C3A-3F) ; FillDwords(task+0x0C, 0, 0x137) @0x6A3C55 ; sub_7016B0(&unk_11AE3F4, task+0x30, 0x4B8) @0x6A3C68.
- **Tranché : conforme aux deux.** add esp,0x44 @0x6A3C73 = 17 dwords (1+4+4+2+3+3 pushes depuis 0x6A3BFD). NB A : « 0x4E8 mots remplis avec word@dword_25102C8+0x800 » — formulation hasardeuse (BS_Memset(dst, val, ?, ?) : l'ordre/count des args 3-4 reste non prouvé dans cette cellule ; A écrit (dst, valeur, 0x4E8, 1) et B pareil en s16→u32, mais la sémantique arg3/arg4 de BS_Memset n'est pas démontrée ici). Le réconcilié garde l'ordre (dst, val, 0x4E8, 1) / (dst, val, 0x20, 0x40) sans interpréter.

### 5. Boucle party : stride 0x18, id*0x9C, base 0x1D972C0
- A et B identiques : id u8 @ [party+8]+off (off += 0x18) ; &rec = 0x1D972C0 + id*156 (lea/shl/sub*4) ; stocké dans table task+0x14+i*4 ; rechargement `mov edx,[edi]` @0x6A3CC7.
- **Tranché : conforme aux deux.** ASM 0x6A3CA3-CB8 : `mov cl,[eax+ebx]` (zero-extend u8), 0x6A3CB0-B6 id*39 via lea/shl 3/sub, 0x6A3CB8 `lea eax, ds:1D972C0h[edx*4]` = id*156 ; 0x6A3CC0 `[edi]=eax`, 0x6A3CD1 `add edi,4` (stride table 4), 0x6A3CE9 `add ebx,18h`. Relit dword_2517A0C et [ecx+4] à chaque itération (0x6A3C98/9E). Boulage signé : 0x6A3CFC `jl` vs (s16)[t+0x0E].

### 6. Pump + orthonormalisation
- A et B identiques : Mat3S16_OrthonormalizeQ12(&dword_1D97778, &dword_2517A80) @0x6A3D3A ; pump #1 (&2517A38) ret conservé (esi) @0x6A3D44 ; pump #2 (&2517A28) ret ignoré @0x6A3D50 ; add esp,0x10 @0x6A3D55.
- **Tranché : conforme aux deux.** ASM 0x6A3D30-35 pushes offset 2517A80 puis offset 1D97778 → arg1=&dword_1D97778, arg2=&dword_2517A80. 0x6A3D4E `mov esi,eax` (ret #1 gardé), pas de réutilisation du ret #2.

### 7. Retour
- A : type int, retour 2 si flag && pump==0 sinon inc WORD[ctx+0xC] et 0. B : type u8 (largeur AL), même logique.
- **Tranché : logique conforme aux deux ; type `int` retenu.** ASM 0x6A3D5E-67 `test al,al ; jz ; cmp esi,ebp(0) ; jnz` → 0x6A3D6C `mov eax,2` ; sinon 0x6A3D76 `inc word ptr [edi+0Ch]`, 0x6A3D7D `xor eax,eax`. Les deux sorties définissent EAX en entier (0/2) → u8 et int équivalents ; `int` choisi (Hex-Rays aussi, diverg. #3 B rejetée comme cosmétique).

### 8. Équilibre pile
- **Tranché : équilibré.** add esp : 0x18 @0x6A3BF2 (6 args), 0x44 @0x6A3C73 (17 pushes), 8 @0x6A3CCE (2 args midpoint), 0x10 @0x6A3D55 (4 args), 8 @0x6A3D72 et 8 @0x6A3D80 (épilogue, avec sub esp,8 initial @0x6A3B70 pour buf). Total pile buf : sub esp,8 vs var_8..var_2 (8 octets) — cohérent.

## Points de détail tranchés (micro-divergences)

- **Accumulateur task+0x2C — buf[2] relu après callee** : A note la divergence vs Hex-Rays (div #3) ; B idem (div #2). **Tranché : A/B.** ASM 0x6A3CD8 `mov dx,[esp+var_4]` lu APRÈS `call Actor_MidpointBonesF0F1` @0x6A3CC2 — c'est la valeur laissée par le callee à buf+4, pas la constante 0x140. Hex-Rays `LOWORD(v7)=v15` lit la variable locale non réécrite → faux.
- **Store buf[1] (var_6) @0x6A3CF0** : A et B le notent jamais relu (B en UNCERTAIN). **Tranché : conservé tel quel** (`buf[1]=(s16)f36`), statut store-mort possible mais pas prouvable dans cette cellule.
- **Moyennes** : idiv signé par (s16)[t+0x0E] INCONDITIONNEL (la boucle est bypassée par `jle` @0x6A3C91 si count==0, pas les 3 idiv 0x6A3D04-25). A et B concordants. Hex-Rays idem (v9 lu même si v4==0 — division par 0 possible si [party+0x10]==0).
- **`movzx ax, byte [edx+10h]`** @0x6A3C79 puis `cmp ax,bp` avec `jle` signé @0x6A3C91 : zero-extend u8→u16 puis comparaison SIGNED (count≤0 impossible car u8, donc jle ne déclenche que si count==0). A et B concordants.
- **Accumulateurs WORD 16 bits** : additions 16 bits sur [esi+0x28/0x2A/0x2C] avec wrap u16 — A/B concordants, Hex-Rays aussi (`+=` sur _WORD).

## UNCERTAIN restants

1. **0x6a3cf0** : `mov [esp+var_6],ax` — buf[1] écrit, jamais relu dans cette fonction. Store mort ou contrat du callee ? Non tranchable ici.
2. **0x6a3cd8** : valeur exacte de buf[2] (var_4) à l'accumulation = celle laissée par Actor_MidpointBonesF0F1 à buf+4 — contenu réel du callee hors cellule (0x140 initial seulement si le callee n'écrit pas buf+4).
3. **0x6a3bb0** : l'init se déclenche à l'appel où le compteur vaut 1 ; 1er ou 2e appel dépend de l'initialisation faite par sub_6A3AE0 (hors cellule).
4. **0x6a3d0d** : si le u8 [party+0x10] vaut 0, les 3 idiv divisent par 0 (#DE). Atteignabilité non prouvable dans cette cellule.
5. **0x6a3d67** : condition de fin `flag && Pump(&2517A38)==0` — sémantique "liste vide" vs "échec" non prouvable ici.
6. **Rôle dword_2517A24** (0x6A3B87/9B) : sélecteur base+0x1A2C / base+0x11A2C alterné — usage downstream hors cellule.
7. **Champ acteur +0x36** (0x6A3CD4) : signification Y brut avec soustraction 0x200 — polarité/origine non prouvée.
8. **Sémantique arg3/arg4 BS_Memset** (0x6A3C20/35) : ordre (count, val) vs (val, count) non démontrable depuis les seuls pushes dans cette cellule — l'ordre du réconcilié suit la convention observée (0x4E8,1 / 0x20,0x40) sans garantie.
9. **Signature sub_6A3D90** (callback enregistrée) : hors cellule.

## Divergences vs Hex-Rays (ASM gagne)

1. **isDravingOverlayImage 5 args** (hexrays.c:37) : rejeté — 4 pushes seulement (0x6A3BBA-BC6), add esp,0x18 @0x6A3BF2 couvre exactement 4+2 args des deux appels.
2. **Accumulation task+0x2C avec constante 0x140** (hexrays.c:64-66) : rejeté — var_4 relu après le callee @0x6A3CD8 ; Hex-Rays ne modélise pas l'écriture du callee via &v13.
3. **`Mat3S16_OrthonormalizeQ12((int)dword_2517A80)`** (hexrays.c:87) : Hex-Rays passe la valeur du tableau (typage int[8]) ; ASM pousse l'ADRESSE offset dword_2517A80 (0x6A3D30). Artefact de typage IDA, corrigé en &dword_2517A80.
4. **Type de retour** : Hex-Rays `int` ; retenu (B proposait u8 — équivalent car EAX défini en entier aux deux sorties).
5. **Cosmétique BS_Memset arg2 `_WORD*`** : push 32 bits, conservé en u32 valeur.
