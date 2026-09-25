/* h4.c — ring flush fidelity: DumpNode(51) + DumpNode(47), then direct
 * fwrite(ring, pending) replicating the flush math, and byte-diff ring vs file. */
#define WIN32_LEAN_AND_MEAN
#define _CRT_SECURE_NO_WARNINGS
#include <windows.h>
#include <stdio.h>
#include <string.h>

typedef void (__cdecl *PFN_DumpNode)(unsigned slot, const void* ctx, const void* node);

static unsigned char g_node[0x40];
static unsigned char g_geom[0x80];
static unsigned char g_pool[2 + 64 * 32];
static unsigned short g_idx[64];

int main(int argc, char** argv)
{
    const char* dll = (argc > 1) ? argv[1] : "C:\\Users\\djden\\AppData\\Local\\Temp\\harness_target.dll";
    const char* out = (argc > 2) ? argv[2] : "h4_ring_copy.bin";
    HMODULE h;
    unsigned char* base;
    unsigned long *pSeq, *pCap, *pOvf, *pWrite, *pCommit, *pRec;
    unsigned long i, pend;
    unsigned char* ring;
    PFN_DumpNode dump;
    FILE* f;

    h = LoadLibraryA(dll);
    if (!h) { printf("load failed %lu\n", GetLastError()); return 2; }
    base = (unsigned char*)h;
    printf("base=%p\n", (void*)base);

    pSeq    = (unsigned long*)(base + 0x4054EB0ul);
    pCap    = (unsigned long*)(base + 0x4054EB4ul);
    pOvf    = (unsigned long*)(base + 0x4054EC8ul);
    pWrite  = (unsigned long*)(base + 0x0054E94ul);
    pCommit = (unsigned long*)(base + 0x4054E98ul);
    pRec    = (unsigned long*)(base + 0x4054EB8ul);
    ring    = base + 0x0054E98ul;

    *pSeq = 100; *pCap = 115; *pOvf = 0; *pWrite = 0; *pCommit = 0;

    memset(g_node, 0, sizeof(g_node));
    *(unsigned long*)(g_node + 0x08) = 9;
    *(unsigned long*)(g_node + 0x14) = (unsigned long)(g_pool + 2);
    *(unsigned long*)(g_node + 0x20) = (unsigned long)g_idx;
    *(unsigned long*)(g_node + 0x2C) = (unsigned long)g_geom;
    *(unsigned long*)(g_geom + 0x3C) = 4;
    *(unsigned long*)(g_geom + 0x40) = 6;
    g_pool[0] = 0xA1; g_pool[1] = 0xA2;
    memset(g_pool + 2, 0x22, sizeof(g_pool) - 2);
    for (i = 0; i < 54; ++i) g_idx[i] = 0x1100 + (unsigned short)i;

    dump = (PFN_DumpNode)(base + 0x19D0ul);

    /* alternate: slot51 kind2 + slot47 kind0, x3 frames to mimic menu layout */
    for (i = 0; i < 3; ++i) {
        *pSeq = 100 + i;
        dump(51, (const void*)0x12345678, g_node);
        memset(g_node, 0, sizeof(g_node));
        dump(47, (const void*)0x12345678, g_node);
        /* restore node for next iter */
        *(unsigned long*)(g_node + 0x08) = 9;
        *(unsigned long*)(g_node + 0x14) = (unsigned long)(g_pool + 2);
        *(unsigned long*)(g_node + 0x20) = (unsigned long)g_idx;
        *(unsigned long*)(g_node + 0x2C) = (unsigned long)g_geom;
    }
    pend = *pWrite - *pCommit;
    printf("pending=%lu (contract 3x1380=4140)\n", pend);
    f = fopen(out, "wb");
    fwrite(ring, 1, pend, f);
    fclose(f);
    printf("wrote %s (%lu bytes)\n", out, pend);
    FreeLibrary(h);
    return 0;
}
