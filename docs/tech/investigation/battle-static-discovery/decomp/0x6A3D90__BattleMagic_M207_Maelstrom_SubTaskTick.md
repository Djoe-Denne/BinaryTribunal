# BattleMagic_M207_Maelstrom_SubTaskTick @ 0x6A3D90

- Instr (live): 319 (1103 o, 0x6A3D90-0x6A41D3)
- Palier: 2+1
- Verdict: LIKELY - tick de la sous-tache FX de Maelstrom (registree par BattleMagic_M207_Maelstrom_Stepper 0x6A3B70 sur 2517A38) : B1 si step<0x50 blob 0x14 o (+0x0E=step<<5 @0x6A3DBA, 0xFF80 word @+0x0C, trou +06..07, dst=dword_25102C8+0x0CE8 @0x6A3DC8) -> sub_701970(ebx+30h, sub_6A41E0, &blob, 0) @0x6A3DC2-E7 ; B2 step in [0x20,0x50) : bbox cibles stride 4 (+0x14) via sub_6A5F10, midpoints /2 signe cdq-sub-sar, /8, idiv 0x18000, sin /48 unsigned shr 5 @0x6A3F91, escalade t<8 SHR @0x6A3FBD, fade 3 bandes jnb unsigned /12 magie @0x6A3FEA-402E (inversion 0x40-fade jle signe @0x6A4037), stores tailles+centres word_2517A58/60 + 2517A6C/70 (X/Y @0x6A3F62-89) -> sub_6A5700(&25102CC, zoom>>2+11, inv) ; B3 SE a t==0, t in [0x30,0x40) 4 particules BdLinkTask_Register(2517A28, sub_6A5650) @0x6A40A0-zone avec Vec3_MulSinCos_Q12, scal rand&7FF+800, vel neg+sar 7, centres +0x28/2A/2C add 16 bits @0x6A413D-59 ; B4 t==0x50 : BattleAction_ApplyEventRecords(records=[rec+8], count byte [rec+10h] @0x6A41AA-AC) + BdLinkTask_Spawn_508660(25102C8+0x1A2C @0x6A4191, ebx+10h @0x6A41B1), inc word [ebx+0Ch] uniquement dans ==0x50 (jnz @0x6A4197) ; retour EAX = [ebx+10h]!=0 ? 2 : 0 (neg;sbb;and 2 @0x6A41C2-CB), sinon step++ @0x6A41D2 -> 0
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A3D90\nTYPE ; proposition: BattleMagic_M207_Maelstrom_SubTaskTick
- Notes parent: checks 5.6 OK : shl 5 (0x6A3DBA), pushes sub_701970 + add ecx,0CE8h (0x6A3DC2-C8), call sub_701970 (0x6A3DE7), shr edx,5 /48 (0x6A3F91), shr edx,3 ramp-in (0x6A3FBD), pushes ApplyEventRecords count (0x6A41AA), lea esi,+1A2Ch (0x6A4191), jnz skip events (0x6A4197), lea eax,[ebx+10h] (0x6A41B1), inc word [ebx+0Ch] (0x6A41BE), neg al + and eax,2 (0x6A41C2-CB), inc eax (0x6A41D2), caller data xref sub_6A3B70 @0x6a3c3a ; R a verifie le Register en IDB live (push sub_6A3D90 + push dword_2517A38 + call Register)

## C reconcilie

```c
/* ===========================================================================
 * c_reconciled.c — sub_6A3D90 — C réconcilié (triple 2+1, campagne mag FX battle)
 * ---------------------------------------------------------------------------
 * METADONNÉES
 *   EA           : 0x6A3D90 (size 1103 o, 319 instr, 0x6A3D90..0x6A41DE)
 *   Instr (live) : 319 — GROUND TRUTH = live ASM (asm.asm), par blocs
 *   Palier       : c_reconciled (rôle C-R, réconciliation de c_a.c / c_b.c)
 *   Type IDA     : int __cdecl sub_6A3D90(int a1) — 1 arg stack, pas de registre
 *   Notes parent : famille mag FX battle ; sous-task BdLinkTask de la famille
 *                  MAG, enregistrée par BattleMagic_M207_Maelstrom_Stepper
 *                  (0x6A3B70, listes 2517A38/2517A28) ; unique xref data
 *                  @0x6a3c3a (callback de step, eax=0/2). Retour = 0 ou 2.
 *
 *   FRAME / CONVENTIONS (prouvées ASM)
 *     - Prologue : sub esp,28h ; push ebx ; push esi ; push ebp ; push edi
 *       (4 sauvegardes ; epilogue symétrique 0x6a4183/0x6a4188, 0x6a41c5/0x6a41ca,
 *       0x6a41d3/0x6a41da + add esp,28h).
 *     - ebx = a1 (task) @0x6a3d94.
 *     - cdecl : args poussés droite→gauche, chaque call suivi de son add esp
 *       (10h@0x6a3dec, 8@0x6a3e41, 0Ch@0x6a3e64, 0Ch@0x6a3f0c, 4@0x6a3f9f,
 *       8@0x6a3fe4, 14h@0x6a4068, 0Ch@0x6a4083, 8@0x6a40af, 0Ch@0x6a40d5,
 *       8@0x6a4174, 10h@0x6a41bb — couvre ApplyEventRecords+Spawn).
 *     - SLOT ARG RÉUTILISÉ : l'argument entrant [E+4] est réécrit comme scratch
 *       local (preuve ESP : @0x6a3e2a esp=E-0x3C, [esp+3Ch+arg_0]→E+4 ;
 *       @0x6a40a0 esp=E-0x40, [esp+40h+arg_0]→E+4) : 0x10000 puis 4.
 *     - Signé/non-signé : jnb UNSIGNED @0x6a3da0/0x6a3dfb/0x6a3fa7/0x6a3fea/
 *       0x6a4007/0x6a4090 (fenêtres de bandes) ; jl/jle/jge SIGNÉS @0x6a3e48/
 *       0x6a3e77/0x6a3e97/0x6a3f46/0x6a3f58/0x6a4037/0x6a4045/0x6a4189 (clamps).
 *     - shl vs sar vs shr : shl 5 @0x6a3dba, shl 0Bh @0x6a3f81, shl 4
 *       @0x6a3fec/0x6a4014/0x6a4029 ; sar (/2) @0x6a3ec2/0x6a3ed5, (/8)
 *       @0x6a3f11/0x6a3f29, (/4) @0x6a4051, (>>0Ch Q12) @0x6a40fe/0x6a4114/
 *       0x6a4121, (>>7 sur négation) @0x6a4111/0x6a411e/0x6a412b ; shr LOGIQUES
 *       @0x6a3f91/0x6a3fbd/0x6a3fc0/0x6a3ff6/0x6a4019/0x6a402e.
 *     - Divisions par magie 0xAAAAAAAB (mul/shr UNSIGNED) : /48 (>>37)
 *       @0x6a3f8f-91 ; /12 (>>35) @0x6a3ff4-96, 0x6a4014-19, 0x6a4029-2e.
 *     - RETOUR : EAX 32 bits toujours défini = 0 (xor @0x6a41d8) ou
 *       2 (neg al; sbb eax,eax; and eax,2 @0x6a41c6-cb — EAX plein, pas AL seul).
 * ===========================================================================
 */

#include <stdint.h>

/* ---- Globaux touchés (globals.txt / asm.asm) ------------------------------ */
extern unsigned int  dword_25102C8;   // base singleton battle : +0xCE8 (ctx 701970), +0x1A2C (spawn final)
extern unsigned int  dword_1D97778;   // passé par adresse au duo Field_readCaPre / preCamReadVariables_Space
extern unsigned int  dword_11AC274;   // handle son → BdPlaySE @0x6a4079
extern unsigned int  dword_2517A0C;   // ctx événements : [+4]=rec ; rec+8=records(ptr) ; rec+0x10=count(byte)
extern unsigned int  dword_2517A28;   // tête de liste BdLinkTask particules @0x6a409b/0x6a4168
extern short         word_2517A58;    // paire taille .w — store @0x6a3f6e, escalade t<8 @0x6a3fc3
extern short         word_2517A60;    // paire taille .h — store @0x6a3f67, escalade t<8 @0x6a3fca
extern int           dword_2517A6C;   // centre X sign-étendu (var_24) @0x6a3f89
extern int           dword_2517A70;   // centre Y sign-étendu (var_22) @0x6a3f7c
extern unsigned char unk_25102CC;     // arg1 de sub_6A5700 @0x6a405e
extern unsigned char unk_25102D4;     // arg2 de sub_6A5700 @0x6a4059
extern char          a00900901[];     // "00900901" — stocké à blob+0x08 @0x6a3ddf

/* ---- Callees (uniquement celles de asm.asm / callees.txt) ------------------ */
void  sub_701970(void *a1, void *callback, void *ctx, int a4);             // cdecl 4 args ; add esp,10h @0x6a3dec
void  Field_readCaPre(void *a1);                                           // cdecl 1 arg
void  preCamReadVariables_Space(void *a1);                                 // cdecl 1 arg
int   sub_6A5F10(void *bbox, void *target, int *zoom);                     // cdecl 3 args ; add esp,0Ch @0x6a3e64
void  setSomeDword5(void *a1);                                             // push @0x6a3eda
void  cameraRelated_usedByFields(void);                                    // 0 arg
void  setSomeDword(unsigned int *out);                                     // push @0x6a3ef3 → var_1C
void  setSomeDword4(unsigned int *out);                                    // push @0x6a3efd → var_18
int   Fixed_Sin4096_Q12(int angle);                                        // 1 arg ; add esp,4 @0x6a3f9f
void  sub_6A5700(void *a1, void *a2, int a3, int a4, int a5);              // cdecl 5 args ; add esp,14h @0x6a4068
void  BdPlaySE(void *handle, int a2, unsigned int a3);                      // cdecl 3 args ; add esp,0Ch @0x6a4083
void *BdLinkTask_Register(void *list, void *callback);                     // eax = handle (0 = échec)
int   _rand(void);
void  Vec3_MulSinCos_Q12(int a, int b, short *out3);                       // cdecl 3 args ; add esp,0Ch @0x6a40d5
void  BattleAction_ApplyEventRecords(void *records, unsigned int count);   // cdecl 2 args
int   BdLinkTask_Spawn_508660(void *a1, void *a2);                         // eax ignoré ; add esp,10h @0x6a41bb
void  sub_6A41E0(void);   // callback transmis à sub_701970 @0x6a3dce
void  sub_6A5650(void);   // callback transmis à BdLinkTask_Register @0x6a4096/0x6a4163

/* ---- Accès task (uniquement les offsets prouvés par l'ASM) -----------------
 * +0x0C step  (int16 compteur, rechargé movsx à chaque lecture, mov ax 16 bits
 *              en B4 @0x6a417f) ; +0x0E nombre de cibles (int16, cmp SIGNÉS) ;
 *              +0x10 byte drapeau fin (pilote le retour 0/2) ; +0x14 tableau de
 *              pointeurs cibles stride 4 ; +0x28/+0x2A/+0x2C centre XYZ (mots
 *              16 bits ; les DWORDS +0x28/+0x2C sont AUSSI lus opaques en B1) ;
 *              +0x30 transmis tel quel à sub_701970.
 */
#define T_step(p)     (*(short         *)((char *)(p) + 0x0C))
#define T_tgtcnt(p)   (*(short         *)((char *)(p) + 0x0E))
#define T_done(p)     (*(uint8_t       *)((char *)(p) + 0x10))
#define T_targets(p)  (*(uint32_t      *)((char *)(p) + 0x14))
#define T_cx(p)       (*(short         *)((char *)(p) + 0x28))
#define T_cy(p)       (*(short         *)((char *)(p) + 0x2A))
#define T_cz(p)       (*(short         *)((char *)(p) + 0x2C))

int sub_6A3D90(void *a1)
{
    void *const   p = a1;                 // ebx @0x6a3d94
    int           arg_slot;               // [E+4] — argument entrant réécrit (0x10000 puis 4)
    short         bbox[4];                // E-0x24..E-0x1D : minx, miny, maxx, maxy (4 mots contigus)
    unsigned int  out1;                   // E-0x1C : sortie setSomeDword (2 mots, chacun /8 signé)
    unsigned int  out2;                   // E-0x18 : sortie setSomeDword4 (mot bas = diviseur idiv)
    unsigned int  acc;                    // E-0x28 : OU des retours sub_6A5F10 (init via edi=0 @0x6a3e26)
    int   idx, t, i, zmin, inv_sin, fade, count;
    short *vec;                           // ebp = handle+0x0C (3×int16)
    void  *hdl;                           // esi = handle BdLinkTask

    /* ================= B1 : 0x6a3d90..0x6a3dee ==============================
     * idx = movsx word [ebx+0Ch] @0x6a3d99 ; cmp eax,0x50 ; jnb UNSIGNED
     * @0x6a3da0 → un step négatif (movsx) saute le bloc.                     */
    idx = (int)T_step(p);
    if ((unsigned int)idx < 0x50u)
    {
        /* Blob 0x14 o bâti E-0x14..E-1 (preuve ESP par store :
         *   0x6a3dac var_14 → E-0x14 ; 0x6a3da8 var_10 → E-0x10 ;
         *   0x6a3ddf var_C  → E-0x0C ; 0x6a3dd8 var_8  → E-0x08 (WORD :
         *   un dword écraserait var_6 écrit avant @0x6a3dbd) ;
         *   0x6a3dbd var_6  → E-0x06 ; 0x6a3dd4 var_4  → E-0x04.
         * +0x06..+0x07 : 2 o JAMAIS écrits (trou transmis tel quel). */
        unsigned char blob[0x14];
        *(uint32_t *)(blob + 0x00) = *(uint32_t *)((char *)p + 0x28);  // @0x6a3da5/dac
        *(uint32_t *)(blob + 0x04) = *(uint32_t *)((char *)p + 0x2C);  // @0x6a3da2/da8
        /* +0x06..+0x07 : non initialisé */
        *(uint32_t *)(blob + 0x08) = (uint32_t)(uintptr_t)a00900901;   // @0x6a3ddf
        *(uint16_t *)(blob + 0x0C) = (uint16_t)0xFF80;                 // -128 @0x6a3dd8 (store 16 bits)
        *(uint16_t *)(blob + 0x0E) = (uint16_t)(idx << 5);             // idx×32, shl 5 @0x6a3dba/dbd
        *(uint32_t *)(blob + 0x10) = dword_25102C8 + 0xCE8;            // @0x6a3dc8/dd4

        /* push 0 ; push &blob ; push offset sub_6A41E0 ; push (ebx+30h)
         * → sub_701970(p+0x30, sub_6A41E0, &blob, 0) @0x6a3de7 ; add esp,10h */
        sub_701970((char *)p + 0x30, sub_6A41E0, blob, 0);
    }

    /* ================= B2 : 0x6a3def..0x6a406b ==============================
     * Fenêtre : esi = step-0x20 ; cmp esi,0x30 ; jnb UNSIGNED @0x6a3dfb
     * → step ∈ [0x20,0x50) (movsx : step<0 exclu).                           */
    idx = (int)T_step(p);                       // re-load movsx @0x6a3def
    t   = idx - 0x20;                           // @0x6a3df3
    if ((unsigned int)t < 0x30u)
    {
        bbox[0] = (short)0x7FFF;                // minx @0x6a3e08
        bbox[1] = (short)0x7FFF;                // miny @0x6a3e0d
        bbox[2] = (short)0x8001;                // maxx : 0xFFFF8001 = -32767 @0x6a3e1c/21
        bbox[3] = (short)0x8001;                // maxy
        acc = 0;                                // edi=0 @0x6a3e06/26
        arg_slot = 0x10000;                     // @0x6a3e2a (slot E+4)
        Field_readCaPre(&dword_1D97778);        // @0x6a3e32
        preCamReadVariables_Space(&dword_1D97778); // @0x6a3e3c ; add esp,8 @0x6a3e41

        /* Boucle cibles : garde jle SIGNÉE @0x6a3e48 sur word [ebx+0Eh] ;
         * ebp = ebx+14h, stride 4 (add ebp,4 @0x6a3e6e) ; compteur re-lu
         * movsx signé + jl @0x6a3e71/0x6a3e77.                                   */
        if ((int)T_tgtcnt(p) > 0)
        {
            uint32_t *tgt = (uint32_t *)((char *)p + 0x14);   // @0x6a3e4a
            for (i = 0; i < (int)T_tgtcnt(p); i++)
            {
                /* push &arg_slot ; push [ebp+0] ; push &bbox →
                 * sub_6A5F10(&bbox[0], *tgt, &arg_slot) ; retour OR-é dans acc */
                acc |= (unsigned int)sub_6A5F10(&bbox[0], (void *)*tgt++, &arg_slot); // @0x6a3e5b
            }                                                 // add esp,0Ch @0x6a3e64
        }

        /* 0x6a3e79.. : arg_slot -= 0x80 (ecx signé) ; test acc ; jz → B3 ;
         * test/jle SIGNÉ sur arg_slot ; jle → B3 (0x6a3e8d/0x6a3e97).            */
        arg_slot -= 0x80;                                   // @0x6a3e81
        if (acc == 0)            goto L_B3;                 // @0x6a3e8d
        if (arg_slot <= 0)       goto L_B3;                 // jle signé @0x6a3e97

        /* Milieux : d = max-min (16 bits), [max] = d (word @0x6a3eaf/0x6a3ec7),
         * min += d/2 vers ZÉRO (movsx;cdq;sub eax,edx;sar 1 @0x6a3eb9-c4/0x6a3ecc-d7)
         * → min=(min+max)/2, max=min... max=largeur/hauteur.                     */
        {
            short d0 = (short)(bbox[2] - bbox[0]);
            bbox[2] = d0;
            bbox[0] = (short)(bbox[0] + d0 / 2);            // /2 signé vers zéro
            short d1 = (short)(bbox[3] - bbox[1]);
            bbox[3] = d1;
            bbox[1] = (short)(bbox[1] + d1 / 2);
        }

        setSomeDword5((char *)p + 0x28);                    // push &centre @0x6a3eda
        cameraRelated_usedByFields();                       // 0 arg @0x6a3eea
        setSomeDword(&out1);                                // → E-0x1C @0x6a3ef4
        setSomeDword4(&out2);                               // → E-0x18 @0x6a3efe
        /* add esp,0Ch (3 pushes : +28h, &var_1C, &var_18) @0x6a3f0c */

        /* out1 : chaque mot /8 SIGNÉ vers zéro (movsx;cdq;and edx,7;add;sar 3)
         * mot bas @0x6a3f03-14, mot haut @0x6a3f19-2c.                           */
        {
            short lo = (short)out1, hi = (short)(out1 >> 16);
            lo = (short)(lo / 8);
            hi = (short)(hi / 8);
            out1 = (unsigned int)((uint16_t)lo | ((uint16_t)hi << 16));
        }

        /* out2 : zmin = 0x18000 / (short)out2 — idiv SIGNÉ @0x6a3f31-37
         * (faute si diviseur 0 ; comportement ASM préservé).                     */
        zmin = 0x18000 / (int)(short)out2;
        out2 = (unsigned int)(uint16_t)zmin;                // store word @0x6a3f45

        /* Clamp MAX signé : cmp cx,dx ; jge garder → size = max(size, zmin). */
        if ((int)(short)bbox[2] < zmin) bbox[2] = (short)zmin;   // jge @0x6a3f46
        if ((int)(short)bbox[3] < zmin) bbox[3] = (short)zmin;   // jge @0x6a3f58

        word_2517A60 = bbox[3];                             // hauteur @0x6a3f67
        word_2517A58 = bbox[2];                             // largeur @0x6a3f6e
        dword_2517A70 = (int)(short)bbox[1];                // centre Y (var_22) @0x6a3f7c
        dword_2517A6C = (int)(short)bbox[0];                // centre X (var_24) @0x6a3f89

        /* sin : (t<<11) × 0xAAAAAAAB ; shr edx,5 = /48 UNSIGNED (0x6a3f81-91)
         * → Fixed_Sin4096_Q12((unsigned)(t*2048)/48) ; inv = 0x1000 - eax.       */
        inv_sin = 0x1000 - Fixed_Sin4096_Q12((int)(((unsigned int)t << 11) / 48u)); // 0x6a3f95-a2

        /* Escalade t<8 : movsx globals ; imul esi ; SHR LOGIQUE >>3
         * (0x6a3fb7-fc0) — pas sar : produit tronqué logiquement.                */
        if ((unsigned int)t < 8u)                           // jnb UNSIGNED @0x6a3fa7
        {
            word_2517A58 = (short)((unsigned int)((int)word_2517A58 * t) >> 3);
            word_2517A60 = (short)((unsigned int)((int)word_2517A60 * t) >> 3);
        }

        Field_readCaPre(&word_2517A58);                     // @0x6a3fd5
        preCamReadVariables_Space(&word_2517A58);           // @0x6a3fdf ; add esp,8 @0x6a3fe4

        /* Fade 3 bandes (jnb UNSIGNED) + /12 par magie (shr edx,3) :
         *  t<0x0C        : 0x10 - (16t/12)          @0x6a3fec-0x6a4002
         *  t<0x18        : 16(t-0x0C)/12            @0x6a4009-19
         *  sinon         : 16 + 16(t-0x18)/12, puis si >0x1F (jle SIGNÉ @0x6a4037)
         *                  → 0x40 - fade @0x6a4039-3e
         *  clamp commun  : si fade > 0x1F (jle SIGNÉ @0x6a4045) → 0x1F.           */
        if ((unsigned int)t < 0xCu)
            fade = 0x10 - (int)(((unsigned int)t << 4) / 12u);
        else if ((unsigned int)t < 0x18u)
            fade = (int)((((unsigned int)t - 0xC) << 4) / 12u);
        else
        {
            fade = (int)((((unsigned int)t - 0x18) << 4) / 12u) + 0x10;
            if (fade > 0x1F)
                fade = 0x40 - fade;
        }
        if (fade > 0x1F)                                    // clamp commun @0x6a4042-47
            fade = 0x1F;

        /* push fade ; sar ecx,2 SIGNÉ +0x11 sur arg_slot ; push inv ; push (arg/4+17) ;
         * push &unk_25102D4 ; push &unk_25102CC → sub_6A5700 @0x6a4063 ; add esp,14h */
        sub_6A5700(&unk_25102CC, &unk_25102D4,
                   (arg_slot >> 2) + 0x11,                  // sar 2 signé @0x6a4051
                   inv_sin, fade);
    }

    /* ================= B3 : 0x6a406b..0x6a417e ============================== */
L_B3:
    if (T_step(p) == 0)                                     // cmp word,0 ; jnz @0x6a4070
        BdPlaySE(&dword_11AC274, 0, 0x80u);                 // push 80h,0,&11AC274 @0x6a407e

    /* Fenêtre spawns : movsx ; sub 0x30 ; cmp 0x10 ; jnb UNSIGNED @0x6a4090
     * → step ∈ [0x30,0x40).                                                  */
    if ((unsigned int)((int)T_step(p) - 0x30) < 0x10u)
    {
        arg_slot = 4;                                       // compteur @0x6a40a0
        hdl = BdLinkTask_Register(&dword_2517A28, sub_6A5650); // @0x6a40a8 ; add esp,8
        while (hdl != NULL)                                 // test/jz @0x6a40b2-b4
        {
            vec = (short *)((char *)hdl + 0x0C);            // ebp = esi+0Ch @0x6a40ba
            *(short *)((char *)hdl + 0x12) = 0;             // @0x6a40bd

            /* push vec ; call rand ; push eax ; call rand ; push eax ;
             * call Vec3_MulSinCos_Q12 ; add esp,0Ch →
             * Vec3_MulSinCos_Q12(2e rand, 1er rand, vec) @0x6a40c3-d5. */
            {
                int r1 = _rand();                           // @0x6a40c4
                int r2 = _rand();                           // @0x6a40ca
                Vec3_MulSinCos_Q12(r2, r1, vec);            // @0x6a40d0
            }

            /* 3e rand : scal = 0x800 + (rand & 0x7FF) ∈ [0x800,0xFFF] @0x6a40d8-ee */
            {
                int s  = (int)(_rand() & 0x7FF) + 0x800;
                int xq = ((int)vec[0] * s) >> 12;           // imul + SAR 0Ch (Q12 signé) @0x6a40f3-fe
                int yq = ((int)vec[1] * s) >> 12;           // @0x6a40f6 / 0x6a4114
                int zq = ((int)vec[2] * s) >> 12;           // @0x6a40f9 / 0x6a4121

                *(short *)((char *)hdl + 0x18) = 0;         // ordre ASM : +18,+16,+14 @0x6a4101-09
                *(short *)((char *)hdl + 0x16) = 0;
                *(short *)((char *)hdl + 0x14) = 0;
                /* Vitesses en octets : neg 32b puis SAR 7, octet bas
                 * (0x6a410d-17 / 0x6a411a-24 / 0x6a4127-2b) — PAS un booléen. */
                ((uint8_t *)hdl)[0x1A] = (uint8_t)((-xq) >> 7);
                ((uint8_t *)hdl)[0x1B] = (uint8_t)((-yq) >> 7);
                ((uint8_t *)hdl)[0x1C] = (uint8_t)((-zq) >> 7);
                vec[0] = (short)xq;                         // @0x6a412e
                vec[1] = (short)yq;                         // @0x6a4132
                vec[2] = (short)zq;                         // @0x6a4136
                /* Centres : add 16 BITS (ax/cx/dx) @0x6a413d-59. */
                vec[0] = (short)(T_cx(p) + (short)xq);
                vec[1] = (short)(T_cy(p) + (short)yq);
                vec[2] = (short)(T_cz(p) + (short)zq);
            }

            arg_slot--;                                     // dec @0x6a4158
            if (arg_slot == 0)                              // jz sur ZF du dec @0x6a4161
                goto L_B4;                                  // 4 spawns max
            hdl = BdLinkTask_Register(&dword_2517A28, sub_6A5650); // @0x6a416d ; add esp,8
        }                                                   // test/jnz @0x6a4177-79
    }

    /* ================= B4 : 0x6a417f..0x6a41de ============================== */
L_B4:
    /* mov ax,[ebx+0Ch] (chargement 16 bits SANS movsx @0x6a417f) ;
     * cmp ax,50h ; jl SIGNÉ 16 bits @0x6a4189.                                */
    {
        int step16 = (int)(short)T_step(p);                 // comparaison signée 16 bits
        if (step16 < 0x50)
        {
            /* 0x6a41d2 : inc eax (bits hauts à 0 via mov ax) ; mov [ebx+0Ch],ax ;
             * xor eax,eax → retour 0.                                            */
            T_step(p) = (short)(step16 + 1);
            return 0;
        }
        /* esi = dword_25102C8 + 0x1A2C @0x6a418b-91 ; jnz (ZF du cmp ax,50h)
         * → si step != 0x50 : saut direct au retour du drapeau.                  */
        if (step16 == 0x50)
        {
            /* [2517A0C]+4 → rec ; rec+8 = records (ptr) ; rec+0x10 = count (byte,
             * zéro-étendu via xor ecx,ecx @0x6a419f).                                */
            uint32_t ctxev = *(uint32_t *)(uintptr_t)dword_2517A0C;          // @0x6a4199
            uint32_t rec   = *(uint32_t *)(ctxev + 4);                       // @0x6a41a1
            void     *records = *(void **)(rec + 8);                         // @0x6a41a7
            unsigned int count = *(uint8_t *)(rec + 0x10);                   // @0x6a41a4
            BattleAction_ApplyEventRecords(records, count);                  // @0x6a41ac
            BdLinkTask_Spawn_508660((char *)(uintptr_t)dword_25102C8 + 0x1A2C,// esi @0x6a4191
                                    (char *)p + 0x10);                       // ebx+10h @0x6a41b1
            /* add esp,10h (4 pushes : count, records, +10h, esi) @0x6a41bb */
            T_step(p) = (short)(step16 + 1);                 // inc word @0x6a41be
        }
    }
    /* neg al ; sbb eax,eax ; and eax,2 → 2 si [ebx+10h] != 0, sinon 0
     * (0x6a41c2-cb) ; EAX défini sur 32 bits.                                 */
    return (T_done(p) != 0) ? 2 : 0;
}

/* ===========================================================================
 * UNCERTAIN restants (aucune preuve ASM suffisante)
 *  1. 0x6a3ddf : rôle du tag "00900901" (a00900901) stocké à blob+0x08 —
 *     littéral transmit à sub_701970, sens inconnu.
 *  2. 0x6a3de7 : sémantique complète de sub_701970 et du ctx 0x14 o (dont le
 *     trou +0x06..+0x07 jamais écrit, transmis tel quel).
 *  3. 0x6a3e5b : signature/retour exacts de sub_6A5F10 (bbox 4 mots par
 *     adresse, 3e arg in/out, eax OR-é) — déduits des seuls usages.
 *  4. 0x6a3f31 : signification du mot bas de out2 (diviseur idiv de 0x18000 ;
 *     0 → faute div, comportement ASM préservé).
 *  5. 0x6a3fd0 : étendue exacte de la structure pointée par &word_2517A58 pour
 *     le duo Field_readCaPre/preCamReadVariables_Space (word_2517A60 à +8).
 *  6. 0x6a41b6 : valeur de retour / effets de bord complets de
 *     BdLinkTask_Spawn_508660 (eax ignoré ici).
 *  7. 0x6a3ee5-0x6a3f0c : sémantique setSomeDword5 / cameraRelated_usedByFields /
 *     setSomeDword / setSomeDword4 (1 arg chacun, 3 pushes nettoyés d'un bloc
 *     par add esp,0Ch — layout prouvé, rôle non).
 *  8. 0x6a40c3/0x6a40c9 : les pushes (vec puis r1) laissent 1 arg résiduel sur
 *     la pile pendant chaque _rand — si _rand = rand(void), args inertes ;
 *     pas de preuve depuis cette fonction seule.
 * =========================================================================== */
```

## Analyse semantique

# Sémantique sub_6A3D90 @ 0x6A3D90 (réconciliation R)

- **Rôle (1 phrase)** : callback BdLinkTask tick de la sous-tâche FX du sort M207 Maelstrom (enregistrée sur la liste `dword_2517A38` par le stepper parent 0x6A3B70) : machine à états sur `word [ebx+0Ch]` — maintenance de l'instance d'effet (sub_701970) tant que step < 0x50, SE de départ au tick 0, bbox/zoom caméra des cibles sur [0x20,0x50), salve de 4 particules par tick sur [0x30,0x40), puis application des event records + spawn de la tâche finale à step == 0x50 exactement.
- **Verdict : LIKELY consolidé.** Mécanique intégralement prouvée par l'ASM (callers, callees, opcodes cités, xref caller vérifiée live) ; le label « M207 Maelstrom » hérite de la chaîne d'ancrage 0x6A3AB0 (CERTAIN, magie 207) → 0x6A3AE0 (CERTAIN) → 0x6A3B70 (LIKELY) — un maillon LIKELY interdit CERTAIN.
- **Confiance : LIKELY** (mécanique de grade CERTAIN au niveau opcodes ; étiquette famille portée par le caller ancré, pas par un nom catalogue propre).
- **Nom catalogue** : absent (nom IDA `sub_6A3D90`). Le contexte orchestrateur (« sous-task enregistrée par BattleMagic_M207_Maelstrom_Stepper, listes 2517A38/2517A28 ») est **conforme** à l'ASM : xref data unique @0x6a3c3a depuis sub_6A3B70, liste enfant `dword_2517A28`, retours 0/2. **Confirme** le contexte, pas de mensonge ni de sur-étendue détectée.
- **Nom proposé (markdown seul, PAS de rename)** : **`BattleMagic_M207_Maelstrom_SubTaskTick`** (tranche en faveur de B, voir Divergences).

## In / Out / Effets

**In** : `ebx = arg_0` = nœud de tâche BdLink (cdecl, 1 arg stack @0x6a3d94). Champs :
- `+0x0C` s16 : compteur de step/phase (lu movsx @0x6a3d99/0x6a3def/0x6a4086, rechargé `mov ax` 16 bits @0x6a417f, incrémenté @0x6a41d2-4 et 0x6a41be) ;
- `+0x0E` s16 : nombre de cibles, tableau de pointeurs à `+0x14` **stride 4** (`add ebp,4` @0x6a3e6e ; comparaisons signées @0x6a3e48/0x6a3e77) ;
- `+0x10` u8 : flag de complétion (passé par adresse au spawn final @0x6a41b1, relu @0x6a41c2 pour le retour) ;
- `+0x28/+0x2A/+0x2C` : centre XYZ s16 (aussi lus opaques dwords @0x6a3da2-a5) ; `+0x30` : passé tel quel à sub_701970 (@0x6a3dc5).

Globals consommées : `dword_25102C8` (base battle : +0xCE8 ctx effet, +0x1A2C spawn final), `dword_2517A0C` (ctx événements : [ptr+4]→rec, rec+8 = records, rec+0x10 = count byte), `dword_1D97778` (caméra field), `dword_11AC274` (handle SE). Slot arg entrant `[E+4]` réutilisé comme scratch (0x10000 @0x6a3e2a, puis compteur 4 @0x6a40a0 — preuve ESP : esp=E-0x3C puis E-0x40).

**Out / Effets** :
- appelle `sub_701970(ebx+30h, sub_6A41E0, &blob, 0)` chaque tick < 0x50 (blob 0x14 o : +0 dword[ebx+28h], +4 dword[ebx+2Ch], +8 offset "00900901", +0C 0xFF80 word, +0E step×32 (shl 5 @0x6a3dba), +10 dword_25102C8+0xCE8 ; trou +06..+07 jamais écrit) — push order 0x6a3dc2-d3, `add esp,10h` @0x6a3dec ;
- fenêtre [0x20,0x50) (`(step-0x20)<0x30` jnb @0x6a3dfb) : lit caméra (`Field_readCaPre`/`preCamReadVariables_Space(&dword_1D97778)` @0x6a3e32-3c), projette les cibles via `sub_6A5F10(&bbox, [ebx+14h+4i], &arg_slot)` avec OR d'accumulateur @0x6a3e5b-e77 ; si acc≠0 et `arg_slot-0x80 > 0` signé (@0x6a3e8d/0x6a3e97) : milieux (max-min)/2 vers zéro @0x6a3eb9-ed7, mots /8 signés @0x6a3f03-2c, `zmin = 0x18000 / (short)out2` idiv signé @0x6a3f31-37, clamp min signés @0x6a3f46/0x6a3f58, puis stores **word_2517A60 = taille Y, word_2517A58 = taille X, dword_2517A70 = centre Y, dword_2517A6C = centre X** (@0x6a3f62-f89) ; angle sin = `(t<<11)/48` (magie 0xAAAAAAAB, `shr edx,5` @0x6a3f8f-91) → `Fixed_Sin4096_Q12` @0x6a3f95, `edi = 0x1000 − sin` @0x6a3f9a-a2 ; ramp-in t<8 : `word_2517A58/A60 = (val×t) >> 3` **SHR logique** @0x6a3fb7-fc0 ; application caméra (`Field_readCaPre`/`preCamReadVariables_Space(&word_2517A58)` @0x6a3fd0-fdf) ; fade 3 bandes /12 par magie (`shr edx,3` @0x6a3ff6/0x6a4019/0x6a402e, miroir 0x40−fade si >0x1F @0x6a4039, clamp 0x1F @0x6a4047) ; `sub_6A5700(&unk_25102CC, &unk_25102D4, (arg_slot>>2 sar)+0x11, edi, fade)` @0x6a4063 ;
- step 0 : `BdPlaySE(&dword_11AC274, 0, 0x80)` @0x6a407e (une seule fois, `cmp word,0`/`jnz` @0x6a406b-70) ;
- fenêtre [0x30,0x40) : jusqu'à **4** spawns/tick sur `dword_2517A28` via `BdLinkTask_Register(list, sub_6A5650)` @0x6a40a8/0x6a416d (compteur = 4 ré-armé chaque tick @0x6a40a0) ; par nœud : direction aléatoire 2× `_rand` → `Vec3_MulSinCos_Q12` @0x6a40c3-d5, `scale = 0x800 + (rand & 0x7FF)` ∈ [0x800,0xFFF] Q12 @0x6a40e5-ee, comps `>> 12` SAR @0x6a40fe/0x6a4114/0x6a4121, vitesses byte = `(−comp) >> 7` (neg + sar 7) @0x6a410d-2b, position += centre tâche (add 16 bits) @0x6a413d-59 ;
- step == 0x50 exactement (jnz @0x6a4197) : `rec = [dword_2517A0C+4]`, `BattleAction_ApplyEventRecords([rec+8], (u8)[rec+0x10])` @0x6a41ac (push order : edx d'abord = records, ecx = count @0x6a41aa-ab), puis `BdLinkTask_Spawn_508660(dword_25102C8+0x1A2C, &ebx+10h)` @0x6a41b6 ; `inc word [ebx+0Ch]` → 0x51 @0x6a41be.

**Out / retour** : EAX défini 32 bits = **0** (continuer, `xor eax,eax` @0x6a41d8 tant que step < 0x50) ou **2** (`neg al; sbb eax,eax; and eax,2` @0x6a41c6-cb → 2 ssi byte `[ebx+10h] != 0`). Pas de retour 1. Sens 2 = fin/unlink cohérent avec le stepper parent (retour 2 si Pump==0 && flag) et le contrat BdLinkTask_Pump.

**Phases** : SE @ step 0 · caméra/cibles [0x20,0x50) · particules [0x30,0x40) · impact + spawn @ step 0x50 pile.

## Divergences A/B tranchées (une par une, preuve ASM adresée)

1. **Nom** — A : `..._SubTask_Stepper` ; B : `..._SubTaskTick`. **Tranché : B.** Preuves : (a) 0x6a3c3a-44 live IDA : `push offset sub_6A3D90; push offset dword_2517A38; call BdLinkTask_Register` → callback tick pompé, pas un stepper autonome ; (b) 0x6a41d2-d4 : `inc eax; mov [ebx+0Ch],ax` → progression par appel (tick) ; (c) « Stepper » est déjà porté par le parent 0x6A3B70 dans le catalogue — A créerait une collision de rôle.
2. **Ordre d'arguments sub_701970** — A rend `sub_701970(&var_14, 0, sub_6A41E0, ebx+30h)` (ordre de push) ; B rend `sub_701970(sub_6A41E0, [ebx+30h], &desc, 0)` (inversé). **Tranché : `sub_701970(ebx+30h, sub_6A41E0, &blob, 0)`** — push order 0x6a3dc2 (0) → 0x6a3dc4 (&blob) → 0x6a3dce (sub_6A41E0) → 0x6a3dd3 (ebx+30h), cdecl droite→gauche, `add esp,10h` @0x6a3dec.
3. **Champ blob +0x0E** — A et B : « step » brut. **Tranché : step × 32** — `shl eax,5` @0x6a3dba avant store word @0x6a3dbd.
4. **Division de l'angle sinusoïdal** — A : `(t<<11) ÷ 48` ✓ ; B : `(t·2048)/12` ✗. **Tranché : /48** — mul 0xAAAAAAAB + `shr edx,5` @0x6a3f8f-91 ≡ division par 48 (le /12 `shr edx,3` concerne uniquement les bandes de fade @0x6a3ff6/0x6a4019/0x6a402e). B a fusionné les deux magies.
5. **Nature des stores bbox 0x6a3f62-f89** — A : « word_2517A60 (min Y), word_2517A58 (min X) » ✗ ; B : « offsets écran / point pivot » (vague). **Tranché (c_reconciled)** : après conversion midpoint, ce sont **taille Y / taille X** (clamps zmin @0x6a3f46/58) et **centre Y / centre X** sign-étendus — preuve : 0x6a3f3e-5d clampe `var_20/var_1E` (issus de max−min @0x6a3ea7/0x6a3ebf) avant les stores 0x6a3f67/0x6a3f6e ; les centres viennent de var_24/var_22 (midpoints @0x6a3ec4/0x6a3ed7).
6. **Ramp-in t<8** — A : `*= esi; >> 3` (non spécifié) ; B : non détaillé. **Tranché : SHR logique** (pas SAR) — `shr edx,3`/`shr eax,3` @0x6a3fbd/fc0 sur produit imul signé.
7. **Ordre d'arguments ApplyEventRecords** — B : `ApplyEventRecords(count, result_event)` ✗ ; A : ordre non rendu. **Tranché : `ApplyEventRecords(records, count)`** — `push ecx`(count) @0x6a41aa puis `push edx`(records) @0x6a41ab : arg1 = edx = records, arg2 = ecx = count (cdecl).
8. **Cadence des spawns particules** — B questionne « 4/tick × 16 ticks ≈ 64, mal lu ? ». **Tranché : 4 par tick, voulu** — le compteur 4 est ré-armé à chaque entrée de fenêtre (`mov [esp+40h+arg_0],4` @0x6a40a0, dans le bloc conditionnel), boucle `dec`/`jz` @0x6a4158-61 avec re-Register @0x6a416d.
9. **Sémantique du retour 2** — A : « 2 si byte non nul » (descriptif) ; B : « bit 2 = unlink du contrat BdLinkTask_Pump » (interprétation wiki). **Tranché : les deux, hiérarchisés** — l'ASM prouve la valeur (`neg;sbb;and 2` @0x6a41c6-cb) ; l'interprétation unlink est appuyée par le parent 0x6A3B70 (retour 2 conditionné au Pump) : conservée comme LIKELY, non comme preuve ASM de cette cellule.

Convergences confirmées sans divergence : xref caller unique data @0x6a3c3a ; liste enfant dword_2517A28 ; SE BdPlaySE au tick 0 ; fenêtres [0x20,0x50)/[0x30,0x40)/step 0x50 pile ; scale Q12 0x800..0xFFF ; vel neg+sar 7 ; idiv 0x18000 signé ; retours 0/2.

## Preuves (ASM cité, 3–8)

1. **0x6a3c3a-44 (live IDA, callers.txt)** : `push offset sub_6A3D90; push offset dword_2517A38; call BdLinkTask_Register` — sous-tâche enregistrée comme callback par sub_6A3B70 ; xref data unique.
2. **0x6a3d99-0x6a3da0** : `movsx eax, word [ebx+0Ch]; cmp eax,50h; jnb` + 0x6a41d2-d4 `inc eax; mov [ebx+0Ch],ax` — machine à états tick sur +0x0C, fenêtre < 0x50 unsigned.
3. **0x6a3f8f-0x6a3fa2** : `mul 0AAAAAAABh; shr edx,5; push edx; call Fixed_Sin4096_Q12; mov edi,1000h; sub edi,eax` — angle (t<<11)/48, amorti 0x1000−sin Q12.
4. **0x6a40a0 + 0x6a40a8/0x6a416d** : `mov [esp+40h+arg_0],4` puis `call BdLinkTask_Register` (liste dword_2517A28, callback sub_6A5650) — 4 particules/tick sur [0x30,0x40) (garde jnb @0x6a4090).
5. **0x6a418b-0x6a41b6** : `lea esi,[ecx+1A2Ch]; jnz short loc_6A41C2` (step==0x50 pile) ; `mov cl,[eax+10h]; mov edx,[eax+8]; push ecx; push edx; call BattleAction_ApplyEventRecords` ; `lea eax,[ebx+10h]; push eax; push esi; call BdLinkTask_Spawn_508660` — impact + handoff final.
6. **0x6a41c2-0x6a41cb** : `mov al,[ebx+10h]; neg al; sbb eax,eax; and eax,2` — retour EAX 32 bits = 2 ssi flag +0x10 non nul ; chemin alternatif `xor eax,eax` @0x6a41d8.
7. **0x6a40e5-0x6a412b** : `and eax,7FFh; add eax,800h` (scale Q12 0x800..0xFFF), `sar edi,0Ch` (Q12 signé), `neg eax; sar eax,7` (vitesses byte) — particules aléatoires.
8. **0x6a3e6e + 0x6a3f31-37** : `add ebp,4` (stride 4 sur +14h) ; `mov eax,18000h; cdq; idiv ecx` — cibles stride 4, zoom minimum 0x18000/diviseur signé.

## Checks §5.6

- **Callees** : les 16 cités présents dans callees.txt (sub_701970, Field_readCaPre, preCamReadVariables_Space, sub_6A5F10, setSomeDword5, cameraRelated_usedByFields, setSomeDword, setSomeDword4, Fixed_Sin4096_Q12, sub_6A5700, BdPlaySE, BdLinkTask_Register, _rand, Vec3_MulSinCos_Q12, BattleAction_ApplyEventRecords, BdLinkTask_Spawn_508660) ; sub_6A41E0/sub_6A5650 référencés comme pointeurs de callback seulement (@0x6a3dce, @0x6a4096/0x6a4163) — absents à juste titre. ✓
- **Caller** : sub_6A3B70, xref data unique @0x6a3c3a — vérifié live dans l'IDB (disasm ci-dessus). ✓
- **Strides en nombres** : cibles +14h stride **4** (@0x6a3e6e) ; blob ctx 0x14 o avec offsets +0/+4/+8/+0C/+0E/+10 en nombres ; nœud particule +0C/+0E/+10/+12/+14/+1A-1C. ✓
- **Polarités** : `jnb` UNSIGNED pour les fenêtres de bandes (@0x6a3da0, 0x6a3dfb, 0x6a3fa7, 0x6a3fea, 0x6a4007, 0x6a4090) ; `jle/jge/jl` SIGNÉS pour clamps et compteurs (@0x6a3e48, 0x6a3e77, 0x6a3e97, 0x6a3f46, 0x6a3f58, 0x6a4037, 0x6a4045, 0x6a4189) ; SHR logiques @0x6a3f91/0x6a3fbd/0x6a3fc0/0x6a3ff6/0x6a4019/0x6a402e vs SAR @0x6a3ec2/ed5/f11/f29/4051/40fe/4111/4114/411e/4121/412b — cohérents (division entière positive par magie vs division signée). ✓
- **Largeur retour** : EAX défini 32 bits sur les deux sorties (0 xor @0x6a41d8 ; 2 sbb+and @0x6a41c8-cb) ; AL significatif — conforme contrat 0/2. ✓
- **Nom ≥2 preuves ASM indépendantes adresées** : (1) enregistrement BdLinkTask @0x6a3c3a-44 ; (2) progression par tick `inc [ebx+0Ch]` @0x6a41d2-4/0x6a41be ; (3) retour bit unlink @0x6a41c6-cb. Proposition `BattleMagic_M207_Maelstrom_SubTaskTick` (markdown seul). ✓

## Questions ouvertes (non bloquantes)

- Contenu exact du byte `[ebx+10h]` (écrit par qui ? la tâche spawnée 0x508660 ?) — déduit, non prouvé dans ce corps.
- Rôle du tag `"00900901"` et du trou +06..+07 du blob 0x14 transmis à sub_701970.
- Sémantique complète de sub_6A5700 (driver d'onde/écran ?) et du paramètre `(arg_slot>>2)+0x11`.
- Identité de dword_25102C8+0xCE8 et +0x1A2C (listes FX / contexte tâche) — à trancher côté 0x508660/sub_701970.

## IDBCOMMENT

Tick de la sous-tache BdLink du sort Maelstrom M207, enregistre comme callback sur la liste 2517A38 par le stepper 0x6A3B70 a 0x6a3c3a. Machine a etats sur word [ebx+0Ch] : instance d'effet sub_701970 tant que step < 0x50, SE BdPlaySE au tick 0, bbox et zoom camera des cibles ([ebx+14h] stride 4) sur [0x20,0x50), 4 particules aleatoires par tick sur 2517A28 sur [0x30,0x40), puis a step 0x50 exactement BattleAction_ApplyEventRecords + spawn BdLinkTask_Spawn_508660(base+1A2C, &ebx+10h). Retour EAX 0 ou 2 : 2 (bit unlink du pump) quand le byte [ebx+10h] devient non nul. [semantic-triple 2026-09-21]

## Notes C-R

# reconcile_notes.md — sub_6A3D90 (0x6A3D90, 319 instr, 1103 o)

Ground truth = live ASM (`asm.asm`). Hex-Rays (`hexrays.c`) = vérificateur seulement.
Voix réconciliées : c_a.c (A), c_b.c (B). Verdicts tranchés **contre l'ASM**, jamais par moyenne.

Arbitrages demandés par le parent — tous tranchés :

## Point 1 — B1 : blob 0x14 o → sub_701970 si step<0x50

- **A** : blob avec champ +0x0C = 0xFF80, +0x0E = t<<5, +0x10 = dst ; appelle sub_701970(a1+0x30, sub_6A41E0, blob, 0).
- **B** : struct `CTX_701970` avec champ f06=0xFF80 (donc 0xFF80 à +0x06, pas +0x0C) et trou non initialisé à +0x0C.
- **TRANCHÉ (layout repris store par store, preuve ESP adressed)** : à l'entrée du bloc esp = E-0x28, donc les stores donnent :
  - `0x6a3dac var_14` = E-0x14 (dword [ebx+28h]) ; `0x6a3da8 var_10` = E-0x10 (dword [ebx+2Ch]) ; `0x6a3ddf var_C` = E-0x0C (&"00900901", dword) ; `0x6a3dd8 var_8` = E-0x08 (**WORD** 0xFF80 : un dword écraserait var_6 écrit avant à 0x6a3dbd) ; `0x6a3dbd var_6` = E-0x06 (word idx<<5, `shl eax,5` @0x6a3dba) ; `0x6a3dd4 var_4` = E-0x04 (dword dword_25102C8+0xCE8 @0x6a3dc8).
  - **Layout adopté (c_reconciled.c)** : +0x00 dword [p+0x28], +0x04 dword [p+0x2C], **+0x06..+0x07 NON INITIALISÉ (trou)**, +0x08 dword &"00900901", +0x0C word 0xFF80, +0x0E word idx×32, +0x10 dword dword_25102C8+0x0CE8. La struct de B avait inversé +0x06/+0x0C ; la struct de A plaçait 0xFF80 au bon +0x0C mais manquait le trou. Séquence d'appel : `push 0 ; push &blob ; push sub_6A41E0 ; push ebx+30h` @0x6a3dc2-0x6a3de7 → `sub_701970(p+0x30, sub_6A41E0, &blob, 0)`, `add esp,10h` @0x6a3dec. dst = dword_25102C8+0x0CE8 confirmé @0x6a3dc8.

## Point 2 — B2 (step ∈ [0x20,0x50)) : bbox, midpoints, idiv, sin, fade, sub_6A5700

- **Fenêtre** : `movsx` puis `sub esi,20h` @0x6a3def-f3, `cmp esi,30h ; jnb loc_6A406B` @0x6a3df7-fb — **unsigned** → step ∈ [0x20,0x50) (les deux voix d'accord).
- **Bbox cibles stride 4** : `lea ebp,[ebx+14h]` @0x6a3e4a, `add ebp,4` @0x6a3e6e — **stride 4** confirmé ; garde `jle` **signée** @0x6a3e48, compteur rechargé `movsx` + `jl` @0x6a3e71-77. `sub_6A5F10(&bbox[0], *tgt, &arg_slot)` ; retour **OR-é** dans var_28 (`or ecx,eax` @0x6a3e67) ; 3e arg in/out = slot E+4 (init 0x10000 @0x6a3e2a, `-0x80` @0x6a3e81). A et B d'accord ; adopté.
- **Midpoints /2 vers zéro** : A écrivait « d/rng = var - mid ; mid += d/2 ; var reprend la différence » avec un léger flou sur qui stocke quoi ; **B** plus précis. **TRANCHÉ (ASM)** : `0x6a3e9d-0x6a3ec7` : d0 = var_20 - var_24 (word), `[var_20] = d0` @0x6a3eaf, `cdq; sub eax,edx; sar eax,1` @0x6a3ebc-c2 = **/2 signé vers zéro**, var_24 += d0/2 @0x6a3ec4 ; idem var_1E/var_22 @0x6a3ebf-0x6a3ed7 (`[var_1E] = di` @0x6a3ec7). Donc min=(min+max)/2 et max=d (qui devient la taille clampée).
- **/8 des mots de out1 (var_1C)** : `movsx;cdq;and edx,7;add;sar 3` @0x6a3f03-14 et @0x6a3f19-2c — **division signée vers zéro** (le `and edx,7` compense le sar pour le round-toward-zero). A et B d'accord.
- **idiv 0x18000** : `mov eax,18000h; cdq; idiv ecx` @0x6a3f31-37 — **signé**, diviseur = mot bas de out2 (var_18). Résultat stocké word @0x6a3f45.
- **Clamp max** : `cmp cx,ax ; jge` @0x6a3f3e-46 et @0x6a3f50-58 — **jge signé** → `size = max(size, zmin)`. A et B d'accord (A disait « clamp BAS VERS LE HAUT (max) », correct).
- **Mapping globals** : `word_2517A58 = cx` (var_20, largeur) @0x6a3f6e ; `word_2517A60 = dx` (var_1E, hauteur) @0x6a3f67 ; `dword_2517A70 = eax` où eax = `movsx var_22` @0x6a3f62 (centre Y) ; `dword_2517A6C = edx` où edx = `movsx var_24` @0x6a3f75 (centre X). **Point 6 tranché : dword_2517A70 ← var_22 (Y), dword_2517A6C ← var_24 (X)** — l'incertitude de A (note 5, « impossible à départager ») est levée par les addresses 0x6a3f62 (movsx var_22 → eax → store 2517A70 @0x6a3f7c) et 0x6a3f75 (movsx var_24 → edx → store 2517A6C @0x6a3f89).
- **Sin 4096-Q12** : `shl ecx,0Bh` @0x6a3f81 ; magie 0xAAAAAAAB + `mul` + `shr edx,5` @0x6a3f84-91 = **/48 UNSIGNED** ; `Fixed_Sin4096_Q12(…)` @0x6a3f95 ; `edi = 0x1000 - eax` @0x6a3f9a-a2. Argument = (t-32)*2048/48 (non signé). Adopté (A et B d'accord).
- **Escalade t<8** : `cmp esi,8 ; jnb` @0x6a3fa4-a7 **unsigned** ; `imul` puis **SHR logique** `>>3` @0x6a3fbd/0x6a3fc0 (voir Point 5). Adopté.
- **Fade 3 branches /12** : `jnb` **unsigned** @0x6a3fea/0x6a4007 ; magie 0xAAAAAAAB `>>3` = /12 unsigned ; branche t<0x0C : `16 - 16t/12` @0x6a3fec-0x6a4002 ; t<0x18 : `16(t-12)/12` @0x6a4009-19 ; sinon `16 + 16(t-24)/12` @0x6a401e-31, puis si `>0x1F` (`jle` **signé** @0x6a4037) → `0x40 - fade` @0x6a4039-3e ; clamp commun `>0x1F → 0x1F` (`jle` signé @0x6a4042-47). **Polarité confirmée** : B avait écrit l'inversion `64-fade` correctement ; A pareil ; Hex-Rays replie en `16*(v4+268435432)/0xC` (mod 2^32, arithmétiquement juste mais masque la séquence). Forme ASM restituée.
- **sub_6A5700** : `push edx(fade) ; sar ecx,2 ; add ecx,11h ; push edi(inv_sin) ; push ecx ; push offset unk_25102D4 ; push offset unk_25102CC` @0x6a404c-0x6a4063 → `sub_6A5700(&unk_25102CC, &unk_25102D4, (arg_slot>>2)+0x11, inv_sin, fade)`, `add esp,14h` @0x6a4068. Le `sar ecx,2` est **signé** @0x6a4051 (A et B d'accord ; le parent demandait « sub_6A5700(&25102CC,…) — ordre et polarités » : ordre ci-dessus, arg3 = (zoom-128)/4 signé + 0x11).

## Point 3 — B3 : SE à t==0 ; spawns ×4 (t ∈ [0x30,0x40))

- **SE** : `cmp word [ebx+0Ch],0 ; jnz` @0x6a406b-70 → `BdPlaySE(&dword_11AC274, 0, 0x80)` pushes `80h,0,&11AC274` @0x6a4072-7e (ordre droite→gauche : a3=0x80, a2=0, a1=&handle). `add esp,0Ch` @0x6a4083.
- **Fenêtre** : `movsx; sub 30h; cmp 10h; jnb` @0x6a4086-90 **unsigned** → step ∈ [0x30,0x40).
- **4 spawns** : compteur = 4 écrit au slot E+4 @0x6a40a0 ; boucle `BdLinkTask_Register(&dword_2517A28, sub_6A5650)` @0x6a40a8 (et 0x6a416d), échec (eax==0) → sortie @0x6a40b4/0x6a4179 ; `dec` + `jz` @0x6a4158-61 → **exactement 4 spawns max** (équivalent Hex-Rays `v19==1 break` ; A et B d'accord).
- **Ordre rand×3** : `push ebp(vec) ; call _rand ; push eax ; call _rand ; push eax ; call Vec3_MulSinCos_Q12` @0x6a40c3-d0 → **Vec3_MulSinCos_Q12(2e rand, 1er rand, vec)** — les deux voix + Hex-Rays d'accord. Note : 1 push résiduel (vec) reste sur la pile pendant les deux `_rand` (args inertes si `_rand(void)` — UNCERTAIN, voir plus bas).
- **Scalaire** : `(rand & 0x7FF) + 0x800` @0x6a40d8-ee → ∈ [0x800,0xFFF] (le parent disait « 0x800..0xFFF », confirmé).
- **Q12 + vitesses** : `imul` puis **`sar 0Ch`** (Q12 **signé** — contrairement aux `shr` de B2) @0x6a40f3-fe/0x6a4114/0x6a4121 ; stores zéro `+0x18,+0x16,+0x14` @0x6a4101-09 (ordre ASM, Hex-Rays inverse — sans effet) ; **vel octets = -((v>>12))>>7** : `neg eax; sar eax,7` (32 bits) puis store octet @0x6a410d-17/0x6a411a-24/0x6a4127-2b — tranché tel quel (pas un booléen ; roll-over possible au-delà de 128).
- **Centres** : additions **16 bits** (`add ax,[ebx+28h]` @0x6a413d-41, `add cx,[ebx+2Ah]` @0x6a4148, `add dx,[ebx+2Ch]` @0x6a4154) — confirmé (le parent disait « add 16 bits »).

## Point 4 — B4 : t==0x50, event records, spawn, retour

- **Rechargement 16 bits sans movsx** : `mov ax,[ebx+0Ch]` @0x6a417f ; `cmp ax,50h ; jl` @0x6a4184-89 — **jl signé 16 bits**. Si < 0x50 : `inc eax` @0x6a41d2, `mov [ebx+0Ch],ax` @0x6a41d4, `xor eax,eax` @0x6a41d8 → **retour 0**.
- **esi = dword_25102C8 + 0x1A2C** @0x6a418b-91 ; `jnz loc_6A41C2` @0x6a4197 (ZF du cmp) → si step != 0x50, saut direct au retour du drapeau (pas de spawn).
- **Si step == 0x50** : `mov edx,[2517A0C] ; mov eax,[edx+4] ; mov cl,[eax+10h] ; mov edx,[eax+8]` @0x6a4199-a7 → `BattleAction_ApplyEventRecords(records=[rec+8], count=(byte)[rec+0x10] zéro-étendu via xor ecx,ecx @0x6a419f)` @0x6a41ac ; puis `push ebx+10h @0x6a41b1 ; push esi @0x6a41b5` → `BdLinkTask_Spawn_508660(dword_25102C8+0x1A2C, p+0x10)` @0x6a41b6 ; `add esp,10h` @0x6a41bb (couvre les 2 pushes de ApplyEventRecords + 2 du Spawn) ; **`inc word [ebx+0Ch]` @0x6a41be exécuté UNIQUEMENT dans la branche ==0x50** (contrôlé par le jnz @0x6a4197).
- **Retour** : `mov al,[ebx+10h] @0x6a41c2 ; neg al @0x6a41c6 ; sbb eax,eax @0x6a41c8 ; and eax,2 @0x6a41cb` → **return [ebx+0x10] != 0 ? 2 : 0**, EAX défini sur 32 bits (négation 8 bits + sbb 32 bits). Correspond au « mov al;neg;sbb;and 2 » du parent @0x6a41c6-zone.

## Point 5 — imul+shr vs sar ; jnb unsigned vs jle/jg signé

- **`shr` LOGIQUES** (pas sar) confirmés adresses : 0x6a3f91 (`shr edx,5`, /48), 0x6a3fbd/0x6a3fc0 (`shr edx,eax /3` — escalade t<8), 0x6a3ff6/0x6a4019/0x6a402e (`shr edx,3`, /12 des bandes fade). **`sar` SIGNÉS** : 0x6a3ec2/0x6a3ed5 (/2 midpoints), 0x6a3f11/0x6a3f29 (/8 mots out1), 0x6a3f2c... 0x6a4051 (sar 2 sur arg_slot pour sub_6A5700), 0x6a40fe/0x6a4114/0x6a4121 (`sar 0Ch` Q12 des composantes), 0x6a4111/0x6a411e/0x6a412b (`sar 7` après neg).
- **`jnb` UNSIGNED** (fenêtres de bandes) : 0x6a3da0, 0x6a3dfb, 0x6a3fa7, 0x6a3fea, 0x6a4007, 0x6a4090. **Clamps signés** : jle @0x6a3e48/0x6a3e97/0x6a4037/0x6a4045, jge @0x6a3f46/0x6a3f58, jl @0x6a3e77/0x6a4189. Les deux voix avaient correctement distingué ; confirmé ligne à ligne.

## Point 6 — Mapping dword_2517A70/6C ← var_22/var_24

Tranché ci-dessus (section Point 2) : **dword_2517A70 ← (movsx)var_22 @0x6a3f62→0x6a3f7c ; dword_2517A6C ← (movsx)var_24 @0x6a3f75→0x6a3f89**. L'« impossible à départager » de A (note 5) est levé par le suivi des registres eax/edx dans l'ASM.

---

## Divergences vs Hex-Rays (hexrays.c = vérificateur ; l'ASM gagne)

1. **0x6a3dd8** : Hex-Rays écrit `v32 = -128` sur un champ 16 bits de sa `v31[3]` reconstituée ; l'ASM fait un store **WORD** (`mov …, 0FF80h`) — un dword écraserait `var_6` (idx×32) stocké avant. Forme ASM restituée (trou +0x06..+0x07 non initialisé).
2. **0x6a4014/0x6a4029** : Hex-Rays replie `16*(v4+268435444)/0xC` / `16*(v4+268435432)/0xC+16` — correct mod 2^32 mais masque la vraie séquence (`add -0xC/-0x18 ; shl 4 ; mul 0xAAAAAAAB ; shr edx,3` = /12 **unsigned**). Forme ASM restituée.
3. **0x6a3fbd/0x6a3fc0** : Hex-Rays `(v4 * word) >> 3` sur int signé (= sar) ; live = **shr logique** après imul signé. Restitué avec cast unsigned.
4. **0x6a4101-09** : Hex-Rays inverse l'ordre des stores zéros (+0x14 avant +0x18) ; ordre ASM restitué (+0x18, +0x16, +0x14). Sans effet sémantique.
5. **0x6a41c6-8** : Hex-Rays `return byte != 0 ? 2 : 0` — correct ; précision ajoutée : EAX défini sur 32 bits (`sbb eax,eax`), pas seulement AL (conforme à la note parent « retour AL only » : le bit utile est dans AL, mais le registre complet est déterministe).
6. **0x6a4072** : le test `step==0` (SE) et la fenêtre [0x30,0x40) sont **séquentiels**, pas imbriqués — Hex-Rays les aplates sous LABEL_24, mêmes sémantiques.
7. **0x6a40a0** : compteur écrit 1 fois avant la boucle puis `dec`+`jz` ⇔ 4 spawns max — équivalent au `v19==1 break` d'Hex-Rays.
8. **sub_701970 arg1** : Hex-Rays type `unsigned __int16 *` — non prouvé, laissé `void *`.

## UNCERTAIN restants (reportés dans c_reconciled.c)

1. **0x6a3ddf** — rôle du tag `"00900901"` (a00900901) stocké à blob+0x08.
2. **0x6a3de7** — sémantique complète de sub_701970 et du ctx 0x14 o (dont le trou +0x06..+0x07).
3. **0x6a3e5b** — signature/retour exacts de sub_6A5F10 (déduits des seuls usages).
4. **0x6a3f31** — signification du mot bas de out2 (diviseur idiv ; 0 → faute div, comportement ASM préservé).
5. **0x6a3fd0** — étendue de la structure pointée par &word_2517A58 pour le duo readCaPre/preCamReadVariables_Space.
6. **0x6a41b6** — retour/effets de bord de BdLinkTask_Spawn_508660 (eax ignoré).
7. **0x6a3ee5-0x6a3f0c** — sémantique setSomeDword5 / cameraRelated_usedByFields / setSomeDword / setSomeDword4 (layout prouvé par les pushes, rôle non).
8. **0x6a40c3/0x6a40c9** — push résiduel (vec/r1) sur la pile pendant les `_rand` : args inertes si `_rand(void)`, pas de preuve depuis cette fonction seule.

## Anomalies / limites du pack

- `callees.txt` : sections CALLS et PROTOS **vides** (seule la liste CALL/ADD-ESP est remplie) — les prototypes ci-dessus sont déduits des `add esp` de asm.asm, pas du pack.
- `callers.txt` : 1 seul xref (data @0x6a3c3a depuis sub_6A3B70) — cohérent avec un callback de step ; pas de fan-in multiple à examiner.
- Pas de `hexrays.c` divergent de fond : flux, comparaisons, clamps, boucle 4 spawns et retour 0/2 coïncident ; seuls les replis arithmétiques (points 2, 3, 5) et l'ordre des stores zéros (point 4) sont restitués en forme ASM.
