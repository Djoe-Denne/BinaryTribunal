# BS_RenderRelated @ 0x500FD0 — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `678036726310b981aedcd92ee5b7e1f62b032bfc62cadd9ddac87050ee630874`, 112 EA / 388 octets ; [sémantique](../semantic/0x500FD0__BS_RenderRelated.md).
- C exact SHA-256 `43e60a77a235cb0811bbbd02544546dda73e0d041a816372187ce51abc4b6e96` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Payload C : exactement 6110 octets après ouverture de fence ; le LF séparateur Markdown éventuel avant fermeture est hors payload, pas normalisation du fichier C accepté.
- Aucun rename/SetType/patch ; les anciennes mentions Push/SetType ci-dessous sont **historiques**, pas opérations du drain.

## C réconcilié / indépendant relu — payload exact

```c
/* neutralized reuse: comments removed; CRLF normalized to LF; semantic names -> address-derived tokens; operations unchanged. mapping: reuse_provenance.json */

/* F1 option 2, RETURN-INCLUSIVE; targeted old-canon repair, not new generation.
 * Numerical ground truth: supplied frozen ASM/bytes [0x500FD0,0x501154),
 * 112 instructions / 388 bytes; SHA-256:
 * 678036726310b981aedcd92ee5b7e1f62b032bfc62cadd9ddac87050ee630874.
 * The unsigned int returns of fn_5082D0 and sub_500FD0 are neutral 32-bit
 * EAX carrier declarations, NOT proven native C-source prototypes/bindings.
 * CALL 0x5082D0 at 0x501147 is followed only by stack cleanup, non-EAX
 * restores and RET: forward its entire EAX unchanged. 0x54 is its argument,
 * NOT a root-return constant; no AL narrowing or invented extension/value.
 *
 * F1--F2 requested domain (premises, not established native facts): ordinary
 * C32 RAM, 32-bit int/unsigned int/pointers, little endian, signed 16-bit
 * two's-complement WORD narrowing and arithmetic right shift, unsigned
 * 32-bit wrapping phase/address math. Ordinary memory is stable between
 * explicit opaque-call effects; reads themselves have no effects, with no
 * asynchronous mutation, MMIO or volatile observation in this domain.
 * Numerical addresses must map correctly to the C objects/accesses with
 * allowed ordinary alias/overlap; no disjointness or restrict is assumed.
 * Opaque calls retain their permitted memory effects and ordinary ABI,
 * including 32-bit outgoing argument slots and EAX result carriers. The
 * root's stack/save/return/outgoing-argument frame is assumed protected
 * against aliasing observations/corruption by mapped accesses and calls.
 *
 * After sub_5099C0 the four fn_5099D0 argument loads have unspecified C
 * evaluation order. Native reads 0x1D8E054, 0xB8A3FC+8*i, 0xB8A3F8+8*i,
 * then 0x1D8E04C. Stable ordinary RAM without read-side effects makes the
 * argument values order-independent here, not a native all-memory-
 * observation guarantee, strong read-trace equivalence or backend proof.
 * Explicit source snapshots, store widths/order, post-call reloads and
 * exact unsigned modulo operations below are retained without changes.
 * Object extents, pointer conversions/arithmetic, standard-C object,
 * effective-type/alias validity, address mapping, frame protection, root
 * ABI/helper prototypes/bindings, compiler/backend realization and native/
 * runtime equivalence remain UNVALIDATED. These premises do not prove
 * safety or helper semantics. Fresh Sol re-review and the parent's
 * canonical-provenance gate remain pending; no final ACCEPT is asserted.
 */


int __cdecl fn_5082B0(int);
int __cdecl fn_508F90(int, unsigned char *);
int __cdecl fn_509440(void *, void *, short);
int __cdecl fn_5095B0(int, int);
int *__cdecl sub_56CE30(short *, int *);
short *__cdecl sub_56C270(int, short *);
void sub_5099C0(void);
int __cdecl fn_5099D0(int *, int, int, int, int);
unsigned int __cdecl fn_5082D0(int);

extern int dword_1D98B3C;
extern unsigned int dword_1D9898C;
extern int gl_1D969A8;
extern int gl_1D8E054;
extern int gl_1D8E04C;
extern int dword_1D96DA4;
extern int dword_1D97778;
extern int dword_1D9778C;
extern int dword_1D97790;
extern int dword_1D97794;
extern unsigned char unk_1D989A4[];
extern unsigned char unk_1D989B0[];
extern unsigned char unk_1D98994[];
extern unsigned char unk_1D98A28[];
extern int dword_1D989B8[];
extern int dword_B8A3F8[];
extern int dword_B8A3FC[];
extern short sh_1D98988;

unsigned int __cdecl sub_500FD0(void)
{
    char *esi;
    int edi;
    int ebx;
    unsigned char flags;
    short ax;

    esi = (char *)fn_5082B0(0x54);
    int snapshot_38 = gl_1D969A8;
    int snapshot_2C = dword_1D98B3C;


    *(unsigned short *)(esi + 0x3C) = 0;
    *(unsigned short *)(esi + 0x3E) = 0;
    *(unsigned short *)(esi + 0x40) = 0x140;
    *(unsigned short *)(esi + 0x42) = 0xD8;
    *(int *)(esi + 0x2C) = snapshot_2C;
    *(int *)(esi + 0x48) = -1;
    *(int *)(esi + 0x38) = snapshot_38;

    for (edi = 0; edi < 4; edi++) {

        if ((*(unsigned char *)&dword_1D9898C & 4) == 0) {
            ebx = edi * 0x2C;
            if (fn_508F90((int)(unk_1D989A4 + ebx),
                                    unk_1D989B0 + ebx) != 0) {
                fn_509440(unk_1D989A4 + ebx,
                                          unk_1D989B0 + ebx,
                                          0);
            }
        }

        if (edi == 3) {

            ax = (short)dword_1D96DA4;
            ax >>= 3;
            *(unsigned short *)(esi + 4) = 0;
            *(unsigned short *)(esi + 0) = 0;
            *(short *)(esi + 2) = ax;
            sub_56CE30((short *)esi, (int *)(esi + 8));
            sub_56C270((int)&dword_1D97778, (short *)(esi + 8));
            int snapshot_1C = dword_1D9778C;
            int snapshot_20 = dword_1D97790;
            int snapshot_24 = dword_1D97794;
            *(int *)(esi + 0x1C) = snapshot_1C;
            *(int *)(esi + 0x20) = snapshot_20;
            *(int *)(esi + 0x24) = snapshot_24;
            fn_5095B0((int)unk_1D98A28, (int)(esi + 8));


            if ((*(unsigned char *)&dword_1D9898C & 1) == 0)
                *(unsigned int *)&dword_1D96DA4 += (unsigned int)(int)sh_1D98988;
        } else {
            fn_5095B0(
                (int)(unk_1D989A4 + edi * 0x2C),
                (int)&dword_1D97778);
        }


        ebx = edi * 0x2C;
        flags = *(unsigned char *)(0x1D98991 + ebx);

        if ((flags & 1) && (flags & 2)) {
            int snapshot_44 = *(int *)((char *)dword_1D989B8 + ebx);
            unsigned short snapshot_4C = *(unsigned short *)(0x1D98992 + ebx);
            *(int *)(esi + 0x44) = snapshot_44;
            *(unsigned short *)(esi + 0x4C) = snapshot_4C;
            sub_5099C0();
            gl_1D8E054 = fn_5099D0(
                (int *)(unk_1D98994 + ebx),
                (int)(esi + 0x28),
                (int)((unsigned int)gl_1D8E04C + (unsigned int)dword_B8A3F8[edi * 2] * 4u),
                dword_B8A3FC[edi * 2],
                gl_1D8E054);
        }
    }

    return fn_5082D0(0x54);
}
```

## Source documentaire antérieure, préservée

Préimage SHA-256 `8ebc2b850cdad358fa7031696d1c6a57478e400eae446c85b7b27314b7b4ed93` ; copie gelée `tools/_tmp_semantic_triple/0x500fd0/native-2026-10-10/parent_named_source_prepublication.md`. La clôture numérique ci-dessus supersède les anciens votes/code/claims sans les effacer.

````text
# BS_RenderRelated @ 0x500FD0

- Instr (live): 112
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=4578
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1166
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=769
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BS_RenderRelated(void)
- Notes parent: 4 layers stride 0x2C jl SIGNED vs 4; dword_1D9898C GLOBAL bit4 skip anim / bit0 skip RotateSky; edi==3 SAR AX,3 + add esp 18h; draw BYTE 1D98991 bits 0 AND 1; WORD 66 viewport 320x216; RenderGeometry 5 args cursor=EAX; occupancy/0xD0/F_CHAR absents.

## C réconcilié

```c
/* BS_RenderRelated @ 0x500FD0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 112 instr, size 0x184. Range 0x500FD0-0x501154. No domain:: / main:: / presentation::.
 * IDA type: int(). Occupancy 1+2 unused (test al,1/2 = per-layer flags bits).
 * Slot 0xD0 unused. F_CHAR 0x1D0 unused. GetRandomInt unused.
 * Layer stride 0x2C. jl SIGNED vs 4. Viewport WORD 320x216. 66-prefix WORDs.
 * Return EAX leftover from BattleScratch_Unwind(0x54).
 */

int __cdecl bs_modulo(int);                          /* 0x5082B0, add esp 4 */
int __cdecl Battle_ReadAnimation(int, unsigned char *); /* 0x508F90, add esp 8 */
int __cdecl BattleAnimation_StartClip(void *model_context, void *state, short clip_id); /* 0x509440, add esp 0Ch */
int __cdecl WalkStride30_MatComposeInPlace(int, int); /* 0x5095B0, add esp 8 */
int *__cdecl sub_56CE30(short *, int *);              /* 0x56CE30 */
short *__cdecl sub_56C270(int, short *);             /* 0x56C270 */
void sub_5099C0(void);                               /* 0x5099C0, 0 args */
int __cdecl RenderGeometry(int *, int, int, int, int); /* 0x5099D0, add esp 14h */
char __cdecl BattleScratch_Unwind(int);             /* 0x5082D0, add esp 4 */

extern int dword_1D98B3C;
extern unsigned int dword_1D9898C;                  /* GLOBAL flags, not stride-indexed */
extern int g_BattlePacketEnd;
extern int g_BattlePacketCursor;
extern int g_BattleOTBase;
extern int dword_1D96DA4;
extern int dword_1D97778;                            /* camera view/orientation block */
extern int dword_1D9778C;
extern int dword_1D97790;
extern int dword_1D97794;
extern unsigned char unk_1D989A4[];                 /* model_context, stride 0x2C */
extern unsigned char unk_1D989B0[];                 /* anim state, stride 0x2C */
extern unsigned char unk_1D98994[];                  /* RenderGeometry arg0, stride 0x2C */
extern unsigned char unk_1D98A28[];                  /* == unk_1D989A4 + 3*0x2C */
extern int dword_1D989B8[];                          /* DWORD, indexed +edi*0x2C not +edi*4 */
extern int dword_B8A3F8[];                           /* [edi*8] byte = index edi*2 */
extern int dword_B8A3FC[];
extern short BattleEffect_RotateSky;

int __cdecl BS_RenderRelated(void)
{
    char *esi;
    int edi;
    int ebx;
    unsigned char flags;
    short ax;

    esi = (char *)bs_modulo(0x54);

    /* 66 89 7e 3c / 3e ; 66 c7 46 40 0140 / 42 00d8 */
    *(unsigned short *)(esi + 0x3C) = 0;
    *(unsigned short *)(esi + 0x3E) = 0;
    *(unsigned short *)(esi + 0x40) = 0x140;
    *(unsigned short *)(esi + 0x42) = 0xD8;
    *(int *)(esi + 0x2C) = dword_1D98B3C;             /* 89 46 2c */
    *(int *)(esi + 0x48) = -1;                       /* c7 46 48 ffffffff */
    *(int *)(esi + 0x38) = g_BattlePacketEnd;         /* 89 4e 38 */

    for (edi = 0; edi < 4; edi++) {                  /* inc; cmp 4; jl SIGNED loc_50100E */
        /* test byte ptr dword_1D9898C, 4 ; jnz loc_501046 */
        if ((*(unsigned char *)&dword_1D9898C & 4) == 0) {
            ebx = edi * 0x2C;                       /* 5*edi; *11; shl 2 */
            if (Battle_ReadAnimation((int)(unk_1D989A4 + ebx),
                                    unk_1D989B0 + ebx) != 0) {
                BattleAnimation_StartClip(unk_1D989A4 + ebx,
                                          unk_1D989B0 + ebx,
                                          0);
            }
        }

        if (edi == 3) {                              /* cmp edi,3 ; jz loc_501068 */
            /* loc_501068: mov eax,dword_1D96DA4 ; lea ebx,[esi+8] ; sar ax,3 */
            ax = (short)dword_1D96DA4;
            ax >>= 3;                                /* 66 c1 f8 03 */
            *(unsigned short *)(esi + 4) = 0;        /* 66 c7 46 04 0000 */
            *(unsigned short *)(esi + 0) = 0;        /* 66 c7 06 0000 */
            *(short *)(esi + 2) = ax;                /* 66 89 46 02 */
            sub_56CE30((short *)esi, (int *)(esi + 8));
            sub_56C270((int)&dword_1D97778, (short *)(esi + 8));
            *(int *)(esi + 0x1C) = dword_1D9778C;   /* 89 46 1c */
            *(int *)(esi + 0x20) = dword_1D97790;    /* 89 4e 20 */
            *(int *)(esi + 0x24) = dword_1D97794;    /* 89 56 24 */
            WalkStride30_MatComposeInPlace((int)unk_1D98A28, (int)(esi + 8));
            /* add esp,18h covers 56CE30+56C270+WalkStride30 */
            /* mov al, byte ptr dword_1D9898C ; test al,1 ; jnz loc_5010D3 */
            if ((*(unsigned char *)&dword_1D9898C & 1) == 0)
                dword_1D96DA4 += (int)BattleEffect_RotateSky; /* 0f bf movsx */
        } else {
            WalkStride30_MatComposeInPlace(
                (int)(unk_1D989A4 + edi * 0x2C),
                (int)&dword_1D97778);
        }

        /* loc_5010D3 */
        ebx = edi * 0x2C;
        flags = *(unsigned char *)(0x1D98991 + ebx); /* unnamed BYTE */
        /* test al,1 jz ; test al,2 jz — both bits required */
        if ((flags & 1) && (flags & 2)) {
            *(int *)(esi + 0x44) = *(int *)((char *)dword_1D989B8 + ebx); /* 89 56 44 */
            *(unsigned short *)(esi + 0x4C) =
                *(unsigned short *)(0x1D98992 + ebx); /* 66 89 46 4c */
            sub_5099C0();
            g_BattlePacketCursor = RenderGeometry(
                (int *)(unk_1D98994 + ebx),
                (int)(esi + 0x28),
                g_BattleOTBase + dword_B8A3F8[edi * 2] * 4,
                dword_B8A3FC[edi * 2],
                g_BattlePacketCursor);
        }
    }

    return BattleScratch_Unwind(0x54);
}
```
````
