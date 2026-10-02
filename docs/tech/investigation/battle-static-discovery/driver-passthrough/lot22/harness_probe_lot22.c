/* Harnais Lot 22 — footer ND08 v14 + sideband ST09 (complément du template
 * générique, qui cible le layout v13). Exécution MANUELLE pour la gate
 * build-only du lot 22 : RVAs dérivées du disasm du DLL candidat
 * (dumpbin /DISASM, image base 0x10000000 confirmée /HEADERS) :
 *   GFXPT_DumpNode RVA 0x2160  (signature v14 : 5 args cdecl)
 *   GFXPT_StEmit    RVA 0x2080
 *   g_dumpWrite     RVA 0x55FD4   g_dumpRing RVA 0x55FD8
 *   g_frameSeq      RVA 0x4055FF0 g_capEndSeq RVA 0x4055FF4
 *   g_frameOverflow RVA 0x4056008 g_stateEpoch RVA 0x405613C
 *   g_stRingDrops   RVA 0x4056140 g_stStreamBroken RVA 0x4056144
 *   g_frameStRecs   RVA 0x4056148
 * Charge une COPIE du DLL (jamais l'AF3DN.P en place). */
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <string.h>

typedef void (__cdecl *DumpNodeFn)(unsigned slot, const void* ctx, const void* node,
                                   unsigned long preStateEpoch, const void* cookie);
typedef void (__cdecl *StEmitFn)(unsigned long kind, unsigned long type,
                                 unsigned long value, unsigned long aux);

static unsigned char* FindBytes(const unsigned char* base, size_t len,
                                const unsigned char* pat, size_t plen)
{
    size_t i, j;
    for (i = 0; i + plen <= len; ++i) {
        int ok = 1;
        for (j = 0; j < plen; ++j) if (base[i + j] != pat[j]) { ok = 0; break; }
        if (ok) return (unsigned char*)(base + i);
    }
    return 0;
}

int main(int argc, char** argv)
{
    const char* dllPath = (argc > 1) ? argv[1] : "harness_target.dll";
    HMODULE h;
    unsigned char* base;
    unsigned char node[64];                       /* >= 0x30 : le writer lit node+0x2C */
    unsigned char idxArea[64], *verts;
    static unsigned char ctx[0xB00];              /* >= 0x450 (clut @+0x448) et >= 0xAC8 (gate @+0xAC4) */
    static unsigned char vertsArea[6 * 32 + 16];
    unsigned char patND[4] = {0x4E, 0x44, 0x30, 0x38};   /* 'ND08' */
    unsigned char patST[4] = {0x53, 0x54, 0x30, 0x39};   /* 'ST09' */
    unsigned char* rec;
    DumpNodeFn dumpNode;
    StEmitFn stEmit;
    unsigned long *pWrite, *pRing, *pSeq, *pCap, *pEpoch, *pStRecs;
    unsigned hdrPsize, hdrSlot, hdrKind, hdrFails, hdrBuild, vc, ic;
    unsigned long footerEpoch, footerFlags, writeBefore;
    int fails = 0;

    h = LoadLibraryA(dllPath);
    if (!h) { printf("FAIL LoadLibrary %lu\n", GetLastError()); return 1; }
    base = (unsigned char*)h;

    pWrite  = (unsigned long*)(base + 0x55FD4);
    pRing   = (unsigned long*)(base + 0x55FD8);   /* adresse de la ring (lecture seule ici) */
    pSeq    = (unsigned long*)(base + 0x4055FF0);
    pCap    = (unsigned long*)(base + 0x4055FF4);
    pEpoch  = (unsigned long*)(base + 0x405613C);
    pStRecs = (unsigned long*)(base + 0x4056148);
    *pSeq = 1000; *pCap = 1015; *pWrite = 0; *pEpoch = 0;

    /* --- 1) ST09 direct : GFXPT_StEmit(1, 5, 1, 0) ----------------------- */
    stEmit = (StEmitFn)(base + 0x2080);
    stEmit(1, 5, 1, 0);
    printf("after StEmit: write=%lu epoch=%lu stRecs=%lu\n", *pWrite, *pEpoch, *pStRecs);
    if (*pWrite != 32) { printf("FAIL advance ST09 %lu != 32\n", *pWrite); fails++; }
    if (*pEpoch != 1) { printf("FAIL epoch %lu != 1\n", *pEpoch); fails++; }
    rec = FindBytes((unsigned char*)pRing, 256, patST, 4);
    if (!rec) { printf("FAIL ST09 introuvable dans le ring\n"); fails++; }
    else {
        unsigned long bld = *(unsigned long*)(rec + 4);
        unsigned long ep  = *(unsigned long*)(rec + 12);
        unsigned long knd = *(unsigned long*)(rec + 16);
        unsigned long typ = *(unsigned long*)(rec + 20);
        unsigned long val = *(unsigned long*)(rec + 24);
        printf("ST09: build=%lX epoch=%lu kind=%lu type=%lu value=%lu\n", bld, ep, knd, typ, val);
        if (bld != 0x5641 || ep != 1 || knd != 1 || typ != 5 || val != 1) { printf("FAIL champs ST09\n"); fails++; }
    }

    /* --- 2) ND08 v14 : draw slot 49, preEpoch=7 -------------------------- */
    memset(node, 0, sizeof(node));
    memset(idxArea, 0x11, sizeof(idxArea));
    verts = (unsigned char*)vertsArea + 8;        /* 8 o de guard avant verts */
    memset(ctx, 0, sizeof(ctx));
    memset(vertsArea, 0xEE, 8);                   /* guard avant verts */
    memset(verts - 4, 0x33, 4);                   /* sentinelle 0x33 AVANT verts */
    memset(verts, 0x22, 6 * 32);                  /* verts (192 o) */
    memset(vertsArea + 8 + 6 * 32, 0xEE, 8);      /* guard après verts */
    *(unsigned*)(node + 0x0C) = 6;                /* vcount */
    *(unsigned*)(node + 0x18) = 6;                /* icount */
    *(unsigned*)(node + 0x14) = (unsigned)verts;
    *(unsigned*)(node + 0x20) = (unsigned)idxArea;
    *(unsigned*)(node + 0x2C) = 0;                /* texinfo null (footers 0) */

    writeBefore = *pWrite;
    dumpNode = (DumpNodeFn)(base + 0x2160);
    dumpNode(49, (const void*)ctx, node, 7, (const void*)0);
    printf("after DumpNode: write=%lu (delta %lu)\n", *pWrite, *pWrite - writeBefore);
    rec = FindBytes((unsigned char*)pRing + writeBefore, 600, patND, 4);
    if (!rec) { printf("FAIL ND08 introuvable dans le ring\n"); fails++; }
    else {
        hdrSlot  = *(unsigned*)(rec + 4);
        hdrKind  = *(unsigned*)(rec + 20);
        hdrFails = *(unsigned*)(rec + 24);
        hdrPsize = *(unsigned*)(rec + 28);
        hdrBuild = *(unsigned*)(rec + 32);
        vc = *(unsigned*)(rec + 36 + 24);
        ic = *(unsigned*)(rec + 36 + 24 + 4);
        {
            unsigned long payloadEnd = 36 + hdrPsize;
            footerEpoch = *(unsigned long*)(rec + payloadEnd - 8);
            footerFlags = *(unsigned long*)(rec + payloadEnd - 4);
        }
        printf("ND08: slot=%u kind=%u fails=%u psize=%u build=%X vc=%u ic=%u epoch=%lu flags=%lX\n",
               hdrSlot, hdrKind, hdrFails, hdrPsize, hdrBuild, vc, ic, footerEpoch, footerFlags);
        {
            int k;
            printf("tail 48 o (offsets %lu..%lu):\n", (unsigned long)(36 + hdrPsize - 48), (unsigned long)(36 + hdrPsize));
            for (k = 36 + hdrPsize - 48; k < (int)(36 + hdrPsize); k += 4)
                printf("  +%3lu: %08lX\n", (unsigned long)k, *(unsigned long*)(rec + k));
        }
        if (hdrPsize != 24 + 8 + ic * 2 + ((4 - (ic * 2 % 4)) % 4) + vc * 32 + 16 + 0 + 0 + 4 + 4 + 12 + 8) { printf("FAIL psize contrat v14\n"); fails++; }
        if (hdrBuild != 0x5641) { printf("FAIL build ND08 %X != 5641\n", hdrBuild); fails++; }
        if (footerEpoch != 7) { printf("FAIL footer epoch %lu != 7\n", footerEpoch); fails++; }
        if ((footerFlags & 1) == 0 || (footerFlags & 2) != 0) { printf("FAIL footer flags %lX (bit0 doit etre pose, stage0_valid=0)\n", footerFlags); fails++; }
        {
            unsigned char* p33 = FindBytes(rec, 600, (unsigned char*)"\x33\x33\x33\x33", 4);
            unsigned char* p22 = FindBytes(rec, 600, (unsigned char*)"\x22\x22\x22\x22", 4);
            if (p22 && p33 && p22 < p33) { printf("FAIL sentinelle 0x33 copiee avant verts (spill)\n"); fails++; }
            else printf("ok sentinelle 0x33 non copiee (source = verts exact)\n");
        }
        if (*pWrite - writeBefore != 36 + hdrPsize) { printf("FAIL advance ND08 %lu != 36+psize %u\n", *pWrite - writeBefore, hdrPsize); fails++; }
    }

    /* --- 3) garde vcount > 4096 : aucun record --------------------------- */
    *(unsigned*)(node + 0x0C) = 5000;
    writeBefore = *pWrite;
    dumpNode(49, (const void*)ctx, node, 7, (const void*)0);
    if (*pWrite != writeBefore) { printf("FAIL garde vcount 5000 : record emis (%lu)\n", *pWrite - writeBefore); fails++; }
    else printf("ok garde vcount>4096 refuse (aucun record)\n");

    /* --- 4) record kind0 (setup) : advance = 36+24 = 60 ------------------- */
    memset(node, 0, sizeof(node));
    writeBefore = *pWrite;
    dumpNode(47, (const void*)ctx, node, 1, (const void*)0);
    if (*pWrite - writeBefore != 60) { printf("FAIL kind0 advance %lu != 60\n", *pWrite - writeBefore); fails++; }
    else printf("ok kind0 advance 60 (36+24)\n");

    /* --- 5) commit de session setup (kind=6) : gates actives -------------- */
    /* ctx : *(ctx+0x30)=1, *(ctx+0x38)=matdesc 0x8888 ; cookie : *(+0xAC4)=1 */
    *(unsigned long*)(ctx + 0x30) = 1;
    *(unsigned long*)(ctx + 0x38) = 0x8888;
    *(unsigned long*)(ctx + 0xAC4) = 1;
    writeBefore = *pWrite;
    dumpNode(47, (const void*)ctx, node, 2, (const void*)ctx);   /* cookie = ctx (gate @+0xAC4) */
    {
        unsigned char* recST = FindBytes((unsigned char*)pRing + writeBefore, 200, patST, 4);
        if (!recST) { printf("FAIL ST09 kind6 introuvable\n"); fails++; }
        else {
            unsigned long knd = *(unsigned long*)(recST + 16);
            unsigned long typ = *(unsigned long*)(recST + 20);
            unsigned long val = *(unsigned long*)(recST + 24);
            unsigned long aux = *(unsigned long*)(recST + 28);
            printf("ST09 kind6: kind=%lu slot=%lu matdesc=%lX gate=%lu\n", knd, typ, val, aux);
            if (knd != 6 || typ != 47 || val != 0x8888 || aux != 1) { printf("FAIL champs ST09 kind6\n"); fails++; }
        }
    }
    /* gate fermée (cookie+0xAC4 = 0) : AUCUN event */
    writeBefore = *pWrite;
    *(unsigned long*)(ctx + 0xAC4) = 0;
    dumpNode(47, (const void*)ctx, node, 3, (const void*)ctx);
    {
        unsigned char* recST = FindBytes((unsigned char*)pRing + writeBefore, 200, patST, 4);
        if (recST) { printf("FAIL ST09 kind6 emis avec gate fermee\n"); fails++; }
        else printf("ok kind6 refuse quand gate *(cookie+0xAC4)=0\n");
    }

    FreeLibrary(h);
    if (fails) { printf("HARNESS LOT22 FAILED (%d)\n", fails); return 1; }
    printf("HARNESS LOT22 OK\n");
    return 0;
}
