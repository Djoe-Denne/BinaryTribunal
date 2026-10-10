# Décomp candidate 0x464BD0 — propagation P3 (MAINTIEN)

- Rôle : propagation mécanique déterministe ; aucun nouveau vote ni nouvelle analyse.
- Fence C (première et unique) : copie **BYTE EXACTE** du gel `P3_C_review/c_reviewed_final.c` (SHA-256 `b68e7c53ab224fabbd2ec2a69291ccf8db48a96820e3163851127d2debe13b6b`). Ni C-B (`P3_C_B/c_control_b.c`, `e28b5a9c678dcac5f7bdfea333bcde34f99f01b06435a7cea5e64ed95de293ae`), ni régénération ; verdict R = **MAINTIEN**, aucun C corrigé produit.
- Titre catalogue natif post-freeze **préservé** : `World_loadTextureVRAM_updateAnim` (World, pas Battle) ; métier World/Texture/VRAM non certifié / trop large sans fausseté établie ; nom numérique proposé `Parcourir96x1100_8x100_EffacerBitPuis32x1136` (preuves : strides/bornes + porte NOT/AND/store tardif) ; pas de rename IDB.
- Confiance : LIKELY numérique ; métier unknown.
- Destination après gate parent : `0x464BD0__World_loadTextureVRAM_updateAnim.md` (decomp + sémantique), écriture réservée au parent.
```c
/* Primary numeric-only reconstruction, 0x464BD0..0x464DA1, 155 instructions.
 * Model: C32 / little-endian x86, not unrestricted ISO C.
 * sub_* declarations describe observed stack arguments and EAX projections,
 * NOT IDA prototypes or established semantic return types.
 * @HEX tokens give exhaustive native-instruction anchors; coverage.json
 * distinguishes stack scaffolding from translated operations.
 */
#include <stdint.h>

_Static_assert(sizeof(uintptr_t) == 4, "requires the C32 address model");
typedef uint32_t u32;

/* All numeric memory operations in this function are DWORD operations.
 * Volatile keeps reloads and observable access order across calls/stores.
 * Valid aligned mapped storage and matching effective types are assumptions.
 */
static u32 r32(u32 a) { return *(volatile u32 *)(uintptr_t)a; }
static void w32(u32 a, u32 v) { *(volatile u32 *)(uintptr_t)a = v; }
static int64_t s32(u32 x)
{
    return (x & UINT32_C(0x80000000)) ? (int64_t)x - INT64_C(4294967296)
                                     : (int64_t)x;
}

#if defined(_MSC_VER)
# define CDECL __cdecl
#elif defined(__i386__)
# define CDECL __attribute__((cdecl))
#else
# define CDECL /* prose-only outside the stated x86 model */
#endif
extern u32 CDECL sub_464F70(u32, u32, u32, u32, u32,
                          u32, u32, u32, u32, u32);
extern u32 CDECL sub_4653B0(u32, u32, u32);
extern u32 CDECL sub_465720(u32, u32, u32);
extern u32 CDECL sub_464DB0(u32, u32, u32);

u32 CDECL sub_464BD0(void)
{
    u32 eax, ebx, ebp, esi, edi, ecx, edx;
    u32 local_10, local_14;

    /* @464BD0 @464BD3 @464BD4 @464BD5 @464BD6:
     * allocate 8 bytes; save EBX, EBP, ESI, EDI (16 bytes).
     * Following local_10/local_14 offsets refer to ESP AFTER those saves.
     * Normal C ABI abstracts the physical frame, not the numeric values.
     */
    local_10 = 0;                         /* @464BD7 */
    esi = UINT32_C(0x1CB6040);            /* @464BDF: address, not a load */
    do {
        ebx = 0;                         /* @464BE4 */
        do {
            local_14 = esi;              /* @464BE6: overwritten each record */
            ebp = 1;                     /* @464BEA */
            edi = 0;                     /* @464BEF */
            do {
                /* @464BF1 @464BF7: zero -> skip, including the final AND. */
                if ((r32(esi + 0x324u) & ebp) == 0)
                    goto loc_464CF2;

                eax = r32(esi + edi + 0x5Cu); /* @464BFD */
                if (eax != 0)                /* @464C01 @464C03 */
                    goto loc_464C39;

                eax = local_10;              /* @464C05 */
                /* @464C09 @464C0B @464C0D @464C0E @464C0F @464C14
                 * @464C19 @464C1F @464C21 @464C22:
                 * pushes RIGHT->LEFT: 0,0,ebx,eax,100h,100h,0,0,ecx,esi.
                 */
                ecx = esi + edi + 4u;        /* @464C1B: LEA, no dereference */
                eax = sub_464F70(esi, ecx, 0, 0, 0x100u, 0x100u,
                                  eax, ebx, 0, 0); /* @464C23 */
                eax = r32(esi);              /* @464C28: BEFORE cleanup */
                /* @464C2A: deferred caller cleanup, ESP += 0x28. */
                if (s32(eax) <= 0)           /* @464C2D @464C2F: JG is signed */
                    w32(esi, 1);             /* @464C31 */
                goto loc_464C5F;             /* @464C37 */

            loc_464C39:
                if ((r32(esi + 0x32Cu) & ebp) == 0) /* @464C39 @464C3F */
                    goto loc_464C5F;
                /* @464C41 @464C47 @464C48: pushes 1,ebx,edx. */
                edx = esi + edi + 4u;        /* @464C43 */
                eax = sub_4653B0(edx, ebx, 1); /* @464C49 */
                /* @464C4E: ESP += 0xC. */
                eax = 0;                    /* @464C51 */
                w32(esi + 0x330u, eax);      /* @464C53 */
                w32(esi + 0x43Cu, eax);      /* @464C59 */

            loc_464C5F:
                eax = r32(esi + edi + 0x48u); /* @464C5F: fresh load */
                if (eax == 0)                /* @464C63 @464C65 */
                    goto loc_464C87;
                eax = r32(UINT32_C(0x1CCFD88)); /* @464C67 */
                if (eax == 0)                /* @464C6C @464C6E */
                    goto loc_464C87;
                if ((r32(esi + 0x32Cu) & ebp) == 0) /* @464C70 @464C76 */
                    goto loc_464C87;
                /* @464C78 @464C7D @464C7E: pushes esi,ebx,eax. */
                eax = esi + edi + 4u;        /* @464C79 */
                eax = sub_465720(eax, ebx, esi); /* @464C7F */
                /* @464C84: ESP += 0xC. */

            loc_464C87:
                if ((r32(esi + 0x328u) & ebp) == 0) /* @464C87 @464C8D */
                    goto loc_464CE0;
                eax = r32(esi + edi + 0x48u); /* @464C8F: reload after call */
                if (eax != 0)                /* @464C93 @464C95 */
                    goto loc_464CE0;
                eax = r32(esi + edi + 0x28u); /* @464C97 */
                if (eax != 0)                /* @464C9B @464C9D */
                    goto loc_464CC5;
                ecx = local_10;              /* @464C9F */
                /* @464CA3 @464CA5 @464CA7 @464CA8 @464CA9 @464CAE
                 * @464CB3 @464CB9 @464CBB @464CBC:
                 * pushes 0,0,ebx,ecx,100h,100h,0,0,edx,esi.
                 */
                edx = esi + edi + 4u;        /* @464CB5 */
                eax = sub_464F70(esi, edx, 0, 0, 0x100u, 0x100u,
                                  ecx, ebx, 0, 0); /* @464CBD */
                /* @464CC2: ESP += 0x28 BEFORE the next pushes. */

            loc_464CC5:
                /* @464CC5 @464CCA @464CCB: pushes esi,ebx,eax. */
                eax = esi + edi + 4u;        /* @464CC6 */
                eax = sub_464DB0(eax, ebx, esi); /* @464CCC */
                eax = r32(esi);              /* @464CD1: BEFORE cleanup */
                /* @464CD3: ESP += 0xC. */
                if (s32(eax) <= 0)           /* @464CD6 @464CD8: signed JG */
                    w32(esi, 1);             /* @464CDA */

            loc_464CE0:
                eax = r32(esi + 0x32Cu);      /* @464CE0: after all calls */
                ecx = ebp;                   /* @464CE6 */
                ecx = ~ecx;                  /* @464CE8: full DWORD NOT */
                eax &= ecx;                  /* @464CEA */
                w32(esi + 0x32Cu, eax);      /* @464CEC: only enabled path */

            loc_464CF2:
                edi += 0x64u;                /* @464CF2 */
                ebp <<= (1u & 31u);          /* @464CF5: x86 shift count */
            } while (s32(edi) < 0x320);       /* @464CF7 @464CFD: signed JL */
            ebx += 1u;                       /* @464D03 */
            esi += 0x44Cu;                   /* @464D04 */
        } while (s32(ebx) < 0x20);            /* @464D0A @464D0D: signed JL */
        ecx = local_10;                      /* @464D13 */
        ecx += 1u;                           /* @464D17 */
        /* @464D18: signed CMP; the following MOV preserves flags. */
        local_10 = ecx;                      /* @464D1E */
    } while (s32(esi) < s32(UINT32_C(0x1CCFCC0))); /* @464D22 */

    eax = r32(UINT32_C(0x1CCFD90));           /* @464D28 */
    if (eax == 0)                            /* @464D2D @464D2F */
        goto loc_464D99;
    edi = 0;                                 /* @464D31 */
    esi = UINT32_C(0x1CAD690);                /* @464D33: address */
    do {
        eax = r32(esi - 4u);                 /* @464D38 */
        if (eax == 0)                        /* @464D3B @464D3D */
            goto loc_464D8D;
        if (r32(esi) == 0)                   /* @464D3F @464D42: EAX unchanged */
            goto loc_464D8D;
        eax = r32(esi - 0x444u);             /* @464D44 */
        if (eax != 0)                        /* @464D4A @464D4C */
            goto loc_464D7B;
        edx = r32(esi + 4u);                 /* @464D4E: CONTENT */
        ecx = local_14;                      /* @464D51: last saved record base */
        /* @464D55 @464D56 @464D58 @464D59 @464D5B @464D60
         * @464D65 @464D6D @464D6F @464D70:
         * pushes edx,0,edi,2,100h,100h,0,0,eax,ecx.
         */
        eax = esi - 0x468u;                  /* @464D67: ADDRESS */
        eax = sub_464F70(ecx, eax, 0, 0, 0x100u, 0x100u,
                          2, edi, 0, edx);  /* @464D71 */
        /* @464D76: ESP += 0x28. */
        goto loc_464D8D;                     /* @464D79 */

    loc_464D7B:
        /* @464D7B @464D83 @464D84: pushes 0,edi,edx. */
        edx = esi - 0x468u;                  /* @464D7D */
        eax = sub_4653B0(edx, edi, 0);       /* @464D85 */
        /* @464D8A: ESP += 0xC. */

    loc_464D8D:
        edi += 1u;                           /* @464D8D */
        esi += 0x470u;                       /* @464D8E */
    } while (s32(edi) < 0x20);                /* @464D94 @464D97: signed JL */

loc_464D99:
    /* @464D99 @464D9A @464D9B @464D9C @464D9D:
     * restore EDI, ESI, EBP, EBX; ESP += 8. No EAX definition here.
     */
    return eax;                              /* @464DA0: RET, no argument pop */
}
```


## Gate parent natif 2026-10-10 — clôture numérique bornée

Les mentions candidate/pending sont historiques, supersédées par ce gate. §5.6 parent PASS : source155insns465bytes SHA1b3684f0cf9b0b2ad705759a997ff01b96f297a366fbe4b1440950e941a8fd65. Sept CALL/quatre callees 464F70/4653B0/465720/464DB0 existent en natif, RETcalleeC3, groupes cdecl10DWORD/40bytes ou3DWORD/12bytes nettoyés, separation464CC2 confirmée. Caller45D288 CODEtype17 unique, no immédiatEAXconsumer. Strides1100/100/1136,96primaires groupes3x32 et8positions,32secondaires. SignedJL/JG, MOV464D1E préserveflagsCMP, SHL1&31. Gatefermée skipcalls ETclear ; lateclearvaluefresh aprèscalls, reloads/ordre des stores vérifiés. Lastprimary1CCF874 commecontenuL14 privé validframe, pasadvanced1CCFCC0 niadressecadre ; dernierargactualDWORDT+46C. EAX32 cinqclasses : globalgate0, lastfirstgate0, firstnonzero/second0→readT+464, bothactive→callee464F70 ou4653B0 fullEAX ; noBOOL/AL-only/count, prologue/RET C3 compatible. Huit gels inchangés, C fence exact SHAb68e7c53ab224fabbd2ec2a69291ccf8db48a96820e3163851127d2debe13b6b. 0défautmatériel inéditB contre BOTH C-review/Cfinal etA/V, représentationpile/domaine déjà bornée ; deuxclarificationsR-only nonattribuéesB. ConfianceLIKELYnumérique, métierWorld/texture/VRAM noncertifié sansfaussetéétablie ; propositiondescriptive justifiéeparstrides/bornes etlateNOTANDstore, aucunrename. Callbacks/modelbackend/types/allcalleeABI/flags/privateframe/concurrency/ISO/compilation/native/runtime equivalence nonvalidés. Isolationnumériqueobservée avecexceptionsadministratives/fragmentContextModegénérique, pascertificatcontexteaveugleabsolu. Probesparent b3b11e70ebc10d53006a1b970c69dc5b6146020525185c096ccf9624bf01efc9 et c6a1db52ed1d3003ab20e06a444985a9815f55040fd374c9a4bd49024cb0758f.
