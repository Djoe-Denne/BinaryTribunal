# Ot_EmitQuad_GTE_FromStream @ 0x69E700

- Instr (live): 119 (342 octets, .text)
- Palier: 2+1 (deux voix A/B + réconciliateur C-R)
- Mode: 2+1
- Verdict: CERTAIN
- Confiance: CERTAIN
- Notes parent: checks 5.6 OK : dec eax/jz retour -1/0 (0x69E711/0x69E71D), fetch idx u16 lea *4 (0x69E733), tag 8000000h+3Ah (0x69E80F/0x69E815), strides 24h/18h (0x69E82A/0x69E82D), add esp,28h (0x69E827), caller sub_69E020 @0x69E23B
- Push IDB: OK append-only + save_database 2026-09-20
- Date: 2026-09-20

## Résumé ASM

Décode un flux de records de 0x18 octets pointé par `ctx->0x10` (dword count à `*cursor`, curseur avancé de +4 dès l'entrée, puis de N*0x18 en sortie). Chaque record : 4 indices u16 (rec+0x04/06/08/0x0A) qui indexent une table de dwords à `ctx->0x04` (`base + idx*4`), chaque triplet de 3 dwords copié en scratch ctx+0x18/0x24/0x30/0x3C. La dword[1] de chaque triplet est pré-écrite dans le nœud OT courant (dword_2510114) à +0x08/+0x10/+0x18/+0x20, puis 4 passes GTE (StorePtr_1CA8A28 → sub_45F270 → GetToPtr_1CA8A68) écrivent vers node+0x04/+0x0C/+0x14/+0x1C. Le nœud reçoit un tag 0x08000000 + octet 0x3A à +7, est lié à l'OT `ctx->0x14` via OtNode24_PoolAllocLink_Code1, puis node += 0x24, rec += 0x18. Retour EAX : 0 si count>0, 0xFFFFFFFF si count==0.

## C réconcilié

```c
struct sub_69E700_ctx {                       /* ebp = arg0                     */
    /* +0x00 */ unsigned int f00;            /* non lu                         */
    /* +0x04 */ unsigned char *base;         /* table sommets : triplet @ base + u16*4 */
    /* +0x08 */ unsigned int f08;            /* non lu                         */
    /* +0x0C */ unsigned int f0C;            /* non lu                         */
    /* +0x10 */ unsigned int *cursor;        /* in/out : count à *cursor, avancé +4 + N*0x18 */
    /* +0x14 */ void *ot;                    /* arg1 OtNode24_PoolAllocLink_Code1 */
    /* +0x18 */ unsigned int t0[3];          /* scratch triplet 1              */
    /* +0x24 */ unsigned int t1[3];          /* scratch triplet 2              */
    /* +0x30 */ unsigned int t2[3];          /* scratch triplet 3              */
    /* +0x3C */ unsigned int t3[3];          /* scratch triplet 4              */
};

extern void GteState_StorePtr_1CA8A28(void *src);   /* dword_1CA8A28 = arg  */
extern void GteState_GetToPtr_1CA8A68(void *dst);   /* *arg = dword_1CA8A68 */
extern void sub_45F270(void);
extern void OtNode24_PoolAllocLink_Code1(void *ot, void *node);
extern unsigned int *dword_2510114;         /* curseur pool noeuds OT, stride 0x24 */

int __cdecl sub_69E700(unsigned char *ctx)
{
    unsigned int *cursor;
    unsigned int   count;
    unsigned char *rec;
    unsigned int  *node;
    unsigned char *base;
    unsigned int   idx;
    unsigned int  *src;
    int            counter;                 /* recyclage du slot arg_0 pile */

    cursor = *(unsigned int **)(ctx + 0x10);           /* 0x69E707 */
    count  = *cursor;                                  /* 0x69E70A */
    rec    = (unsigned char *)(cursor + 1);            /* 0x69E70C lea [ecx+4] */
    *(unsigned int **)(ctx + 0x10) = (unsigned int *)rec; /* 0x69E712 (avant le test) */
    node   = dword_2510114;                            /* 0x69E715 */
    if (count == 0u)                                   /* 0x69E71B jz 0x69E849 */
        goto early_exit;

    counter = (int)count;                              /* dec 0x69E711 + inc 0x69E723 */
    do {
        base = *(unsigned char **)(ctx + 0x04);        /* 0x69E729 */

        idx = (unsigned int)*(unsigned short *)(rec + 0x04); /* 0x69E72E */
        src = (unsigned int *)(base + idx * 4);              /* 0x69E733 lea [eax+edx*4] */
        *(unsigned int *)(ctx + 0x18) = src[0];
        *(unsigned int *)(ctx + 0x1C) = src[1];
        *(unsigned int *)(ctx + 0x20) = src[2];

        idx = (unsigned int)*(unsigned short *)(rec + 0x06); /* 0x69E74D */
        src = (unsigned int *)(base + idx * 4);
        *(unsigned int *)(ctx + 0x24) = src[0];
        *(unsigned int *)(ctx + 0x28) = src[1];
        *(unsigned int *)(ctx + 0x2C) = src[2];

        idx = (unsigned int)*(unsigned short *)(rec + 0x08); /* 0x69E769 */
        src = (unsigned int *)(base + idx * 4);
        *(unsigned int *)(ctx + 0x30) = src[0];
        *(unsigned int *)(ctx + 0x34) = src[1];
        *(unsigned int *)(ctx + 0x38) = src[2];

        idx = (unsigned int)*(unsigned short *)(rec + 0x0A); /* 0x69E785 */
        src = (unsigned int *)(base + idx * 4);
        *(unsigned int *)(ctx + 0x3C) = src[0];
        *(unsigned int *)(ctx + 0x40) = src[1];
        *(unsigned int *)(ctx + 0x44) = src[2];

        /* dword[1] de chaque triplet -> noeud OT, AVANT les appels GTE */
        node[2] = *(unsigned int *)(ctx + 0x1C);       /* 0x69E79F/0x69E7A2 */ // UNCERTAIN 0x69E7A2
        node[4] = *(unsigned int *)(ctx + 0x28);       /* 0x69E7A5/0x69E7A8 */
        node[6] = *(unsigned int *)(ctx + 0x34);       /* 0x69E7AB/0x69E7AE */
        node[8] = *(unsigned int *)(ctx + 0x40);       /* 0x69E7B1/0x69E7B4 */

        GteState_StorePtr_1CA8A28(rec);                /* 0x69E7B7, src = edi */
        sub_45F270();                                  /* 0x69E7BC */
        GteState_GetToPtr_1CA8A68(node + 1);           /* 0x69E7C5, dst = esi+0x04 */

        GteState_StorePtr_1CA8A28(rec + 0x0C);         /* 0x69E7CE */
        sub_45F270();                                  /* 0x69E7D3 */
        GteState_GetToPtr_1CA8A68(node + 3);           /* dst = esi+0x0C */

        GteState_StorePtr_1CA8A28(rec + 0x10);         /* 0x69E7E5 */
        sub_45F270();                                  /* 0x69E7EA */
        GteState_GetToPtr_1CA8A68(node + 5);           /* dst = esi+0x14 */

        GteState_StorePtr_1CA8A28(rec + 0x14);         /* 0x69E7FC */
        sub_45F270();                                  /* 0x69E801 */
        GteState_GetToPtr_1CA8A68(node + 7);           /* dst = esi+0x1C */

        node[0] = 0x08000000;                          /* 0x69E80F */
        ((unsigned char *)node)[7] = 0x3A;             /* 0x69E815 */
        OtNode24_PoolAllocLink_Code1(*(void **)(ctx + 0x14), node); /* 0x69E81E */

        node   += 9;                    /* 0x69E82A add esi,0x24 */
        rec    += 0x18;                 /* 0x69E82D add edi,0x18 */
        counter--;                      /* 0x69E830 dec (slot arg_0, reload 0x69E823) */
    } while (counter != 0);             /* 0x69E831 jnz 0x69E729 */

    *(unsigned int **)(ctx + 0x10) = (unsigned int *)rec;  /* 0x69E83B */
    dword_2510114 = node;                                  /* 0x69E83E */
    return 0;                                              /* retn 0x69E848, eax=0 */

early_exit:
    *(unsigned int **)(ctx + 0x10) = (unsigned int *)rec;  /* 0x69E849 */
    dword_2510114 = node;                                  /* 0x69E84C */
    return (int)(count - 1u);                              /* eax = 0xFFFFFFFF */
}
```

Convention pile : cdecl ; `add esp,0x28` @ 0x69E827 cumule les 10 args poussés par itération (8 GteState + 2 OtNode24). Le compteur de boucle vit dans le slot arg_0 de la pile (l'argument d'entrée est écrasé @ 0x69E725, rechargé @ 0x69E823) — variable locale en C, sémantique identique.

## Preuves

1. 0x69E70C/0x69E712 : `lea edi,[ecx+4]` puis store immédiat dans `[ebp+10h]` AVANT le test count — le curseur est avancé de +4 même si count==0.
2. 0x69E733/0x69E751/0x69E76D/0x69E789 : `lea edx,[eax+edx*4]` avec edx = u16 zero-étendu (xor/mov dx|cx) — stride fetch = idx*4, indices unsigned.
3. 0x69E79F-0x69E7B4 : les 4 pré-écritures node+0x08/+0x10/+0x18/+0x20 précèdent le premier `call GteState_StorePtr_1CA8A28` @ 0x69E7B7 (ordre ASM strict).
4. 0x69E80F/0x69E815 : tag nœud `dword 0x08000000` + octet 0x3A à +7, avant OtNode24_PoolAllocLink_Code1 @ 0x69E81E.
5. 0x69E82A/0x69E82D : strides de sortie — nœud OT 0x24, record 0x18.
6. 0x69E827 : `add esp,0x28` = cleanup des 10 args cdecl de l'itération ; ebx est poussé @ 0x69E724 seulement sur le chemin boucle (jz @ 0x69E71D le précède), cohérent avec les pops 0x69E852-55.
7. Retour EAX : `dec` @ 0x69E711 compensé par `inc` @ 0x69E723 ; dernier `dec` @ 0x69E830 jamais rechargé avant `retn` @ 0x69E848 → 0 si count>0 ; branche 0x69E849 → 0xFFFFFFFF si count==0.

## Divergences Hex-Rays / voix

- Hex-Rays (`result = --v12` après boucle, `result = v4 - 1` sinon) est cohérent avec l'ASM sur le retour ; la voix A (« retour = count-1 dans tous les cas ») est FAUSSE — tranché par 0x69E830/0x69E848 (voir reconcile_notes.md).
- Aucune divergence Hex-Rays sur les strides (*4, +0x18, +9 dwords) ni sur l'ordre pré-écritures/GTE.
- Restent non tranchés par l'ASM : rôle sémantique de la dword[1] copiée dans le nœud (// UNCERTAIN 0x69E7A2) et l'effet exact de GteState_GetToPtr_1CA8A68 sur les 12 octets cibles (chevauchement possible avec les pré-écritures).
