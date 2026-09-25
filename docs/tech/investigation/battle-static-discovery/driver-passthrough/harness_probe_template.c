/* Harnais sentinelles générique — modèle du skill ff8-dump-writer-verify.
 * Les RVAs marquées <<RVA>> sont patchées par verify_writer.ps1 (auto-dérivées du disasm).
 * Lit le DLL cible (COPIE), arme la capture via les globales, injecte un node synthétique
 * slot 51 (remaining=9, perV=4, perI=6) avec sentinelles, et vérifie le contrat du record. */
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <string.h>

typedef void (__cdecl *DumpNodeFn)(unsigned slot, const void* ctx, const void* node);

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
    unsigned char node[24];
    unsigned char idxArea[128], geomArea[128];
    static unsigned char pool[64 * 32 + 16];
    unsigned char pat[4] = {0x4E, 0x44, 0x30, 0x37};
    unsigned char *rec, *p33, *p22, *p11;
    DumpNodeFn dump;
    unsigned seq = 1000, capEnd;
    unsigned long *pSeq, *pCap, *pWrite, expected, delta;
    unsigned hdrPsize, hdrKind, hdrSlot, hdrFails, vc, ic;
    int fails = 0;

    h = LoadLibraryA(dllPath);
    if (!h) { printf("FAIL LoadLibrary %lu\n", GetLastError()); return 1; }
    base = (unsigned char*)h;

    pSeq   = (unsigned*)(base + /*RVA_SEQ*/0x4054EB0);
    pCap   = (unsigned*)(base + /*RVA_CAP*/0x4054EB4);
    pWrite = (unsigned*)(base + 0x54E94);          /* g_dumpWrite (lot 13) */
    *pSeq = seq; capEnd = seq + 15; *pCap = capEnd; *pWrite = 0;

    memset(node, 0, sizeof(node));
    memset(idxArea, 0x11, sizeof(idxArea));
    memset(geomArea, 0, sizeof(geomArea));
    memset(pool, 0xEE, sizeof(pool));
    memset(pool + 8, 0x33, 4);                     /* sentinelle AVANT verts */
    memset(pool + 12, 0x22, 64 * 32);              /* verts @ pool+12 */
    *(unsigned*)(node + 0x08) = 9;                 /* remaining */
    *(unsigned*)(node + 0x14) = (unsigned)(pool + 12);
    *(unsigned*)(node + 0x20) = (unsigned)idxArea;
    *(unsigned*)(node + 0x2C) = (unsigned)geomArea;
    *(unsigned*)(geomArea + 0x3C) = 4;             /* perV */
    *(unsigned*)(geomArea + 0x40) = 6;             /* perI */

    ((DumpNodeFn)(base + /*RVA_DUMP*/0x19D0))(51, (const void*)0x12345678, node);

    printf("after: seq=%lu capEnd=%lu write=%lu\n", *pSeq, *pCap, *pWrite);
    if (*pWrite == 0) { printf("FAIL ring vide (early return : RVAs globales?)\n"); return 2; }

    rec = FindBytes(base + 0x54E98, 0x1000, pat, 4);   /* ring base RVA 0x54E98 (lot 13) */
    if (!rec) { printf("FAIL magic introuvable dans le ring\n"); return 2; }
    hdrSlot  = *(unsigned*)(rec + 4);
    hdrKind  = *(unsigned*)(rec + 20);
    hdrFails = *(unsigned*)(rec + 24);
    hdrPsize = *(unsigned*)(rec + 28);
    vc = *(unsigned*)(rec + 56); ic = *(unsigned*)(rec + 60);
    printf("hdr: slot=%u kind=%u fails=%u psize=%u vc=%u ic=%u\n", hdrSlot, hdrKind, hdrFails, hdrPsize, vc, ic);
    delta = (long)((rec - (base + 0x54E98)));
    (void)delta;
    expected = 32 + hdrPsize;
    if (*pWrite != expected) { printf("FAIL advance %lu != 32+psize %lu (drift +2 class CRLF?)\n", *pWrite, expected); fails++; }
    else printf("ok advance %lu == 32+psize\n", *pWrite);
    if (hdrPsize != 24 + 8 + ic*2 + ((4 - (ic*2 % 4)) % 4) + vc*32) { printf("FAIL psize contrat\n"); fails++; }
    if (vc != 36 || ic != 54) { printf("FAIL closure 51 (attendu vc=36 ic=54)\n"); fails++; }
    p33 = FindBytes(rec, 600, (unsigned char*)"\x33\x33\x33\x33", 4);
    p22 = FindBytes(rec, 600, (unsigned char*)"\x22\x22\x22\x22", 4);
    p11 = FindBytes(rec, 600, (unsigned char*)"\x11\x11\x11\x11", 4);
    printf("sentinelles: idx(11)@+%ld verts(22)@+%ld guard(33)@+%ld\n",
           p11 ? (long)(p11 - rec) : -9999L, p22 ? (long)(p22 - rec) : -9999L, p33 ? (long)(p33 - rec) : -9999L);
    if (p22 && p33 && p22 < p33) { printf("FAIL guard 0x33 copie avant verts (spill / verts-2)\n"); fails++; }
    else printf("ok sentinelle 0x33 non copiee (source = verts exact)\n");
    if (hdrFails) { printf("WARN fails=%u (copie SEH partielle)\n", hdrFails); }

    FreeLibrary(h);
    if (fails) { printf("WRITER VERIFY FAILED (%d)\n", fails); return 1; }
    printf("WRITER VERIFIED (harnais)\n");
    return 0;
}
