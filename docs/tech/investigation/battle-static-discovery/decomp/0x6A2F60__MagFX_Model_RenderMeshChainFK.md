# MagFX_Model_RenderMeshChainFK @ 0x6A2F60

- Instr (live): 117 (430 o, 0x6A2F60-0x6A30B6)
- Palier: 2+1
- Verdict: LIKELY - rend la chaine de nœuds d'un modele d'effet magie (4 xrefs data dans le ticker MAG_212_Timeline_Tick 0x6A1660) : scratch 0x5C (bs_modulo @0x6A2F64/Unwind @0x6A30AA), ecrit un node OT via sub_5088A0 avec g_BattleOTBase-0xBC (add ecx,0FFFFFF44h @0x6A2F7D, shift 4), transforme la position a3 (3x movsx s16->i32 @0x6A2FA5-BB), compose matrice modele a1+0x40 x vue dword_1D97778 (2x Mat_ComposeTwoThenCopy8) + MulQ12_ToI32x3 puis soustraction composante (0x6A2FE6-FF6), remplit ctx scratch+0x30 (320x216, dword_1D98B3C->+34h, g_BattlePacketEnd, [a1+28h], [a1+7Ch]), rend la geometrie racine [a1+64h] + FK [a1+60h] via WalkStride30 + RenderGeometry (5 args cdecl, packets g_BattlePacketCursor), squelette secondaire [a1+78h] conditionnel avec scratch+50h=-1 (0x6A3072, pas une boucle : jz 0x6A306E sans back-edge) ; retour EAX = retour BattleScratch_Unwind propage (0x6A30B6)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A2F60\nTYPE ; proposition: MagFX_Model_RenderMeshChainFK
- Notes parent: checks 5.6 OK : add ecx,0FFFFFF44h = -0xBC (0x6A2F7D), g_BattlePacketCursor (0x6A2F95), movsx position (0x6A2FA5), soustractions (0x6A2FE6-FF6), dword_1D98B3C->scratch+34h (0x6A3005-0D), +44h packet (0x6A304A-B), jz sans back-edge (0x6A306E), +50h=-1 (0x6A3072), Unwind + retn (0x6A30AA-B6), 4 xrefs data sub_6A1660 (callers.txt) ; R verifie signature RenderGeometry 5 args par pushes @0x6A304A-55

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_6A2F60 (C réconcilié, pipeline triple 2+1 mag FX battle)
 * ----------------------------------------------------------------------------
 * PREAMBULE :
 *   Ground truth = live ASM (asm.asm, 117 instr @ 0x6A2F60..0x6A30B6) +
 *   ida_dump_bytes, NOT Hex-Rays (hexrays.c = vérificateur SEULEMENT).
 *   Taille : 343 octets (0x6A2F60..0x6A30B6). Type IDA :
 *   'char __cdecl(int, __int16 *, __int16 *)'.
 *   Sauvegardes de registres : push ebx, ebp, esi, edi (pas d'ebp frame ;
 *   base esp, args = [esp+14h+arg_0] etc.). eax, ecx, edx scratch.
 *   Convention : TOUTES les callees sont cdecl — aucun add esp individuel ;
 *   nettoyage batched : 0x6A2FEB add esp,40h (16 dwords = push 5Ch + 15 args :
 *   bs_modulo 1 + sub_5088A0 4 + sub_56CE30 2 + Mat_ComposeTwoThenCopy8 3+3 +
 *   Mat3S16_MulQ12_ToI32x3 3), 0x6A3069 add esp,20h (8 dwords : walk 2 +
 *   RenderGeometry 5 + FK 1), 0x6A30A5 add esp,20h (idem branche alt),
 *   0x6A30AF add esp,4 (Unwind 1). Args cdecl poussés droite -> gauche.
 *   Aucun library call : uniquement les callees de callees.txt.
 * ========================================================================== */

extern int           bs_modulo(int nbytes);                  /* 0x5082B0 : bump alloc dword_1D999C4 */
extern int           sub_5088A0(int a1, int ot_base, int shift4, unsigned int cursor);
extern void          sub_56CE30(short *a2, void *scratch);

/* E3a : call 0x56C090 + call 0x56C600(edi+0x14) + add [esi+14/18/1C] + rep movsd 8 dwords */
extern void          Mat_ComposeTwoThenCopy8(void *m1, void *m2, void *dst);
/* E3c : 3 x dot signe x 1/4096 -> 3 i32 (Q12 -> i32), 0 callee */
extern void          Mat3S16_MulQ12_ToI32x3(void *m, short *v3s16, int *out3);
/* E3a : n=[ebx] entrees stride 0x30 depuis ebx+0x20 ; Mat_ComposeTwoThenCopy8(arg1,e,e) in-place */
extern void          WalkStride30_MatComposeInPlace(void *list, void *scratch);
extern unsigned int  RenderGeometry(unsigned int geom, void *ctx, int ot_base,
                                    int ot_shift, unsigned int packet);
extern void          BattleSkeleton_BuildHierarchicalFK(void *skel);
extern int           BattleScratch_Unwind(int nbytes);       /* inverse de bs_modulo */

extern unsigned int  g_BattleOTBase;            /* utilise a -0xBC (0x6A2F7D) et +0x44 (0x6A304B) */
extern unsigned int  g_BattlePacketCursor;      /* dword curseur passe PAR VALEUR, pas un pointeur */
extern unsigned int  g_BattlePacketEnd;         /* 0x6A3036 */
extern unsigned int  dword_1D97778;             /* vue camera, base matrice 8 dwords */
extern unsigned int  dword_1D98B3C;             /* copiee telle quelle a scratch+0x34 */

char __cdecl sub_6A2F60(int a1, short *a2, short *a3)
{
    int scratch;  /* esi : bloc 0x5C octets = ctx (0x14..0x30) + render ctx (0x30..0x5C) */
    int list;     /* ebx : a1 + 0x60 (liste skeleton, n=[list], entrees stride 0x30 des list+0x20) */
    int ent;      /* edi : a1 puis [a1+0x78] (squelette secondaire) */
    int src;      /* ebp : a3 temporairement */
    int rctx;     /* ebp : scratch + 0x30 (bloc RenderGeometry) */

    /* 0x6A2F64 : push 5Ch ; call bs_modulo — scratch 92 octets */
    scratch = bs_modulo(0x5C);                                        /* 0x6A2F64-0x6A2F6B */

    ent = a1;                                                         /* 0x6A2F71 */
    list = a1 + 0x60;                                                 /* 0x6A2F87 lea ebx,[edi+60h] */

    /* 0x6A2F7C-0x6A2F8A : sub_5088A0(a1, g_BattleOTBase-0xBC, 4, g_BattlePacketCursor)
     * ANCRE : add ecx, 0FFFFFF44h => offset -0xBC (= -188), PAS -47 (Hex-Rays faux).
     * eax -> NOUVEAU g_BattlePacketCursor (store 0x6A2F95 apres le call). */
    g_BattlePacketCursor = (unsigned int)sub_5088A0(                  /* 0x6A2F8A */
        ent,
        (int)(g_BattleOTBase - 0xBC),
        4,
        g_BattlePacketCursor);

    sub_56CE30(a2, (void *)scratch);                                  /* 0x6A2F9A : (a2, scratch) */

    /* 0x6A2F9F : ebp = a3 */
    src = a3;

    /* 0x6A2FA5-0x6A2FBB : 3 x movsx word ptr -> i32 (SIGN-EXTEND s16 -> i32 OBLIGATOIRE)
     * ANCRE : movsx word [ebp+0] -> scratch+0x14 ; [ebp+2] -> +0x18 ; [ebp+4] -> +0x1C.
     * Hex-Rays ecrit des copies dword brutes : faux. */
    *(int *)(scratch + 0x14) = (int)(signed short)*(short *)(src + 0); /* 0x6A2FA5 */
    *(int *)(scratch + 0x18) = (int)(signed short)*(short *)(src + 2); /* 0x6A2FAF */
    *(int *)(scratch + 0x1C) = (int)(signed short)*(short *)(src + 4); /* 0x6A2FB7-0x6A2FBB */

    /* 0x6A2FBE : Mat_ComposeTwoThenCopy8(a1+0x40, scratch, scratch) — locale a1+0x40 */
    Mat_ComposeTwoThenCopy8((void *)(ent + 0x40), (void *)scratch, (void *)scratch);

    /* 0x6A2FCA : Mat_ComposeTwoThenCopy8(&dword_1D97778, scratch, scratch) — vue camera */
    Mat_ComposeTwoThenCopy8(&dword_1D97778, (void *)scratch, (void *)scratch);

    /* 0x6A2FD5 : Mat3S16_MulQ12_ToI32x3(scratch, a3, scratch+0x20) — 3 i32 en scratch+0x20..0x2B */
    Mat3S16_MulQ12_ToI32x3((void *)scratch, a3, (int *)(scratch + 0x20));

    /* 0x6A2FDA-0x6A2FFD : soustraction composante, ordre ASM exact :
     * ecx=[s+20] lu 1er, eax=[s+14] ; edx=[s+24], ebp=[s+18] ; ecx=[s+1C] ;
     * sub eax,ecx -> [s+14] ; sub ebp,edx -> [s+18] ; sub ecx,eax([s+28]) -> [s+1C]. */
    *(int *)(scratch + 0x14) -= *(int *)(scratch + 0x20);             /* 0x6A2FE6/0x6A2FEE */
    *(int *)(scratch + 0x18) -= *(int *)(scratch + 0x24);             /* 0x6A2FF4/0x6A2FF8 */
    *(int *)(scratch + 0x1C) -= *(int *)(scratch + 0x28);             /* 0x6A2FF6/0x6A2FFD */

    /* 0x6A3000 : compose in-place n=[list] matrices, stride 0x30, depuis list+0x20 */
    WalkStride30_MatComposeInPlace((void *)list, (void *)scratch);    /* 0x6A3000 */

    /* ---- 0x6A3005-0x6A303C : init du render ctx (scratch+0x30..0x5C) ----
     * ANCRE ordre exact : eax=0 (xor) a 0x6A300B AVANT les stores 0x44/0x46/0x58 ;
     * eax RECHARGE depuis [edi+7Ch] a 0x6A302D APRES le store scratch+0x58. */
    *(unsigned int *)(scratch + 0x34) = dword_1D98B3C;                /* 0x6A300D */
    *(unsigned short *)(scratch + 0x44) = 0;                          /* 0x6A3010 (ax) */
    *(unsigned short *)(scratch + 0x46) = 0;                          /* 0x6A3014 (ax) */
    *(unsigned short *)(scratch + 0x48) = 0x140;                      /* 320 — 0x6A3018 */
    *(unsigned short *)(scratch + 0x4A) = 0x00D8;                     /* 216 — 0x6A301E */
    *(unsigned int *)(scratch + 0x4C) = *(unsigned int *)(ent + 0x28);/* [edi+28h] 0x6A3024 */
    *(unsigned int *)(scratch + 0x58) = 0;                            /* 0x6A302A (eax=0) */
    *(unsigned int *)(scratch + 0x50) = *(unsigned int *)(ent + 0x7C);/* [edi+7Ch] 0x6A3033 */
    rctx = scratch + 0x30;                                            /* 0x6A3030 lea ebp,[esi+30h] */
    *(unsigned int *)(scratch + 0x40) = g_BattlePacketEnd;            /* 0x6A303C */

    /* ---- 0x6A304A-0x6A3056 : rendu racine ----
     * RenderGeometry([a1+0x64] = [list+4], rctx, g_BattleOTBase+0x44, 4, cursor)
     * ANCRE : add eax, 44h => +0x44 (= 68), PAS +17 (Hex-Rays faux). */
    g_BattlePacketCursor = RenderGeometry(                            /* 0x6A3056 */
        *(unsigned int *)(list + 4),
        (void *)rctx,
        (int)(g_BattleOTBase + 0x44),
        4,
        g_BattlePacketCursor);

    /* 0x6A305B-0x6A3061 : FK sur la liste a1+0x60 */
    BattleSkeleton_BuildHierarchicalFK((void *)list);                 /* 0x6A3061 */

    /* 0x6A3066-0x6A306E : squelette secondaire [edi+78h] = [a1+0x78], test/jz */
    ent = *(int *)(ent + 0x78);
    if (ent != 0)
    {
        /* ANCRE : ECRASE la valeur [a1+0x7C] posee a scratch+0x50 par -1 (0xFFFFFFFF).
         * Note ordre : le store -1 a 0x6A3072 est AVANT le WalkStride (0x6A3079). */
        *(unsigned int *)(scratch + 0x50) = 0xFFFFFFFF;               /* 0x6A3072 */
        WalkStride30_MatComposeInPlace((void *)ent, (void *)scratch); /* 0x6A3079 */
        g_BattlePacketCursor = RenderGeometry(                        /* 0x6A3095 */
            *(unsigned int *)(ent + 4),
            (void *)rctx,
            (int)(g_BattleOTBase + 0x44),
            4,
            g_BattlePacketCursor);
        BattleSkeleton_BuildHierarchicalFK((void *)ent);              /* 0x6A30A0 */
        /* 0x6A30A5 : add esp,20h (8 dwords cdecl) */
    }

    /* ---- 0x6A30A8-0x6A30B6 : unwind du scratch + retour ----
     * eax = retour de BattleScratch_Unwind PROPAGE au retn tel quel. */
    return BattleScratch_Unwind(0x5C);                                /* 0x6A30AA */
}

/* ============================================================================
 * UNCERTAIN restants :
 * UNCERTAIN 0x6A30B6 largeur du retour : prototype IDA 'char' (AL only ?) vs
 *   Hex-Rays 'int'. L'ASM montre retn avec eax = retour Unwind non tronque dans
 *   ce corps ; la consommation par les callers (sub_6A1660 x2, sub_6A30C0,
 *   sub_6F5000 — voir callers.txt) n'est pas prouvable depuis ce corps seul.
 * UNCERTAIN 0x6A2F8A types de sub_5088A0 : arg2 passe comme g_BattleOTBase-0xBC
 *   (offset negatif -0xBC prouve) ; lecture interne (pointeur octet vs index
 *   dword) non prouvable ici. arg4 (cursor) passe par valeur (dword).
 * UNCERTAIN 0x6A3005 role de dword_1D98B3C (type IDA None) : copie dword brute
 *   en scratch+0x34, sens non prouvable.
 * UNCERTAIN 0x6A3072 polarite du -1 en scratch+0x50 : ecrase [a1+0x7C] si
 *   [a1+0x78]!=0 ; ressemble a un flag OT "priorite/desactive" — non prouve.
 * ========================================================================== */
```

## Analyse semantique

# Sémantique sub_6A2F60 @ 0x6A2F60 (réconciliation R)

- Rôle (1 phrase) : soumission de rendu d'un nœud de modèle d'effet magique — alloue un scratch battle de 0x5C octets, compose view caméra (dword_1D97778) × matrice modèle [a1+0x40] avec translation 3×s16 de a3, rend la géométrie racine puis (conditionnellement) celle du nœud secondaire [a1+0x78] via RenderGeometry dans l'OT (g_BattleOTBase+0x44, shift 4) en réécrivant g_BattlePacketCursor, et libère le scratch par BattleScratch_Unwind.
- Verdict : LIKELY consolidé (rôle render-submit solide, ancré ; nom non attesté wiki).
- Confiance : LIKELY
- Nom catalogue : IDA `sub_6A2F60` non informatif. Proposition (markdown seul) : **`MagFX_Model_RenderMeshChainFK`** — synthèse : préfixe `MagFX` justifié par le contexte caller (xrefs 0x6A1E41/0x6A1F89 depuis sub_6A1660, ticker MAG_212, ancre fermée CERTAIN) ; `RenderMesh` par les 2 appels RenderGeometry ; `ChainFK` par la chaîne `[edi+78h]` + BattleSkeleton_BuildHierarchicalFK. Le nom A (« SubmitGeometryFK ») est acceptable mais « Submit » masque le rendu OT direct ; le nom B (« BattleModelNode_RenderMesh_ChainFK ») est structurellement juste mais omet l'ancrage mag FX du caller.

## In / Out / Effets

- In (`char __cdecl(int a1, __int16 *a2, __int16 *a3)` cdecl, 3 args) :
  - `a1` (edi) : instance/nœud de modèle. Champs lus : `+0x28` → ctx+0x4C ; `+0x40` matrice modèle (composée @0x6A2FBE) ; `+0x60` = tête de liste squelette (ebx ; n=[ebx], entrées stride 0x30 depuis ebx+0x20) ; `+0x64` = [ebx+4] id géométrie racine (arg1 RenderGeometry) ; `+0x78` = nœud secondaire (passe conditionnelle unique) ; `+0x7C` → ctx+0x50 (écrasé à -1 si nœud secondaire).
  - `a2` (edx) : passé tel quel à `sub_56CE30(a2, scratch)` @0x6A2F9A (paramètre d'anim/état, proto inconnu).
  - `a3` (ebp) : pointeur 3×s16, lus par `movsx` sign-extend @0x6A2FA5/0x6A2FAF/0x6A2FB7 → scratch+0x14/0x18/0x1C ; ajoutés par Mat_ComposeTwoThenCopy8 puis **soustraits** de rot·a3 (Q12) @0x6A2FE6/0x6A2FF4/0x6A2FF6 — translation relative du pivot.
- Out : retour EAX = valeur de `BattleScratch_Unwind(0x5C)` propagée au `retn` @0x6A30B6 (type IDA `char` = AL au plus ; consommation par callers non prouvable depuis ce corps). Effets globaux : `g_BattlePacketCursor` réécrit 3× (0x6A2F95 retour sub_5088A0, 0x6A305C et 0x6A309B retours RenderGeometry) ; 92 octets de scratch alloués (bs_modulo @0x6A2F66) puis relâchés (Unwind @0x6A30AA).
- Effets : ctx scratch rempli : +0x14/18/1C translation relative ; +0x34 = dword_1D98B3C ; +0x40 = g_BattlePacketEnd ; +0x44/0x46 = 0 (u16) ; +0x48 = 0x140 (320) ; +0x4A = 0xD8 (216) ; +0x4C = [a1+0x28] ; +0x50 = [a1+0x7C] puis -1 ; +0x58 = 0 ; bloc rendu = scratch+0x30 (ebp @0x6A3030). Squelette : WalkStride30_MatComposeInPlace sur [a1+0x60] @0x6A3000 puis FK @0x6A3061 ; **passe unique** conditionnelle sur [a1+0x78] : -1 @0x6A3072, Walk @0x6A3079, RenderGeometry @0x6A3095, FK @0x6A30A0.

## Divergences A/B (tranchées une par une)

1. **Traversal « FIFO des nœuds » (A) vs itération de chaîne (B)** — **tranché : passe unique conditionnelle, PAS une boucle.** ASM : `0x6A3066 mov edi,[edi+78h]`, `0x6A306E jz short loc_6A30A8`, corps 0x6A3070–0x6A30A5 **tombe dans 0x6A30A8 (push 5Ch / unwind)** — aucun jmp arrière vers 0x6A3066. La fonction traite racine + au plus UN nœud secondaire. A affirmait « liste chaînée … chacun passe par » (faux) ; B disait « second passage » (juste) mais son résumé « itère sur la chaîne » était ambigu.
2. **Ordre des args RenderGeometry (wiki 4-arg cité par A et B)** — **tranché : 5 args cdecl, ordre (geom, ctx, ot_base, shift, packet).** Pushes 0x6A304A–0x6A3055 : packet (edx) → 4 → ot_base (eax, `add eax,44h` @0x6A304B) → ctx (ebp=esi+0x30) → [ebx+4] en dernier = arg1. La signature wiki « int __cdecl(ctx, ot_base, ot_shift, packet) » citée par A et B ne correspond pas : 5 args, arg1 = id géométrie [a1+0x64] / [nœud+4], packet en dernier.
3. **Emplacement dword_1D98B3C (A : « +0x4C-adjacent », vague) vs B (+0x34)** — **tranché : scratch+0x34.** ASM : `0x6A3005 mov ecx, dword_1D98B3C` ; `0x6A300D mov [esi+34h], ecx`. Le +0x4C reçoit [edi+28h] @0x6A3024.
4. **Retour (A : « void de fait » vs B : « char non significatif »)** — **tranché : EAX = retour BattleScratch_Unwind propagé au retn** @0x6A30AA→0x6A30B6 ; type IDA `char` (AL). Consommation par les callers non prouvable ici → ni « void » ni « non significatif » affirmés : propagé, signification UNCERTAIN.
5. **Offset OT de sub_5088A0 (A : non mentionné ; B : g_BattleOTBase-0xBC)** — **tranché : -0xBC.** ASM : `0x6A2F7D add ecx, 0FFFFFF44h` (= -0xBC) avant `0x6A2F8A call sub_5088A0`. A avait omis ce fait d'ancrage ; retenu.
6. **Polarité de a3 (A : « ajoutés à la matrice » ; B : « translation injectée puis soustraite »)** — **tranché : les deux, séquentiellement.** Les 3×s16 sont ajoutés par Mat_ComposeTwoThenCopy8 (note E3a : add [esi+14/18/1C]) PUIS soustraits sous forme rot·a3 : `0x6A2FE6 sub eax,ecx` ([s+14]-=[s+20]), `0x6A2FF4 sub ebp,edx` ([s+18]-=[s+24]), `0x6A2FF6 sub ecx,eax` ([s+1C]-=[s+28]). La formulation B est la complète ; A n'avait que la moitié.
7. **Nom (A : MagFX_Model_SubmitGeometryFK vs B : BattleModelNode_RenderMesh_ChainFK)** — **tranché : synthèse `MagFX_Model_RenderMeshChainFK`** (voir Nom catalogue ; 3 preuves ASM adresées ci-dessous).

## Preuves (ASM cité)

1. `0x6A2F64 push 5Ch` → `0x6A2F66 call bs_modulo` ; `0x6A30A8 push 5Ch` → `0x6A30AA call BattleScratch_Unwind` — paire alloc/unwind symétrique d'un scratch 0x5C frame-local (note callees.txt : Unwind = inverse de bs_modulo 0x5082B0 sur dword_1D999C4).
2. `0x6A2F7D add ecx, 0FFFFFF44h` (= g_BattleOTBase-0xBC) puis `0x6A2F8A call sub_5088A0(a1, ot, 4, cursor)` ; retour stocké `0x6A2F95 mov g_BattlePacketCursor, eax` — réservation packet sur sous-liste OT négative.
3. `0x6A2FC5 push offset dword_1D97778` → `0x6A2FCA call Mat_ComposeTwoThenCopy8` (après `0x6A2FBE` avec [edi+40h]) — composition view caméra × matrice modèle dans le scratch.
4. `0x6A304A–0x6A3056` : pushes (packet, 4, g_BattleOTBase+0x44, ebp=esi+0x30, [ebx+4]) → `call RenderGeometry` ; retour → `0x6A305C mov g_BattlePacketCursor, eax`. Identique @0x6A3089–0x6A309B avec [edi+4] du nœud secondaire — sortie = curseur packets.
5. `0x6A3066 mov edi,[edi+78h]` ; `0x6A306E jz short loc_6A30A8` ; corps 0x6A3070–0x6A30A5 sans back-edge, tombe dans l'unwind — passe unique sur un nœud secondaire, pas une boucle.
6. `0x6A3072 mov dword ptr [esi+50h], 0FFFFFFFFh` — écrase ctx+0x50 ([a1+0x7C] posé @0x6A3033) uniquement si nœud secondaire présent.
7. Callers `0x6a1e41`/`0x6a1f89` (sub_6A1660, ticker MAG_212) + `0x6a30d0` (sub_6A30C0, wrapper 0x21 octets) + `0x6f57e0` (sub_6F5000) — usage mag FX battle confirmé côté callers.txt.

## Checks §5.6

- Callees cités tous présents dans callees.txt : bs_modulo, sub_5088A0, sub_56CE30, Mat_ComposeTwoThenCopy8 ×2, Mat3S16_MulQ12_ToI32x3, WalkStride30_MatComposeInPlace ×2, RenderGeometry ×2, BattleSkeleton_BuildHierarchicalFK ×2, BattleScratch_Unwind — 12/12. ✓
- Callers cités présents dans callers.txt : 0x6a1e41, 0x6a1f89, 0x6a30d0, 0x6f57e0. ✓
- Strides en nombres : scratch 0x5C ; walk entrées stride 0x30 depuis list+0x20 ; OT +0x44 ; shift 4 ; offset sub_5088A0 = -0xBC. ✓
- Polarités : movsx s16→i32 sign-extend (0x6A2FA5/0x6A2FAF/0x6A2FB7) ; sub pos − rot·off (0x6A2FE6/0x6A2FF4/0x6A2FF6) ; jz = terminaison chaîne (0x6A306E) ; -1 = override conditionnel (0x6A3072). ✓
- Largeur retour : EAX = retour BattleScratch_Unwind au retn (0x6A30AA→0x6A30B6), type IDA `char` (AL au plus). ✓
- Nom ≥2 preuves ASM indépendantes adresées : RenderGeometry ×2 avec packet cursor (0x6A3056/0x6A3095) ; chaîne +0x78 + FK ×2 (0x6A3066, 0x6A3061/0x6A30A0) ; contexte caller MAG_212 (0x6a1e41). ✓
- Cohérence avec c_reconciled.c : ordre stores ctx (xor eax @0x6A300B avant stores 0x44/0x46/0x58, rechargement eax=[edi+7Ch] @0x6A302D), override -1 avant Walk @0x6A3072<0x6A3079, add esp batched 0x40/0x20/0x20/0x4 — tout conforme. ✓

## Questions ouvertes (non bloquantes)

- Rôle de `sub_56CE30(a2, scratch)` @0x6A2F9A (anim state, palette, params mesh ?) — proto inconnu, non documenté wiki.
- Sémantique de dword_1D98B3C (type IDA None) copiée en ctx+0x34.
- Lecture interne de sub_5088A0 : la sous-liste g_BattleOTBase-0xBC est-elle une réservation header opposée au dessin +0x44 ?
- Signification de ctx+0x50 = -1 (priorité OT, flag, ou id « none ») et de [a1+0x28] → ctx+0x4C.
- Consommation du retour EAX par les 4 callers (sub_6A1660 ×2, sub_6A30C0, sub_6F5000) — hors pack.

## IDBCOMMENT

Rendu d'un noeud de modele d'effet magique : alloue 92 octets de scratch battle (bs_modulo), reserve un packet via sub_5088A0 sur g_BattleOTBase-0xBC, puis compose la view camera dword_1D97778 avec la matrice modele [a1+0x40] et la translation 3xs16 de a3 (soustraite apres rotation Q12). Rend la geometrie racine [a1+0x64] et, en une passe unique conditionnelle, celle du noeud secondaire [a1+0x78] (ctx+0x50 force a -1) via RenderGeometry dans l'OT g_BattleOTBase+0x44 shift 4, en reecrivant g_BattlePacketCursor a chaque retour, avec FK hierarchique sur les listes stride 0x30. Scratch libere par BattleScratch_Unwind(0x5C), eax propage au retn. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_6A2F60 (triple 2+1, mag FX battle)

Ground truth = live ASM (asm.asm, 117 instr, 0x6A2F60..0x6A30B6, 343 octets).
Type IDA : `char __cdecl(int, __int16 *, __int16 *)`.
Voices : A = c_a.c, B = c_b.c. Hex-Rays = vérificateur seulement.

## État général

A et B sont convergents sur ~95 % du corps (mêmes offsets, mêmes ancrées,
même audit stack `add esp`). Aucun désaccord structurel A/B détecté. Le C
réconcilié reprend la structure B (préambule + externes typés) avec les
commentaires d'ancre d'A. Points tranchés contre Hex-Rays ci-dessous.

## Divergences Hex-Rays vs ASM (toutes tranchées : ASM gagne)

1. **Offset node OT sub_5088A0** — Hex-Rays : `g_BattleOTBase - 47`.
   ASM 0x6A2F7D : `add ecx, 0FFFFFF44h` => **-0xBC (= -188)**. Tranché : -0xBC.
2. **OT base RenderGeometry (x2)** — Hex-Rays : `g_BattleOTBase + 17`.
   ASM 0x6A304B / 0x6A308D : `add eax, 44h` => **+0x44 (= 68)**. Tranché : +0x44.
3. **Position a3 (3 loads)** — Hex-Rays : copies dword brutes (`*(_DWORD*)(v3+20)=*a3`). ASM 0x6A2FA5/0x6A2FAF/0x6A2FB7 : `movsx word ptr` => **sign-extend s16 → i32 obligatoire**, vers scratch+0x14/0x18/0x1C. Tranché : movsx.
4. **g_BattlePacketCursor** — Hex-Rays le type `_DWORD*` (pointeur). ASM : dword curseur passé **par valeur** à sub_5088A0/RenderGeometry, réassigné depuis eax (0x6A2F95, 0x6A305C, 0x6A309B). Pas de déréférencement. Tranché : dword par valeur.
5. **Ordre des soustractions** — Hex-Rays utilise des temporaires croisés
   (`v4=[s+36]`→`[s+24]=v5-v4`, etc.) cohérents avec le réordonnage registre
   ASM ; le réconcilié garde la lecture canonique composante/composante
   `[s+14]-=[s+20] ; [s+18]-=[s+24] ; [s+1C]-=[s+28]` (ASM 0x6A2FE6-0x6A2FFD).
6. **Retour** — Hex-Rays type la fonction `int`, prototype IDA `char`.
   ASM 0x6A30AA-0x6A30B6 : `call BattleScratch_Unwind` puis `retn` direct avec
   eax propagé tel quel ; aucune troncature dans ce corps.
   => **Retour = eax de BattleScratch_Unwind propagé, confirmé** ; largeur
   effective (AL vs EAX) non prouvable depuis ce corps → UNCERTAIN conservé.

## Points du cahier des charges — tranchés avec adresses

1. **Scratch 0x5C bs_modulo/Unwind** — alloc 0x6A2F64 (`push 5Ch ; call bs_modulo`), release 0x6A30AA (`push 5Ch ; call BattleScratch_Unwind`), inverse du bump dword_1D999C4. Nettoyages cdecl batched : `add esp,40h` @0x6A2FEB, `add esp,20h` @0x6A3069 et @0x6A30A5, `add esp,4` @0x6A30AF.
2. **Node OT sub_5088A0** — args exacts (poussés droite→gauche, 0x6A2F7C-0x6A2F86) : `(a1, g_BattleOTBase-0xBC, 4, g_BattlePacketCursor)` ; retour eax → g_BattlePacketCursor @0x6A2F95. Shift = 4.
3. **Position a3** — ordre exact : 3× movsx s16→i32 → scratch+0x14/18/1C (0x6A2FA5-0x6A2FBB) ; Mat_ComposeTwoThenCopy8(a1+0x40,…) @0x6A2FBE puis Mat_ComposeTwoThenCopy8(&dword_1D97778,…) @0x6A2FCA ; Mat3S16_MulQ12_ToI32x3(scratch, a3, scratch+0x20) @0x6A2FD5 ; soustractions composantes 0x6A2FE6-0x6A2FFD.
4. **Ctx scratch+0x30** — ordre exact des stores 0x6A3005-0x6A303C : +0x34=dword_1D98B3C, +0x44/+0x46=0 (xor eax,eax @0x6A300B AVANT), +0x48=0x140 (320), +0x4A=0xD8 (216), +0x4C=[edi+28h], +0x58=0 (eax=0), puis eax recharge de [edi+7Ch] @0x6A302D → +0x50, +0x40=g_BattlePacketEnd. Override : scratch+0x50=-1 @0x6A3072 uniquement si [a1+0x78]!=0, écrit AVANT le WalkStride de la branche alt.
5. **Rendu** — racine [a1+0x64] (= [ebx+4]) + FK (a1+0x60) via WalkStride30 @0x6A3000 + RenderGeometry @0x6A3056 + FK @0x6A3061 ; squelette secondaire [a1+0x78] conditionnel (test/jz @0x6A306C) avec même trio walk/render/FK + scratch+0x50=-1.
6. **Retour** — eax = BattleScratch_Unwind propagé au retn : confirmé (voir divergence 5).

## UNCERTAIN restants

- **0x6A30B6** largeur du retour : `char` (IDA) vs `int` (Hex-Rays) ; consommation réelle par les callers (sub_6A1660 ×2 @0x6A1E41/0x6A1F89, sub_6A30C0 @0x6A30D0, sub_6F5000 @0x6F57E0) non inspectée dans ce pack.
- **0x6A2F8A** types internes de sub_5088A0 (arg2 : pointeur octet vs index dword ; arg4 curseur passé par valeur prouvé).
- **0x6A300D** rôle de dword_1D98B3C (type IDA None) copié tel quel en scratch+0x34.
- **0x6A3072** polarité/priorité du -1 en scratch+0x50 (flag OT « désactivé » ? interprétation non prouvable).

## Déroulé concluant

Pack complet et non-stub ; A et B déjà alignés, réconciliation = sélection
B (squelette) + ancrées A + anchors d'adresses partout. Aucun chunk >600 instr
(117 instr). Callgraph : 4 xrefs code, `more:false` — pas de TRUNCATED.
