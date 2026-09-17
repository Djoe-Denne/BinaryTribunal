# Gpu_DrawOTag @ 0x45D080

- Instr (live): 169
- Mode: 1+V (A=semantic-analyste glm-5.3-flash, V=semantic-reviewer glm-5.3-flash, P=parent §5.6 sur ASM live)
- Verdict: CERTAIN — A CERTAIN, V CORRIGE (2 corrections substantielles intégrées), A==V sur nom/rôle/contrat, pas d'escalade
- Push IDB: append-only `[semantic-triple 2026-09-17]` + save_database
- Notes parent §5.6: callees confirmés live (sub_45D050, World_loadTextureVRAM_updateAnim, sub_460C20, Gpu_DrawOTagWithDispatchTable, sub_460CE0 + dispatch indirect g_SoftwarePrimDispatch/g_TexturePageDirtyDispatch) ; caller unique Gpu_DrawOTagCurrent @0x45d615 (code) ; division signée par 0x18 via magic 0x2AAAAAAB/sar 2 (jamais *24) ; cap 0x4000 nœuds jge signé ; bornes pool jb/jnb unsigned ; terminateur 0xFFFFFF (jz) aux deux sites ; code primitive = u8 [packet+7] (45d118 mov dl,[esi+7]) PAS le tag — tag>>24 = compte de mots (dword_1CA89B0, jle/jg signés) ; stride g_PrimitiveWordStride[code] dwords (défaut 1), avance lea esi,[esi+eax*4] ; retour EAX 32 bits = 0 si abandon externe (45d259 jz→45d2fc), sinon ancien dword_1CA89A4 (45d2d1) ; reset final g_OtNodePoolCursor=g_OtNodePool + compteurs 1CA89A4/1CA8850/1CA89B4/1CA89AC=0. Miroir 0x45C870 vérifié croisé par parent (ce lot, commit 0ecfdcb): insertion (node[0x16]=old>>24 ; pkt[0]=tag^((tag^old)&0xFFFFFF)) ↔ reconstruction ((node[0x16]<<24)|(L&0xFFFFFF)).

## Corrections V intégrées (vs A)

1. **E1**: l'index des dispatch tables est le CODE DE PRIMITIVE u8 à `[packet+7]` (MSB du mot GP0), pas le tag. Le tag (L>>24) est le COMPTE DE MOTS (dword_1CA89B0).
2. **E2**: sous-boucle interne 45d111–45d224 omise par A — le packet est parcouru MOT PAR MOT: stride = g_PrimitiveWordStride[code] (défaut 1 si 0), count -= stride (45d217 sub ecx,eax), packet += stride*4 (45d219 lea esi,[esi+eax*4]), re-dispatch tant que count > 0 (45d224 jg, signé).
3. **E4**: retour EAX = 0 sur chemin d'abandon (sub_45D050 → NULL → 45d2fc), pas seulement l'ancienne valeur.

## C réconcilié (squelette fidèle)

```c
/* Gpu_DrawOTag @ 0x45D080 — 169 instr, cdecl 1 arg, retn C3.
 * Retour EAX 32 bits: 0 si échec alloc nœud externe, sinon ancien dword_1CA89A4.
 */
typedef void (__cdecl *PrimFn)(void *packet);

unsigned int __cdecl Gpu_DrawOTag(unsigned int ot_head)
{
    int count = (int)(g_OtNodePoolCursor - g_OtNodePool) / 0x18; /* magic 0x2AAAAAAB, sar 2 */
    if (count >= 0x4000)                    /* cap pool, jge signé */
        return dword_1CA89A4;

    dword_1CA8880 = 0;
    if (ot_head == 0xFFFFFFFFu)             /* -1: tête OT collante */
        ot_head = dword_1B47808;
    dword_1B47808 = ot_head;

    if (ot_head == 0)                       /* jz 45d280: saut le drain */
        goto reemit;

    unsigned char *p = (unsigned char *)ot_head;
    while (1) {
        if (p < g_OtNodePool || p >= g_OtNodePoolCursor) {   /* jb/jnb unsigned: nœud externe */
            void *rec = sub_45D050(p);
            if (!rec) return 0;             /* abandon: EAX=0 */
            *(unsigned int *)((char *)rec + 4) = 1;
            p = *(unsigned char **)p;       /* suivant = node[0] direct */
        } else {                            /* nœud in-pool 0x18 */
            unsigned int *node = (unsigned int *)p;
            unsigned int *pkt = (unsigned int *)node[0];
            int words = (int)(pkt[0] >> 24);/* dword_1CA89B0 = compte de mots */
            if (words > 0) {                /* jle: skip si <= 0 */
                unsigned int *q = pkt;
                do {                        /* 45d111–45d224, mot par mot */
                    unsigned char code = ((unsigned char *)q)[7]; /* GP0 MSB */
                    if (code != 0) {
                        /* setup état selon node[0x14] bit0:
                           B7CC00/04, 1CA89FC, B7CC1C = 0x10 / 0x0D */
                        if (dword_1CA8A0C & 1)
                            ((PrimFn)g_SoftwarePrimDispatch[code])(q);       /* add esp,4 */
                        /* porte byte_B7CD28[code], dword_1CA8A0C bit1,
                           dword_B7CC24, NULL-check table */
                        if (g_TexturePageDirtyDispatch[code] && gates)
                            ((PrimFn)g_TexturePageDirtyDispatch[code])(q);   /* add esp,4 */
                    }
                    int stride = g_PrimitiveWordStride[code];
                    if (!stride) stride = 1;                        /* défaut 1 */
                    words -= stride;                                /* sub ecx,eax */
                    q += stride;                                    /* lea esi,[esi+eax*4] */
                } while (words > 0);                                /* jg 45d111 signé */
            }
            unsigned int link = pkt[0] & 0x00FFFFFFu;
            if (link == 0x00FFFFFFu) break;  /* terminateur OT, jz 45d280 */
            p = (unsigned char *)(((unsigned int)((unsigned char *)node)[0x16] << 24) | link);
        }
    }

reemit:
    if (dword_B7CC24) {                     /* jz 45d2d1: porte re-émission */
        World_loadTextureVRAM_updateAnim();
        dword_B7CC20 = 1;  sub_460C20();
        Gpu_DrawOTagWithDispatchTable(ot_head, g_GpuPrimDispatchOpaque);
        sub_460CE0();      dword_B7CC20 = 0;
        Gpu_DrawOTagWithDispatchTable(ot_head, g_GpuPrimDispatchSemiTransparent);
        sub_460CE0();      dword_B7CC20 = 1;
    }

    unsigned int old = dword_1CA89A4;
    g_OtNodePoolCursor = g_OtNodePool;      /* pool = scratch par frame */
    dword_1CA89A4 = 0; dword_1CA8850 = 0;
    dword_1CA89B4 = 0; dword_1CA89AC = 0;
    return old;                             /* EAX */
}
```

## Preuves ASM (live)

1. `45d087 mov eax, 2AAAAAABh` / `45d093 imul ecx` / `45d095 sar edx, 2` — division signée par 0x18 (nœuds 24 octets).
2. `45d0a3 cmp edx, 4000h` / `45d0aa jge loc_45D2D1` — garde capacité 0x4000 nœuds, signé.
3. `45d0ba cmp edi, 0FFFFFFFFh` / `45d0bf mov ecx, dword_1B47808` / `45d0cd mov dword_1B47808, edi` — tête OT collante (-1 = courant).
4. `45d0db cmp esi, offset g_OtNodePool` / `45d0e1 jb` / `45d0e7 cmp esi, g_OtNodePoolCursor` / `45d0ed jnb` — bornes pool unsigned, sinon nœud externe.
5. `45d0fb mov ecx, [eax]` / `45d100 shr ecx, 18h` / `45d105 mov dword_1CA89B0, ecx` / `45d10b jle` — tag>>24 = compte de mots.
6. `45d118 mov dl, [esi+7]` — code primitive GP0 = octet packet+7 (index dispatch).
7. `45d202 mov al, g_PrimitiveWordStride[edi]` / `45d217 sub ecx, eax` / `45d219 lea esi, [esi+eax*4]` / `45d224 jg loc_45D111` — sous-boucle stride dwords, signée.
8. `45d234 and eax, unk_FFFFFF` / `45d239 cmp eax, unk_FFFFFF` / `45d23e jz` / `45d242 mov cl, [ebp+16h]` / `45d245 shl esi, 18h` / `45d24a or esi, eax` — terminateur + reconstruction miroir de 0x45C870.
9. `45d259 jz loc_45D2FC` — abandon externe → EAX=0 ; `45d2d1 mov eax, dword_1CA89A4` — retour normal.
10. `45d2d6 mov g_OtNodePoolCursor, offset g_OtNodePool` — reset pool par frame.

